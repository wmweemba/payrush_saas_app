# PayRush SaaS Application

A comprehensive client management and invoicing platform built with Next.js and Express.js.

## 🏢 Business Architecture

**PayRush is a professional invoicing solution designed for business owners and freelancers:**
- ✅ **Invoicing Platform**: Simple yet powerful invoice creation, tracking, and delivery system
- ✅ **Client Management**: Comprehensive client relationship management with contact details and communication logs
- ✅ **Professional Presentation**: Custom branding, templates, and automated numbering for professional invoices
- ✅ **Manual Payment Processing**: "Mark as Paid" functionality for tracking payments received through traditional methods
- ✅ **Email Delivery**: Professional invoice delivery via email with PDF attachments and payment instructions
- ✅ **Business Focus**: Designed for individual business owners managing client invoicing and payments
- ✅ **Subscription Billing**: DPO payment gateway integration for PayRush's own SaaS subscription payments

## 👥 Multi-User Features (Future Enhancement)

**Note**: PayRush currently operates on a single-user model where each business account has one owner/manager. The following features will be added when multi-user functionality is implemented:

- **Approval Workflows**: Invoice approval processes requiring multiple users with different roles
- **Role-Based Access**: Admin, Manager, Accountant, Viewer permissions
- **Team Management**: Adding and managing multiple users within a business account
- **Collaboration Features**: Shared invoice management and team communication tools

## 🚀 Features

### Professional Invoicing
- **Invoice Creation**: Create beautiful, professional invoices with customizable templates and branding
- **Template System**: Multiple invoice templates (Modern, Classic, Professional, Minimal) with visual editor
- **Custom Branding**: Add your logo, colors, and business information for consistent brand presentation
- **Numbering Schemes**: Flexible invoice numbering with prefixes, suffixes, and date components
- **Line Items Management**: Detailed line items with descriptions, quantities, and pricing
- **Email Delivery**: Send invoices directly to clients via email with professional PDF attachments
- **Payment Tracking**: Manual payment processing with "Mark as Paid" functionality and status tracking

### Client Management
- **Client Database**: Complete CRUD operations for client information and relationship management
- **Contact Management**: Multiple contacts per client with roles and communication preferences
- **Address Management**: Multiple addresses (billing, shipping, office) per client with proper organization
- **Communication System**: Notes, timeline tracking, and reminders for better client relationships
- **Financial Dashboard**: Comprehensive financial overview, analytics, and invoice aging reports

### Invoice & Payment Features
- **Professional Invoice Templates**: Customizable branding, colors, and layouts
- **Numbering Schemes**: Flexible invoice numbering with prefixes, suffixes, and date components
- **Email Integration**: Resend.com integration for reliable invoice delivery
- **Manual Payment Processing**: Complete manual payment tracking with "Mark as Paid" functionality
- **Payment Method Support**: Bank transfer, cash, check, mobile money, and traditional payment methods
- **Payment Instructions**: Bank details included in invoices for customer payments

### Advanced Features
- **Currency Preferences**: Client-specific currency settings with automatic conversion
- **Business Branding**: Customizable company colors, fonts, and logo integration
- **Template Management**: Multiple invoice templates with visual editor
- **Communication System**: Notes, interactions, reminders, and timeline tracking
- **Multi-region Support**: Support for multiple currencies and regional payment methods

### Communication & Notes System
- **Client Notes**: Categorized notes with priority levels (General, Meeting, Call, Email, Follow-up, Important)
- **Activity Timeline**: Chronological view of all client interactions
- **Reminders**: Scheduled reminders with priority levels and types
- **Communication Stats**: Track engagement metrics and last contact dates

### Currency & Payment Features
- **Multi-currency Support**: USD, EUR, GBP, ZMW, NGN, KES, GHS, ZAR
- **Payment Method Configuration**: Region-specific payment options
- **Automatic Currency Conversion**: Optional conversion for invoices
- **Exchange Rate Management**: Real-time exchange rate tracking

## 🏗️ Architecture

### Frontend (Next.js 15.5.4)
- **Framework**: Next.js with App Router
- **Styling**: Tailwind CSS with shadcn/ui components
- **State Management**: React hooks and context
- **Authentication**: JWT token-based authentication

### Backend (Express.js)
- **API Server**: RESTful API with Express.js
- **Database**: Supabase (PostgreSQL) with Row Level Security
- **Authentication**: JWT middleware with Supabase Auth
- **Services**: Modular service architecture

### Database Schema
- **Clients**: Core client information
- **Client Contacts**: Multiple contacts per client
- **Client Addresses**: Multiple addresses per client
- **Client Notes**: Communication tracking
- **Client Interactions**: Interaction history
- **Client Reminders**: Scheduled reminders
- **Currency Rates**: Exchange rate management

## 🛠️ Installation & Setup

### Prerequisites
- Node.js 18+
- npm or pnpm
- Supabase account

### Clone Repository
```bash
git clone <repository-url>
cd payrush_saas_app
```

### Server Setup
```bash
cd server
npm install
cp .env.example .env
# Configure your Supabase credentials in .env
npm start
```

### Client Setup
```bash
cd client
npm install
cp .env.local.example .env.local
# Configure your API URL in .env.local
npm run dev
```

### Environment Variables

#### Server (.env)
```
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
JWT_SECRET=your_jwt_secret
PORT=5000
RESEND_API_KEY=your_resend_api_key
DPO_COMPANY_TOKEN=your_dpo_company_token
DPO_SERVICE_TYPE=your_dpo_service_type
DPO_API_URL=https://secure.3gdirectpay.com
# DPO is used for PayRush's own subscription billing, not customer invoice payments
```

#### Client (.env.local)
```
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

## 📁 Project Structure

```
payrush_saas_app/
├── client/                 # Next.js frontend
│   ├── src/
│   │   ├── app/           # App router pages
│   │   ├── components/    # React components
│   │   │   ├── clients/   # Client-specific components
│   │   │   └── ui/        # shadcn/ui components
│   │   └── lib/           # Utilities and services
│   └── public/            # Static assets
├── server/                # Express.js backend
│   ├── routes/           # API routes
│   ├── services/         # Business logic
│   ├── config/           # Configuration files
│   └── utils/            # Utility functions
└── README.md
```

## 🔑 Key Components

### Client Management
- **ClientProfile**: Main client view with tabbed interface
- **ClientContactsManager**: Manage multiple client contacts
- **ClientAddressManager**: Manage multiple client addresses
- **ClientFinancialDashboard**: Financial overview and analytics

### Communication System
- **ClientCommunication**: Notes, timeline, and reminders
- **ClientCurrencyPreferences**: Currency and payment settings

### UI Components
- **Form Components**: Consistent form styling with validation
- **Select Components**: Enhanced dropdowns with proper styling
- **Modal Dialogs**: Add/edit functionality for all entities

## 🎯 Recent Updates

### Version 1.9.27 - Manual Payment Processing
- ✅ Added "Mark as Paid" functionality for manual payment processing
- ✅ Implemented payment confirmation email system with proper formatting
- ✅ Created payment method selection (bank transfer, cash, check, other)
- ✅ Fixed database constraints and email template content issues
- ✅ Enhanced invoice status workflow with comprehensive payment tracking

### Version 1.2.0 - Client Communication System
- ✅ Added comprehensive notes system with categories and priorities
- ✅ Implemented activity timeline tracking
- ✅ Created reminder system with scheduling
- ✅ Added communication statistics dashboard

### Version 1.1.0 - Currency Management
- ✅ Multi-currency support with 8 major currencies
- ✅ Client-specific currency preferences
- ✅ Regional payment method configuration
- ✅ Automatic currency conversion options

### Version 1.0.0 - Core Platform
- ✅ Client CRUD operations
- ✅ Contact and address management
- ✅ Basic invoice functionality
- ✅ Financial dashboard

## 🚧 Development Status

### Completed Features (MVP Phase)
- [x] Client management with full CRUD operations
- [x] Multi-contact and multi-address support
- [x] Invoice creation with professional PDF templates
- [x] Business branding and customization
- [x] Numbering schemes with flexible patterns
- [x] Email invoice delivery (Resend integration)
- [x] Simple payment tracking (Draft → Sent → Paid)
- [x] Communication system (notes, timeline, reminders)
- [x] Financial dashboard with invoice aging
- [x] Navigation consolidation and UI improvements

### Phase 2 Features (Coming Soon)
- [ ] Multi-user business accounts with role-based access control
- [ ] Advanced approval workflows (requires multi-user accounts)
- [ ] Enhanced subscription billing with multiple plans and pricing tiers
- [ ] WhatsApp invoice delivery and payment notifications
- [ ] Multiple email templates and customization
- [ ] Multi-channel communication dashboard (Email + WhatsApp)
- [ ] Advanced reporting and analytics
- [ ] Multi-tenant support
- [ ] Mobile app development

## 🚀 Pre-Deployment Tasks

### Critical Subscription Billing Integration
- [ ] **Implement DPO for PayRush's own subscription billing**
  - [ ] Set up DPO merchant account and obtain API credentials
  - [ ] Implement DPO payment integration for PayRush subscription payments
  - [ ] Create subscription management interface for PayRush users
  - [ ] Configure DPO webhook handlers for subscription payment processing
  - [ ] Test complete subscription billing flow with DPO in production environment
  - [ ] Remove unused Flutterwave integration (legacy invoice payment system)

### Production Readiness
- [ ] Configure production environment variables for DPO
- [ ] Set up CI/CD pipeline with automated deployments
- [ ] Implement comprehensive error monitoring and logging
- [ ] Performance optimization and security hardening
- [ ] Database backup and disaster recovery procedures

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/new-feature`)
3. Commit your changes (`git commit -m 'Add new feature'`)
4. Push to the branch (`git push origin feature/new-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions, please open an issue in the GitHub repository.

---

**Built with ❤️ using Next.js, Express.js, and Supabase**