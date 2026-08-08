# AI Job Aggregation & Career Assistant

India-first subscription platform for aggregating public job openings, organizing them in one place, and helping candidates improve their job search with AI resume analysis and career assistance.

## Approved Baseline

- Initial market: India
- Role coverage: all roles
- Business model: subscription tool sold/promoted through Instagram
- MVP priority: faster launch with production-grade foundations
- Core value: continuously aggregate jobs related to users' fields in one place
- Resume support: users upload resumes and receive AI analysis
- Ingestion mode: continuous background aggregation for all users
- Primary sources: company career pages, public ATS feeds, and permitted public web sources
- LinkedIn posture: avoid direct automated scraping unless official permission/API access exists

## Current Phase Status

| Phase | Status |
| --- | --- |
| Phase 1: Product and Business Foundation | Approved |
| Phase 2: System Design | Approved |
| Phase 3: Database Design | Approved |
| Phase 4: Job Aggregation System | Approved |
| Implementation code | Not started |

## Architecture Direction

The MVP will use a modular monolith with background workers:

- React web app
- Node.js/TypeScript API
- Worker process for ingestion, AI tasks, and indexing
- PostgreSQL as the primary database
- Redis for cache, rate limits, queues, and background jobs
- Search abstraction for PostgreSQL full-text, Meilisearch, or OpenSearch
- Provider-agnostic AI layer for resume analysis and job matching
- Object storage for resume files
- Source-policy guarded ingestion for public ATS and career pages

## Repository Structure

```text
apps/
  api/
  web/
  worker/

packages/
  ai/
  config/
  ingestion/
  logger/
  types/
  validation/

infra/
  ci/
  docker/

docs/
  adr/
  architecture/
  product/
  roadmap/
```

## Approval Workflow

This project is developed phase by phase. Each phase must be approved before moving to the next phase or generating implementation code that depends on it.
