# Requirements Document

## Introduction

This document specifies the requirements for a catalog embedding script that generates vector embeddings for product listings in the TechBazaar marketplace. The script will read product data from MySQL using MikroORM, generate embeddings using OpenAI's text-embedding-3-small model, and store them in Qdrant vector database to enable semantic search capabilities.

## Glossary

- **Embedding_Script**: The standalone TypeScript script that orchestrates the embedding generation process
- **Database_Reader**: The component that fetches product listings from MySQL using MikroORM
- **Embedding_Generator**: The component that generates vector embeddings using OpenAI API
- **Vector_Store**: The Qdrant vector database that stores embeddings with metadata
- **Active_Listing**: A product listing with status "Active" and isDeleted = false
- **Listing_Text**: The descriptive text constructed from listing fields for embedding generation
- **Batch**: A group of 50 listings processed together for embedding generation
- **Collection**: A Qdrant collection that stores vectors with a specific configuration
- **Metadata**: Additional listing information stored with embeddings for filtering (price, brand, category, stock)

## Requirements

### Requirement 1: Database Connection and Configuration

**User Story:** As a developer, I want the script to connect to the MySQL database using existing MikroORM configuration, so that I can reuse the established database setup.

#### Acceptance Criteria

1. THE Embedding_Script SHALL initialize MikroORM using the configuration from the global database module
2. THE Embedding_Script SHALL load environment variables from the .env.development file
3. WHEN the database connection fails, THE Embedding_Script SHALL log the error and terminate with exit code 1
4. THE Embedding_Script SHALL close the database connection when the script completes or encounters an error

### Requirement 2: Fetch Active Listings

**User Story:** As a developer, I want to fetch all active product listings with their specifications, so that I can generate embeddings for searchable products.

#### Acceptance Criteria

1. THE Database_Reader SHALL fetch listings where status equals "Active" and isDeleted equals false
2. THE Database_Reader SHALL populate the listing entity with brand, category, condition, listingSpecification, and listingPrice relations
3. THE Database_Reader SHALL fetch the item entity with its brand, model, processor, ram, storageSsd, storageHdd, and storageMobile fields
4. WHEN no active listings exist, THE Embedding_Script SHALL log a message and terminate successfully
5. THE Database_Reader SHALL log the total count of active listings fetched

### Requirement 3: Construct Descriptive Text

**User Story:** As a developer, I want to build descriptive text from listing fields, so that embeddings capture comprehensive product information for semantic search.

#### Acceptance Criteria

1. THE Embedding_Script SHALL construct Listing_Text from the following fields: listingTitle, brandName, categoryName, conditionName, modelTitle, processor, ramCapacity, primaryStorageType, primaryStorageCapacity, secondaryStorageType, secondaryStorageCapacity, graphicsCardName, screenSize, and effectivePrice
2. THE Embedding_Script SHALL format Listing_Text as a natural language description
3. THE Embedding_Script SHALL handle null or undefined fields by omitting them from Listing_Text
4. THE Embedding_Script SHALL include the currency code with the price in Listing_Text
5. FOR ALL listings, THE Embedding_Script SHALL generate non-empty Listing_Text

### Requirement 4: Generate Embeddings in Batches

**User Story:** As a developer, I want to generate embeddings in batches of 50, so that I can efficiently process large catalogs while respecting API rate limits.

#### Acceptance Criteria

1. THE Embedding_Generator SHALL process listings in Batch groups of 50
2. THE Embedding_Generator SHALL use OpenAI's text-embedding-3-small model
3. THE Embedding_Generator SHALL send the OPENAI_API_KEY from environment variables for authentication
4. WHEN an OpenAI API call fails, THE Embedding_Generator SHALL log the error with the batch number and continue with the next batch
5. THE Embedding_Generator SHALL log progress after each batch completes
6. FOR ALL successful API calls, THE Embedding_Generator SHALL extract the embedding vector from the response

### Requirement 5: Qdrant Collection Management

**User Story:** As a developer, I want the script to create the Qdrant collection if it doesn't exist, so that the script can run on fresh installations.

#### Acceptance Criteria

1. THE Vector_Store SHALL check if the Collection specified in QDRANT_COLLECTION environment variable exists
2. WHEN the Collection does not exist, THE Vector_Store SHALL create it with vector size 1536 and distance metric Cosine
3. WHEN the Collection exists, THE Vector_Store SHALL verify the vector configuration matches the expected size 1536
4. THE Vector_Store SHALL connect to Qdrant using the QDRANT_URL from environment variables
5. WHEN the Qdrant connection fails, THE Embedding_Script SHALL log the error and terminate with exit code 1

### Requirement 6: Store Embeddings with Metadata

**User Story:** As a developer, I want to store embeddings with metadata in Qdrant, so that I can filter search results by price, brand, category, and stock status.

#### Acceptance Criteria

1. THE Vector_Store SHALL store each embedding with the listing ID as the point ID
2. THE Vector_Store SHALL store the following Metadata fields: listingId, listingTitle, brandName, categoryName, effectivePrice, currencyCode, listedQty, primaryImage, and url
3. THE Vector_Store SHALL convert effectivePrice to a number for range filtering
4. THE Vector_Store SHALL use the upsert operation to allow re-running the script
5. WHEN a Qdrant upsert operation fails, THE Vector_Store SHALL log the error with the listing ID and continue with the next listing
6. THE Vector_Store SHALL log the count of successfully stored embeddings

### Requirement 7: Script Execution and Logging

**User Story:** As a developer, I want comprehensive logging throughout the script execution, so that I can monitor progress and troubleshoot issues.

#### Acceptance Criteria

1. THE Embedding_Script SHALL log when the script starts with a timestamp
2. THE Embedding_Script SHALL log the total number of active listings found
3. THE Embedding_Script SHALL log progress after each batch is processed with the batch number and total batches
4. THE Embedding_Script SHALL log the total number of embeddings successfully stored
5. THE Embedding_Script SHALL log when the script completes successfully with execution time
6. WHEN any error occurs, THE Embedding_Script SHALL log the error message with context
7. THE Embedding_Script SHALL use console.log for informational messages and console.error for errors

### Requirement 8: Script Re-runnability

**User Story:** As a developer, I want to re-run the script to update embeddings when products change, so that the vector database stays synchronized with the product catalog.

#### Acceptance Criteria

1. THE Embedding_Script SHALL use upsert operations to overwrite existing embeddings
2. THE Embedding_Script SHALL process all active listings on each run regardless of whether they already have embeddings
3. THE Embedding_Script SHALL handle listings that were previously embedded but are no longer active by leaving them in the vector database
4. THE Embedding_Script SHALL complete successfully when run multiple times consecutively

### Requirement 9: Script Location and Execution

**User Story:** As a developer, I want the script located at src/scripts/embed-catalog.ts, so that it follows the project structure conventions.

#### Acceptance Criteria

1. THE Embedding_Script SHALL be located at the file path src/scripts/embed-catalog.ts
2. THE Embedding_Script SHALL be executable using ts-node with the command: npx ts-node -r tsconfig-paths/register src/scripts/embed-catalog.ts
3. THE Embedding_Script SHALL import entities and services using the project's path aliases
4. THE Embedding_Script SHALL use TypeScript with proper type definitions
5. THE Embedding_Script SHALL handle the MikroORM initialization independently without requiring the NestJS application to be running

### Requirement 10: Error Handling and Resilience

**User Story:** As a developer, I want the script to handle errors gracefully, so that partial failures don't prevent the entire catalog from being embedded.

#### Acceptance Criteria

1. WHEN an embedding generation fails for a batch, THE Embedding_Script SHALL log the error and continue with the next batch
2. WHEN a Qdrant upsert fails for a listing, THE Embedding_Script SHALL log the error and continue with the next listing
3. WHEN the OpenAI API returns an error, THE Embedding_Script SHALL include the error message and batch information in the log
4. WHEN the database query fails, THE Embedding_Script SHALL log the error and terminate with exit code 1
5. THE Embedding_Script SHALL ensure database connections are closed even when errors occur
