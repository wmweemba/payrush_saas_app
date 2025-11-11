# PayRush Server API

Express.js backend API for the PayRush SaaS platform - A business-focused invoicing system for freelancers and small businesses.

## 🏢 Application Architecture

**PayRush is a B2B SaaS platform designed for business owners, not end customers:**
- ✅ **Business Owners**: Full account access, create/manage invoices, client management
- ✅ **End Customers**: No accounts required, receive invoices via email, pay via public payment pages
- ✅ **Payment Flow**: Customers pay through external gateways (DPO, Flutterwave) without PayRush login

## 🚀 Quick Start

```bash
npm install
npm install resend  # Email service for invoice delivery
cp .env.example .env
# Configure your environment variables (including RESEND_API_KEY and DPO_API_KEY)
npm start
```

Server runs on [http://localhost:5000](http://localhost:5000)

## 🏗️ Tech Stack

- **Framework**: Express.js
- **Database**: Supabase (PostgreSQL)
- **Authentication**: JWT with Supabase Auth
- **Email Service**: Resend.com for invoice delivery
- **ORM**: Supabase Client
- **PDF Generation**: Server-side PDF creation for invoices
- **Validation**: Custom middleware
- **Logging**: Console-based logging

## 📁 API Structure

### Core Endpoints

#### Client Management
- `GET /api/clients` - Get all clients with filtering
- `POST /api/clients` - Create new client
- `GET /api/clients/:id` - Get specific client
- `PUT /api/clients/:id` - Update client
- `DELETE /api/clients/:id` - Delete client (soft delete)

#### Contact Management
- `GET /api/clients/:id/contacts` - Get client contacts
- `POST /api/clients/:id/contacts` - Add contact
- `PUT /api/clients/:id/contacts/:contactId` - Update contact
- `DELETE /api/clients/:id/contacts/:contactId` - Delete contact

#### Address Management
- `GET /api/clients/:id/addresses` - Get client addresses
- `POST /api/clients/:id/addresses` - Add address
- `PUT /api/clients/:id/addresses/:addressId` - Update address
- `DELETE /api/clients/:id/addresses/:addressId` - Delete address

#### Financial Endpoints
- `GET /api/clients/:id/invoices` - Get client invoices
- `GET /api/clients/:id/payment-history` - Get payment history
- `GET /api/clients/:id/financial-summary` - Get financial summary
- `GET /api/clients/:id/invoice-aging` - Get invoice aging analysis
- `GET /api/clients/:id/activity` - Get client activity

#### Currency & Payment
- `GET /api/clients/currencies` - Get supported currencies
- `GET /api/clients/exchange-rates` - Get exchange rates
- `GET /api/clients/:id/currency-preferences` - Get client currency preferences
- `PUT /api/clients/:id/currency-preferences` - Update currency preferences

#### Communication System
- `GET /api/clients/:id/notes` - Get client notes
- `POST /api/clients/:id/notes` - Create note
- `PUT /api/clients/:id/notes/:noteId` - Update note
- `DELETE /api/clients/:id/notes/:noteId` - Delete note
- `GET /api/clients/:id/timeline` - Get activity timeline
- `GET /api/clients/:id/reminders` - Get reminders
- `POST /api/clients/:id/reminders` - Create reminder
- `GET /api/clients/:id/communication-stats` - Get communication stats

#### Invoice & Email Management
- `POST /api/invoices/:id/send` - Send invoice via email
- `PUT /api/invoices/:id/status` - Update invoice status (DRAFT → SENT → PAID)
- `PUT /api/invoices/:id/mark-paid` - Mark invoice as paid with payment details
- `GET /api/branding` - Get business branding and payment information
- `PUT /api/branding` - Update branding and payment details
- `GET /api/numbering-schemes` - Get numbering schemes
- `POST /api/numbering-schemes` - Create numbering scheme

### Authentication
All endpoints require JWT authentication via `Authorization: Bearer <token>` header.

**Note**: Authentication is only for business owners who manage invoices. End customers (invoice recipients) do not need PayRush accounts and interact only through public payment pages.

## �️ Database Schema

### Core Tables
- **clients** - Main client information
- **client_contacts** - Multiple contacts per client
- **client_addresses** - Multiple addresses per client
- **client_notes** - Communication notes
- **client_interactions** - Interaction history
- **client_reminders** - Scheduled reminders
- **currency_rates** - Exchange rates

### Features
- Row Level Security (RLS) for data protection
- Foreign key constraints for data integrity
- Indexed columns for performance
- Soft deletes for data preservation

## 🔧 Services

### Client Service (`services/clientService.js`)
- CRUD operations for clients
- Contact and address management
- Data validation and mapping

### Currency Service (`services/currencyService.js`)
- Multi-currency support (USD, EUR, GBP, ZMW, NGN, KES, GHS, ZAR)
- Payment method configuration
- Exchange rate management
- Currency conversion utilities

### Communication Service (`services/communicationService.js`)
- Notes management with categories and priorities
- Timeline tracking
- Reminder scheduling
- Communication statistics

### Invoice Service (`services/invoiceService.js`)
- Financial summaries and analytics
- Invoice aging analysis
- Payment history tracking
- Activity timeline

## 🛡️ Security

### Authentication Middleware
- JWT token validation
- User ID extraction from tokens
- Route protection

### Authorization
- User-specific data access
- Row Level Security policies
- Input validation and sanitization

## 🔧 Configuration

### Environment Variables (.env)
```bash
# Supabase Configuration
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# JWT Configuration
JWT_SECRET=your_jwt_secret_key

# Server Configuration
PORT=5000
NODE_ENV=development

# Email Service Configuration
RESEND_API_KEY=your_resend_api_key

# Payment Gateway Configuration
DPO_COMPANY_TOKEN=your_dpo_company_token
DPO_SERVICE_TYPE=your_dpo_service_type
DPO_API_URL=https://secure.3gdirectpay.com
FLUTTERWAVE_PUBLIC_KEY=your_flutterwave_public_key (alternative gateway)

# CORS Configuration
CLIENT_URL=http://localhost:3000
```

### Database Migrations
Database schema is managed through Supabase migrations:
- Migration 007: Client contacts and addresses
- Migration 008: Currency preferences
- Migration 009: Communication system

## � API Response Format

### Success Response
```json
{
  "success": true,
  "data": {...},
  "message": "Operation completed successfully"
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error message",
  "statusCode": 400
}
```

## 🚧 Development

### Available Scripts
- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon
- `npm test` - Run tests (when implemented)

### Code Organization
```
server/
├── routes/           # Express route handlers
├── services/         # Business logic layer
├── config/           # Configuration files
├── utils/            # Utility functions
├── middleware/       # Custom middleware
└── app.js           # Express app setup
```

## 🎯 Recent Updates

### Manual Payment Processing (v1.9.27)
- ✅ Added "Mark as Paid" API endpoint for manual payment processing
- ✅ Implemented payment confirmation email service with proper formatting
- ✅ Created payment method tracking (bank_transfer, cash, check, other)
- ✅ Enhanced invoice status workflow with payment date tracking
- ✅ Fixed database constraints and email template content issues

### Communication System (v1.2.0)
- ✅ Added notes system with categories and priorities
- ✅ Implemented activity timeline
- ✅ Created reminder scheduling system
- ✅ Added communication statistics

### Currency Management (v1.1.0)
- ✅ Multi-currency support
- ✅ Payment method configuration
- ✅ Exchange rate management
- ✅ Client-specific preferences

### API Enhancements
- ✅ Improved error handling
- ✅ Enhanced validation
- ✅ Better response formatting
- ✅ Optimized database queries

## 🧪 Testing

### Manual Testing
Use tools like Postman or curl to test endpoints:

```bash
# Get all clients
curl -H "Authorization: Bearer <token>" http://localhost:5000/api/clients

# Create new client
curl -X POST \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Client","email":"test@example.com"}' \
  http://localhost:5000/api/clients
```

## 📝 Error Handling

The API includes comprehensive error handling:
- Input validation errors
- Database constraint violations
- Authentication failures
- Rate limiting (planned)
- Graceful degradation