# PayRush Client Application

Next.js frontend for the PayRush SaaS platform - A comprehensive invoicing and client management system.

## 🏢 Application Architecture

**PayRush Client is designed for business owners and freelancers only:**
- ✅ **Business Users**: Login to manage invoices, clients, and business settings
- ✅ **End Customers**: Interact via email and public payment pages (no client app access)
- ✅ **Payment Processing**: Public payment pages integrated with DPO gateway (primary) and Flutterwave (alternative)

## 🚀 Quick Start

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser.

## 🏗️ Tech Stack

- **Framework**: Next.js 15.5.4 with App Router
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **Icons**: Lucide React
- **Date Handling**: date-fns
- **HTTP Client**: Fetch API with custom service layer

## 📁 Key Components

### Client Management
- `ClientProfile.js` - Main client interface with tabbed navigation
- `ClientContactsManager.js` - Multiple contact management
- `ClientAddressManager.js` - Multiple address management
- `ClientFinancialDashboard.js` - Financial analytics and invoice tracking

### Invoice & Template Management
- `TemplatesPage.js` - Consolidated template, branding, and numbering management
- `BrandingTabContent` - Company branding, colors, fonts, and payment details
- `NumberingTabContent` - Invoice numbering schemes and patterns
- Invoice PDF generation with professional templates

### Communication & Email
- `ClientCommunication.js` - Notes, timeline, and reminders
- `ClientCurrencyPreferences.js` - Currency and payment method settings
- Email service integration for invoice delivery

### Core Features
- **Multi-tab Interface**: Overview, Contacts, Addresses, Financial, Currency, Communication, Invoices
- **Form Validation**: Client-side validation with error handling
- **Responsive Design**: Mobile-friendly interface
- **Real-time Updates**: Dynamic data fetching and updates

## 🎨 UI Components

### Enhanced Select Components
All dropdown menus include:
- White background for visibility
- Proper borders and shadows
- Hover states for better UX
- Z-index management for proper layering

### Form Components
- Consistent styling across all forms
- Validation feedback
- Loading states
- Error handling

## 🔧 Configuration

### Environment Variables (.env.local)
```
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_DPO_COMPANY_TOKEN=your_dpo_public_token
NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY=your_flutterwave_public_key
```

### Email Service Integration
- **Resend**: Primary email service for invoice delivery
- **Free Tier**: 3,000 emails/month (perfect for startup phase)
- **Professional Templates**: HTML email templates with PDF attachments
- **Reliable Delivery**: High deliverability rates for business communications

### Payment Gateway Integration
- **DPO**: Primary payment gateway for Zambian market operations
- **Flutterwave**: Alternative/backup payment gateway
- **Public Payment Pages**: Guest checkout for customers (no PayRush account required)
- **Automatic Updates**: Webhook integration for real-time payment confirmation

### API Integration
- Centralized API configuration in `lib/apiConfig.js`
- Service layer in `lib/clientService.js`
- JWT token management
- Error handling and retry logic

## 🧪 Development

### Available Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

### Code Organization
```
src/
├── app/                    # App Router pages
│   ├── dashboard/         # Main dashboard
│   └── layout.js          # Root layout
├── components/
│   ├── clients/           # Client-specific components
│   └── ui/                # shadcn/ui components
└── lib/                   # Utilities and services
    ├── apiConfig.js       # API configuration
    └── clientService.js   # Client service layer
```

## 🎯 Recent Updates

### UI Enhancements
- ✅ Fixed dropdown visibility issues across all components
- ✅ Enhanced form validation and error handling
- ✅ Improved loading states and empty states
- ✅ Added proper date formatting utilities

### New Features
- ✅ Currency preferences with multi-currency support
- ✅ Communication system with notes and reminders
- ✅ Financial dashboard with invoice aging
- ✅ Activity timeline tracking

This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).
