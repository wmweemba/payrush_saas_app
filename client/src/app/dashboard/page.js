"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabaseClient";

export default function Dashboard() {
  const router = useRouter();
  
  // Auth state
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Navigation state
  const [activeTab, setActiveTab] = useState('invoices');
  
  // Invoice state
  const [invoices, setInvoices] = useState([]);
  const [invoiceLoading, setInvoiceLoading] = useState(false);
  
  // New invoice form state
  const [showInvoiceForm, setShowInvoiceForm] = useState(false);
  const [invoiceForm, setInvoiceForm] = useState({
    customer_name: '',
    customer_email: '',
    amount: '',
    due_date: ''
  });
  
  // Message state
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);

  // Authentication guard and data loading
  useEffect(() => {
    const initializeDashboard = async () => {
      try {
        // Get current session
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session?.user) {
          router.push('/login');
          return;
        }

        setUser(session.user);

        // Fetch user profile
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (profileError && profileError.code === 'PGRST116') {
          // Profile doesn't exist, create one
          const { data: newProfile, error: createError } = await supabase
            .from('profiles')
            .insert({
              id: session.user.id,
              name: session.user.email?.split('@')[0] || 'User',
              business_name: 'My Business'
            })
            .select()
            .single();

          if (createError) {
            console.error('Failed to create profile:', createError);
            setProfile({ name: 'User', business_name: 'My Business' });
          } else {
            setProfile(newProfile);
          }
        } else if (profileError) {
          console.error('Error fetching profile:', profileError);
          setProfile({ name: 'User', business_name: 'My Business' });
        } else {
          setProfile(profileData);
        }

        // Fetch user's invoices
        await fetchInvoices(session.user.id);

      } catch (error) {
        console.error('Dashboard initialization error:', error);
        setMessage('Error loading dashboard. Please try refreshing.');
        setIsError(true);
      } finally {
        setLoading(false);
      }
    };

    initializeDashboard();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_OUT' || !session?.user) {
          router.push('/login');
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [router]);

  // Fetch user's invoices
  const fetchInvoices = async (userId) => {
    try {
      setInvoiceLoading(true);
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setInvoices(data || []);
    } catch (error) {
      console.error('Error fetching invoices:', error);
      setMessage(`Failed to fetch invoices: ${error.message}`);
      setIsError(true);
    } finally {
      setInvoiceLoading(false);
    }
  };

  // Handle signout
  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      setMessage(`Error signing out: ${error.message}`);
      setIsError(true);
    } else {
      router.push('/');
    }
  };

  // Handle invoice form input
  const handleInvoiceInputChange = (e) => {
    setInvoiceForm({
      ...invoiceForm,
      [e.target.name]: e.target.value
    });
  };

  // Create new invoice
  const createInvoice = async (e) => {
    e.preventDefault();
    if (!user) return;
    
    setInvoiceLoading(true);
    setMessage('');
    setIsError(false);

    try {
      // Get tomorrow's date as default due date if not provided
      const defaultDueDate = new Date();
      defaultDueDate.setDate(defaultDueDate.getDate() + 30);
      
      const invoiceData = {
        user_id: user.id,
        customer_name: invoiceForm.customer_name,
        customer_email: invoiceForm.customer_email || null,
        amount: parseFloat(invoiceForm.amount),
        currency: 'USD',
        status: 'draft',
        due_date: invoiceForm.due_date || defaultDueDate.toISOString().split('T')[0]
      };

      const { data, error } = await supabase
        .from('invoices')
        .insert(invoiceData)
        .select();

      if (error) throw error;

      setMessage('✅ Invoice created successfully!');
      setIsError(false);
      
      // Reset form and hide it
      setInvoiceForm({
        customer_name: '',
        customer_email: '',
        amount: '',
        due_date: ''
      });
      setShowInvoiceForm(false);
      
      // Refresh invoices
      await fetchInvoices(user.id);
    } catch (error) {
      setMessage(`❌ Failed to create invoice: ${error.message}`);
      setIsError(true);
    } finally {
      setInvoiceLoading(false);
    }
  };

  // Format currency
  const formatCurrency = (amount, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-900 dark:to-slate-800">
      {/* Header Navigation */}
      <header className="bg-white dark:bg-slate-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              PayRush
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
                Welcome back, {profile?.name || 'User'}! 👋
              </h1>
              <p className="text-gray-600 dark:text-gray-300">
                <span className="font-medium">{profile?.business_name || 'Your Business'}</span> • 
                Dashboard
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
              <button
                onClick={() => setActiveTab('invoices')}
                className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'invoices'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                📄 Invoices ({invoices.length})
              </button>
              <button
                onClick={() => setActiveTab('payments')}
                className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'payments'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                💳 Payments
              </button>
              <button
                onClick={() => setActiveTab('settings')}
                className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'settings'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                ⚙️ Profile Settings
              </button>
            </nav>
          </div>

          <div className="p-6">
            {/* Invoices Tab */}
            {activeTab === 'invoices' && (
              <div className="space-y-6">
                {/* Invoice Actions */}
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                      Your Invoices
                    </h2>
                    <p className="text-gray-600 dark:text-gray-300 text-sm">
                      Manage and track all your invoices
                    </p>
                  </div>
                  <div className="flex space-x-3">
                    <Button 
                      onClick={() => fetchInvoices(user?.id)}
                      variant="outline"
                      size="sm"
                      disabled={invoiceLoading}
                    >
                      🔄 Refresh
                    </Button>
                    <Button 
                      onClick={() => setShowInvoiceForm(!showInvoiceForm)}
                      className="payrush-gradient text-white hover:scale-105 transition-transform"
                    >
                      ➕ New Invoice
                    </Button>
                  </div>
                </div>

                {/* New Invoice Form */}
                {showInvoiceForm && (
                  <div className="bg-gray-50 dark:bg-slate-700 p-6 rounded-xl border border-gray-200 dark:border-gray-600">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                      Create New Invoice
                    </h3>
                    <form onSubmit={createInvoice} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Customer Name *
                        </label>
                        <input
                          type="text"
                          name="customer_name"
                          value={invoiceForm.customer_name}
                          onChange={handleInvoiceInputChange}
                          required
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                                   bg-white dark:bg-slate-800 text-gray-900 dark:text-white 
                                   focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Enter customer name"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Customer Email
                        </label>
                        <input
                          type="email"
                          name="customer_email"
                          value={invoiceForm.customer_email}
                          onChange={handleInvoiceInputChange}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                                   bg-white dark:bg-slate-800 text-gray-900 dark:text-white 
                                   focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Enter customer email (optional)"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Amount (USD) *
                        </label>
                        <input
                          type="number"
                          name="amount"
                          value={invoiceForm.amount}
                          onChange={handleInvoiceInputChange}
                          required
                          step="0.01"
                          min="0"
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                                   bg-white dark:bg-slate-800 text-gray-900 dark:text-white 
                                   focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="0.00"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Due Date
                        </label>
                        <input
                          type="date"
                          name="due_date"
                          value={invoiceForm.due_date}
                          onChange={handleInvoiceInputChange}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                                   bg-white dark:bg-slate-800 text-gray-900 dark:text-white 
                                   focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div className="md:col-span-2 flex justify-end space-x-3">
                        <Button 
                          type="button"
                          onClick={() => setShowInvoiceForm(false)}
                          variant="outline"
                        >
                          Cancel
                        </Button>
                        <Button 
                          type="submit"
                          disabled={invoiceLoading}
                          className="payrush-gradient text-white"
                        >
                          {invoiceLoading ? 'Creating...' : 'Create Invoice'}
                        </Button>
                      </div>
                    </form>
                  </div>
                )}

                {/* Invoices List */}
                {invoices.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-slate-700 rounded-full flex items-center justify-center">
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                      No invoices yet
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 mb-4">
                      Create your first invoice to get started
                    </p>
                    <Button 
                      onClick={() => setShowInvoiceForm(true)}
                      className="payrush-gradient text-white"
                    >
                      Create First Invoice
                    </Button>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {invoices.map((invoice) => (
                      <div key={invoice.id} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <h4 className="font-semibold text-gray-900 dark:text-white">
                                {invoice.customer_name}
                              </h4>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                invoice.status === 'paid' 
                                  ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                                  : invoice.status === 'sent'
                                  ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
                                  : invoice.status === 'overdue'
                                  ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                                  : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                              }`}>
                                {invoice.status}
                              </span>
                            </div>
                            {invoice.customer_email && (
                              <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">
                                {invoice.customer_email}
                              </p>
                            )}
                            <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                              <span>Due: {formatDate(invoice.due_date)}</span>
                              <span>ID: {invoice.id.slice(0, 8)}...</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">
                              {formatCurrency(invoice.amount, invoice.currency)}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Payments Tab */}
            {activeTab === 'payments' && (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-slate-700 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Payments Coming Soon
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Payment tracking and processing features will be available soon
                </p>
              </div>
            )}

            {/* Profile Settings Tab */}
            {activeTab === 'settings' && (
              <div className="max-w-2xl">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                  Profile Settings
                </h2>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Full Name
                      </label>
                      <input
                        type="text"
                        value={profile?.name || ''}
                        disabled
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                                 bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Business Name
                      </label>
                      <input
                        type="text"
                        value={profile?.business_name || ''}
                        disabled
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                                 bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-white"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={user?.email || ''}
                      disabled
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                               bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-white"
                    />
                  </div>
                  <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Profile editing features will be available in a future update.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Message Display */}
        {message && (
          <div className={`p-4 rounded-lg text-sm ${
            isError 
              ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800' 
              : 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800'
          }`}>
            {message}
          </div>
        )}
      </div>
    </div>
  );
}