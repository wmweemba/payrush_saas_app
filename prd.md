Title: SME Invoice + Payments Assistant

Version: 0.1 (PRD)

Date: 2025-09-24

Executive summary

A lightweight, mobile-friendly SaaS that enables Zambian micro and small businesses to create invoices, send payment links/QR codes that accept local mobile money (MTN/Airtel/Zamtel) and international cards, and automatically reconcile payments. The MVP must be buildable with zero upfront cost using free-tier hosting and services and with JavaScript-based code (Next.js + Supabase).

Goals

Enable quick invoicing and fast collection for Zambian SMEs.

Support both local mobile money and international card payments.

Ship a usable MVP in ~2–4 weeks with no upfront hosting cost.

Provide a path to scale services after revenue (paid API usage, upgraded DB, SMS/WhatsApp paid providers).

Primary users

Owner/operator of micro & small businesses (shopkeepers, salons, small service providers) in Zambia.

Bookkeepers or small accounting clerks managing invoices for multiple merchants.

Success metrics (first 3 months)

100 registered business accounts.

500 invoices issued.

30% of invoices paid through payment links.

Positive NPS from pilot merchants (goal > 7/10).

Scope — In-scope (MVP)

Business signup and login (Supabase Auth).

Client/customer CRUD.

Create invoice with line items, due date, and currency (ZMW, option USD).

Generate invoice landing page with pay button + QR (payment link from gateway).

Integrate with a payment gateway (initially Flutterwave) to accept MTN/Airtel/Zamtel mobile money and card payments.

Webhook endpoint to reconcile payments and mark invoices paid.

Send payment link via WhatsApp / email (templates) and basic dashboard showing paid / unpaid invoices.

Simple billing gating (freemium tier: up to X invoices per month free).

Out-of-scope (MVP)

In-app payments with stored card details (PCI scope). Gate to gateway tokens only.

Complex multi-company accounting features.

Full KYC automation (merchant onboarding will require manual KYC steps for live payouts).

User stories (prioritized)

As a merchant, I can sign up and log in to my dashboard.

As a merchant, I can add a client with name, phone, and email.

As a merchant, I can create an invoice and send a payment link via WhatsApp or email.

As a client, I can click the payment link, choose mobile money or card, and pay.

As the merchant, I receive confirmation that an invoice is paid (automatic reconciliation).

As a merchant, I can view invoice status and filter by paid/unpaid.

Functional requirements

Auth: Supabase email/password + magic link optional.

Invoices: Create/edit/delete, generate public invoice URL.

Payments: Create payment link via gateway API; support mobile-money network selection.

Webhooks: Verify signature; idempotent processing; update transaction and invoice.

Notifications: Send payment link via WhatsApp template and email via SMTP/API.

Dashboard: Simple list view + invoice detail.

Billing: Track invoice counts per account; restrict after free allotment.

Non-functional requirements

Language & Framework: JavaScript (Next.js) + Tailwind CSS.

DB/Auth: Supabase (Postgres) free tier.

Hosting: Vercel / Netlify free tier for frontend/serverless APIs.

Security: RLS for multi-tenant data isolation; never store card PANs; use gateway tokens.

Performance: Page load < 2s on 3G (simple UI), serverless endpoints under 500ms typical.

Risks & mitigations

Gateway KYC delays: Use sandbox for dev; plan manual KYC checklist before go-live.

Mobile money variation: Test across networks in sandbox and pilot with real merchants.

Local regulations: Keep payments business as compliant as possible; require merchant KYC.

Acceptance criteria (MVP)

Merchant can create an invoice, send payment link, and receive webhook reconciliation marking invoice as paid in Supabase.

Basic dashboard shows paid/unpaid invoices.

Deployed on free tier and reachable via public URL.

Milestones

M1: Repo + Supabase schema + auth (3 days)

M2: Invoice UI + create/send link (5 days)

M3: Payment gateway integration + webhook (5 days)

M4: Notifications + billing gating (4 days)

M5: Testing + deployment + pilot (3 days)