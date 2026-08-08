# ADR-0003: Use Redis And BullMQ For Cache And Queues

## Status

Approved.

## Decision

Use Redis for caching, rate limiting, and queue backing. Use BullMQ for background jobs in the Node.js ecosystem.

## Why

The platform needs continuous scraping, AI processing, search indexing, retries, and rate limits. Redis and BullMQ provide a fast MVP-friendly queue and cache foundation.

## Pros

- Simple Node.js integration
- Fast queue setup
- Supports retries and delayed jobs
- Useful for caching and rate limits
- Lower operational overhead than Kafka

## Cons

- Redis persistence and memory usage need careful configuration
- Not ideal for very large event-streaming workloads
- BullMQ is tied to the Node.js ecosystem

## Alternatives

- RabbitMQ
- Kafka
- AWS SQS
- Google Pub/Sub

## Security

Redis must be private-network only, authenticated, encrypted in transit where supported, and never exposed publicly.

## Performance

Excellent for low-latency queue and cache operations.

## Scalability

Good for MVP and early production. Kafka or cloud queues may be considered if event volume becomes very high.

## Cost

Low to moderate depending on managed Redis size.

## Maintenance

Simple to maintain for early-stage systems.

