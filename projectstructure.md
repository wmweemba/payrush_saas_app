# PayRush SaaS Application - Project Structure

This document provides a comprehensive overview of the PayRush SaaS application's folder and file structure. The project follows a **microservice architecture** with a separated client (Next.js) and server (Express.js) setup.

## 📁 Root Directory Structure

```
payrush_saas_app/
├── 📁 client/                      # Next.js frontend application (port 3000)
├── 📁 server/                      # Express.js backend API (port 5000)
├── 📁 supabase/                    # Database migrations and schema
├── 📁 node_modules/                # Root dependencies
├── 📄 .gitignore                   # Git ignore rules
├── 📄 package.json                 # Root package configuration
├── 📄 pnpm-lock.yaml               # Package lock file
└── 📄 Documentation Files          # See Documentation section below
```

---

## 🖥️ Client Directory (`/client`)

The frontend is a **Next.js 15** application with **App Router** architecture.

### Client Configuration Files
```
client/
├── 📄 .env.local                   # Environment variables (Supabase config)
├── 📄 .gitignore                   # Client-specific git ignore
├── 📄 components.json              # shadcn/ui components configuration
├── 📄 eslint.config.mjs            # ESLint configuration
├── 📄 jsconfig.json                # JavaScript project configuration
├── 📄 next.config.mjs              # Next.js configuration
├── 📄 package.json                 # Client dependencies and scripts
├── 📄 pnpm-lock.yaml               # Client package lock
├── 📄 postcss.config.mjs           # PostCSS configuration for TailwindCSS
├── 📄 README.md                    # Client-specific documentation
└── 📄 tailwind.config.js           # TailwindCSS v4 configuration
```

### Client Source Structure (`/client/src`)
```
src/
├── 📁 app/                         # Next.js App Router pages and layouts
│   ├── 📁 api/                     # Client-side API utilities (legacy)
│   ├── 📁 dashboard/               # Protected dashboard pages
│   ├── 📁 invoice/[id]/           # Public invoice view page
│   ├── 📁 login/                   # Authentication pages
│   ├── 📁 profile-update/          # Profile management
│   ├── 📁 signup/                  # User registration
│   ├── 📄 favicon.ico              # Application favicon
│   ├── 📄 globals.css              # Global styles and TailwindCSS
│   ├── 📄 layout.js                # Root layout component
│   └── 📄 page.js                  # Landing page
├── 📁 components/                  # React components library
│   ├── 📁 clients/                 # Client management components
│   ├── 📁 invoices/                # Invoice-related components
│   ├── 📁 layout/                  # Layout components
│   ├── 📁 providers/               # Context providers
│   ├── 📁 templates/               # PDF template components
│   └── 📁 ui/                      # shadcn/ui base components
├── 📁 hooks/                       # Custom React hooks
├── 📁 lib/                         # Utilities and services
│   ├── 📁 currency/                # Currency handling utilities
│   ├── 📁 payments/                # Payment processing (Flutterwave)
│   └── 📁 pdf/                     # PDF generation utilities
└── 📁 public/                      # Static assets
```

### App Router Pages (`/client/src/app`)
```
app/
├── 📁 api/                         # Legacy API routes (being phased out)
│   ├── 📁 debug-profile/           # Profile debugging utilities
│   └── 📁 update-profile/          # Profile update endpoints
├── 📁 dashboard/                   # Main application dashboard
│   ├── 📁 approvals/               # Invoice approval workflows
│   ├── 📁 branding/                # Business branding management
│   ├── 📁 clients/                 # Client management interface
│   ├── 📁 notes/                   # Notes and communication
│   ├── 📁 numbering/               # Invoice numbering schemes
│   ├── 📁 payments/                # Payment tracking interface
│   ├── 📁 profile-settings/        # User profile management
│   ├── 📁 templates/               # Invoice template management
│   │   └── 📁 editor/[id]/         # Template visual editor
│   └── 📄 page.js                  # Main dashboard (invoice management)
├── 📁 debug/                       # Development debugging tools
├── 📁 invoice/[id]/                # Public customer-facing invoice pages
├── 📁 login/                       # User authentication
└── 📁 signup/                      # User registration
```

### Components Library (`/client/src/components`)
```
components/
├── 📁 clients/                     # Client Management Components
│   ├── 📄 ClientAddressManager.js     # Multiple addresses per client
│   ├── 📄 ClientCommunication.js      # Notes, timeline, reminders
│   ├── 📄 ClientContactsManager.js    # Multiple contacts per client
│   ├── 📄 ClientCurrencyPreferences.js # Currency settings
│   ├── 📄 ClientFinancialDashboard.js # Financial analytics
│   ├── 📄 ClientForm.js               # Client creation/editing
│   ├── 📄 ClientList.js               # Client listing with search
│   └── 📄 ClientProfile.js            # Complete client profile
├── 📁 invoices/                    # Invoice Management Components
│   ├── 📄 AdvancedInvoiceManager.js      # Main invoice management
│   ├── 📄 BulkInvoiceActions.js          # Bulk operations interface
│   ├── 📄 EnhancedInvoiceForm.js         # Invoice creation form
│   ├── 📄 EnhancedInvoiceSearchResults.js # Search results display
│   ├── 📄 InvoiceDetailView.js           # Invoice detail modal
│   ├── 📄 InvoiceLineItemsManager.js     # Line items management
│   ├── 📄 InvoiceNotesWidget.js          # Invoice notes interface
│   ├── 📄 InvoiceSearchInterface.js      # Advanced search interface
│   ├── 📄 InvoiceSearchResults.js        # Search results table
│   ├── 📄 InvoiceSearchStats.js          # Search analytics
│   ├── 📄 InvoiceSharingCard.js          # Sharing options
│   └── 📄 NotesSummaryCard.js            # Notes summary widget
├── 📁 layout/                      # Layout Components
│   └── 📄 DashboardLayout.js           # Main dashboard layout with navigation
├── 📁 providers/                   # Context Providers
│   └── 📄 ToastProvider.js             # Toast notification provider
├── 📁 templates/                   # Template System Components
│   ├── 📄 ColorPicker.js               # Color customization interface
│   ├── 📄 FontSelector.js              # Font selection component
│   ├── 📄 TemplateCustomizer.js        # Template visual editor
│   ├── 📄 TemplateLibrary.js           # Template browsing interface
│   └── 📄 TemplatePreview.js           # Real-time template preview
└── 📁 ui/                          # shadcn/ui Base Components
    ├── 📄 alert.jsx                    # Alert notifications
    ├── 📄 badge.jsx                    # Status badges
    ├── 📄 button.jsx                   # Button variations
    ├── 📄 card.jsx                     # Card containers
    ├── 📄 checkbox.jsx                 # Checkbox inputs
    ├── 📄 CurrencySelect.js            # Currency selection dropdown
    ├── 📄 dialog.jsx                   # Modal dialogs
    ├── 📄 dropdown-menu.jsx            # Dropdown menus
    ├── 📄 input.jsx                    # Form inputs
    ├── 📄 label.jsx                    # Form labels
    ├── 📄 popover.jsx                  # Popover components
    ├── 📄 progress.jsx                 # Progress bars
    ├── 📄 scroll-area.jsx              # Scrollable areas
    ├── 📄 select.jsx                   # Select dropdowns
    ├── 📄 separator.jsx                # Visual separators
    ├── 📄 skeleton.jsx                 # Loading skeletons
    ├── 📄 slider.jsx                   # Range sliders
    ├── 📄 switch.jsx                   # Toggle switches
    ├── 📄 table.jsx                    # Data tables
    ├── 📄 tabs.jsx                     # Tabbed interfaces
    ├── 📄 textarea.jsx                 # Text areas
    └── 📄 toast.jsx                    # Toast notifications
```

### Libraries and Utilities (`/client/src/lib`)
```
lib/
├── 📁 currency/                    # Currency Management
│   └── 📄 currencies.js               # Currency configurations and utilities
├── 📁 payments/                    # Payment Processing
│   └── 📄 flutterwave.js              # Flutterwave payment integration
├── 📁 pdf/                        # PDF Generation
│   ├── 📄 invoicePDF.js               # Invoice PDF generation
│   ├── 📄 templates.js                # PDF template definitions
│   └── 📄 templateService.js          # Template service utilities
├── 📄 apiConfig.js                 # API client configuration
├── 📄 auth.js                      # Authentication utilities
├── 📄 clientService.js             # Client API service layer
├── 📄 supabaseClient.js            # Supabase client configuration
└── 📄 utils.js                     # General utility functions
```

### Custom Hooks (`/client/src/hooks`)
```
hooks/
├── 📄 use-toast.js                 # Toast notification hook
└── 📄 useUserProfile.js            # User profile management hook
```

---

## 🚀 Server Directory (`/server`)

The backend is an **Express.js** RESTful API server with modular architecture.

### Server Configuration Files
```
server/
├── 📄 .env                        # Environment variables (not in git)
├── 📄 .env.example                # Environment template
├── 📄 .gitignore                  # Server-specific git ignore
├── 📄 index.js                    # Express server entry point
├── 📄 package.json                # Server dependencies and scripts
├── 📄 pnpm-lock.yaml              # Server package lock
└── 📄 README.md                   # Server documentation
```

### Server Architecture (`/server`)
```
server/
├── 📁 config/                     # Configuration Management
│   ├── 📄 database.js                 # Supabase database configuration
│   └── 📄 index.js                    # General server configuration
├── 📁 middleware/                  # Express Middleware
│   ├── 📄 auth.js                     # JWT authentication middleware
│   ├── 📄 errorHandler.js             # Global error handling
│   └── 📄 logger.js                   # Request logging middleware
├── 📁 routes/                      # API Route Handlers
│   ├── 📄 approvals.js                # Invoice approval workflows
│   ├── 📄 auth.js                     # Authentication endpoints
│   ├── 📄 branding.js                 # Business branding API
│   ├── 📄 bulkInvoices.js             # Bulk invoice operations
│   ├── 📄 clients.js                  # Client management API
│   ├── 📄 invoiceLineItems.js         # Line items management
│   ├── 📄 invoiceNotes.js             # Invoice notes API
│   ├── 📄 invoices.js                 # Invoice CRUD operations
│   ├── 📄 invoiceSearch.js            # Advanced search API
│   ├── 📄 numberingSchemes.js         # Numbering schemes API
│   ├── 📄 payments.js                 # Payment processing
│   ├── 📄 publicInvoice.js            # Public invoice access
│   ├── 📄 templates.js                # Template management API
│   └── 📄 webhooks.js                 # Payment webhook handlers
├── 📁 services/                    # Business Logic Layer
│   ├── 📄 approvalService.js          # Approval workflow logic
│   ├── 📄 brandingService.js          # Branding management
│   ├── 📄 bulkExportService.js        # Bulk export operations
│   ├── 📄 bulkInvoiceService.js       # Bulk invoice operations
│   ├── 📄 clientService.js            # Client business logic
│   ├── 📄 clientService.mock.js       # Mock client service (testing)
│   ├── 📄 communicationService.js     # Client communication logic
│   ├── 📄 currencyService.js          # Currency management
│   ├── 📄 database.js                 # Database utility functions
│   ├── 📄 emailService.js             # Email processing
│   ├── 📄 invoiceLineItemsService.js  # Line items business logic
│   ├── 📄 invoiceNotesService.js      # Invoice notes logic
│   ├── 📄 invoiceSearchService.js     # Search business logic
│   ├── 📄 invoiceService.js           # Invoice business logic
│   ├── 📄 numberingSchemeService.js   # Numbering schemes logic
│   ├── 📄 paymentService.js           # Payment processing logic
│   └── 📄 templateService.js          # Template management logic
└── 📁 utils/                       # Server Utilities
    └── 📄 index.js                    # Utility functions
```

---

## 🗄️ Database Directory (`/supabase`)

Database schema and migration management using **Supabase PostgreSQL**.

```
supabase/
└── 📁 migrations/                  # Database Migration Scripts
    ├── 📄 001_update_invoice_status.sql      # Initial invoice status updates
    ├── 📄 002_add_profile_fields.sql         # Extended user profiles
    ├── 📄 003_create_payments_table.sql      # Payment processing table
    ├── 📄 004_fix_profiles_schema.sql        # Profile schema fixes
    ├── 📄 005_add_multicurrency_support.sql  # Multi-currency system
    ├── 📄 006_create_client_management.sql   # Client management tables
    ├── 📄 007_enhance_client_contact_management.sql # Contact system
    ├── 📄 008_client_currency_payment_preferences.sql # Currency prefs
    ├── 📄 009_client_communication_logs_notes.sql # Communication system
    ├── 📄 010_create_invoice_line_items.sql   # Line items system
    ├── 📄 011_create_invoice_template_system_clean.sql # Template system
    ├── 📄 012_approval_workflow_functions.sql # Approval workflows
    ├── 📄 013_create_email_logs_table.sql     # Email tracking
    ├── 📄 014_add_invoice_template_integration.sql # Template integration
    ├── 📄 014_create_invoice_numbering_schemes.sql # Numbering schemes
    └── 📄 015_create_business_branding.sql    # Business branding
```

---

## 📚 Documentation Files

Comprehensive project documentation in the root directory:

```
📄 .gitignore                      # Git ignore rules
📄 BULK_OPERATIONS_SUMMARY.md      # Bulk operations documentation
📄 changelog.md                    # Version history and updates
📄 copilot.md                      # GitHub Copilot coding guidelines
📄 FLUTTERWAVE_INTEGRATION.md      # Payment integration guide
📄 INVOICE_CREATION_FIX.md         # Invoice creation debugging
📄 MULTI_CURRENCY_IMPLEMENTATION_SUMMARY.md # Currency system docs
📄 package.json                    # Root project configuration
📄 planning.md                     # Technical architecture planning
📄 pnpm-lock.yaml                  # Root package lock
📄 prd.md                          # Product Requirements Document
📄 PROFILE_DEBUG.md                # Profile system debugging
📄 projectstructure.md             # This file - project structure
📄 README.md                       # Main project documentation
📄 tasks.md                        # Development milestones and tasks
└── 📄 test_milestone1-7.md         # Milestone testing documentation
```

---

## 🔧 Technology Stack

### Frontend (Client)
- **Framework**: Next.js 15 with App Router
- **Language**: JavaScript (ES Modules)
- **Styling**: TailwindCSS v4
- **UI Components**: shadcn/ui with Radix UI primitives
- **State Management**: React hooks and Context API
- **Forms**: React Hook Form with validation
- **PDF Generation**: jsPDF with custom templates
- **Payment Processing**: Flutterwave integration
- **Notifications**: React Hot Toast

### Backend (Server)
- **Framework**: Express.js with RESTful architecture
- **Language**: JavaScript (ES Modules)
- **Authentication**: JWT tokens
- **Database**: Supabase (PostgreSQL)
- **File Storage**: Supabase Storage for assets
- **Email**: SendGrid/Mailgun integration
- **Payment Processing**: Flutterwave webhooks
- **Security**: Row Level Security (RLS) policies

### Database & Infrastructure
- **Database**: Supabase PostgreSQL with RLS
- **Authentication**: Supabase Auth
- **File Storage**: Supabase Storage buckets
- **Deployment**: Configured for Vercel (client) + Railway/Heroku (server)
- **Version Control**: Git with GitHub

---

## 🚀 Key Features by Directory

### Client-Side Features
- **Authentication System** (`/app/login`, `/app/signup`)
- **Dashboard Management** (`/app/dashboard`)
- **Invoice Management** (`/components/invoices`)
- **Client Relationship Management** (`/components/clients`)
- **Template Customization** (`/components/templates`)
- **Payment Processing** (`/lib/payments`)
- **PDF Generation** (`/lib/pdf`)

### Server-Side Features
- **RESTful API** (`/routes`)
- **Business Logic** (`/services`)
- **Authentication Middleware** (`/middleware/auth.js`)
- **Database Operations** (`/services/database.js`)
- **Payment Webhooks** (`/routes/webhooks.js`)
- **Email Processing** (`/services/emailService.js`)

### Database Features
- **User Management** (profiles table)
- **Client Management** (clients, contacts, addresses)
- **Invoice System** (invoices, line items, templates)
- **Payment Tracking** (payments, webhook logs)
- **Communication System** (notes, interactions, reminders)
- **Business Branding** (branding, assets)

---

## 🔄 Development Workflow

### Running the Application
```bash
# Start the server (port 5000)
cd server && pnpm dev

# Start the client (port 3000)
cd client && pnpm dev
```

### Adding New Features
1. **Database**: Add migration in `/supabase/migrations/`
2. **Server**: Add route in `/routes/` and logic in `/services/`
3. **Client**: Add components in `/components/` and pages in `/app/`
4. **Documentation**: Update relevant `.md` files

### Project Architecture Notes
- **Separation of Concerns**: Clean separation between client, server, and database
- **Modular Design**: Each feature has dedicated components, routes, and services
- **Security**: JWT authentication, RLS policies, input validation
- **Scalability**: Microservice architecture ready for horizontal scaling
- **Maintainability**: Well-documented code with clear file organization

---

*This document is maintained as the project evolves. Last updated: October 14, 2025*