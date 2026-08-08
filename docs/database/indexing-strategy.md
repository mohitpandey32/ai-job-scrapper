# Indexing Strategy

## Principles

- Index fields used in filters, joins, uniqueness checks, and ordering.
- Use composite indexes for common query shapes.
- Avoid indexing every column.
- Use raw SQL migrations for advanced PostgreSQL indexes not fully expressed by Prisma.
- Monitor slow queries before adding heavy indexes.

## Critical Indexes

| Table | Index | Purpose |
| --- | --- | --- |
| users | email unique | Login lookup |
| users | provider, provider_id | OAuth lookup |
| jobs | status, country, posted_at | Active India jobs ordered by freshness |
| jobs | status, normalized_title, posted_at | Role-based job discovery |
| jobs | country, location_state, location_city | Location filters |
| jobs | company_id | Company page and joins |
| jobs | source_id, external_job_id unique | Source-level deduplication |
| jobs | canonical_url unique | URL-level deduplication |
| jobs | content_hash | Content-level deduplication |
| saved_jobs | user_id, job_id unique | Prevent duplicate saves |
| saved_jobs | user_id, created_at | Saved jobs list |
| applications | user_id, job_id unique | One tracker item per job |
| applications | user_id, status, updated_at | Application board |
| job_sources | status, last_crawled_at | Scheduler source selection |
| source_policies | allowed, risk_level | Find crawlable sources |
| source_policies | terms_review_status | Compliance/source review |
| ingestion_runs | source_id, created_at | Source run history |
| ingestion_runs | status, created_at | Failed/running run lookup |
| ingestion_errors | ingestion_run_id, severity | Run failure diagnostics |
| ai_recommendations | user_id, match_score | Recommendation ranking |
| sessions | refresh_token_hash unique | Refresh token lookup |
| audit_logs | user_id, created_at | User audit history |

## Future PostgreSQL Extensions

Recommended extensions when migrations begin:

```sql
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS unaccent;
CREATE EXTENSION IF NOT EXISTS vector;
```

`vector` should only be added after Phase 8 AI architecture approval.

## Future Raw SQL Indexes

Prisma may need raw SQL migrations for:

- Full-text GIN indexes on job title and description
- Trigram indexes on company names and job titles
- Partial indexes for active jobs
- Vector indexes for embeddings
- Partition indexes for large historical tables
