# Run Real Job Ingestion

## What This Does

The MVP ingestion runner fetches jobs from allowed public ATS sources stored in the database.

Current seeded sources:

- Binance Lever postings
- The Block Lever postings

The runner only persists jobs that appear India-relevant based on location/title/description metadata. Direct LinkedIn scraping remains blocked by source policy.

## Commands

Seed source configuration:

```bash
pnpm db:seed
```

Run ingestion once:

```bash
pnpm worker:ingest:once
```

Then open the Jobs page and refresh.

## Production Notes

- This is run-once ingestion, not continuous scheduling yet.
- The next step is queue scheduling with Redis/BullMQ.
- Public ATS APIs are preferred over broad web scraping.
- Source failures are recorded in `ingestion_runs` and `ingestion_errors`.
- Source allow/block decisions are governed by `source_policies`.

