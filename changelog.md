# Changelog

All notable changes to the PayRush project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- **Full Supabase Auth + Database integration test page** with comprehensive functionality
- **Dual authentication modes**: Sign Up and Sign In with mode toggle interface  
- **Robust profile creation system**: Automatic profile creation with RLS policy handling
- **Session persistence**: User state maintained across page refreshes
- **Invoice management system**: Create, fetch, and display user invoices
- **Real-time invoice listing**: Display invoices with status badges and formatting
- **Protected dashboard view**: Invoice management interface for authenticated users
- **Enhanced navigation**: Dynamic navigation showing user email and sign out option
- **Graceful error handling**: RLS policy violations handled with user-friendly messaging
- **Profile creation fallback**: Automatic profile creation on sign-in if missing during signup
- Official PayRush database schema with three core tables
- **profiles** table extending Supabase auth.users with business_name
- **invoices** table for customer billing with status tracking (draft|sent|paid|overdue)  
- **payments** table for payment gateway integration with provider tracking
- Row Level Security (RLS) policies for data protection
- Foreign key relationships with cascade delete protection
- Database indexes for optimized query performance
- Check constraints for status validation
- Test authentication form integrated into landing page
- Supabase authentication flow with signInWithPassword
- Client-side authentication state management
- User-friendly error and success messaging for auth testing
- Form validation and loading states
- TailwindCSS styling for authentication form components

### Changed
- **Complete authentication system overhaul**: Upgraded from basic signin to full auth system
- **Enhanced user experience**: Added loading states, session management, and protected routes
- **Dashboard-style interface**: Invoice management with create, read, refresh functionality
- **Robust error handling**: Improved RLS policy violation handling with graceful fallbacks
- **Responsive design improvements**: Better mobile and desktop layout for auth and dashboard
- Updated planning.md with complete database architecture documentation
- Enhanced database security with comprehensive RLS policies
- Moved supabaseClient.js to correct src/lib/ path for Next.js compatibility
- Landing page converted to client component to support authentication state
- Added React useState hooks for form management
- Enhanced landing page layout to include authentication testing section

### Fixed
- **Critical RLS policy issue**: Fixed Row Level Security violations during profile creation
- **Profile creation timing**: Resolved session establishment timing issues during signup
- **Authentication flow reliability**: Added fallback profile creation on sign-in
- **JSX syntax errors**: Fixed duplicate return statements and unclosed elements
- Resolved supabaseClient import path issue preventing page compilation
- Fixed Next.js module resolution for @/lib/supabaseClient imports

### Technical Details
- Supabase client integration with proper environment variable usage
- Form submission handling with async/await pattern
- Error boundary handling for authentication failures
- Responsive design for authentication form
- Dark mode support for form elements

---
- Initial Next.js 14 project structure with App Router
- TailwindCSS v4 configuration and setup
- PayRush brand identity and color scheme
- Responsive landing page with PayRush branding
- Dark mode support throughout the application
- Custom TailwindCSS utilities for PayRush styling
- Supabase integration dependencies
- React Hook Form for form handling
- React Hot Toast for notifications
- Axios for HTTP requests
- shadcn/ui component library integration with TailwindCSS v4
- Button component implementation with multiple variants (default, outline, secondary, ghost, destructive, link)
- Utility functions for class merging and conditional styling

### Changed
- Updated package.json metadata from default Next.js to PayRush branding
- Replaced default Next.js homepage with PayRush landing page
- Configured globals.css with PayRush theme variables and custom utilities
- Enhanced landing page buttons with shadcn/ui Button components for better consistency and accessibility

### Technical Details
- Next.js 15.5.4 with Turbopack support
- TailwindCSS v4 with PostCSS integration
- Geist font family integration
- ESLint configuration for Next.js
- Comprehensive .gitignore files for clean repository
- Git repository initialized and pushed to GitHub
- shadcn/ui integrated with TailwindCSS v4 using "new-york" style
- Class Variance Authority (CVA) for component variants
- Radix UI primitives for accessible component foundations
- clsx and tailwind-merge for optimal class handling

---

## [0.2.0] - 2025-09-25

### Added
- shadcn/ui component library setup and configuration
- Button component with multiple variants and sizes
- Utility functions for class merging (cn helper)
- Comprehensive CSS custom properties for theming
- Dark mode support for shadcn components
- TailwindCSS v4 integration with shadcn/ui

### Changed  
- Landing page buttons converted to shadcn/ui Button components
- Enhanced styling consistency across the application
- Improved accessibility with Radix UI primitives

### Technical Details
- shadcn/ui installed using latest CLI (`pnpm dlx shadcn@latest init`)
- Configured with "new-york" style and neutral base color
- CSS variables approach for theming
- Component path aliases configured (@/components/ui)
- Successfully tested with development server

---

## [0.1.0] - 2025-09-25

### Added
- Project initialization
- Development environment setup
- Documentation structure (prd.md, planning.md, copilot.md, tasks.md)

### Infrastructure
- GitHub repository structure
- Development workflow documentation
- Coding standards and conventions
- Git repository setup with proper .gitignore files
- Initial commit pushed to https://github.com/wmweemba/payrush_saas_app.git