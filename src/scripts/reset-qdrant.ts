import { QdrantClient } from '@qdrant/js-client-rest';
import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables
const envPath = resolve(process.cwd(), 'env', '.env.development');
config({ path: envPath });

const qdrant = new QdrantClient({ url: process.env.QDRANT_URL });
const COLLECTION = process.env.QDRANT_COLLECTION ?? 'techbazaar_products';

async function resetCollection() {
  try {
    console.log(`🗑️  Deleting collection: ${COLLECTION}...`);
    
    // Check if collection exists
    const collections = await qdrant.getCollections();
    const exists = collections.collections.some((c) => c.name === COLLECTION);
    
    if (exists) {
      await qdrant.deleteCollection(COLLECTION);
      console.log(`✅ Collection deleted: ${COLLECTION}`);
    } else {
      console.log(`ℹ️  Collection does not exist: ${COLLECTION}`);
    }
    
    console.log('\n✅ Done! You can now run the embed:catalog script to recreate the collection with correct dimensions.');
  } catch (error) {
    console.error('❌ Failed to delete collection:', error);
    process.exit(1);
  }
}

resetCollection();
