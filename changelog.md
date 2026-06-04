# PayRush Changelog

All notable changes to this project are documented here.
Format: [version] — date — description

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
