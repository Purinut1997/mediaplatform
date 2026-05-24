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
```

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

## First API Check

After deploying to Cloudflare Pages, open:

```text
/api/health
```

It should return JSON with `ok: true`.
