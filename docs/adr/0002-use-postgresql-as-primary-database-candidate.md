# ADR-0002: Use PostgreSQL As Primary Database

## Status

Approved.

## Decision

Use PostgreSQL as the primary source of truth for users, profiles, jobs, companies, saved jobs, applications, sessions, audit logs, and AI metadata.

## Why

The domain is relational and requires strong consistency. PostgreSQL also supports JSONB, full-text search, mature indexing, partitioning, and pgvector.

## Pros

- Strong relational integrity
- Excellent indexing
- JSONB support for scraped metadata
- Full-text search for MVP
- pgvector option for AI features
- Mature production ecosystem

## Cons

- Requires schema design discipline
- Search may need external engine at scale
- Vector search may need dedicated infrastructure later

## Alternatives

- MySQL
- MongoDB
- Hybrid PostgreSQL + document store

## Security

Supports least-privilege users, TLS connections, encrypted backups, row-level security, and audit-friendly access patterns.

## Performance

Excellent for transactional workloads and indexed queries. Heavy search should move to a dedicated search layer when needed.

## Scalability

Supports read replicas, partitioning, and future sharding patterns.

## Cost

Affordable in managed cloud offerings and efficient for MVP.

## Maintenance

Well understood by engineering teams and supported by strong migration tooling.
