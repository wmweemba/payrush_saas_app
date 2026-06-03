# tech_spec.md — PayRush Technical Architecture & Migration Plan

> This document covers infrastructure decisions, database design, auth setup, and the step-by-step migration plan from the current state to the target architecture.

---

## Architecture Overview

### Current State (Legacy)
- Next.js 15 client on port 3000
- Express.js server on port 5000
- Supabase (hosted Postgres + Supabase Auth)
- JWT-based auth via Express middleware
- Flutterwave payment integration (dead code)
- Approval workflow code (removed from UI but still in server routes)

### Target Architecture
- Next.js 15 (App Router) — single application, no separate server
- Next.js Route Handlers replace all Express routes
- Self-hosted PostgreSQL on Coolify
- Drizzle ORM for type-safe queries and migrations
- Better Auth (embedded in Next.js app)
- Resend for email (keep existing)
- Cloudflare R2 for file storage (logos, PDFs)
- Single Docker container deployed via Coolify

### Why this is better for a solo developer
- One process to run in development (`pnpm dev`)
- One container to deploy on Coolify
- One codebase to maintain
- Drizzle migrations are committed to git — full schema history
- Better Auth has zero external dependencies — auth data stays on your VPS

---

## Infrastructure (Coolify on Hetzner)

### VPS Spec
- CPU: 2 vCPU
- RAM: 4GB
- Storage: 40GB
- OS: Ubuntu 22.04 (Coolify managed)

### Services on Coolify

**1. PostgreSQL service** (Coolify-managed Docker container)
```
Image: postgres:16-alpine
Port: 5432 (internal only, not exposed externally)
Volume: /data/postgres → persistent storage
Memory limit: 512MB
Initial DB: postgres
```
All apps use this single instance with separate schemas:
- `payrush` — PayRush application data + Better Auth tables
- `chama360` — Chama360 (future)

**2. PayRush application** (Coolify Docker service)
```
Build: Dockerfile in repo root
Port: 3000 (mapped to domain via Coolify reverse proxy)
Memory limit: 768MB
Domain: payrush.app (via Coolify Traefik)
SSL: auto via Let's Encrypt (Coolify handles this)
```

### Dockerfile (target)
```dockerfile
FROM node:20-alpine AS base
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install --frozen-lockfile

FROM base AS builder
COPY . .
RUN pnpm build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
EXPOSE 3000
CMD ["node", "server.js"]
```

Add to `next.config.mjs`:
```js
output: 'standalone'
```

---

## Database Design

### Connection (Drizzle + node-postgres)

```js
// lib/db/index.js
import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30000,
})

export const db = drizzle(pool)
```

Connection string format:
```
postgresql://payrush_user:password@postgres-container:5432/postgres?search_path=payrush
```

### Schema files (Drizzle)

```js
// lib/db/schema/users.js
import { pgTable, uuid, text, timestamp } from 'drizzle-orm/pg-core'

export const profiles = pgTable('profiles', {
  id: uuid('id').primaryKey(),  // references Better Auth user.id
  businessName: text('business_name').notNull(),
  phone: text('phone'),
  address: text('address'),
  website: text('website'),
  createdAt: timestamp('created_at').defaultNow(),
})
```

### Drizzle config
```js
// drizzle.config.js
export default {
  schema: './lib/db/schema/*',
  out: './drizzle/migrations',
  dialect: 'postgresql',
  dbCredentials: { url: process.env.DATABASE_URL },
  schemaFilter: ['payrush'],
}
```

Migration commands:
```bash
pnpm drizzle-kit generate   # generate migration files
pnpm drizzle-kit migrate    # run migrations against DB
pnpm drizzle-kit studio     # visual DB browser (dev only)
```

---

## Auth (Better Auth)

### Why Better Auth over Clerk/Supabase Auth
- Self-hosted — no external SaaS dependency
- Runs inside Next.js — no extra container, no extra deploy
- Free regardless of user count
- Works with Drizzle natively
- Can be reused per-app (each app has its own Better Auth instance pointing at its own DB schema)

### Setup

```bash
pnpm add better-auth
```

Better Auth auto-creates these tables in your schema on first run:
- `user` — core user record
- `session` — active sessions
- `account` — OAuth providers (email/password counts as an account)
- `verification` — email verification tokens

```js
// lib/auth.js
import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { db } from './db/index.js'

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: 'pg' }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false, // enable after launch
  },
  session: {
    expiresIn: 60 * 60 * 24 * 30,  // 30 days
    cookieCache: { enabled: true, maxAge: 60 * 5 },
  },
  user: {
    additionalFields: {
      businessName: { type: 'string', required: true },
    },
  },
})
```

```js
// lib/auth-client.js
import { createAuthClient } from 'better-auth/react'

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL,
})

export const { signIn, signUp, signOut, useSession } = authClient
```

```js
// app/api/auth/[...all]/route.js
import { auth } from '@/lib/auth'
import { toNextJsHandler } from 'better-auth/next-js'
export const { GET, POST } = toNextJsHandler(auth)
```

### Session access pattern

In Route Handlers:
```js
const session = await auth.api.getSession({ headers: request.headers })
if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
const userId = session.user.id
```

In Server Components:
```js
import { headers } from 'next/headers'
const session = await auth.api.getSession({ headers: await headers() })
```

In Client Components:
```js
const { data: session } = useSession()
```

---

## Migration Plan

### Phase 0 — Preparation (1 evening)

- [ ] Create new git branch: `rebuild/foundation`
- [ ] Read through entire current codebase — identify what to keep vs delete
- [ ] List all current Supabase tables and export schema as SQL
- [ ] Note all environment variables currently in use
- [ ] Back up current `.env` files

### Phase 1 — Coolify Postgres Setup (1 evening)

- [ ] Create PostgreSQL service in Coolify
- [ ] Connect to it via psql or TablePlus to verify
- [ ] Create `payrush` schema: `CREATE SCHEMA IF NOT EXISTS payrush;`
- [ ] Create a dedicated DB user: `CREATE USER payrush_app WITH PASSWORD '...';`
- [ ] Grant permissions: `GRANT ALL ON SCHEMA payrush TO payrush_app;`
- [ ] Test connection string locally via `.env`

### Phase 2 — Project restructure (1 evening)

- [ ] Delete `/server` directory entirely
- [ ] Delete `/client` directory — move contents up to root
- [ ] New root structure: `app/`, `components/`, `lib/`, `public/`, `drizzle/`
- [ ] Update `package.json` — remove server deps, add: `better-auth`, `drizzle-orm`, `drizzle-kit`, `pg`, `@aws-sdk/client-s3`
- [ ] Remove from deps: `jsonwebtoken`, all Supabase packages, Flutterwave packages
- [ ] Set up `drizzle.config.js`
- [ ] Set up `lib/db/index.js`

### Phase 3 — Schema migration (1 evening)

- [ ] Write Drizzle schema files for all tables (see Database Design above)
- [ ] Run `pnpm drizzle-kit generate` → review generated SQL
- [ ] Run `pnpm drizzle-kit migrate` → verify tables created in `payrush` schema
- [ ] Run `pnpm drizzle-kit studio` → visually confirm schema
- [ ] Optionally export existing Supabase data as JSON and write a seed script

### Phase 4 — Better Auth setup (1 evening)

- [ ] Install Better Auth: `pnpm add better-auth`
- [ ] Create `lib/auth.js` and `lib/auth-client.js`
- [ ] Create `app/api/auth/[...all]/route.js`
- [ ] Create `middleware.js` for route protection
- [ ] Build `/login` page using `authClient.signIn.email()`
- [ ] Build `/signup` page using `authClient.signUp.email()` + create profile record
- [ ] Test full auth flow: signup → session → protected route → signout
- [ ] Verify session cookies set correctly

### Phase 5 — Route Handler migration (2 evenings)

Migrate Express routes to Next.js Route Handlers, one domain at a time:

**Evening 1:**
- [ ] `app/api/invoices/route.js` — GET (list), POST (create)
- [ ] `app/api/invoices/[id]/route.js` — GET, PUT, DELETE
- [ ] `app/api/invoices/[id]/send/route.js` — POST (send email)
- [ ] `app/api/invoices/[id]/mark-paid/route.js` — POST

**Evening 2:**
- [ ] `app/api/clients/route.js` — GET, POST
- [ ] `app/api/clients/[id]/route.js` — GET, PUT, DELETE
- [ ] `app/api/branding/route.js` — GET, PUT
- [ ] `app/api/invoice/[token]/route.js` — GET (public, no auth)

### Phase 6 — Legacy cleanup (0.5 evening)

- [ ] Delete all Supabase client references (`supabaseClient.js`, Supabase imports)
- [ ] Delete Flutterwave integration (`lib/payments/flutterwave.js`)
- [ ] Delete approval workflow routes and services
- [ ] Delete mock service files (`clientService.mock.js`)
- [ ] Delete old Next.js API routes under `app/api/debug*`, `app/api/update-profile*`
- [ ] Remove legacy redirects (`/dashboard/branding`, `/dashboard/numbering`)
- [ ] Audit `package.json` — remove any unused packages
- [ ] Run `pnpm build` — fix any remaining import errors

### Phase 7 — UI rebuild (3–4 evenings)

Implement `ui_spec.md` across all screens. Build mobile-first.

Order:
1. Global layout — `app/layout.js`, `globals.css` with design tokens
2. Dashboard layout component — sidebar (desktop) + bottom nav (mobile)
3. Home page — hero card + chart + recent invoices
4. Invoice list page
5. Invoice creation — mobile form + desktop split panel
6. Invoice detail view — with share buttons
7. Public invoice view (`/invoice/[token]`)
8. Clients list + client detail
9. Settings / branding page
10. Auth pages (login, signup)

### Phase 8 — PWA setup (0.5 evening)

- [ ] Create `public/manifest.json`
- [ ] Add icons: 192×192, 512×512 (PNG)
- [ ] Register service worker for offline support
- [ ] Add `next-pwa` or manual service worker for caching strategy
- [ ] Test "Add to Home Screen" on Android and iOS
- [ ] Lighthouse PWA audit — target score 90+

**manifest.json:**
```json
{
  "name": "PayRush",
  "short_name": "PayRush",
  "description": "Invoice faster. Get paid sooner.",
  "start_url": "/dashboard",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#185FA5",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

---

## Security Checklist

- [ ] All API routes check session before any DB operation
- [ ] All DB queries filter by `userId` — users can never access other users' data
- [ ] No sensitive data in URL parameters (use POST body or headers)
- [ ] Environment variables never exposed to client (no `NEXT_PUBLIC_` prefix on secrets)
- [ ] File uploads validated: type check (images only for logos), size limit (2MB)
- [ ] Rate limiting on auth endpoints (Better Auth has built-in rate limiting)
- [ ] Public invoice route (`/invoice/[token]`) exposes only invoice data, never user account data
- [ ] CORS — Next.js handles this by default (same-origin). Add explicit headers if subdomain needed.
- [ ] No `console.log` of sensitive data in production

---

## Performance Targets

| Metric | Target | Notes |
|--------|--------|-------|
| LCP | < 2.5s | On 3G mobile |
| FID / INP | < 200ms | Interaction responsiveness |
| CLS | < 0.1 | No layout shift |
| Lighthouse Performance | > 85 | Mobile audit |
| Lighthouse PWA | > 90 | After Phase 8 |
| API response time | < 300ms | p95 for list endpoints |

Strategies:
- Use Next.js `loading.js` files for streaming skeleton states
- Paginate invoice list (20 per page)
- Lazy load PDF generation library (only import on invoice detail/create)
- Image optimisation via `next/image` for logos
- Static generation for public invoice pages where possible

---

## Deployment Checklist (Pre-Launch)

- [ ] All environment variables set in Coolify service config
- [ ] Database migrations run on production schema
- [ ] Domain DNS pointing to Coolify server
- [ ] SSL certificate active (Coolify auto-manages via Let's Encrypt)
- [ ] Test full user flow on production: signup → create invoice → send → mark paid
- [ ] Test shareable invoice link on mobile (WhatsApp link preview)
- [ ] Lighthouse audit on production URL
- [ ] Set up basic uptime monitoring (UptimeRobot free tier)
- [ ] Verify Resend sending domain authenticated (DKIM/SPF)

---

## Development Commands

```bash
# Install dependencies
pnpm install

# Run development server
pnpm dev

# Database
pnpm drizzle-kit generate    # generate migration from schema changes
pnpm drizzle-kit migrate     # run pending migrations
pnpm drizzle-kit studio      # open Drizzle Studio (visual DB browser)

# Build
pnpm build
pnpm start

# Linting
pnpm lint
```

---

*Last updated: June 2026*
