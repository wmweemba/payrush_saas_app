# claude.md — BazaBooks AI Development Context

> Load this file at the start of every development session. It is the single source of truth for project context, conventions, and build instructions.

---

## What BazaBooks Is

BazaBooks is a professional invoicing SaaS for solopreneurs, freelancers, and small service businesses — primarily in markets where WhatsApp is the primary business communication channel (Africa, Southeast Asia, Latin America).

**Core USP:** Speed and simplicity. Create a professional invoice in under 2 minutes, share via WhatsApp, email, or Telegram, track what's paid.

**Not:** A full accounting suite. Not competing with Zoho or FreshBooks on features.

**Target user:** A freelancer or SME owner on a mobile phone who just finished a job and needs to get paid.

---

## Current Build Phase

**Phase: Foundation rebuild — complete through Phase 6.5 (quotes). Launch prep underway.**

Order of operations:
1. ✅ UI direction locked (see `ui_spec.md`)
2. ✅ Infra setup — Coolify Postgres (multi-schema), Better Auth
3. ✅ Architecture consolidation — Next.js only (no Express server)
4. ✅ DB migration — Supabase → self-hosted Postgres via Drizzle ORM
5. ✅ Auth migration — Supabase Auth → Better Auth
6. ✅ Legacy cleanup — remove Flutterwave, approval routes, dead code
7. ✅ UI rebuild — implement ui_spec.md across all screens
8. ✅ PWA hardening — manifest, service worker, offline states
8.5 ✅ Quotes support (Phase 6.5) — schema, sequential numbering, creation
    toggle, list/detail/public views, PDF, convert-to-invoice flow
    (see "Quotes Feature" section below)
9. 🔄 Launch prep — shareable invoice links, WhatsApp/Telegram/email share

Do not suggest or build features outside this order until the current phase is complete.

---

## Tech Stack (Final Decisions)

### Frontend
- **Framework:** Next.js 15 (App Router)
- **Language:** JavaScript (ES Modules) — no TypeScript
- **Styling:** Tailwind CSS v4
- **UI Components:** shadcn/ui (new-york style, neutral base)
- **Forms:** React Hook Form + Zod validation
- **PDF Generation:** jsPDF (existing, keep and refine)
- **Icons:** Tabler Icons (`@tabler/icons-react`)

### Backend
- **Architecture:** Next.js Route Handlers only. No separate Express server.
- The `/server` directory is being deprecated. All API logic moves to `app/api/` route handlers.

### Database
- **ORM:** Drizzle ORM (`drizzle-orm` + `drizzle-kit`)
- **Driver:** `postgres` (node-postgres)
- **Host:** Self-hosted PostgreSQL on Coolify VPS
- **Schema strategy:** One Postgres instance, one schema per app. BazaBooks uses the `payrush` schema.
- **Migrations:** Drizzle Kit (`pnpm drizzle-kit migrate`)

### Auth
- **Library:** Better Auth (self-hosted, runs inside Next.js app)
- **Session strategy:** Cookie-based sessions (Better Auth default)
- **Tables:** Better Auth manages its own tables (`user`, `session`, `account`, `verification`) inside the `payrush` schema
- **Profile extension:** `profiles` table extends `user` with business-specific fields

### Email
- **Provider:** Resend.com (keep existing integration)
- **SDK:** `resend` npm package

### File Storage
- **Provider:** Cloudflare R2 (free tier, S3-compatible) for logo uploads and PDF storage
- **SDK:** `@aws-sdk/client-s3` with R2 endpoint

### Deployment
- **Platform:** Coolify on Hetzner VPS (2CPU / 4GB RAM / 40GB storage)
- **Frontend:** Docker container via Coolify
- **Database:** Coolify-managed Postgres service (shared instance, `payrush` schema)

---

## Project Structure (Target)

```
payrush/
├── app/
│   ├── (auth)/
│   │   ├── login/page.js
│   │   └── signup/page.js
│   ├── (dashboard)/
│   │   ├── layout.js              # Dashboard shell with sidebar + bottom nav
│   │   ├── page.js                # Home — collected stats + recent invoices
│   │   ├── invoices/
│   │   │   ├── page.js            # Invoice list
│   │   │   ├── new/page.js        # Create invoice (split panel on desktop)
│   │   │   └── [id]/page.js       # Invoice detail
│   │   ├── clients/
│   │   │   ├── page.js
│   │   │   └── [id]/page.js
│   │   └── settings/page.js
│   ├── invoice/[id]/page.js       # Public shareable invoice view (no auth)
│   ├── api/
│   │   ├── auth/[...all]/route.js # Better Auth catch-all handler
│   │   ├── invoices/route.js
│   │   ├── invoices/[id]/route.js
│   │   ├── clients/route.js
│   │   ├── clients/[id]/route.js
│   │   └── branding/route.js
│   ├── globals.css
│   └── layout.js
├── components/
│   ├── ui/                        # shadcn/ui primitives
│   ├── invoices/
│   ├── clients/
│   ├── dashboard/
│   └── shared/
├── lib/
│   ├── auth.js                    # Better Auth server instance
│   ├── auth-client.js             # Better Auth client instance
│   ├── db/
│   │   ├── index.js               # Drizzle client
│   │   └── schema/
│   │       ├── users.js
│   │       ├── invoices.js
│   │       ├── clients.js
│   │       └── branding.js
│   ├── pdf/
│   ├── email/
│   └── utils.js
├── drizzle.config.js
├── middleware.js                  # Auth session middleware
├── claude.md                      # This file
├── ui_spec.md
└── tech_spec.md
```

---

## Database Schema (Drizzle — Target)

All tables use the `payrush` Postgres schema. Better Auth tables are auto-managed.

### Core application tables

**profiles** — extends Better Auth `user`
```
id (uuid, PK, FK → user.id)
business_name (text, not null)
phone (text)
address (text)
website (text)
created_at (timestamptz, default now())
```

**clients**
```
id (uuid, PK, default gen_random_uuid())
user_id (uuid, FK → user.id, not null)
name (text, not null)
email (text)
phone (text)
address (text)
currency (text, default 'ZMW')
status (text, default 'active') — active | archived
created_at (timestamptz)
updated_at (timestamptz)
```

**invoices**
```
id (uuid, PK)
user_id (uuid, FK → user.id)
client_id (uuid, FK → clients.id, nullable)
invoice_number (text, not null)
customer_name (text, not null)
customer_email (text)
currency (text, not null, default 'ZMW')
status (text) — draft | sent | paid | overdue | cancelled
due_date (date)
paid_at (timestamptz)
payment_method (text) — bank_transfer | mobile_money | cash | cheque | other
payment_notes (text)
public_token (uuid, default gen_random_uuid()) — used for shareable link
created_at (timestamptz)
updated_at (timestamptz)
```

**invoice_items**
```
id (uuid, PK)
invoice_id (uuid, FK → invoices.id, cascade delete)
description (text, not null)
quantity (numeric, default 1)
unit_price (numeric, not null)
amount (numeric, generated as quantity * unit_price)
sort_order (int, default 0)
```

**branding**
```
id (uuid, PK)
user_id (uuid, FK → user.id, unique)
logo_url (text)
primary_color (text, default '#185FA5')
business_name (text)
bank_name (text)
account_name (text)
account_number (text)
mobile_money_number (text)
payment_instructions (text)
template (text, default 'modern') — modern | classic | minimal
created_at (timestamptz)
updated_at (timestamptz)
```

**email_logs**
```
id (uuid, PK)
invoice_id (uuid, FK → invoices.id)
user_id (uuid, FK → user.id)
recipient_email (text)
subject (text)
status (text) — sent | failed | bounced
resend_id (text)
sent_at (timestamptz)
```

---

## Quotes Feature (Phase 6.5)

BazaBooks supports quotes alongside invoices. Quotes and invoices share the
`invoices` table, the list page, and most surrounding UI — they are
distinguished by `document_type`.

### Schema additions
- `invoices.document_type` — text, not null, default `'invoice'`,
  values: `'invoice'` | `'quote'`
- `invoices.converted_from_quote_id` — uuid, nullable, FK → `invoices.id`

### Invoice numbering (Phase 6.5 fix)
- Numbers are sequential, zero-padded to 3 digits: `INV-001`, `INV-002`, etc.
- A single counter is shared across invoices and quotes
- Prefix is determined by `document_type` at creation time: `INV-` or `QT-`
- On convert (quote → invoice): the number's digits are preserved, the
  prefix swaps from `QT-` to `INV-`
- The counter is derived from the count of all invoices for the user

### Status values
- `invoice`: `draft` | `sent` | `paid` | `overdue` | `cancelled`
- `quote`: `draft` | `sent` | `accepted` | `declined` | `cancelled`

### Routes added
- `POST /api/invoices/[id]/convert` — converts a quote to a new invoice
  record, copies all fields and line items, returns
  `{ data: { id: newInvoiceId } }`

### Key behaviours
- Quotes and invoices share the `invoices` table and the list page
- The "Quotes" tab on the list page filters to `document_type = 'quote'`
- All other tabs filter to `document_type = 'invoice'`
- Dashboard stats exclude quotes (invoices only)
- Payment details are hidden on quotes (detail view, public view, PDF)
- The PDF header switches between `INVOICE` and `QUOTATION` per template
- The "Convert to invoice" button is hidden on `declined` or `cancelled` quotes

---

## API Route Conventions

- All protected routes check session via `auth.api.getSession()` from Better Auth
- Return `{ data, error }` shape consistently
- HTTP status codes: 200 success, 201 created, 400 bad request, 401 unauthenticated, 403 forbidden, 404 not found, 500 server error
- Never expose internal error messages to the client — log server-side, return generic message

### Route pattern example
```js
// app/api/invoices/route.js
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET(request) {
  const session = await auth.api.getSession({ headers: request.headers })
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  // ...
}
```

---

## Auth Conventions (Better Auth)

```js
// lib/auth.js — server instance
import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { db } from './db'

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: 'pg' }),
  emailAndPassword: { enabled: true },
  session: { cookieCache: { enabled: true } }
})

// lib/auth-client.js — client instance
import { createAuthClient } from 'better-auth/react'
export const authClient = createAuthClient({ baseURL: process.env.NEXT_PUBLIC_APP_URL })
```

Session guard in middleware:
```js
// middleware.js
import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'

export async function middleware(request) {
  const session = await auth.api.getSession({ headers: request.headers })
  if (!session && request.nextUrl.pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/login', request.url))
  }
}
```

---

## Coding Conventions

- **Language:** JavaScript only. No TypeScript.
- **Modules:** ES Modules (`import`/`export`). No CommonJS (`require`).
- **Components:** Functional components only. No class components.
- **Async:** `async/await` everywhere. No `.then()` chains.
- **Naming:** `camelCase` for variables/functions, `PascalCase` for components, `kebab-case` for files.
- **No index.js barrel files** — import directly from the file.
- **Validation:** Zod schemas for all form inputs and API request bodies.
- **Error handling:** Always wrap async operations in try/catch. Log errors server-side.
- **No console.log in production code** — use a logger or remove before commit.

### Component structure
```js
// Standard component file structure
'use client' // only if needed

import { useState } from 'react'
import { cn } from '@/lib/utils'

export function ComponentName({ prop1, prop2 }) {
  // hooks first
  // derived state / handlers
  // return JSX
}
```

---

## Environment Variables

```bash
# Database
DATABASE_URL=postgresql://user:password@host:5432/postgres?search_path=payrush

# Better Auth
BETTER_AUTH_SECRET=                    # 32+ char random string
BETTER_AUTH_URL=                       # https://payrush.app

# App
NEXT_PUBLIC_APP_URL=                   # https://payrush.app

# Resend
RESEND_API_KEY=

# Cloudflare R2
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=
R2_PUBLIC_URL=
```

---

## What NOT to Build (Scope Guard)

Do not suggest or implement the following until after public launch:

- Multi-user accounts / team features
- Approval workflows
- DPO subscription billing integration (post-launch)
- WhatsApp Business API (Twilio) — share links are sufficient for launch
- Advanced analytics / reporting dashboard
- Mobile app (React Native)
- Accounting integrations (QuickBooks, Xero)

If a session starts drifting toward these, flag it and redirect to the current phase.

---

## Key Business Context

- **Free tier:** 10 invoices/month permanently free
- **Paid tier:** Unlimited invoices (pricing TBD, implement billing gate post-launch)
- **Primary share channels:** WhatsApp, Telegram, Email — all three on invoice view
- **Primary currency:** ZMW (Zambian Kwacha) as default, full multi-currency support
- **Shareable invoice link:** `/invoice/[public_token]` — no auth required to view

---

## Known Issues / Recurring Gotchas

- **Dev server returns 500 for all routes after `pnpm build` runs while
  `pnpm dev` is active** — the two share the `.next/` directory and clobber
  each other's build artifacts. Fix: kill the dev server, `rm -rf .next`,
  then `pnpm dev`. This has occurred in every phase — always restart this
  way if 500s appear on a fresh session.

- **Empty catch blocks in `lib/pdf/templates.js` and `lib/pdf/invoicePDF.js`**
  (logo loading, branding fetch) — errors swallowed silently after
  `console.warn` removal in Phase 7 security cleanup. Restore with
  `console.error` calls post-launch.

---

## Per-Session Checklist

Before writing any code in a session:
1. Confirm which phase of the build we're in
2. Confirm which specific task within that phase
3. Check that the task doesn't introduce out-of-scope features
4. Write the smallest working implementation first, then refine

---

*Last updated: June 2026*
