# Copilot Instructions — PayRush

> Primary context is in CLAUDE.md at the project root. Load that first before any session.

## Quick reference

- Language: JavaScript (ES Modules only — no TypeScript, no CommonJS)
- Framework: Next.js 15 (App Router)
- Styling: Tailwind CSS v4 + shadcn/ui (new-york style)
- Database: Drizzle ORM + PostgreSQL (self-hosted on Coolify)
- Auth: Better Auth (embedded in Next.js, cookie sessions)
- Icons: Tabler Icons (@tabler/icons-react, outline only)
- Forms: React Hook Form + Zod

## Architecture

Single Next.js application — no separate Express server.
All API logic lives in `app/api/` Route Handlers.
Database queries go through Drizzle in `lib/db/`.
Auth is handled by Better Auth in `lib/auth.js`.

## What not to build

Do not suggest Supabase, Flutterwave, JWT middleware, or Express patterns.
Do not suggest features outside the current build phase (see CLAUDE.md).

## File output convention

When asked to modify a file, output the complete file.
When asked for SQL or migrations, output only the SQL.
When asked for API route handlers, include auth session check at the top.

## Commit convention

feat: description
fix: description
chore: description
docs: description
