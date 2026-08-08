# ADR-0001: Use Modular Monolith For MVP

## Status

Approved.

## Decision

Use a modular monolith with separate runtime processes for the API and background workers.

## Why

The platform needs fast MVP delivery while keeping enough structure for future scale. A modular monolith gives clean domain boundaries without the operational cost of microservices.

## Pros

- Faster development
- Easier local debugging
- Lower deployment complexity
- Shared types and validation
- Clear path to extract services later

## Cons

- Requires discipline to maintain module boundaries
- Can become large as the product grows
- Independent scaling is less granular than microservices

## Security

Centralized auth, authorization, validation, logging, and audit controls are easier to enforce initially.

## Performance

Good for MVP. Slow background operations run in workers instead of blocking API requests.

## Scalability

API and workers can scale horizontally as separate processes. Later, ingestion, search, and AI can be extracted.

## Cost

Lower cost than microservices because fewer deployable units and infrastructure components are required.

## Maintenance

Maintainability depends on strict module boundaries, dependency rules, and ADR discipline.

