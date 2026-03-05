# Implementation Plan: Catalog Embedding Script

## Overview

This plan implements a standalone TypeScript script that generates vector embeddings for product listings. The script fetches active listings from MySQL using MikroORM, constructs descriptive text from listing fields, generates embeddings using OpenAI's API in batches of 50, and stores them in Qdrant vector database with metadata for semantic search.

## Tasks

- [ ] 1. Set up script structure and environment configuration

  - Create src/scripts/embed-catalog.ts file
  - Import required dependencies (MikroORM, OpenAI, Qdrant, dotenv)
  - Load environment variables from .env.development
  - Define TypeScript interfaces for configuration and data structures
  - Requirements: 1.2, 9.1, 9.3, 9.4

- [ ] 2. Implement database connection and initialization

  - [ ] 2.1 Create MikroORM initialization function
    - Initialize MikroORM using existing configuration
    - Handle connection errors with logging and exit code 1
    - Return EntityManager for queries
    - Requirements: 1.1, 1.3, 9.5
  - [ ] 2.2 Implement database connection cleanup
    - Create cleanup function to close MikroORM connection
    - Ensure cleanup runs on both success and error paths
    - Requirements: 1.4, 10.5

- [ ] 3. Implement active listings fetcher

  - [ ] 3.1 Create fetchActiveListings function
    - Query listings with status="Active" and isDeleted=false
    - Populate relations: brand, category, condition, item, listingSpecification, listingPrice
    - Log total count of active listings fetched
    - Handle case when no active listings exist
    - Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 7.2
  - [ ] 3.2 Handle database query errors
    - Catch and log database errors with context
    - Terminate with exit code 1 on query failure
    - Requirements: 10.4

- [ ] 4. Implement listing text constructor

  - [ ] 4.1 Create constructListingText function
    - Extract fields: listingTitle, brand name, category name, condition name
    - Extract item fields: model, processor, ram
    - Extract specification fields: ramCapacity, storage types and capacities, graphics, screen size
    - Extract price fields: effectivePrice, currencyCode
    - Requirements: 3.1, 3.4
  - [ ] 4.2 Implement field handling and formatting
    - Handle null/undefined fields by omitting them
    - Format storage information (primary and secondary)
    - Format price with currency code
    - Construct natural language description
    - Ensure non-empty output for all listings
    - Requirements: 3.2, 3.3, 3.5

- [ ] 5. Implement Qdrant collection management

  - [ ] 5.1 Create Qdrant client initialization
    - Connect to Qdrant using QDRANT_URL from environment
    - Handle connection errors with logging and exit code 1
    - Requirements: 5.4, 5.5
  - [ ] 5.2 Implement collection verification and creation
    - Check if collection exists using QDRANT_COLLECTION environment variable
    - Create collection if it doesn't exist with vector size 1536 and Cosine distance
    - Verify existing collection has correct vector configuration
    - Requirements: 5.1, 5.2, 5.3

- [ ] 6. Implement OpenAI embedding generator

  - [ ] 6.1 Create generateEmbeddings function
    - Initialize OpenAI client with OPENAI_API_KEY
    - Accept array of texts and batch number as parameters
    - Call OpenAI API with text-embedding-3-small model
    - Extract embedding vectors from response
    - Requirements: 4.2, 4.3, 4.6
  - [ ] 6.2 Implement batch error handling
    - Catch OpenAI API errors
    - Log errors with batch number and error message
    - Return empty array for failed batches to allow continuation
    - Requirements: 4.4, 10.3

- [ ] 7. Implement vector store operations

  - [ ] 7.1 Create metadata extraction function
    - Extract listingId, listingTitle, brandName, categoryName
    - Extract effectivePrice and convert to number
    - Extract currencyCode, listedQty, primaryImage, url
    - Requirements: 6.2, 6.3
  - [ ] 7.2 Implement upsert function for embeddings
    - Use listing ID as point ID for idempotency
    - Prepare vector points with embeddings and metadata
    - Execute upsert operation to Qdrant
    - Requirements: 6.1, 6.4, 8.1
  - [ ] 7.3 Handle individual upsert errors
    - Catch upsert failures for individual listings
    - Log errors with listing ID
    - Continue processing remaining listings
    - Requirements: 6.5, 10.2

- [ ] 8. Implement batch processor

  - [ ] 8.1 Create batch splitting logic
    - Split listings array into chunks of 50
    - Track batch numbers for logging
    - Requirements: 4.1
  - [ ] 8.2 Implement batch processing loop
    - For each batch: construct text, generate embeddings, extract metadata
    - Map embeddings to corresponding listings
    - Store embeddings with metadata in Qdrant
    - Log progress after each batch with batch number and total
    - Track successfully stored embeddings count
    - Requirements: 4.5, 6.6, 7.3, 7.4

- [ ] 9. Implement main orchestration function

  - [ ] 9.1 Create main function with initialization
    - Log script start with timestamp
    - Initialize database connection
    - Initialize Qdrant client and ensure collection exists
    - Requirements: 7.1
  - [ ] 9.2 Implement execution flow
    - Fetch active listings
    - Process listings in batches
    - Log total embeddings successfully stored
    - Calculate and log execution time
    - Requirements: 7.4, 7.5
  - [ ] 9.3 Implement cleanup and error handling
    - Wrap execution in try-catch block
    - Ensure database cleanup in finally block
    - Log errors with context using console.error
    - Exit with appropriate status code (0 for success, 1 for fatal errors)
    - Requirements: 7.6, 7.7, 10.5

- [ ] 10. Verify script execution and re-runnability

  - [ ] 10.1 Test script execution command
    - Verify script runs with: npx ts-node -r tsconfig-paths/register src/scripts/embed-catalog.ts
    - Verify path aliases resolve correctly
    - Requirements: 9.2, 9.3
  - [ ] 10.2 Verify idempotency
    - Confirm upsert operations overwrite existing embeddings
    - Verify script can be run multiple times consecutively
    - Confirm all active listings are processed on each run
    - Requirements: 8.1, 8.2, 8.3, 8.4

- [ ] 11. Final checkpoint - Ensure script works end-to-end
  - Run the script with actual database and verify embeddings are stored
  - Check logs for proper progress reporting
  - Verify error handling by testing with invalid credentials
  - Ensure all tests pass, ask the user if questions arise

## Notes

- The script is standalone and doesn't require the NestJS application to be running
- Batch size of 50 is chosen to balance API efficiency and rate limits
- Upsert operations ensure the script is idempotent and can be re-run safely
- Partial failures (individual batches or listings) don't stop the entire process
- All requirements are covered through implementation tasks with explicit traceability
