# Quick Setup Guide for Catalog Embedding

## Step 1: Install and Run Qdrant

Using Docker (recommended):
```bash
docker run -p 6333:6333 -p 6334:6334 qdrant/qdrant
```

Or download from: https://qdrant.tech/documentation/quick-start/

## Step 2: Verify Environment Variables

Check `env/.env.development` has these variables:

```env
# Gemini AI Configuration
GEMINI_API_KEY=your-gemini-api-key

# Qdrant Configuration
QDRANT_URL=http://localhost:6333
QDRANT_COLLECTION=techbazaar_products

# Database Configuration (should already be set)
DATABASE_HOST=62.72.29.235
DATABASE_PORT=3306
DATABASE_USER=root
DATABASE_PASSWORD=1OtVcJqWHzMgqnX
DATABASE_NAME=live_090425
```

Get your Gemini API key from: https://makersuite.google.com/app/apikey

## Step 3: Run the Script

```bash
npm run embed:catalog
```

## Expected Output

```
🚀 Starting catalog embedding script with Gemini...
📅 Started at: 2026-03-06T10:30:00.000Z

🔌 Connecting to database...
✅ Database connected successfully
🔍 Checking Qdrant collection...
📝 Creating collection: techbazaar_products
✅ Collection created: techbazaar_products
📦 Fetching active listings...
✅ Found 1250 active listings

📦 Processing 1250 listings in 63 batches...

⏳ Processing batch 1/63...
✅ Batch 1/63 complete - 20/1250 listings processed
⏳ Processing batch 2/63...
✅ Batch 2/63 complete - 40/1250 listings processed
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

## Verify Success

Check Qdrant has your data:

```bash
curl http://localhost:6333/collections/techbazaar_products
```

You should see:
```json
{
  "result": {
    "status": "green",
    "vectors_count": 1250,
    ...
  }
}
```

## Next Steps

1. **Test semantic search** by querying Qdrant
2. **Build search API** to expose semantic search to your frontend
3. **Schedule regular runs** to keep embeddings up-to-date

## Common Issues

### "Database connection failed"
- Check database credentials
- Ensure database is accessible

### "Qdrant connection failed"
- Verify Qdrant is running: `docker ps`
- Check URL is correct: `http://localhost:6333`

### "Gemini API error"
- Verify API key is valid
- Check Google Cloud project has Generative AI API enabled
- Review rate limits (script includes 500ms delays between batches)

### "No active listings found"
- Check listings have status: `"Validated,Active"`
- Verify `isDeleted = false`

## Re-running the Script

The script is idempotent - you can safely re-run it:
- Existing embeddings will be updated
- New listings will be added
- Deleted/inactive listings remain in Qdrant (won't be updated)

Run it whenever you:
- Add new products
- Update product information
- Change product specifications
- Want to refresh the search index
