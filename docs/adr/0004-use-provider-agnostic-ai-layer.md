# ADR-0004: Use Provider-Agnostic AI Layer

## Status

Approved.

## Decision

Wrap AI providers behind internal interfaces for resume analysis, skill extraction, job matching, cover letters, and future career coaching.

## Why

The platform should avoid lock-in to one model vendor and should support model routing based on latency, cost, quality, and availability.

## Pros

- Easier to compare OpenAI, Claude, Gemini, and open-source models
- Cost optimization through model routing
- Better resilience if one provider fails
- Cleaner testing with mocked AI interfaces

## Cons

- More abstraction work upfront
- Lowest-common-denominator interface risk
- Provider-specific features need careful design

## Security

The AI layer must enforce prompt injection defenses, context minimization, PII controls, and logging rules that avoid storing sensitive resume content.

## Performance

Allows async AI jobs, caching, and model selection by workload.

## Scalability

AI processing can scale independently through workers and queues.

## Cost

Enables cheaper models for extraction and stronger models for high-value recommendations.

## Maintenance

Centralizes prompt templates, evaluation, model configuration, and safety controls.

