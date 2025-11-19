Title: Professional Invoicing & Client Management Platform

Version: 2.0 (Updated PRD)

Date: 2025-11-19

Executive summary

PayRush is a professional invoicing solution designed for business owners and freelancers who need to create, track, and deliver professional invoices to their clients. The platform focuses on invoice management, client relationships, and manual payment processing, providing a comprehensive yet simple invoicing workflow. Built with Next.js and Supabase for scalability and reliability.

Goals

Enable professional invoice creation with custom branding and templates.

Provide comprehensive client management with communication tracking.

Support manual payment processing for businesses using traditional payment methods.

Deliver professional email communication with PDF invoice attachments.

Build a sustainable SaaS business with DPO payment integration for subscriptions.

Primary users

Business owners and freelancers who need professional invoicing capabilities.

Service providers (consultants, agencies, contractors) managing client billing.

Small to medium businesses requiring organized client and invoice management.

Success metrics (first 6 months)

200 registered business accounts actively creating invoices.

1,000+ professional invoices generated with custom branding.

80%+ invoice delivery success rate via email.

Positive user feedback on invoice professionalism and ease of use.

Scope — Current Platform (Production Ready)

✅ **User Authentication**: Secure business signup and login (Supabase Auth).

✅ **Client Management**: Complete CRUD operations with contact and address management.

✅ **Professional Invoicing**: Create invoices with line items, custom branding, and templates.

✅ **Template System**: Multiple professional invoice templates with visual customization.

✅ **Business Branding**: Custom logos, colors, fonts, and company information.

✅ **Email Delivery**: Send professional PDF invoices via email (Resend integration).

✅ **Manual Payment Processing**: "Mark as Paid" functionality for traditional payment methods.

✅ **Communication System**: Client notes, timeline tracking, and reminders.

✅ **Financial Dashboard**: Invoice analytics, status tracking, and aging reports.

✅ **Numbering Schemes**: Flexible invoice numbering with automated patterns.

Simple billing gating (freemium tier: up to X invoices per month free).

Out-of-scope (MVP)

In-app payments with stored card details (PCI scope). Gate to gateway tokens only.

Complex multi-company accounting features.

Full KYC automation (merchant onboarding will require manual KYC steps for live payouts).

User stories (prioritized)

As a merchant, I can sign up and log in to my dashboard.

As a merchant, I can add a client with name, phone, and email.

As a merchant, I can create an invoice and send a payment link via WhatsApp or email.

As a client, I can view the invoice and make payment via bank transfer using provided bank details.

As the merchant, I can mark invoices as paid and send payment confirmation emails.

As a merchant, I can view invoice status and filter by paid/unpaid.

Functional requirements

Auth: Supabase email/password + magic link optional.

Invoices: Create/edit/delete, generate public invoice URL.

Payments: Manual payment processing with multiple payment methods; bank details in invoices.

Subscriptions: DPO integration for PayRush's own subscription billing and revenue collection.

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

M3: Manual payment processing + DPO subscription billing (5 days)

M4: Notifications + billing gating (4 days)

M5: Testing + deployment + pilot (3 days)