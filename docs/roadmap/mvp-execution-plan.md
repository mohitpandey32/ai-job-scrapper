# MVP Execution Plan

## Product Goal

Launch a fast India-first subscription MVP that aggregates relevant public job openings, lets users upload resumes, analyzes resumes with AI, and helps users save and track applications.

## Build Order

1. Repository and documentation baseline
2. Database schema foundation
3. Backend foundation
4. Authentication and profiles
5. Resume upload and AI analysis
6. Job source configuration and ingestion foundation
7. Phase 5 backend approval
8. Backend API foundation
9. Worker execution and scheduler
10. Job normalization and deduplication persistence
11. Search and filters
12. Saved jobs and application tracker
13. Subscription gating
14. Deployment and monitoring

## MVP Constraints

- Optimize for faster MVP launch
- Keep architecture production-grade but avoid premature microservices
- Prefer permitted public job sources first
- Avoid direct automated LinkedIn scraping without permission/API access
- Make AI asynchronous where latency or cost is high

## Open Approval Gates

- Phase 4: Job aggregation system
- Phase 5: Backend architecture
- Phase 6: Frontend architecture
- Phase 8: AI architecture
- Phase 11: DevOps
