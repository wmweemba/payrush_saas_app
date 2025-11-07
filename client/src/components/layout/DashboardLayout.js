'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabaseClient';
import { useUserProfile } from '@/hooks/useUserProfile';

export default function DashboardLayout({ children, currentTab = null, title, description, user: propUser, profile: propProfile, onSignOut }) {
  const router = useRouter();
  const { user: hookUser, profile: hookProfile, loading, error } = useUserProfile();
  
  // Use props if provided (for backward compatibility), otherwise use hook values
  const user = propUser || hookUser;
  const profile = propProfile || hookProfile;

  const handleSignOut = async () => {
    try {
      if (onSignOut) {
        onSignOut();
      } else {
        await supabase.auth.signOut();
        router.push('/login');
      }
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading Dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 dark:text-red-400 mb-4">
            <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm">{error}</p>
          </div>
          <Button onClick={() => window.location.reload()} variant="outline">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-900 dark:to-slate-800">
      {/* Header Navigation */}
      <header className="bg-white dark:bg-slate-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo and Business Name */}
            <div className="flex items-center space-x-4">
              <Link href="/dashboard" className="text-2xl font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors">
                PayRush
              </Link>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                <span className="font-medium">{profile?.business_name || 'My Business'}</span>
              </div>
            </div>

            {/* User menu */}
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600 dark:text-gray-300">
                {user?.email}
              </span>
              <Button 
                onClick={handleSignOut}
                variant="outline"
                size="sm"
                className="border-red-600 text-red-600 hover:bg-red-50 dark:border-red-400 dark:text-red-400 dark:hover:bg-red-900/20"
              >
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Banner */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                {title || `Welcome back, ${profile?.name || 'User'}! 👋`}
              </h1>
              <p className="text-gray-600 dark:text-gray-300">
                <span className="font-medium">{profile?.business_name || 'My Business'}</span> • 
                {description || 'Dashboard'}
              </p>
            </div>
            <div className="hidden sm:block">
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 w-16 h-16 rounded-2xl flex items-center justify-center">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg mb-8">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="flex space-x-8 px-6">
              <Link
                href="/dashboard"
                className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                  currentTab === 'invoices'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                📄 Invoices
              </Link>
              <Link
                href="/dashboard/clients"
                className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                  currentTab === 'clients'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                👥 Clients
              </Link>
              <Link 
                href="/dashboard/templates"
                className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                  currentTab === 'templates'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                🎨 Templates
              </Link>
              <Link 
                href="/dashboard/notes"
                className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                  currentTab === 'notes'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                📝 Notes
              </Link>
              <Link
                href="/dashboard/approvals"
                className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                  currentTab === 'approvals'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                ✅ Approvals
              </Link>
              <Link
                href="/dashboard/payments"
                className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                  currentTab === 'payments'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                💳 Payments
              </Link>
              <Link
                href="/dashboard/profile-settings"
                className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                  currentTab === 'settings'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                ⚙️ Profile Settings
              </Link>
            </nav>
          </div>
          <div className="p-6 bg-white dark:bg-slate-800 text-gray-900 dark:text-white">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}