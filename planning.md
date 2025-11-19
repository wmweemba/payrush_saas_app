Architecture overview

Frontend + SSR: Next.js (JavaScript) deployed to Vercel/Netlify.

Database & Auth: Supabase (Postgres + Auth) — use service role key only on server-side.

Email Service: Resend.com (MVP phase with free tier - 3,000 emails/month) — reliable invoice delivery with professional templates.

WhatsApp Integration: Twilio WhatsApp Business API (Phase 2) — invoice delivery and payment notifications via WhatsApp.

Payments: Manual payment processing (MVP) for all payment methods → Future: Enhanced payment tracking and reporting.

Notifications: Email-first approach (MVP) → Multi-channel communication (Email + WhatsApp) in Phase 2.

CI/CD: GitHub Actions — run lint/test and deploy.

Core environment variables (store in Vercel/Netlify/GH secrets)

NEXT_PUBLIC_SUPABASE_URL

NEXT_PUBLIC_SUPABASE_ANON_KEY

SUPABASE_SERVICE_ROLE_KEY (server-side only)

DPO_COMPANY_TOKEN (DPO for PayRush subscription billing)

DPO_SERVICE_TYPE (DPO service configuration)

DPO_API_URL (DPO API endpoint)

RESEND_API_KEY (Resend.com for email delivery)

TWILIO_ACCOUNT_SID (Twilio WhatsApp - Phase 2)
TWILIO_AUTH_TOKEN (Twilio WhatsApp - Phase 2)
TWILIO_WHATSAPP_NUMBER (WhatsApp Business number - Phase 2)

APP_URL (production URL)

Data model (high-level)

users: id (uuid), email, org_name, plan, created_at

clients: id, user_id (FK), name, phone, email, metadata

invoices: id, user_id (FK), client_id, invoice_number, currency, total_amount, due_date, status (draft|sent|paid|overdue), sent_at, paid_at, public_url, created_at

invoice_items: id, invoice_id, description, quantity, unit_price

transactions: id, invoice_id, gateway, reference, amount, currency, status, raw_payload

payment_webhooks: id, raw_payload, received_at, processed_at, status

## Official PayRush Database Schema

### Core Tables

**profiles** (extends auth.users)
- `id` uuid PRIMARY KEY → references auth.users(id) 
- `name` text NOT NULL
- `business_name` text NOT NULL
- `phone` text
- `address` text  
- `website` text
- `created_at` timestamptz DEFAULT now()

**invoices**
- `id` uuid PRIMARY KEY DEFAULT gen_random_uuid()
- `user_id` uuid → references profiles(id) 
- `customer_name` text NOT NULL
- `customer_email` text
- `amount` numeric(12,2) NOT NULL
- `currency` text NOT NULL
- `status` text CHECK (Pending|Sent|Paid|Overdue|Cancelled) DEFAULT 'Pending'
- `due_date` date
- `paid_at` timestamptz
- `payment_method` text (bank_transfer, cash, mobile_money, etc.)
- `payment_notes` text
- `created_at` timestamptz DEFAULT now()

**payments** (for manual payment tracking)
- `id` uuid PRIMARY KEY DEFAULT gen_random_uuid()
- `invoice_id` uuid → references invoices(id)
- `amount` numeric(12,2) NOT NULL
- `currency` text NOT NULL
- `method` text NOT NULL (bank_transfer, cash, mobile_money, etc.)
- `status` text CHECK (completed) DEFAULT 'completed'
- `reference` text (manual payment reference)
- `notes` text
- `created_at` timestamptz DEFAULT now()

### Security & Relationships

- **Row Level Security (RLS)** enabled on all tables
- **Cascade deletions**: User deletion removes all associated data
- **Foreign key constraints**: Maintain data integrity
- **Check constraints**: Validate status values
- **Indexes**: Optimized for common queries (user_id, status, invoice_id)

### RLS Policies

- Users can only access their own profiles, invoices, and payments
- Payments are accessible only through owned invoices
- Full CRUD permissions for own data

API endpoints (MVP Phase)

POST /api/invoices/:id/send — send invoice via email with PDF attachment

PUT /api/invoices/:id/status — update invoice status (DRAFT → SENT → PAID)

PUT /api/invoices/:id/mark-paid — mark invoice as paid with manual payment details

GET /api/invoices/:id — public invoice page for customer viewing (view-only)

GET /api/branding — get business branding and payment information

PUT /api/branding — update payment details (bank account, etc.)

POST /api/numbering-schemes — create custom invoice numbering patterns

Future Endpoints (Phase 2):
POST /api/subscriptions/create — create PayRush subscription via DPO
POST /api/webhook/dpo — webhook receiver for subscription payment updates

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