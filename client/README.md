# PayRush Client Application

Next.js frontend for the PayRush SaaS platform.

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

### Communication System
- `ClientCommunication.js` - Notes, timeline, and reminders
- `ClientCurrencyPreferences.js` - Currency and payment method settings

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
```

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
