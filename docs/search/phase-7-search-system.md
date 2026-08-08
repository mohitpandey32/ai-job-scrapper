# Phase 7: Search System

## Objective

Make job discovery usable before introducing a dedicated search engine.

## Implemented MVP Search

- Protected `GET /api/v1/jobs`
- Keyword search across title, normalized title, description, and company
- Filters for location, company, remote, hybrid, experience level, and minimum salary
- Sort options for newest, salary high to low, salary low to high, and company A-Z
- Pagination
- `GET /api/v1/jobs/:id` for job details
- `GET /api/v1/jobs/facets` for filter counts
- `GET /api/v1/jobs/autocomplete` for suggestions
- Frontend filters, sorting, result list, and pagination

## Current Search Engine

The MVP uses PostgreSQL queries through Prisma.

## Why

This is fast to ship and enough for early seeded data and the first ingestion runs.

## Trade-Offs

| Option | Pros | Cons | Decision |
| --- | --- | --- | --- |
| PostgreSQL contains search | Fast MVP, no new infra | Not enough for millions of jobs | Use now |
| PostgreSQL full-text search | Better ranking, still simple | Needs raw SQL indexes | Next improvement |
| Meilisearch | Great UX and typo tolerance | Additional service | Consider soon |
| OpenSearch | Large-scale industry standard | More ops cost | Later scale path |

## Next Search Improvements

- Add PostgreSQL full-text GIN indexes.
- Add relevance ranking.
- Add typo-tolerant autocomplete.
- Add saved-job/application state to search results.
- Move to Meilisearch or OpenSearch once job volume grows.

