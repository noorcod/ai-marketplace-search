# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## [Unreleased]

### Models Filters – Finalized (2025-11-11)

#### Added

- **Source parameter for aggregated filters**: `source=web|mobile` with dynamic per-filter caps (web: 10, mobile: 5). Override via `perFilterMaxValues`.
- **Single filter pagination**: `GET /models/filters/:filterName` supports `page`/`size` and returns `pagination.hasMore`.
- **Counts per value**: Repository now selects `COUNT(model_id) as count`; mapped in responses.
- **DTOs aligned with listings**: `ModelsFiltersResponseDto`, `SingleModelsFilterResponseDto`, `ModelFilterDto`, `ModelFilterValueDto`.
- **Docs**: Updated `docs/models-filter-architecture.md` with final behavior and contracts.

#### Changed

- **Entity property names everywhere**: Service queries and value extraction use `filterDef.name` (not DB columns).
- **Brand grouped under category**: When `categoryName` is provided, `brandName` is returned in `categoryFilters`.
- **Selection logic**: Unified and normalized for checkbox/radio/boolean, including array and CSV support for checkbox.
- **Multi-value params**: `brandName` accepts repeated query params or comma-separated values; `ModelOptionsBuilder` handles `string[]` via `$in`.
- **Label generation**: Only booleans are formatted (Yes/No); other values are returned as-is to avoid duplicating units.
- **Search integration**: `ModelOptionsBuilder.setSearch()` applies search context to filter aggregations.

#### Fixed

- **Counts always zero** → Now aggregated and mapped correctly.
- **Category selection missing** → `categoryName` merged into applied filters so it appears selected.
- **Cannot pass multiple brands** → Array/CSV support implemented and selection works.
- **Service method availability** → Public `getFilterByName()` added to `ModelsFilterService` for controller usage.

#### DTOs & Controller

- `ModelFiltersQueryDto`: added `source`, `perFilterMaxValues`, `includeEmpty`; `brandName` supports arrays/CSV.
- `ModelsController`: aggregated endpoint uses dynamic per-filter caps; single-filter endpoint excludes non-filter params from `filters`.

#### Repository & Utilities

- `ModelsRepository.fetchOneFilter()`: selects `[key, COUNT(model_id) as count]`, grouped and ordered by count desc.
- `ModelOptionsBuilder`: `setWhereClause` and `setRawWhereClause` accept `string[]` and build `$in`/IN conditions.

#### Documentation

- `docs/models-filter-architecture.md` updated with final implementation, examples, and endpoint contracts.

---

## Notes

- All changes are backward compatible
- Existing API calls continue to work with improved validation
- No breaking changes introduced
