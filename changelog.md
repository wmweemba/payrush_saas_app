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
