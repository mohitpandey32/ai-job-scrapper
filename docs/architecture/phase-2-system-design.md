# Phase 2: System Design

## Objective

Design a scalable production architecture for a fast MVP that can later support millions of users, jobs, searches, resume uploads, AI workloads, and continuous job ingestion.

## Recommended Architecture

Use a modular monolith plus background workers.

## Why

- Faster MVP delivery than microservices
- Cleaner operational model
- Easier debugging and deployment
- Still supports strong module boundaries
- Allows future extraction of ingestion, search, and AI services

## Trade-Offs

| Architecture | Pros | Cons | Best Use |
| --- | --- | --- | --- |
| Modular monolith | Fast, simple, maintainable | Can grow large if boundaries are weak | MVP and early scale |
| Microservices | Independent scaling and ownership | High operational complexity | Later stage with clear scaling pain |
| Serverless-first | Low infrastructure management | Harder local development and long-running scraping | Specific async workloads later |

## High-Level Components

```mermaid
flowchart LR
  User["User Browser"] --> Web["React Web App"]
  Web --> API["Node.js API"]
  API --> DB["PostgreSQL"]
  API --> Redis["Redis"]
  API --> Search["Search Layer"]
  API --> AI["AI Service Layer"]
  API --> Storage["Object Storage"]

  Scheduler["Scheduler"] --> Queue["Redis / BullMQ Queue"]
  Queue --> Worker["Worker Process"]
  Worker --> Sources["Career Pages / ATS / Public Web"]
  Worker --> Normalize["Normalizer + Deduplicator"]
  Normalize --> DB
  Normalize --> Search
```

## Core Components

| Component | Responsibility |
| --- | --- |
| Web App | Candidate experience, search, resume upload, application tracking |
| API | Auth, profiles, jobs, resumes, saved jobs, applications, AI endpoints |
| Worker | Scraping, parsing, normalization, deduplication, AI jobs, indexing |
| Scheduler | Continuous source refresh |
| Queue | Retries, delays, background processing |
| PostgreSQL | Primary source of truth |
| Redis | Cache, rate limits, queue backend |
| Search Layer | Search abstraction for MVP and future scale |
| Object Storage | Secure resume file storage |
| AI Layer | Provider-agnostic resume analysis and matching |

## Authentication Flow

```mermaid
sequenceDiagram
  participant User
  participant Web
  participant API
  participant Google
  participant DB

  User->>Web: Login or sign up
  Web->>API: Submit credentials or Google OAuth token
  API->>Google: Verify Google identity when applicable
  API->>DB: Create or fetch user
  API->>API: Issue access and refresh tokens
  API->>Web: Return authenticated session
```

## Search Flow

```mermaid
flowchart TD
  A["User searches"] --> B["API validates query"]
  B --> C["Check Redis cache"]
  C -->|Hit| D["Return cached results"]
  C -->|Miss| E["Search layer"]
  E --> F["Apply filters and ranking"]
  F --> G["Attach saved/application state"]
  G --> H["Return results"]
```

## Job Aggregation Flow

```mermaid
flowchart TD
  A["Scheduler"] --> B["Queue source crawl"]
  B --> C["Worker fetches source"]
  C --> D["Source policy checks"]
  D --> E["Parser extracts jobs"]
  E --> F["Normalizer standardizes data"]
  F --> G["Deduplicator checks duplicates"]
  G --> H["Persist jobs"]
  H --> I["Update search index"]
  H --> J["Record ingestion metrics"]
```

## AI Flow

```mermaid
flowchart TD
  A["Resume upload"] --> B["Secure object storage"]
  B --> C["Text extraction"]
  C --> D["AI resume parser"]
  D --> E["Structured profile intelligence"]
  E --> F["Embedding and matching layer"]
  G["Job description"] --> H["Skill extraction"]
  H --> F
  F --> I["Match score and explanation"]
```

## Deployment Direction

- Dockerized API container
- Dockerized worker container
- Managed PostgreSQL
- Managed Redis
- S3-compatible object storage
- Static frontend hosting behind CDN
- Monitoring and logs from first production release

## Source Policy

The ingestion system must classify sources before crawling.

| Source | MVP Policy |
| --- | --- |
| Company career pages | Allowed when public and accessible |
| Greenhouse | Allowed |
| Lever | Allowed |
| Ashby | Allowed |
| Public web job pages | Allowed after policy checks |
| LinkedIn | Avoid direct automated scraping unless official permission/API access exists |

## Architecture Decision Records

See `docs/adr`.

## Approval Status

Approved.

