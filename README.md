# PayRush SaaS Application

A comprehensive client management and invoicing platform built with Next.js and Express.js.

## 🚀 Features

### Core Functionality
- **Client Management**: Complete CRUD operations for client data
- **Contact Management**: Multiple contacts per client with roles and communication preferences
- **Address Management**: Multiple addresses (billing, shipping, office) per client
- **Invoice Management**: Create, track, and manage client invoices
- **Financial Dashboard**: Comprehensive financial overview and analytics

### Advanced Features
- **Currency Preferences**: Client-specific currency settings with automatic conversion
- **Payment Methods**: Configurable payment options per client (Credit/Debit Cards, Bank Transfers, Mobile Money, USSD, Cryptocurrency)
- **Communication System**: Notes, interactions, reminders, and timeline tracking
- **Financial Analytics**: Invoice aging analysis, payment history, and financial summaries
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

### Completed Features
- [x] Client management with full CRUD operations
- [x] Multi-contact and multi-address support
- [x] Currency preferences and payment methods
- [x] Communication system (notes, timeline, reminders)
- [x] Financial dashboard with invoice aging
- [x] Enhanced UI with proper dropdown styling
- [x] Error handling and validation

### Upcoming Features
- [ ] Advanced invoice creation and management
- [ ] Payment processing integration
- [ ] Email notification system
- [ ] Advanced reporting and analytics
- [ ] Multi-tenant support
- [ ] Mobile responsiveness improvements

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