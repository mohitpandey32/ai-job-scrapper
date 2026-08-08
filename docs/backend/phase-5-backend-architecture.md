# Phase 5: Backend Architecture

## Objective

Build the MVP backend foundation with Express, TypeScript, REST APIs, email/password authentication, HTTP-only cookies, Prisma repositories, Zod validation, admin role protection, and worker separation.

## Approved MVP Decisions

- Express + TypeScript
- REST API
- Email/password authentication only
- Google login deferred
- HTTP-only cookie auth
- CSRF protection for cookie-authenticated state changes
- Refresh token rotation
- Zod request validation
- Prisma repository pattern
- Admin APIs protected by `ADMIN` role
- Subscription schema retained, no payment enforcement yet
- BullMQ worker architecture for background jobs

## Implemented Foundation

- API app bootstrap
- Health/readiness routes
- Auth signup, login, refresh, logout, and me routes
- Profile read/update routes
- Admin ingestion source/run/error read routes
- Worker bootstrap and queue names
- Ingestion worker policy-check placeholder
- Shared config, logger, validation, and database packages

## Security Notes

- Passwords are hashed with bcryptjs.
- Access and refresh tokens are sent through HTTP-only cookies.
- Refresh tokens are hashed before database storage.
- CSRF token is exposed through a separate non-HTTP-only cookie and must be sent as `x-csrf-token` on unsafe requests.
- Admin routes require authenticated `ADMIN` users.
- Logger redacts cookies, authorization headers, passwords, and tokens.

## Remaining Backend Work

- Add OpenAPI documentation.
- Add auth tests.
- Add resume upload endpoints.
- Add jobs/search/saved jobs/application modules.
- Add real queue producers.
- Add Redis-backed rate limit store.
- Add subscription plan/status endpoints later.

## Approval Status

Approved and implementation started.

