# myAPIRest

A modular REST services platform for authentication, user management, and shared capabilities used by the Pet, SonicPI, Health, and TicketSeller applications.

> Status: runnable API with authentication, sessions, password recovery, protected movie and event integrations, favorites, showtimes, seats, and sandbox ticket purchases.

## Purpose

This repository centralizes capabilities that several applications need in common, starting with identity and access. It does not replace each application's own domain: those domains remain separate and avoid duplicating sensitive authentication logic in every project.

## Current scope

The API exposes a versioned contract under `/api/v1`:

| Method | Route | Purpose |
| --- | --- | --- |
| `POST` | `/auth/register` | Create a user account. |
| `POST` | `/auth/login` | Start a password-based session. |
| `POST` | `/auth/request-login-code` | Request a passwordless login OTP. |
| `POST` | `/auth/verify-login-code` | Verify a login OTP and start a session. |
| `POST` | `/auth/logout` | Revoke the current session. |
| `POST` | `/auth/forgot-password` | Request a password-recovery OTP. |
| `POST` | `/auth/reset-password` | Verify a recovery OTP and change a password. |
| `GET` | `/users/me` | Read the authenticated user's profile. |
| `GET` | `/movies/now-playing`, `/movies/popular`, `/movies/top-rated`, `/movies/upcoming` | Read the movie catalog. |
| `GET` | `/movies/:id` | Read movie details. |
| `GET` | `/events?countryCode=MX&size=10&page=0` | Read Ticketmaster events. |
| `GET` | `/events/classifications` | Read Ticketmaster classifications. |
| `POST` | `/purchases` | Create a ticket purchase through the sandbox payment gateway. |
| `GET` | `/purchases` | List the authenticated user's confirmed purchases. |

## Domain boundaries

- **auth** and **users** are shared modules that own identity, sessions, and the base profile.
- **pet**, **health**, and future modules retain their own data and business rules.
- Health- or pet-specific fields are not added to the base user unless there is an explicit shared need.

The initial architecture is a **modular monolith**. It is simpler to build, test, and deploy than microservices at this stage, while keeping clear boundaries for a future separation when the product requires it.

## Technology stack

- Node.js LTS and TypeScript
- NestJS
- PostgreSQL
- Prisma ORM with versioned migrations
- Docker Compose for the local environment
- OpenAPI/Swagger for the HTTP contract
- Vitest for tests

The final selection is versioned alongside the implementation; dependencies are not added without reviewing their maintenance, license, and need.

## Security from the start

- Passwords are protected with Argon2id and are never stored or logged as plain text.
- Short-lived access tokens and rotating refresh tokens are stored as hashes and can be revoked on logout.
- Every HTTP input is validated; payload sizes are limited and error responses omit internal details.
- Rate limiting protects sensitive endpoints such as registration and login.
- CORS and security headers are configured before enabling web clients or public deployments.
- Secrets live only in environment variables. `.env` is never committed; `.env.example` contains no secrets.
- Card data and CVV used by the sandbox gateway are validated in memory only: they are never stored, returned, or logged.
- Migrations, lockfiles, and reproducible configuration are committed to Git.

## Development

Requires Node.js 24.

```bash
npm install
npm run start:dev
```

With the server running, the technical `GET /api/v1/health` endpoint responds with:

```json
{ "status": "ok" }
```

Interactive documentation is available at `http://localhost:3000/api/docs`, and the OpenAPI JSON document is available at `http://localhost:3000/api/docs-json`. Swagger provides examples for every endpoint and lets you use **Authorize** with a Bearer access token to test protected routes.

Before integrating changes, verify the project with:

```bash
npm run build
npm test
npm run test:e2e
npm audit
```

## Local database

PostgreSQL runs in Docker and is exposed only on `localhost:5432`; it is not accessible from other devices on the network.

```bash
docker compose up -d
docker compose ps
```

The first run creates a Docker volume named `my-api-rest_postgres_data`, which preserves data when the container stops. To stop the database without deleting data:

```bash
docker compose down
```

`.env` contains local credentials and is excluded from Git. A developer cloning the repository must copy `.env.example` to `.env` and replace the example password before starting the containers.

## Prisma and migrations

Prisma manages the PostgreSQL schema and migrations. The shared model starts with `User`; data exclusive to Pet or Health belongs in separate modules.

Inside NestJS, `PrismaModule` exposes `PrismaService` as the only technical gateway to PostgreSQL. Business modules should depend on that service and must not open connections or run SQL independently.

```bash
npm run prisma:validate
npm run prisma:migrate -- --name describe-your-change
npm run prisma:generate
```

Generated migrations in `prisma/migrations` are committed to Git. The generated client in `src/generated/prisma` is not committed; it is regenerated from the schema.

## Users and authentication

`users` owns the shared user model and keeps its use cases separate from the PostgreSQL adapter. It exposes no HTTP routes and never returns password hashes; the `auth` module owns those responsibilities.

`POST /api/v1/auth/register` creates a user with a valid email and password. Passwords are processed with Argon2id and are never included in responses or stored as plain text.

`POST /api/v1/auth/login` issues a short-lived JWT access token and an opaque refresh token. Refresh tokens are stored only as hashes in `refresh_sessions`, so they can be revoked or rotated without persisting session secrets.

`POST /api/v1/auth/refresh` rotates the refresh token: the previous token is invalidated when the next one is issued. `POST /api/v1/auth/logout` revokes the session associated with the refresh token and returns `200` with `{ "success": true }`.

`POST /api/v1/auth/forgot-password` always returns `202`, whether the account exists or not, to avoid revealing registered emails. For an active account it generates a six-digit OTP valid for 15 minutes. `POST /api/v1/auth/reset-password` validates the OTP, allows at most five attempts, changes the password, and revokes every existing session.

## Purchases and sandbox payment gateway

`POST /api/v1/purchases` creates a confirmed purchase for the authenticated user. The service validates the showtime and seats, recalculates the price on the server, stores a historical ticket snapshot, and prevents double sales with a unique constraint per showtime and seat. `GET /api/v1/purchases` returns the current user's purchase history.

The gateway is **sandbox-only**: the cards below are test credentials, do not represent real cards, and never create charges. Full card numbers, expiration dates, and CVVs are used only to simulate a bank decision and are never persisted, returned, or logged.

| Brand | Sandbox outcome | Number | Expiry | CVV |
| --- | --- | --- | --- | --- |
| Visa | Approved | `4242 4242 4242 4242` | `10/30` | `111` |
| Mastercard | Approved | `5555 5555 5555 4444` | `10/30` | `222` |
| Amex | Approved | `3782 822463 10005` | `10/30` | `3333` |
| Visa | Bank decline | `4000 0000 0000 0002` | `10/30` | `111` |
| Mastercard | Bank decline | `5105 1051 0510 5100` | `10/30` | `222` |
| Amex | Bank decline | `3714 496353 98431` | `10/30` | `3333` |

An approved card with a different expiration date or CVV returns `400 PAYMENT_INVALID_DETAILS`. A card configured as declined returns `402 PAYMENT_DECLINED`. Neither case creates a purchase or marks seats as sold.

## Error contract

All HTTP errors share this format, so clients do not depend on NestJS-specific responses:

```json
{
  "statusCode": 401,
  "code": "AUTH_INVALID_CREDENTIALS",
  "message": "Correo o contraseña inválidos."
}
```

The client application should use `code` to decide behavior and `message` to show a safe explanation. Internal errors are returned as `INTERNAL_ERROR`; they never expose PostgreSQL, Prisma, Resend, or secret details.

## Movie catalog and events

`movies` is a protected integration module for TMDB. It keeps the TMDB read token on the API server and returns a TMDB-compatible response while TicketSeller migrates to the shared host. Collections are cached in memory for five minutes per API process. Configure `TMDB_READ_ACCESS_TOKEN` only in `.env`; never include it in a mobile application. TMDB attribution remains required in TicketSeller.

`events` follows the same protected integration pattern for Ticketmaster Discovery. It keeps `TICKETMASTER_API_KEY` on the API server, preserves Ticketmaster-compatible responses, and caches each request for five minutes. The mobile client must never contain the key.

## Passwordless login OTP

Active users can request a six-digit login code with `POST /auth/request-login-code` and exchange it at `POST /auth/verify-login-code`. Codes are stored only as hashes, expire after 10 minutes, are single-use, and accept at most five verification attempts. The request endpoint always returns `202` so it does not reveal whether an email is registered.

Authentication routes allow five attempts per IP address per minute. Rate-limit storage is local at this stage; before deploying multiple replicas it should be replaced with shared storage such as Redis.

## Transactional email

The project uses an `EmailService` abstraction. Locally, `EMAIL_PROVIDER=console` is the default: the server logs the OTP and does not send email to the Internet.

To enable Resend, create an API key and verify the sender domain in its dashboard. In your `.env`, which is never committed, configure:

```bash
EMAIL_PROVIDER=resend
RESEND_API_KEY=re_...
EMAIL_FROM="MyAPIRest <noreply@your-verified-domain.com>"
```

Never put `RESEND_API_KEY` in mobile or web clients, repositories, or messages. Resend receives requests exclusively from this API. The integration uses the official Node.js SDK, whose setup requires an API key and a configured sender. [Resend documentation](https://resend.com/nodejs)
