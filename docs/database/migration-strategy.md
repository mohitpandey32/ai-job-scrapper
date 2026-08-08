# Migration Strategy

## Tool

Use Prisma Migrate for schema versioning.

## Why

Prisma gives a fast TypeScript developer experience and reliable migration tracking. Advanced PostgreSQL features can still be added with raw SQL migrations.

## Environments

- Local development
- Staging
- Production

## Rules

- Every schema change must be represented as a migration.
- Never edit an applied production migration.
- Use backward-compatible migrations for production releases.
- Add indexes concurrently for large production tables when possible.
- Separate application DB credentials from migration credentials.
- Run migrations in CI before deployment.
- Back up production before high-risk migrations.

## Rollback Strategy

- Prefer forward-fix migrations.
- Keep database backups and point-in-time recovery enabled.
- Avoid destructive column drops until data has been migrated and verified.
- Use expand-and-contract migrations for breaking schema changes.

## Seed Strategy

Initial seed data should include:

- Default subscription plans
- Common skills
- Source type enums
- Admin user only through secure environment-controlled setup

