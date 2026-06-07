# PayRush Changelog

All notable changes to this project are documented here.
Format: [version] — date — description

---

## [3.1.0] — 2026-06-07 — Phase 5 Step 7: Public Invoice View

### Public invoice view
- `app/invoice/[token]/page.js` — new async server component fetching from
  `app/api/invoice/[token]/route.js`; includes `generateMetadata` for
  share-link OG previews and a `NotFound` fallback for invalid/missing tokens
- `components/invoices/PublicInvoiceView.js` — new component built to
  ui_spec.md design tokens: business identity (logo or initials), status
  badge, invoice/date meta, billed-to with copy-to-clipboard, line items,
  payment details card, share row (WhatsApp/Telegram/Email deep links via
  `publicToken`), "Download PDF" wired to existing `downloadInvoicePDF` via a
  camelCase→snake_case `mapInvoiceForPDF` adapter

### Removed
- `app/invoice/[id]/page.js` — deleted legacy public invoice page (478 lines);
  it called the dead Express endpoint `localhost:5000/api/public/invoice/:id`
  (removed in Phase 4) and used pre-design-system styling (lucide-react,
  shadcn cards). Superseded by `[token]`, matching the API route and the
  `invoices.public_token` shareable-link convention.

### Verified
- `pnpm build` passes clean — 20/20 routes compile, zero errors ✅
- Public route returns full invoice + items + branding for live test token
  (`f101cb6e-028d-4479-9723-0e58994149a6`) — INV-1780641050375, ZMW 6,000 ✅

---

## [3.0.0] — 2026-06-05 — Phase 5: UI Rebuild (Steps 1–6)

### Design system
- globals.css — full rewrite: CSS custom properties for all colours, spacing, radius, and typography tokens per ui_spec.md
- Added `.card`, `.badge`, `.badge-{status}`, `.section-label`, `.focus-ring`, `.skeleton`, `.no-scrollbar`, `.invoice-form-panel` global utility classes
- `@keyframes pulse` animation for skeleton loading states
- Inter font loaded via Google Fonts (weights 400, 500 only)
- Root layout updated: Inter via `next/font/google`, metadata updated to "PayRush — Invoice faster. Get paid sooner."

### App shell
- `app/dashboard/layout.js` — authenticated shell with sidebar (desktop) + bottom nav (mobile)
- `components/shared/Sidebar.js` — 220px `#0C447C` sidebar, sticky, `usePathname` active state, Tabler icons
- `components/shared/BottomNav.js` — fixed bottom nav, 64px, 4 items, `lg:hidden`
- Installed `@tabler/icons-react@^3.44.0`

### Dashboard home
- `app/dashboard/page.js` — `next/dynamic ssr:false` shell (Better Auth `useSession` is incompatible with Next.js 15 SSR pass)
- `components/dashboard/DashboardHome.js` — greeting with time-of-day logic, hero card (collected this month + 3 stat pills), 7-day bar chart, recent invoices list (5 rows with skeleton + empty state), full-width "New Invoice" CTA

### Invoice list
- `app/dashboard/invoices/page.js` — dynamic shell
- `components/invoices/InvoiceList.js` — filter tabs (All/Sent/Paid/Overdue/Draft), client-side filtering, summary bar (Total/Paid/Pending) on All tab, invoice card rows with avatar/status badge, empty states, 5-row skeleton

### Invoice creation
- `app/dashboard/invoices/new/page.js` — dynamic shell
- `components/invoices/InvoiceForm.js` — mobile: sticky top bar + scrollable form + fixed bottom submit; desktop: 360px form panel (sticky) + live preview panel; client autocomplete from `/api/clients`; line items with add/delete; live totals; currency selector; collapsible notes; validation with inline errors; POST to `/api/invoices`; on success navigates to invoice detail
- `app/globals.css` — added `.invoice-form-panel` (360px desktop width) and `.no-scrollbar`

### Invoice detail
- `app/dashboard/invoices/[id]/page.js` — dynamic shell
- `components/invoices/InvoiceDetail.js` — full detail view: invoice summary card (logo/initials, status badge, total due, line items table), payment details card (with copy-to-clipboard for account number and reference), notes card, "Mark as Paid" inline confirmation, "Download PDF" (using existing `downloadInvoicePDF` with camelCase→snake_case mapping), share row (WhatsApp/Telegram/Email deep links using `publicToken`), action sheet with cancel confirmation
- Skeleton loading state for all cards and action buttons

### Shared utilities
- `lib/utils.js` — added `formatAmount`, `getInitials`, `formatDate`, `getInvoiceTotal` as named exports (shared across all invoice components)

### Routes added
- `/dashboard` — home dashboard
- `/dashboard/invoices` — invoice list
- `/dashboard/invoices/new` — invoice creation
- `/dashboard/invoices/[id]` — invoice detail
- `/dashboard/clients` — stub (Phase 5 next)
- `/dashboard/settings` — stub (Phase 5 next)

### Build
- All 19 routes compile clean, zero errors

---

## [2.4.0] — 2026-06-05 — Legacy Cleanup

### Deleted
- src/lib/supabaseClient.js — Supabase client removed
- src/lib/apiConfig.js — Express-era API config (hardcoded localhost:5000)
- src/lib/clientService.js — Express-era service layer
- src/lib/pdf/templateService.js — imported deleted apiConfig, dead code
- src/hooks/useUserProfile.js — Supabase-dependent hook
- src/components/templates/ (5 files) — all legacy, being rebuilt in Phase 7
- src/components/clients/ (8 files) — all legacy, being rebuilt in Phase 7
- src/components/invoices/ (11 files) — all legacy, being rebuilt in Phase 7
- src/components/layout/DashboardLayout.js — imported Supabase
- src/app/dashboard/payments/page.js — not in target spec
- src/app/dashboard/notes/page.js — not in target spec
- src/app/dashboard/templates/page.js + editor/[id]/page.js — not in target spec

### Import fixes applied to surviving files
- src/app/page.js — removed Supabase auth state, simplified to static nav
- src/app/dashboard/clients/page.js — replaced with Phase 7 placeholder
- src/app/dashboard/profile-settings/page.js — replaced with Phase 7 placeholder
- src/app/dashboard/page.js — removed useSession import causing SSR crash
- src/lib/pdf/invoicePDF.js — removed templateService import, collapsed to
  static-template-only path, stripped dead testing code

### Verified
- npm run build passes clean — 13/13 static pages, zero errors ✅
- All 8 API routes confirmed present and dynamic ✅

---

## [2.0.0] — 2026-06-03 — Foundation Rebuild

### Architecture
- Removed entire Express.js server — all API logic moving to Next.js Route Handlers
- Removed Supabase — migrating to self-hosted PostgreSQL on Coolify via Drizzle ORM
- Removed Supabase Auth — replacing with Better Auth (embedded, self-hosted)
- Consolidated to single Next.js application (no more client/server split)

### Cleanup
- Deleted /server directory (52 files — all Express routes, services, middleware)
- Deleted /supabase directory (all legacy migration scripts)
- Removed Flutterwave integration (confirmed dead — all files deleted)
- Removed approval workflow code (out of scope for MVP launch)
- Removed debug routes and pages
- Removed legacy redirect pages (/dashboard/branding, /dashboard/numbering)
- Removed Supabase client files from frontend
- Cleaned up root-level legacy documentation

### Documentation
- Added CLAUDE.md — AI development context and project conventions
- Added ui_spec.md — full design system and screen specifications
- Added tech_spec.md — architecture decisions and migration plan
- Updated copilot.md — references CLAUDE.md, updated stack conventions
- Created this changelog

### Design
- UI direction locked: light mode, Inter font, deep blue/navy accent (#185FA5 / #0C447C)
- Mobile-first design with desktop split-panel enhancement
- Mockups approved for: mobile dashboard, mobile invoice view, desktop invoice creation

---

## [2.3.1] — 2026-06-05 — Dashboard Placeholder

### Dashboard
- Replaced legacy `dashboard/page.js` with a minimal Better Auth placeholder
- Old page used `useUserProfile` hook → `supabase.auth.getSession()` → stub
  returned null → hook redirected to `/login` immediately after dashboard load
- Placeholder uses `useSession` from `auth-client.js` — shows signed-in user's
  name, email, and businessName; no redirect loop
- Full dashboard UI deferred to Phase 7 (UI rebuild)

---

## [2.3.0] — 2026-06-05 — Clients, Branding & Public Invoice Route Handlers

### API
- Created `app/api/clients/route.js` — GET (active clients only), POST (create)
- Created `app/api/clients/[id]/route.js` — GET, PUT (update), DELETE (soft
  delete sets status=archived, no hard delete)
- Created `app/api/branding/route.js` — GET (returns null if no record),
  PUT (upsert via `onConflictDoUpdate` on `user_id`)
- Created `app/api/invoice/[token]/route.js` — public route, no auth required,
  returns invoice + items + branding; `user_id` stripped from both invoice
  and branding objects before response

### Security
- Fixed: branding object on public invoice route was initially exposing
  `user_id` — caught and fixed before commit

### Verified
- Soft delete correctly excludes archived clients from GET list ✅
- Branding upsert creates on first PUT, updates on subsequent PUTs ✅
- Public invoice route returns full render data with no auth required ✅
- `user_id` absent from both invoice and branding in public response ✅

---

## [2.2.0] — 2026-06-05 — Invoice Route Handlers

### API
- Created `app/api/invoices/route.js` — GET (list with items), POST (create
  with line items, Zod validation)
- Created `app/api/invoices/[id]/route.js` — GET (single with items),
  PUT (update with item replacement), DELETE (cascade via FK)
- Created `app/api/invoices/[id]/mark-paid/route.js` — POST sets status=paid,
  records paidAt, paymentMethod, paymentNotes

### Verified
- Unauthenticated requests return 401 ✅
- Invoice creation returns 201 with nested items array ✅
- `amount` column computed by Postgres (`quantity * unit_price`) ✅
- mark-paid sets correct status and paidAt timestamp ✅
- DELETE returns `{ data: { id } }` and cascades to invoice_items ✅

---

## [2.1.1] — 2026-06-05 — Schema Fix: userId columns

### Database
- Migration `0002_mushy_sage` applied: changed `userId` column type from `uuid`
  to `text` on `invoices`, `clients`, `branding`, and `email_logs` tables
- Matches Better Auth `user.id` type (text) — required for FK constraints
  to be added in a future migration

---

## [2.0.4] — 2026-06-04 — Phase 4: Login and Signup Pages

### Auth Pages
- Created `src/app/(auth)/login/page.js` — Better Auth `signIn.email` with
  `callbackURL: '/dashboard'`, inline error display, link to `/signup`
- Created `src/app/(auth)/signup/page.js` — Better Auth `signUp.email` with
  `name`, `businessName`, `email`, `password` fields, `callbackURL: '/dashboard'`
- Deleted legacy Supabase-based `login/page.js` and `signup/page.js`

### Styling
- Follows `ui_spec.md` tokens: `#F0F2F5` page background, white card with 16px
  border-radius, `#185FA5` primary button, 11px uppercase labels, `#A32D2D` error state
- No external component dependencies — plain HTML elements with inline styles

### Route Group
- Pages placed in `src/app/(auth)/` route group — URLs remain `/login` and `/signup`
- `src/app/(dashboard)/page.js` not created — would conflict with existing
  `dashboard/page.js`; deferred to Phase 7 UI rebuild

### Smoke Test Results
- `GET /dashboard` (unauthenticated) → `307 → /login` ✓
- `GET /signup` → `200 OK` ✓
- Signup `will@payrush.test` → `200`, session cookies set, `businessName` written to DB ✓
- `GET /dashboard` (authenticated) → `200 OK`, no redirect ✓
- `payrush."user"` table → user row present with correct `businessName` ✓

---

## [2.0.3] — 2026-06-04 — Phase 2 Completion: Auth Flow Verified

### Auth Schema — Drizzle Definitions Added
- Created `src/lib/db/schema/auth.js` — Drizzle schema definitions for all 4 Better Auth tables:
  `user`, `session`, `account`, `verification` (plain `pgTable`, no schema prefix — Better Auth
  manages these directly)
- `user` table includes `businessName text` column matching the `additionalFields` config
- `session.userId`, `account.userId` carry `onDelete: cascade` FK to `user.id`
- Fixes the runtime error: "model 'user' was not found in the schema object"

### Drizzle DB Instance Updated
- `src/lib/db/index.js` — added `authSchema` import and spread into the drizzle schema object
- Renamed existing schema imports to `*Schema` convention for clarity
  (`users` → `usersSchema`, etc.)
- `drizzle.config.js` glob `./src/lib/db/schema/*` already covers `auth.js` — no config change needed

### Better Auth Adapter Fix
- `src/lib/auth.js` — added `import * as authSchema` and passed `schema: authSchema` explicitly
  to `drizzleAdapter`. This is required when using a custom Drizzle instance.

### Migration — profiles.id uuid → text
- Applied migration `0001_alter_profiles_id_to_text`: changed `profiles.id` from `uuid` to `text`
  to match Better Auth's string user IDs (Better Auth uses nanoid strings, not UUIDs)
- Migration journal and snapshot files committed

### Verified
- `POST /api/auth/sign-up/email` → `200 OK`, session cookies set (`better-auth.session_token`,
  `better-auth.session_data`), user + `businessName` written to `payrush."user"` ✓
- `GET /api/auth/get-session` → `200 null` (no session without cookie) ✓
- `GET /dashboard` → `307 → /login` (middleware redirect) ✓

---

## [2.0.2] — 2026-06-04 — Phase 2: Better Auth Setup

### Auth Infrastructure
- Created `src/lib/auth.js` — Better Auth server instance (emailAndPassword, 30-day sessions,
  5-min cookie cache, `businessName` additional field on user)
- Created `src/lib/auth-client.js` — Better Auth React client with named exports:
  `signIn`, `signUp`, `signOut`, `useSession`
- Created `src/app/api/auth/[...all]/route.js` — Better Auth catch-all Next.js route handler
- Created `src/middleware.js` — session guard protecting all `/dashboard/*` routes,
  redirects unauthenticated users to `/login`

### Better Auth Database Schema
- Generated `drizzle/better-auth-schema.sql` — 4 tables ready to apply:
  `user`, `session`, `account`, `verification` (all in `payrush` schema)
- `user` table includes `businessName` column for the additionalFields config
- `session` table includes `userId` FK with cascade delete
- Schema not yet applied to live DB — pending verification

### Build Fixes
- Removed `--turbopack` flag from production build — Turbopack incompatible with
  `better-auth`'s bundled kysely SQLite adapters (internal export mismatch)
  `dev` script retains `--turbopack` for fast local development
- Added `serverExternalPackages: ['better-auth', 'postgres', 'drizzle-orm']` to
  `next.config.mjs` — prevents webpack from bundling Node-only packages
- Added `eslint.ignoreDuringBuilds: true` — pre-existing lint issues in legacy
  components deferred to Phase 3 rewrites
- Wrapped `/dashboard/templates` page in `<Suspense>` boundary — required by
  Next.js 15 for `useSearchParams()` usage
- Added runtime nodejs declaration to `middleware.js` — middleware uses Postgres
  (Node.js only), cannot run on Edge runtime

### Cleanup
- Deleted legacy `src/app/clients/page.js` — confirmed duplicate of
  `/dashboard/clients`, directly imported `@supabase/supabase-js`
- Created temporary `src/lib/supabaseClient.js` stub — 12 legacy MIGRATE files
  still reference Supabase; stub satisfies imports at build time without calling
  Supabase. Will be removed in Phase 3 as each page is rewritten.

### Known Issues & Notes
- `better-auth` v1.6.14 does not ship a CLI binary — `generate` command unavailable.
  Better Auth SQL schema written manually based on documented table structure.
- 12 pages/components still reference Supabase via the stub — full migration to
  Better Auth + API routes is Phase 3 work.

---

## [2.0.1] — 2026-06-04 — Phase 1: Infrastructure & Database Setup

### Dependencies
- Installed: `better-auth`, `drizzle-orm`, `postgres`, `zod`, `resend`, `@aws-sdk/client-s3`
- Installed dev: `drizzle-kit`
- Removed: `@supabase/supabase-js`, `axios`

### Database
- Created `drizzle.config.js` — points to `payrush` schema on self-hosted Postgres
- Created Drizzle schema files:
  - `src/lib/db/schema/users.js` — `profiles` table (extends Better Auth user)
  - `src/lib/db/schema/clients.js` — `clients` table
  - `src/lib/db/schema/invoices.js` — `invoices`, `invoice_items`, `email_logs` tables
  - `src/lib/db/schema/branding.js` — `branding` table
- Created `src/lib/db/index.js` — Drizzle client with all schemas loaded
- Generated initial migration: `drizzle/migrations/0000_outstanding_iceman.sql`
- Applied migration to live Coolify Postgres — all 6 tables created in `payrush` schema:
  `profiles`, `clients`, `invoices`, `invoice_items`, `branding`, `email_logs`
- Created `payrush.__drizzle_migrations` tracking table

### Known Issues & Notes
- `drizzle-kit migrate` hangs indefinitely on this Coolify/Postgres configuration — root
  cause unknown (likely a connection pool or SSL negotiation quirk in drizzle-kit's internal
  client). Workaround: migrations are applied by running the SQL directly via the `postgres`
  Node.js driver. This approach works reliably and will be used for all future migrations.
- Coolify Postgres was initially only accessible via internal Docker hostname — required
  exposing port `5433:5432` in Coolify service config and adding a TCP inbound rule for
  port 5433 in the Hetzner Cloud firewall.
- `payrush` schema was auto-created by a partial first migration attempt; subsequent run
  skipped schema creation and applied only the table statements idempotently.

---

## [1.9.28] — 2025-11-xx — Pre-Rebuild State

### Last stable state before foundation rebuild
- Invoice creation, editing, deletion working
- Email delivery via Resend integration
- Manual payment tracking (Mark as Paid)
- PDF generation with 4 templates (Modern, Classic, Professional, Minimal)
- Client management with contacts, addresses, notes
- Multi-currency support (ZMW, USD, EUR, GBP, NGN, KES, GHS, ZAR)
- Business branding and numbering schemes
- Bulk invoice operations
- Auth via Supabase + JWT middleware on Express
