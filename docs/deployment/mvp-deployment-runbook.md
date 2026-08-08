# MVP Deployment Runbook

This runbook deploys the current MVP without adding new product features.

## Recommended Architecture

```text
Vercel static web app
  -> Render API service
      -> Supabase PostgreSQL
      -> Upstash Redis
      -> Gemini API

Render worker
  -> processes queued ingestion jobs

Render cron
  -> runs ingestion every 6 hours
```

## Decision

Use Vercel for the React frontend and Render for the Node API, background worker, and ingestion cron.

Why:
- Fast MVP launch.
- Managed HTTPS, logs, deploys, and rollbacks.
- Separate API, worker, and cron processes.
- No Kubernetes or server administration for version one.

Advantages:
- Low operational complexity.
- Works well with the current monorepo.
- Easy to connect GitHub for CI/CD.
- Singapore region is acceptable for India MVP latency.

Disadvantages:
- Render Singapore is not the same as Mumbai.
- Runtime currently uses `tsx`; later production hardening should compile API and worker to JavaScript.
- Local resume storage is not durable across cloud redeploys. Use Cloudflare R2 before public resume upload traffic.

Alternatives:
- AWS ECS + RDS + ElastiCache + S3: stronger long-term control, slower and more expensive to launch.
- Railway-only deployment: fastest, but weaker production control.
- Fly.io: good regional control, more operational complexity.

Industry standard:
- Start with managed PaaS for MVP.
- Move to AWS/GCP/Azure or containerized workloads when traffic, compliance, or cost requires it.

## Step 1: Create Managed Services

Create these accounts/projects:

- Vercel project for `apps/web`.
- Render Blueprint connected to this repository.
- Supabase PostgreSQL project in Mumbai if available for your plan.
- Upstash Redis database in Mumbai or Singapore.
- Google AI Studio Gemini API key.

## Step 2: Configure Database

Use Supabase Postgres.

For Render API and worker:
- Prefer Supabase session pooler if direct IPv6 is not reachable.
- Use direct connection for migrations only when available.

Set:

```text
DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/postgres
```

## Step 3: Configure Render

Use `render.yaml` from the repository root.

Render services created:
- `ai-job-platform-api`
- `ai-job-platform-worker`
- `ai-job-platform-ingestion-cron`

Required Render environment variables:

```text
APP_URL=https://your-vercel-domain.vercel.app
API_URL=https://your-api-service.onrender.com
CORS_ORIGIN=https://your-vercel-domain.vercel.app
COOKIE_DOMAIN=
DATABASE_URL=postgresql://...
REDIS_URL=rediss://...
JWT_ACCESS_TOKEN_SECRET=<32+ char random secret>
JWT_REFRESH_TOKEN_SECRET=<different 32+ char random secret>
GEMINI_API_KEY=<gemini api key>
```

The API health check path is:

```text
/health/ready
```

## Step 4: Configure Vercel

Use `vercel.json` from the repository root.

Set Vercel environment variable:

```text
VITE_API_URL=https://your-api-service.onrender.com
```

Build command:

```text
pnpm web:build
```

Output directory:

```text
apps/web/dist
```

## Step 5: Deploy Order

Deploy in this order:

1. Supabase PostgreSQL.
2. Upstash Redis.
3. Render API.
4. Render worker.
5. Render ingestion cron.
6. Vercel frontend.

Why:
- API requires database and Redis secrets.
- Frontend needs the final API URL.

## Step 6: Migration

Render API runs:

```text
pnpm db:migrate:deploy
```

This applies committed Prisma migrations in production.

Do not run `pnpm db:migrate:dev` against production.

## Step 7: Seed Job Sources

After the first successful API deployment, run this once from a secure Render shell or local shell pointed at production:

```text
pnpm db:seed
```

## Step 8: Run Initial Ingestion

Run this once after seeding:

```text
pnpm worker:ingest:once
```

The cron service will continue ingestion every 6 hours.

## Step 9: Verify Production

Check:

```text
https://your-api-service.onrender.com/health
https://your-api-service.onrender.com/health/ready
https://your-vercel-domain.vercel.app/login
```

Acceptance checks:
- Signup works.
- Login works.
- Jobs page loads real jobs.
- Freshers Hub loads real early-career jobs.
- Resume upload works for MVP local storage.
- Gemini resume analysis works.
- Cover letter PDF downloads.
- Admin ingestion page is accessible only for admin users.

## Step 10: Known Production Follow-Ups

Before public launch:

- Replace local resume storage with Cloudflare R2.
- Add production email provider for alerts and verification.
- Add structured uptime monitoring.
- Add log retention.
- Add backup policy for PostgreSQL.
- Add apply-link validation before aggressive Instagram promotion.
