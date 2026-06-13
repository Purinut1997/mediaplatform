# Media VIP Platform

Starter project for a member media library using Cloudflare Pages, Cloudflare
Pages Functions, and Neon Postgres.

## Stack

- Vite + React + TypeScript for the frontend
- Cloudflare Pages for hosting
- Cloudflare Pages Functions for API routes
- Neon Postgres for database metadata
- Google Drive, Google Sheets, and YouTube for external media links

## Local Commands

```bash
npm install
npm run dev
npm run build
npm run smoke
npm run cron:secret
npm run cron:deploy
```

`npm run smoke` checks the live production homepage, Cloudflare Functions, Neon
connection, settings, and published-media API without writing data. GitHub
Actions also runs this check every six hours.

## Cloudflare Pages Settings

Use these settings when importing the GitHub repository:

```text
Framework preset: Vite
Build command: npm run build
Build output directory: dist
Root directory: /
```

## Environment Variables

Create a local `.env.local` file from `.env.example` when database work starts:

```bash
DATABASE_URL="postgresql://USER:PASSWORD@HOST/DATABASE?sslmode=require"
```

Also add `DATABASE_URL` in Cloudflare Pages:

```text
Project > Settings > Environment variables
```

For Super Admin writes, add one more secret variable and use the same value in
the admin form:

```text
ADMIN_WRITE_TOKEN="choose-a-long-random-admin-token"
```

For the first real Super Admin account, add:

```text
ADMIN_BOOTSTRAP_EMAIL="your-admin-email@example.com"
ADMIN_BOOTSTRAP_PASSWORD="choose-a-strong-password"
ADMIN_BOOTSTRAP_NAME="MIKPURINUT Super Admin"
```

The next API request will create or update that account in Neon.

For automatic broken-link checks, add the same `CRON_SECRET` in both places:

```text
Cloudflare Pages > mediaplatform > Settings > Variables and Secrets
Cloudflare Workers > mediaplatform-link-check-cron > Settings > Variables and Secrets
```

Then deploy the separate scheduler Worker:

```bash
npm run cron:secret
npm run cron:deploy
```

The Worker config is in `workers/link-check-cron/wrangler.toml`. It calls
`/api/cron/link-checks` every 6 hours without storing the secret in GitHub.

Telegram notifications are optional. Add these as secrets only when needed:

```text
TELEGRAM_BOT_TOKEN
TELEGRAM_CHAT_ID
```

## First API Check

After deploying to Cloudflare Pages, open:

```text
/api/health
```

It should return JSON with `ok: true`.

After adding `DATABASE_URL` in Cloudflare, open:

```text
/api/db-check
```

It should return JSON with `ok: true` and a timestamp from Neon.

## Media API

The first request to `/api/media` initializes the core Neon tables if they do
not already exist, seeds starter media, and returns published media records.

```text
GET /api/media
GET /api/categories
POST /api/media
POST /api/auth/login
POST /api/auth/register
GET /api/auth/me
POST /api/auth/logout
GET /api/settings
PUT /api/settings
```

`POST /api/media` accepts title, topic, access, status, price, cover,
description, source, resourceUrl, and previewUrl. The resource link is stored in
`media_links` so Google Drive, Google Sheet, YouTube, or external files can be
managed without editing code. Writes require `x-admin-token` to match
`ADMIN_WRITE_TOKEN` or a valid logged-in `superadmin` session.

Reference SQL is kept in `database/schema.sql`.

## Database Migrations

Heavy database changes must not run inside a Cloudflare Pages Function request.
Run SQL files in `database/migrations` manually from the Neon SQL Editor during
deployment. Each migration is idempotent and can be reviewed before execution.

For faster media filters and partial-text search, run:

```text
database/migrations/2026-06-09-media-filter-indexes.sql
```
