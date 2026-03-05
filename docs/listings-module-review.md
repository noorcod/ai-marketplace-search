# Listings Module Review

Date: 2025-09-02
Reviewer: Internal Code Review (Generated)

## 1. Scope

Reviewed non-test source files under `src/modules/listings`:

- Controller, Service, Module
- Repository (`fetchRandomListings` + `applyFilters`)
- DTOs: random, most-viewed, top-discounted, section listings
- Core entity `listing.entity.ts` (structure & mapping)

Excluded: Spec files, other entities’ internal details, global utilities.

## 2. High-Level Overview

The Listings module provides read-focused endpoints:

- Random listings selection with progressive filter relaxation
- Most viewed listings
- Top discounted listings with city/category fallback
- Section-based batch retrieval
- Listing detail (PDP)
- Related products based on price tolerance & category/brand/spec filters

Tech stack: NestJS + MikroORM (MySQL) + custom BaseRepository + raw Knex for random selection. Responses wrapped using `AppResponse` and transformers in PDP path.

## 3. Architecture & Design Notes

Strengths:

- Clear separation of repository and service logic for specialized random query
- Reusable column & populate constants
- Progressive relaxation strategy (random / discounted / related logic) shows user-oriented design

Areas to Improve:

- Inconsistent filtering logic spread across service & repository (harder to evolve)
- Mixed naming conventions (`brand` vs `brandName`, `condition` vs `conditionName`)
- Magic strings and magic numbers for statuses, tolerances, counts
- Inconsistent response transformation (only PDP path applies transformer)

## 4. Identified Issues (Bugs) & Fixes

| Severity | Area                          | Issue                                                                                             | Fix Recommendation                                                                  |
| -------- | ----------------------------- | ------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| Critical | Service `fetchRandomListings` | `remaining = remaining - finalResults.length;` subtracts cumulative size ⇒ underfetch or negative | Use `remaining -= unique.length;` or `remaining = requested - finalResults.length;` |
| High     | Service `fetchRandomListings` | Potential infinite/pointless loop if `unique.length === 0`                                        | Break when no new results after filter removal                                      |
| High     | Service                       | `count` may be `undefined` ⇒ unbounded SQL (no limit)                                             | Enforce required size or default (e.g. 10) with validation                          |
| High     | DTO `RandomListingsQueryDto`  | `minPrice` / `maxPrice` typed & validated as `string` but used numerically                        | Change to `number` with `@Type(() => Number)` & `@IsNumber()`                       |
| High     | Service responses             | Array results cast to `AppResponse<Partial<Listing>>` (singular)                                  | Correct generics: `AppResponse<Partial<Listing>[]>`                                 |
| High     | Related products              | Assumes `category` relation loaded; may be null                                                   | Ensure populate (or re-fetch with populate) & add guard                             |
| Medium   | Error fallback logic          | Condition for random fallback on failed detail fetch ambiguous                                    | Differentiate not found vs internal error                                           |
| Medium   | Repository                    | `console.log(where.shop.username);` leaking info                                                  | Remove debug log                                                                    |
| Medium   | Random selection              | `ORDER BY RAND()` scalability issue                                                               | Implement id sampling strategy / pre-sampled table                                  |
| Medium   | Mutation of filter object     | Deleting keys from shared `whereCondition`                                                        | Clone before mutation                                                               |
| Low      | Hard-coded magic numbers      | 4, 30, 20, 30 inside logic                                                                        | Extract to constants                                                                |
| Low      | Magic status string           | `'Validated,Active'`                                                                              | Use enum/constants                                                                  |
| Low      | Naming inconsistency          | Mixed `brand` vs `brandName`                                                                      | Normalize DTO -> internal mapping                                                   |
| Low      | Dedup O(n^2)                  | `some()` for each new listing                                                                     | Use `Set` for visited ids                                                           |

## 5. Quick-Win Patch Set (Minimal Risk)

1. Fix random listings loop & remaining calculation
2. Convert price fields to number in DTO + validation
3. Remove debug console log
4. Correct response generics for array endpoints
5. Add guard & populate check in related products
6. Extract magic numbers/status to constants (optional step)

## 6. Suggested Code Improvements (Beyond Bug Fixes)

### Abstraction

- Introduce a `ListingFilterBuilder` to centralize dynamic where clause assembly
- Create `ListingSelectionStrategy` (random, most-viewed, discounted, related) to isolate algorithms

### Configuration & Constants

```
export const RANDOM_LISTINGS_MIN = 4;
export const RANDOM_LISTINGS_MAX = 30;
export const RELATED_PRICE_TOLERANCES = [20, 30];
export enum ListingStatus { ValidatedActive = 'Validated,Active', PendingInactive = 'Validation Pending,Inactive' }
```

### Performance

- Replace `ORDER BY RAND()`:
  1. Determine active id range
  2. Generate random candidate ids client-side
  3. Query subset with `WHERE listing_id IN (...)`
  4. If insufficient, fallback to relaxed filters
- Add indexes: `(activation_date, archived_on, is_deleted, listed_qty)`, `(category_name)`, `(city_id)`, `(brand_name)`, `(effective_price)` depending on selectivity

### Consistency & Types

- Ensure all public endpoints return consistent DTO shapes (e.g., `ListingSummaryDto`) and map raw Knex rows to camelCase
- Unify filter names in DTOs (`brandName`, `conditionName`) and map to DB fields internally

### Observability

- Structured logging events: `random_listings_iteration`, `related_products_tolerance_retry`, `discounted_listings_city_fallback`
- Metrics: number of filter relaxations, proportion of second tolerance usage, average query time

### Testing Strategy

- Unit tests for `fetchRandomListings` (count bounds, dedup, relaxation)
- Tests for related products tolerance expansion (20% then 30%)
- Discounted listings fallback when city-limited results < requested count
- Repository filter builder snapshot of generated SQL (`toSQL()`) for regression safety

### Error Handling & Fallbacks

- Differentiate `NotFound` vs `InternalError` and reflect in response codes
- Provide structured error object (code, message, meta) in `AppResponse`

### Caching Opportunities

- PDP listing detail (short TTL 30–60s)
- Related products (key: listingId + page + tolerance hash)
- Most viewed (Compute & cache daily top N)

### Security & Privacy

- Remove stray debug logs
- Validate numeric inputs with bounds to avoid large queries (DoS surface)
- Consider rate limiting for random listings endpoint

### Code Hygiene

- Remove unused DI injections (`MikroORM`, `EntityManager`) if not directly used
- Use `private` for internal helper `buildWhereCondition` and move to a separate helper class if reused
- Mark constant objects as `readonly` or move outside class scope

## 7. Proposed Implementation Roadmap

| Phase | Goals                                       | Est. Effort                     |
| ----- | ------------------------------------------- | ------------------------------- |
| 1     | Quick-win patch set + tests                 | 0.5–1 day                       |
| 2     | Filter builder abstraction + enum/constants | 0.5 day                         |
| 3     | Random selection performance optimization   | 1–1.5 days (incl. benchmarking) |
| 4     | DTO normalization + response mapping layer  | 0.5 day                         |
| 5     | Caching + metrics instrumentation           | 1 day                           |
| 6     | Extended test coverage + CI quality gates   | 0.5 day                         |

## 8. Sample Refactored Random Logic (Conceptual)

```ts
const requested = clamp(query.size ?? DEFAULT_RANDOM_SIZE, RANDOM_LISTINGS_MIN, RANDOM_LISTINGS_MAX);
const filterStages = buildFilterRelaxationStages(baseFilter, [
  'shop',
  'city',
  'categoryName',
  'brandName',
  'conditionName',
  'effectivePrice',
]);
const seen = new Set<number>();
for (const stage of filterStages) {
  const batch = await repo.fetchRandomListings(stage, requested - seen.size);
  addUnique(batch, seen, results);
  if (seen.size >= requested) break;
  if (batch.length === 0) continue; // move to next relaxation
}
return AppResponse.Ok(results.slice(0, requested));
```

## 9. Data Model Observations

- Entity is large; consider splitting price/rating fields into a projection DTO for lightweight list responses
- Status enum strongly recommended
- Many one-to-one relations: ensure lazy loading doesn’t cause N+1 (current approach uses explicit populate arrays — good)

## 10. Endpoint Summary (Current)

| Endpoint                      | Purpose                             | Notes                        |
| ----------------------------- | ----------------------------------- | ---------------------------- |
| GET /listings/random          | Random listings with filters        | Needs bounds & metadata      |
| GET /listings/most-viewed     | Top visited listings                | Add size validation          |
| GET /listings/top-discounted  | Highest discount                    | City/category fallback logic |
| POST /listings/theme-sections | Batch fetch by ids per section      | Could be GET with `ids`      |
| GET /listings/:id             | Listing detail (PDP)                | Applies transformer          |
| GET /listings/:id/related     | Related listings by price tolerance | Needs fallback clarity       |

## 11. Glossary

- PDP: Product Detail Page
- Tolerance: Percentage deviation around base price for related selection
- Relaxation: Progressive removal of filters to meet requested count

## 12. Shareable Summary (Short Form)

The Listings module is functional but needs immediate fixes to random selection logic (remaining calculation, unbounded size, DTO type mismatch). Medium-term improvements include centralizing filter construction, optimizing random selection, and standardizing DTOs & statuses. Performance risks center on `ORDER BY RAND()` and potential over-fetch; observability and caching additions would reduce load.

## 13. Recommended Immediate Actions

1. Apply quick-win patch set (Section 5)
2. Add basic tests for random, discounted, related logic
3. Introduce constants & enums

## 14. Risks if Unaddressed

- Under/over-fetching random listings causing inconsistent UX
- Potential heavy DB load from unbounded random queries
- Hard-to-maintain filter logic duplication slowing new feature velocity

---

For follow-up, implement Phase 1 & 2, then benchmark random selection before moving to Phase 3.
