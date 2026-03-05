# Catalog Embedding Script

This script generates vector embeddings for product listings in the TechBazaar marketplace using OpenAI and stores them in Qdrant vector database for semantic search capabilities.

## Prerequisites

1. **Qdrant Vector Database**: Make sure Qdrant is running and accessible

   - Default URL: `http://localhost:6333`
   - You can run Qdrant using Docker:
     ```bash
     docker run -p 6333:6333 qdrant/qdrant
     ```

2. **OpenAI API Key**: Set your OpenAI API key in `env/.env.development`

   ```
   OPENAI_API_KEY=your-api-key-here
   ```

   Get your API key from: https://platform.openai.com/api-keys

3. **Qdrant Configuration**: Configure Qdrant connection in `env/.env.development`
   ```
   QDRANT_URL=http://localhost:6333
   QDRANT_COLLECTION=techbazaar_products
   ```

## Usage

Run the script using npm:

```bash
npm run embed:catalog
```

Or directly with ts-node:

```bash
npx ts-node -r tsconfig-paths/register src/scripts/embed-catalog.ts
```

## What the Script Does

1. **Connects to MySQL** using MikroORM configuration
2. **Fetches active listings** (status = "Validated,Active", isDeleted = false)
3. **Constructs descriptive text** from listing fields:
   - Title, brand, category, condition
   - Model, processor, RAM, storage
   - Graphics card, screen size, price
4. **Generates embeddings** using OpenAI's `text-embedding-3-small` model (1536 dimensions)
5. **Stores embeddings** in Qdrant with metadata for filtering:
   - listingId, title, brand, category
   - price, currency, quantity, image, URL

## Features

- ✅ **Idempotent**: Can be re-run safely to update embeddings
- ✅ **Batch Processing**: Processes 50 listings at a time (optimized for OpenAI)
- ✅ **Error Resilient**: Continues processing even if individual batches fail
- ✅ **Progress Logging**: Shows detailed progress and summary
- ✅ **Metadata Storage**: Stores filterable metadata with each embedding

## Output

The script provides detailed logging:

```
🚀 Starting catalog embedding script with OpenAI...
📅 Started at: 2026-03-06T10:30:00.000Z

🔌 Connecting to database...
✅ Database connected successfully
🔍 Checking Qdrant collection...
✅ Collection created: techbazaar_products
📦 Fetching active listings...
✅ Found 1250 active listings

📦 Processing 1250 listings in 63 batches...

⏳ Processing batch 1/63...
✅ Batch 1/63 complete - 20/1250 listings processed
...

============================================================
📊 Embedding Summary
============================================================
✅ Total listings processed: 1250
✅ Successfully stored: 1250
❌ Failed batches: 0
⏱️  Execution time: 125.45s
============================================================

✅ Catalog embedding complete. Qdrant is ready for semantic search!
🔌 Database connection closed
```

## When to Run

- **Initial Setup**: Run once to populate the vector database
- **After Product Updates**: Re-run whenever you add or update products
- **Scheduled**: Set up a cron job to run periodically (e.g., daily)

## Troubleshooting

### Database Connection Failed

- Check your database credentials in `env/.env.development`
- Ensure the database is accessible from your machine

### Qdrant Connection Failed

- Verify Qdrant is running: `curl http://localhost:6333/collections`
- Check the `QDRANT_URL` in your environment file

### OpenAI API Errors

- Verify your API key is valid
- Check your OpenAI account has sufficient credits
- Review rate limits if processing large catalogs

### No Active Listings Found

- Check that listings have status `"Validated,Active"`
- Verify `isDeleted` is `false` for your listings
- Review the database query in the script

## Configuration

### Batch Size

Default: 50 listings per batch (optimized for OpenAI). Modify in the script:

```typescript
const BATCH_SIZE = 50;
```

### Vector Size

Default: 1536 (for OpenAI text-embedding-3-small). Do not modify unless using a different model:

```typescript
const VECTOR_SIZE = 1536;
```

### Collection Name

Default: `techbazaar_products`. Change via environment variable:

```
QDRANT_COLLECTION=your-collection-name
```

## Next Steps

After running this script, you can:

1. **Query embeddings** for semantic search
2. **Filter by metadata** (price, brand, category, stock)
3. **Implement search API** using Qdrant client
4. **Build recommendation features** based on similarity

## Support

For issues or questions, contact the development team.
