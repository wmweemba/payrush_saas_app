Architecture overview

Frontend + SSR: Next.js (JavaScript) deployed to Vercel/Netlify.

Database & Auth: Supabase (Postgres + Auth) — use service role key only on server-side.

Payments: Flutterwave (initial gateway) — create payment links and webhooks.

Notifications: Email via SendGrid; WhatsApp via Twilio or merchant's WhatsApp (simple link) in MVP.

CI/CD: GitHub Actions — run lint/test and deploy.

Core environment variables (store in Vercel/Netlify/GH secrets)

NEXT_PUBLIC_SUPABASE_URL

NEXT_PUBLIC_SUPABASE_ANON_KEY

SUPABASE_SERVICE_ROLE_KEY (server-side only)

FLW_SECRET_KEY (Flutterwave secret)

FLW_PUBLIC_KEY (Flutterwave public)

EMAIL_API_KEY (SendGrid/Mailgun)

WHATSAPP_API_KEY (Twilio) — optional for MVP

APP_URL (production URL)

Data model (high-level)

users: id (uuid), email, org_name, plan, created_at

clients: id, user_id (FK), name, phone, email, metadata

invoices: id, user_id, client_id, invoice_number, currency, total_amount, due_date, status (draft|sent|paid|overdue), public_url, created_at

invoice_items: id, invoice_id, description, quantity, unit_price

transactions: id, invoice_id, gateway, reference, amount, currency, status, raw_payload

payment_webhooks: id, raw_payload, received_at, processed_at, status

API endpoints (minimal)

POST /api/create-payment — create payment link via gateway

POST /api/webhook/flutterwave — webhook receiver

GET /api/invoices/:id — public invoice page

POST /api/send-invoice — trigger send (email/whatsapp)

Security & compliance

RLS: configure Supabase Row Level Security so each user can only access own rows.

No PAN storage: never store card numbers; use gateway tokens.

Webhook verification: verify signatures and use idempotency keys.

Secrets: use project secret storage (Vercel, Netlify env vars, GH secrets).

CI/CD

Lint & format check on PR.

Run minimal unit tests on serverless handlers (node environment using node:test or Jest).

Auto-deploy main to staging and production on tag.

Monitoring & logs

Use a lightweight logging tool (Logflare / Vercel logs / Supabase logs) for MVP.

Add Sentry later for error monitoring.

Backup & recovery

Supabase automated backups are sufficient for MVP. Export daily to CSV as additional backup.

Scaling plan

Move to paid Supabase DB or managed Postgres when connection limits require.

Migrate heavy jobs (reconciliation) to background worker (e.g., Render, Heroku, small VPS).

Use Twilio/SMS paid plan for reliable notifications.