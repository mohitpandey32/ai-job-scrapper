# Source Management

## MVP Strategy

Use config-file source management first. This is faster than building an admin dashboard and still keeps sources reviewable.

## Source Record Requirements

Each source must define:

- `name`
- `sourceType`
- `sourceUrl`
- `country`
- `riskLevel`
- `termsReviewStatus`
- `crawlFrequencyMinutes`
- `allowed`
- `notes`

## Review Rules

Sources should be blocked when they:

- Require login
- Present CAPTCHA as normal access flow
- Prohibit automated access
- Contain private user data
- Repeatedly fail
- Are unrelated to job postings

## Future Admin Dashboard

The admin dashboard should support:

- Add source
- Pause source
- Block source
- Review source health
- Re-run source crawl
- View ingestion errors
- View duplicate rate

