# ADR-0005: Use Source Policy Layer For Ingestion

## Status

Approved.

## Decision

Introduce a source policy layer that classifies job sources before crawling or ingestion.

## Why

The platform will aggregate from career pages and public web sources. Source risk must be managed explicitly to protect reliability, legality, and subscription business trust.

## Pros

- Reduces risky scraping behavior
- Supports source allowlists and blocklists
- Improves crawler reliability
- Helps document compliance decisions
- Enables different crawl frequencies by source

## Cons

- Adds upfront operational complexity
- Requires maintaining source rules
- Does not eliminate all legal risk

## Alternatives

- Crawl every discovered source
- Manual-only source list
- API-only aggregation

## Security

Source policy helps prevent accidental crawling of authenticated, private, or prohibited content.

## Performance

Rate-limit rules and crawl frequencies prevent worker overload and source blocking.

## Scalability

Enables many source adapters while keeping ingestion behavior controlled.

## Cost

Avoids wasted worker time on blocked or low-quality sources.

## Maintenance

Requires periodic review of source health, terms, robots rules, and failures.

