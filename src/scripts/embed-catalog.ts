import { MikroORM } from '@mikro-orm/core';
import { MySqlDriver } from '@mikro-orm/mysql';
import { TsMorphMetadataProvider } from '@mikro-orm/reflection';
import { QdrantClient } from '@qdrant/js-client-rest';
import OpenAI from 'openai';
import { config } from 'dotenv';
import { resolve } from 'path';
import { Listing } from '@modules/listings/entities/listing.entity';
import { ListingStatus } from '@common/enums/listing-status.enum';

// Load environment variables
const envPath = resolve(process.cwd(), 'env', '.env.development');
config({ path: envPath });

// Configuration constants
const VECTOR_SIZE = 1536; // OpenAI text-embedding-3-small outputs 1536 dims
const BATCH_SIZE = 50; // OpenAI can handle larger batches
const COLLECTION = process.env.QDRANT_COLLECTION ?? 'techbazaar_products';

// Initialize clients
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const qdrant = new QdrantClient({ url: process.env.QDRANT_URL });

// Types
interface ListingMetadata {
  listingId: number;
  listingTitle: string;
  brandName: string | null;
  categoryName: string;
  effectivePrice: number;
  currencyCode: string;
  listedQty: number;
  primaryImage: string;
  url: string | null;
  [key: string]: unknown;
}

interface ProcessingResult {
  totalProcessed: number;
  successfullyStored: number;
  failedBatches: number[];
}

// ─── Database Connection ──────────────────────────────────────────────────────

async function initializeDatabase(): Promise<MikroORM<MySqlDriver>> {
  try {
    console.log('🔌 Connecting to database...');

    const orm = await MikroORM.init<MySqlDriver>({
      host: process.env.DATABASE_HOST,
      port: parseInt(process.env.DATABASE_PORT || '3306'),
      user: process.env.DATABASE_USER,
      password: process.env.DATABASE_PASSWORD,
      dbName: process.env.DATABASE_NAME,
      entities: ['dist/**/*.entity.js'],
      entitiesTs: ['src/**/*.entity.ts'],
      debug: false,
      metadataProvider: TsMorphMetadataProvider,
      driver: MySqlDriver,
    });

    console.log('✅ Database connected successfully');
    return orm;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
  }
}

// ─── Fetch Active Listings ────────────────────────────────────────────────────

async function fetchActiveListings(orm: MikroORM<MySqlDriver>): Promise<Listing[]> {
  try {
    console.log('📦 Fetching active listings...');

    const em = orm.em.fork();
    const listings = await em.find(
      Listing,
      {
        status: ListingStatus.VALIDATED_ACTIVE,
        isDeleted: false,
      },
      {
        populate: ['brand', 'category', 'condition', 'item', 'listingSpecification', 'listingPrice'],
      },
    );

    console.log(`✅ Found ${listings.length} active listings`);

    if (listings.length === 0) {
      console.log('ℹ️  No active listings to process. Exiting.');
    }

    return listings;
  } catch (error) {
    console.error('❌ Failed to fetch listings:', error);
    process.exit(1);
  }
}

// ─── Construct Listing Text ───────────────────────────────────────────────────

function constructListingText(listing: Listing): string {
  const parts: string[] = [];

  // Title
  if (listing.listingTitle) {
    parts.push(listing.listingTitle);
  }

  // Brand
  if (listing.brandName) {
    parts.push(`Brand: ${listing.brandName}`);
  }

  // Category
  if (listing.categoryName) {
    parts.push(`Category: ${listing.categoryName}`);
  }

  // Condition
  if (listing.conditionName) {
    parts.push(`Condition: ${listing.conditionName}`);
  }

  // Model
  if (listing.modelTitle) {
    parts.push(`Model: ${listing.modelTitle}`);
  }

  // Processor from specification or item
  const processor = listing.listingSpecification?.processor || listing.item?.processor;
  if (processor && processor !== 'ns' && processor !== '-1') {
    parts.push(`Processor: ${processor}`);
  }

  // RAM
  const ramCapacity = listing.listingSpecification?.ramCapacity;
  if (ramCapacity && ramCapacity !== 'ns' && ramCapacity !== '-1') {
    parts.push(`RAM: ${ramCapacity}GB`);
  }

  // Storage
  const primaryStorageType = listing.listingSpecification?.primaryStorageType;
  const primaryStorageCapacity = listing.listingSpecification?.primaryStorageCapacity;
  if (primaryStorageType && primaryStorageCapacity && primaryStorageType !== 'ns' && primaryStorageCapacity !== '-1') {
    parts.push(`Storage: ${primaryStorageCapacity}GB ${primaryStorageType}`);
  }

  // Secondary Storage
  const secondaryStorageType = listing.listingSpecification?.secondaryStorageType;
  const secondaryStorageCapacity = listing.listingSpecification?.secondaryStorageCapacity;
  if (
    secondaryStorageType &&
    secondaryStorageCapacity &&
    secondaryStorageType !== 'ns' &&
    secondaryStorageCapacity !== '-1'
  ) {
    parts.push(`Additional Storage: ${secondaryStorageCapacity}GB ${secondaryStorageType}`);
  }

  // Graphics Card
  const graphicsCardName = listing.listingSpecification?.graphicsCardName;
  if (graphicsCardName && graphicsCardName !== 'ns' && graphicsCardName !== '-1') {
    parts.push(`GPU: ${graphicsCardName}`);
  }

  // Screen Size
  const screenSize = listing.listingSpecification?.screenSize;
  if (screenSize && screenSize !== 'ns' && screenSize !== '-1') {
    parts.push(`Screen: ${screenSize} inches`);
  }

  // Price
  if (listing.effectivePrice) {
    parts.push(`Price: ${listing.effectivePrice} ${listing.currencyCode}`);
  }

  return parts.filter(Boolean).join('. ');
}

// ─── Ensure Qdrant Collection ─────────────────────────────────────────────────

async function ensureCollection(): Promise<void> {
  try {
    console.log('🔍 Checking Qdrant collection...');

    const collections = await qdrant.getCollections();
    const exists = collections.collections.some(c => c.name === COLLECTION);

    if (!exists) {
      console.log(`📝 Creating collection: ${COLLECTION}`);
      await qdrant.createCollection(COLLECTION, {
        vectors: {
          size: VECTOR_SIZE,
          distance: 'Cosine',
        },
      });
      console.log(`✅ Collection created: ${COLLECTION}`);
    } else {
      console.log(`ℹ️  Collection already exists: ${COLLECTION}`);
    }
  } catch (error) {
    console.error('❌ Qdrant connection failed:', error);
    process.exit(1);
  }
}

// ─── Generate Embeddings ──────────────────────────────────────────────────────

async function generateEmbeddings(texts: string[], batchNumber: number): Promise<number[][]> {
  try {
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: texts,
    });

    return response.data.map(item => item.embedding);
  } catch (error) {
    console.error(`❌ Embedding generation failed for batch ${batchNumber}:`, error);
    return [];
  }
}

// ─── Extract Metadata ─────────────────────────────────────────────────────────

function extractMetadata(listing: Listing): ListingMetadata {
  return {
    listingId: listing.listingId,
    listingTitle: listing.listingTitle,
    brandName: listing.brandName || null,
    categoryName: listing.categoryName,
    effectivePrice: parseFloat(listing.effectivePrice || '0'),
    currencyCode: listing.currencyCode,
    listedQty: listing.listedQty,
    primaryImage: listing.primaryImage,
    url: listing.url || null,
  };
}

// ─── Process Batches ──────────────────────────────────────────────────────────

async function processBatches(listings: Listing[]): Promise<ProcessingResult> {
  const result: ProcessingResult = {
    totalProcessed: 0,
    successfullyStored: 0,
    failedBatches: [],
  };

  const totalBatches = Math.ceil(listings.length / BATCH_SIZE);
  console.log(`\n📦 Processing ${listings.length} listings in ${totalBatches} batches...\n`);

  for (let i = 0; i < listings.length; i += BATCH_SIZE) {
    const batchNumber = Math.floor(i / BATCH_SIZE) + 1;
    const batch = listings.slice(i, i + BATCH_SIZE);

    console.log(`⏳ Processing batch ${batchNumber}/${totalBatches}...`);

    // Construct texts
    const texts = batch.map(constructListingText);

    // Generate embeddings
    const embeddings = await generateEmbeddings(texts, batchNumber);

    if (embeddings.length === 0) {
      console.error(`❌ Batch ${batchNumber} failed - skipping`);
      result.failedBatches.push(batchNumber);
      continue;
    }

    // Prepare points for Qdrant
    const points = batch.map((listing, index) => ({
      id: listing.listingId,
      vector: embeddings[index],
      payload: extractMetadata(listing),
    }));

    // Upsert to Qdrant
    try {
      await qdrant.upsert(COLLECTION, {
        wait: true,
        points,
      });

      result.successfullyStored += points.length;
      console.log(
        `✅ Batch ${batchNumber}/${totalBatches} complete - ${i + batch.length}/${listings.length} listings processed`,
      );
    } catch (error) {
      console.error(`❌ Failed to upsert batch ${batchNumber}:`, error);
      result.failedBatches.push(batchNumber);
    }

    result.totalProcessed += batch.length;
  }

  return result;
}

// ─── Main Function ────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const startTime = Date.now();
  console.log('🚀 Starting catalog embedding script with OpenAI...');
  console.log(`📅 Started at: ${new Date().toISOString()}\n`);

  let orm: MikroORM<MySqlDriver> | null = null;

  try {
    // Initialize database
    orm = await initializeDatabase();

    // Ensure Qdrant collection exists
    await ensureCollection();

    // Fetch active listings
    const listings = await fetchActiveListings(orm);

    if (listings.length === 0) {
      return;
    }

    // Process batches
    const result = await processBatches(listings);

    // Summary
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log('\n' + '='.repeat(60));
    console.log('📊 Embedding Summary');
    console.log('='.repeat(60));
    console.log(`✅ Total listings processed: ${result.totalProcessed}`);
    console.log(`✅ Successfully stored: ${result.successfullyStored}`);
    console.log(`❌ Failed batches: ${result.failedBatches.length}`);
    if (result.failedBatches.length > 0) {
      console.log(`   Batch numbers: ${result.failedBatches.join(', ')}`);
    }
    console.log(`⏱️  Execution time: ${duration}s`);
    console.log('='.repeat(60));
    console.log('\n✅ Catalog embedding complete. Qdrant is ready for semantic search!');
  } catch (error) {
    console.error('\n❌ Script failed with error:', error);
    process.exit(1);
  } finally {
    // Cleanup
    if (orm) {
      await orm.close();
      console.log('🔌 Database connection closed');
    }
  }
}

// Execute
main().catch(error => {
  console.error('💥 Unhandled error:', error);
  process.exit(1);
});
