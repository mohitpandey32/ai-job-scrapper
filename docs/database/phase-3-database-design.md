# Phase 3: Database Design

## Objective

Design and implement the database foundation for the India-first AI job aggregation and career assistant platform.

## Approved Database Baseline

- Primary database: PostgreSQL
- ORM and migration direction: Prisma Migrate
- Resume files: object storage, not PostgreSQL
- Flexible scraped metadata: JSONB
- Flexible AI outputs: JSONB with versioning
- Primary keys: UUID
- Search MVP: PostgreSQL full-text search, with search abstraction for future Meilisearch/OpenSearch
- Vector MVP option: pgvector later, after AI architecture approval

## Why PostgreSQL

PostgreSQL is the strongest fit because the platform has relational workflows: users, profiles, jobs, companies, saved jobs, applications, sessions, audit logs, and AI recommendations. It also gives us JSONB for messy source metadata, mature indexing, full-text search, partitioning, and an optional pgvector path.

## Alternatives

| Option | Pros | Cons | Decision |
| --- | --- | --- | --- |
| PostgreSQL | Relational integrity, JSONB, full-text search, pgvector, mature indexes | Requires schema discipline | Approved |
| MySQL | Simple, reliable, common | Weaker JSON/search/vector ecosystem | Not selected |
| MongoDB | Flexible documents | Poor fit for application tracking and user workflows | Not selected as primary DB |

## Core Tables

- users
- user_profiles
- resumes
- ai_resume_analyses
- companies
- job_sources
- jobs
- job_raw_snapshots
- skills
- job_skills
- user_skills
- saved_jobs
- applications
- notifications
- sessions
- ai_recommendations
- audit_logs
- plans
- subscriptions
- payments
- usage_limits

## Security

- Passwords are stored as hashes only.
- Refresh tokens are stored as hashes only.
- Resume files are stored in private object storage.
- Resume access must use signed URLs.
- Audit logs must avoid raw resume text, secrets, and full AI prompts.
- Database credentials must be least privilege.
- Production connections must use TLS.

## Performance

The schema supports common MVP queries:

- Active job search by title, location, remote status, salary, and posting date
- Saved jobs by user
- Application board by user and status
- Fresh ingestion source selection
- AI recommendation lookup by user and match score
- Resume analysis version history

## Scalability

Initial scaling will use indexes, caching, and search abstraction. Future scale options include read replicas, partitioning large append-heavy tables, external search, and service extraction.

## Approval Status

Approved.

