# AI Search Module

Conversational AI-powered product search for TechBazaar using OpenAI and Qdrant vector database.

## Features

- 🤖 **Conversational Search**: Natural language product queries
- 🎯 **Intent Extraction**: Automatically extracts budget, brand, category, and specs from user messages
- 🔍 **Semantic Search**: Uses vector embeddings for intelligent product matching
- 💬 **Session Management**: Maintains conversation history in Redis
- 🎮 **Smart Filtering**: Combines semantic search with structured filters (price, brand, specs)
- ✅ **Grounded Responses**: AI responses are based only on actual product data

## API Endpoint

### POST `/ai-search/chat`

Chat with the AI assistant to search for products.

**Query Parameters:**

- `sessionId` (optional): Session ID for conversation continuity. If not provided, a new session is created.

**Request Body:**

```json
{
  "message": "I need a gaming laptop under 100,000 PKR"
}
```

**Response:**

```json
{
  "reply": "Here are some great gaming laptops within your budget...",
  "products": [
    {
      "listingId": 123,
      "listingTitle": "Dell G15 Gaming Laptop",
      "brandName": "Dell",
      "effectivePrice": "95000",
      "currencyCode": "PKR",
      ...
    }
  ],
  "sessionId": "550e8400-e29b-41d4-a716-446655440000",
  "followUpQuestion": null
}
```

## How It Works

### 1. Intent Extraction

The AI analyzes the user's message and conversation history to extract:

- Product type (laptop, desktop, accessory, etc.)
- Budget range (min/max in PKR)
- Brand preferences
- Use case (gaming, office, editing, etc.)
- Technical requirements (RAM, GPU, etc.)

### 2. Semantic Search

- User query is converted to a vector embedding using OpenAI `text-embedding-3-small`
- Qdrant performs similarity search against product embeddings
- Filters are applied (price, brand, category, stock status)

### 3. Live Data Fetch

- Matched product IDs are fetched from MySQL with latest data
- Ensures prices and stock status are always current

### 4. Grounded Response Generation

- AI generates a friendly response using OpenAI `gpt-4o-mini` with only the matched products
- Never invents specs or prices
- Provides personalized recommendations based on user needs

### 5. Session Management

- Conversation history stored in Redis (30-minute TTL)
- Last 6 messages kept for context
- Enables follow-up questions and clarifications

## Example Conversations

### Example 1: Gaming Laptop

```
User: "I want a laptop for playing COD"
AI: "For Call of Duty, you'll need a gaming laptop with a dedicated GPU and at least 16GB RAM.
     What's your budget range?"
User: "Around 80,000 PKR"
AI: "Here are gaming laptops in your budget:
     1. Dell G15 - Rs. 79,999 - RTX 3050, 16GB RAM, perfect for COD at medium-high settings
     2. HP Pavilion Gaming - Rs. 75,000 - GTX 1650, 16GB RAM, handles COD at medium settings"
```

### Example 2: Office Laptop

```
User: "Need a laptop for office work under 50k"
AI: "Here are reliable office laptops within your budget:
     1. HP 15s - Rs. 45,000 - Intel i3, 8GB RAM, great for documents and browsing
     2. Lenovo IdeaPad - Rs. 48,500 - AMD Ryzen 3, 8GB RAM, good battery life"
```

## Configuration

Required environment variables:

```env
OPENAI_API_KEY=your-openai-api-key
QDRANT_URL=http://localhost:6333
QDRANT_COLLECTION=techbazaar_products
REDIS_URL=redis://localhost:6379
```

## Prerequisites

1. **Qdrant**: Vector database must be running
2. **Redis**: For session management
3. **Embeddings**: Run `npm run embed:catalog` to populate Qdrant with product embeddings

## Testing

```bash
# Test the endpoint
curl -X POST http://localhost:8001/api/ai-search/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "show me gaming laptops under 100k"}'

# Continue conversation
curl -X POST "http://localhost:8001/api/ai-search/chat?sessionId=YOUR_SESSION_ID" \
  -H "Content-Type: application/json" \
  -d '{"message": "what about Dell laptops?"}'
```

## Architecture

```
User Message
     ↓
Intent Extraction (OpenAI GPT-4o-mini)
     ↓
Semantic Search (Qdrant) + Filters
     ↓
Live Data Fetch (MySQL)
     ↓
Response Generation (OpenAI GPT-4o-mini)
     ↓
Session Save (Redis)
     ↓
Response to User
```

## Customization

### Adjust Search Results

Change `MAX_RESULTS` in `ai-search.service.ts`:

```typescript
const MAX_RESULTS = 5; // Change to desired number
```

### Modify Session Duration

Change `SESSION_TTL` in `ai-search.service.ts`:

```typescript
const SESSION_TTL = 60 * 30; // 30 minutes in seconds
```

### Update Intent Extraction

Modify the prompt in `extractIntent()` method to add new product categories or use cases.

## Notes

- The AI only references products that actually exist in the database
- Prices and stock status are always fetched live from MySQL
- Out-of-stock products are automatically filtered out
- Conversation history helps with follow-up questions and clarifications
- The system understands Pakistani market context (prices in PKR, local brands, etc.)
