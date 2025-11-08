# PayRush SaaS Application

A comprehensive client management and invoicing platform built with Next.js and Express.js.

## 🚀 Features

### Core Functionality
- **Client Management**: Complete CRUD operations for client data
- **Contact Management**: Multiple contacts per client with roles and communication preferences
- **Address Management**: Multiple addresses (billing, shipping, office) per client
- **Invoice Management**: Create, edit, and track client invoices with professional PDF generation
- **Email Invoice Delivery**: Send invoices directly to clients via email with PDF attachments
- **Financial Dashboard**: Comprehensive financial overview and analytics

### Invoice & Payment Features
- **Professional Invoice Templates**: Customizable branding, colors, and layouts
- **Numbering Schemes**: Flexible invoice numbering with prefixes, suffixes, and date components
- **Email Integration**: Resend.com integration for reliable invoice delivery
- **Payment Tracking**: Simple invoice status management (Draft → Sent → Paid)
- **Manual Payment Processing**: Bank details integration for traditional payment methods

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
- [ ] Advanced approval workflows with user roles
- [ ] Payment gateway integration (Stripe/PayPal)
- [ ] WhatsApp invoice delivery and payment notifications
- [ ] Client portal for invoice viewing and payments
- [ ] Multiple email templates and customization
- [ ] Multi-channel communication dashboard (Email + WhatsApp)
- [ ] Advanced reporting and analytics
- [ ] Multi-tenant support
- [ ] Mobile app development

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