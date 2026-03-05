import { Injectable, Logger } from '@nestjs/common';
import { QdrantClient } from '@qdrant/js-client-rest';
import OpenAI from 'openai';
import { EntityManager } from '@mikro-orm/core';
import { RedisService } from '@liaoliaots/nestjs-redis';
import Redis from 'ioredis';
import { Listing } from '@modules/listings/entities/listing.entity';
import { ListingStatus } from '@common/enums/listing-status.enum';

const COLLECTION = process.env.QDRANT_COLLECTION ?? 'techbazaar_products';
const SESSION_TTL = 60 * 30; // 30 minutes in seconds
const MAX_HISTORY = 6; // last 6 messages kept in memory
const MAX_RESULTS = 5; // max products returned per search

interface ChatResponse {
  reply: string;
  products: any[];
  sessionId: string;
  followUpQuestion: string | null;
}

interface SearchIntent {
  product_type: string | null;
  budget_max: number | null;
  budget_min: number | null;
  brands: string[];
  use_case: string | null;
  min_ram_gb: number | null;
  gpu_required: boolean;
  search_query: string;
  needsFollowUp: boolean;
  followUpQuestion: string | null;
}

@Injectable()
export class AiSearchService {
  private readonly logger = new Logger(AiSearchService.name);
  private qdrant: QdrantClient;
  private openai: OpenAI;
  private redis: Redis | null;

  constructor(
    private readonly em: EntityManager,
    private readonly redisService: RedisService,
  ) {
    // Qdrant client
    this.qdrant = new QdrantClient({ url: process.env.QDRANT_URL });

    // OpenAI client
    this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    // Redis client
    this.redis = this.redisService.getOrNil();
  }

  // ─── PUBLIC: Main chat entry point ─────────────────────────────────────────

  async chat(message: string, sessionId: string): Promise<ChatResponse> {
    // 1. Load conversation history from Redis
    const history = await this.getHistory(sessionId);

    // 2. Extract intent + filters from user message
    const intent = await this.extractIntent(message, history);
    this.logger.log(`Intent extracted: ${JSON.stringify(intent)}`);

    // 3. If intent is unclear, ask a follow-up question
    if (intent.needsFollowUp) {
      await this.saveHistory(sessionId, history, message, intent.followUpQuestion!);
      return {
        reply: intent.followUpQuestion!,
        products: [],
        sessionId,
        followUpQuestion: intent.followUpQuestion,
      };
    }

    // 4. Search Qdrant (semantic) + MySQL (filters)
    const products = await this.searchProducts(message, intent);

    // 5. Generate friendly reply grounded in real product data
    const reply = await this.generateReply(message, products, intent);

    // 6. Save this turn to Redis
    await this.saveHistory(sessionId, history, message, reply);

    return { reply, products, sessionId, followUpQuestion: null };
  }

  // ─── STEP 2: Extract structured intent from user message ───────────────────

  private async extractIntent(message: string, history: any[]): Promise<SearchIntent> {
    const historyText = history.map(h => `${h.role}: ${h.text}`).join('\n');

    const prompt = `You are a product filter extractor for TechBazaar, a Pakistani electronics store. Prices are in PKR.

Conversation so far:
${historyText || 'No previous messages.'}

New user message: "${message}"

Extract search intent. Return ONLY valid JSON, no markdown, no explanation:
{
  "product_type": "laptop|desktop|pc|accessory|monitor|keyboard|mouse|other",
  "budget_max": <number in PKR or null>,
  "budget_min": <number in PKR or null>,
  "brands": ["array of brand names or empty array"],
  "use_case": "gaming|office|editing|student|programming|general or null",
  "min_ram_gb": <number or null>,
  "gpu_required": <true or false>,
  "search_query": "rewrite the user intent as a clean product search query",
  "needsFollowUp": <true if budget is completely missing AND product type is unclear>,
  "followUpQuestion": "one short question to ask OR null"
}

Gaming knowledge: COD/gaming needs GPU, 16GB RAM min, i5 12th gen or Ryzen 5 5600 min.
Mid-range in Pakistan = 40k-80k PKR for laptops, 30k-60k for desktops.`;

    const result = await this.openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
    });

    const text = result.choices[0].message.content?.trim() || '{}';

    try {
      // Strip markdown code fences if present
      const clean = text.replace(/```json|```/g, '').trim();
      return JSON.parse(clean);
    } catch {
      this.logger.warn('Intent parse failed, using fallback');
      // Fallback: treat as a general search
      return {
        product_type: null,
        budget_max: null,
        budget_min: null,
        brands: [],
        use_case: null,
        min_ram_gb: null,
        gpu_required: false,
        search_query: message,
        needsFollowUp: false,
        followUpQuestion: null,
      };
    }
  }

  // ─── STEP 3: Search products ────────────────────────────────────────────────

  private async searchProducts(message: string, intent: SearchIntent): Promise<any[]> {
    // 3A. Embed the search query
    const embedResult = await this.openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: intent.search_query || message,
    });
    const queryVector = embedResult.data[0].embedding;

    // 3B. Build Qdrant payload filters from intent
    const filters: any = {
      must: [
        { key: 'listedQty', range: { gt: 0 } }, // never show out-of-stock
      ],
    };

    if (intent.budget_max) {
      filters.must.push({ key: 'effectivePrice', range: { lte: intent.budget_max } });
    }

    if (intent.budget_min) {
      filters.must.push({ key: 'effectivePrice', range: { gte: intent.budget_min } });
    }

    if (intent.product_type && intent.product_type !== 'other') {
      filters.must.push({ key: 'categoryName', match: { value: intent.product_type } });
    }

    if (intent.brands?.length > 0) {
      filters.should = intent.brands.map((brand: string) => ({
        key: 'brandName',
        match: { value: brand.toLowerCase() },
      }));
    }

    // 3C. Run vector search in Qdrant
    const searchResult = await this.qdrant.search(COLLECTION, {
      vector: queryVector,
      limit: MAX_RESULTS,
      filter: filters,
      with_payload: true,
    });

    if (searchResult.length === 0) {
      return [];
    }

    // 3D. Fetch LIVE data from MySQL for the matched listing IDs
    const listingIds = searchResult.map(r => r.payload!.listingId as number);
    const liveListings = await this.em.find(
      Listing,
      {
        listingId: { $in: listingIds },
        status: ListingStatus.VALIDATED_ACTIVE,
        isDeleted: false,
      },
      {
        populate: ['brand', 'category', 'item', 'listingSpecification'],
      },
    );

    // 3E. Re-order to match Qdrant's relevance ranking
    const orderedListings = listingIds.map(id => liveListings.find(l => l.listingId === id)).filter(Boolean);

    return orderedListings;
  }

  // ─── STEP 4: Generate grounded reply ───────────────────────────────────────

  private async generateReply(message: string, products: any[], intent: SearchIntent): Promise<string> {
    if (products.length === 0) {
      return `I couldn't find any products matching your requirements right now. Try adjusting your budget or category — or ask me something like "show me all laptops under 80,000 PKR".`;
    }

    // Build product data block — AI can ONLY reference what's in here
    const productBlock = products
      .map((p, i) => {
        const ram = p.listingSpecification?.ramCapacity;
        const storage = p.listingSpecification?.primaryStorageCapacity;
        const storageType = p.listingSpecification?.primaryStorageType;
        const gpu = p.listingSpecification?.graphicsCardName;
        const processor = p.listingSpecification?.processor || p.item?.processor;

        return `Product ${i + 1}:
- Name: ${p.listingTitle}
- Brand: ${p.brandName || 'N/A'}
- Price: ${p.effectivePrice} ${p.currencyCode}
- RAM: ${ram && ram !== 'ns' && ram !== '-1' ? ram + 'GB' : 'N/A'}
- Storage: ${storage && storage !== 'ns' && storage !== '-1' ? storage + 'GB ' + (storageType || '') : 'N/A'}
- GPU: ${gpu && gpu !== 'ns' ? gpu : 'Integrated'}
- Processor: ${processor && processor !== 'ns' ? processor : 'N/A'}`;
      })
      .join('\n\n');

    const prompt = `You are TechBazaar's friendly AI shopping assistant for Pakistani customers.

User asked: "${message}"

Here are the matching products from our catalog:
${productBlock}

Write a helpful, conversational reply in 2-3 sentences. Then list each product with its name, price in PKR, and ONE reason it fits the user's need.

Rules:
- Only mention products listed above. Never invent specs or prices.
- Keep it concise and friendly.
- Mention prices in PKR format (e.g., Rs. 45,000).
- If the user asked about gaming, mention gaming performance briefly.`;

    const result = await this.openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
    });

    return result.choices[0].message.content?.trim() || 'Here are some products that match your search.';
  }

  // ─── Redis session helpers ──────────────────────────────────────────────────

  private async getHistory(sessionId: string): Promise<any[]> {
    try {
      if (!this.redis) return [];
      const data = await this.redis.get(`chat:${sessionId}`);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  private async saveHistory(
    sessionId: string,
    history: any[],
    userMessage: string,
    assistantReply: string,
  ): Promise<void> {
    if (!this.redis) return;

    const updated = [
      ...history,
      { role: 'user', text: userMessage },
      { role: 'assistant', text: assistantReply },
    ].slice(-MAX_HISTORY); // keep only last 6 messages

    await this.redis.setex(`chat:${sessionId}`, SESSION_TTL, JSON.stringify(updated));
  }
}
