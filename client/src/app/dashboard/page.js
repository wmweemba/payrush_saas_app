"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabaseClient";
import { processPayment, formatCurrency } from "@/lib/payments/flutterwave";

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
  
  // Payment processing state
  const [processingPayment, setProcessingPayment] = useState(false);
  const [paymentInvoiceId, setPaymentInvoiceId] = useState(null);

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
    if (!user || !profile) {
      setMessage('❌ Unable to create invoice: User profile not loaded');
      setIsError(true);
      return;
    }
    
    setInvoiceLoading(true);
    setMessage('');
    setIsError(false);

    try {
      // Ensure profile exists in the database
      const { data: profileCheck, error: profileCheckError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single();

      if (profileCheckError || !profileCheck) {
        console.log('Profile not found, creating profile...');
        const { error: createProfileError } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            name: user.email?.split('@')[0] || 'User',
            business_name: profile.business_name || 'My Business'
          });

        if (createProfileError) {
          throw new Error(`Failed to create user profile: ${createProfileError.message}`);
        }
      }

      // Get tomorrow's date as default due date if not provided
      const defaultDueDate = new Date();
      defaultDueDate.setDate(defaultDueDate.getDate() + 30);
      
      const invoiceData = {
        user_id: user.id, // This now references profiles(id) which should exist
        customer_name: invoiceForm.customer_name,
        customer_email: invoiceForm.customer_email || null,
        amount: parseFloat(invoiceForm.amount),
        currency: 'USD',
        status: 'Pending',
        due_date: invoiceForm.due_date || defaultDueDate.toISOString().split('T')[0]
      };

      console.log('Creating invoice with data:', invoiceData);

      const { data, error } = await supabase
        .from('invoices')
        .insert(invoiceData)
        .select();

      if (error) {
        console.error('Invoice creation error:', error);
        throw new Error(`Database error: ${error.message || 'Unknown error occurred'}`);
      }

      if (!data || data.length === 0) {
        throw new Error('Invoice was not created properly');
      }

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
      console.error('Complete invoice creation error:', error);
      let errorMessage = 'Failed to create invoice';
      
      if (error.message.includes('foreign key')) {
        errorMessage = '❌ Account setup issue. Please try signing out and signing in again.';
      } else if (error.message.includes('profiles')) {
        errorMessage = '❌ Profile setup issue. Please refresh the page and try again.';
      } else {
        errorMessage = `❌ ${error.message}`;
      }
      
      setMessage(errorMessage);
      setIsError(true);
    } finally {
      setInvoiceLoading(false);
    }
  };

  // Update invoice status
  const updateInvoiceStatus = async (invoiceId, newStatus) => {
    setInvoiceLoading(true);
    setMessage('');
    setIsError(false);

    try {
      const { error } = await supabase
        .from('invoices')
        .update({ status: newStatus })
        .eq('id', invoiceId)
        .eq('user_id', user.id); // Ensure user can only update their own invoices

      if (error) throw error;

      setMessage(`✅ Invoice marked as ${newStatus}!`);
      setIsError(false);
      
      // Refresh invoices
      await fetchInvoices(user.id);
    } catch (error) {
      console.error('Invoice status update error:', error);
      setMessage(`❌ Failed to update invoice status: ${error.message}`);
      setIsError(true);
    } finally {
      setInvoiceLoading(false);
    }
  };

  // Process payment for an invoice
  const handlePayNow = async (invoice) => {
    setProcessingPayment(true);
    setPaymentInvoiceId(invoice.id);
    setMessage('');
    
    try {
      await processPayment(
        invoice,
        // onSuccess callback
        async (response, verificationResult) => {
          setMessage(`✅ Payment successful! Invoice #${invoice.id} has been paid.`);
          setIsError(false);
          
          // Refresh invoices to show updated status
          if (user) {
            await fetchInvoices(user.id);
          }
          
          console.log('Payment successful:', { response, verificationResult });
        },
        // onError callback
        (error, details) => {
          console.error('Payment error:', error, details);
          setMessage(`❌ Payment failed: ${typeof error === 'string' ? error : error.message}`);
          setIsError(true);
        }
      );
    } catch (error) {
      console.error('Payment processing error:', error);
      setMessage(`❌ Failed to process payment: ${error.message}`);
      setIsError(true);
    } finally {
      setProcessingPayment(false);
      setPaymentInvoiceId(null);
    }
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
                                invoice.status === 'Paid' 
                                  ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                                  : invoice.status === 'Sent'
                                  ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
                                  : invoice.status === 'Overdue'
                                  ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                                  : invoice.status === 'Cancelled'
                                  ? 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                                  : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400' // Pending
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
                          <div className="text-right flex flex-col items-end space-y-2">
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">
                              {formatCurrency(invoice.amount, invoice.currency)}
                            </p>
                            
                            {/* Invoice Action Buttons */}
                            <div className="flex space-x-2">
                              {invoice.status === 'Pending' && (
                                <>
                                  <Button 
                                    onClick={() => handlePayNow(invoice)}
                                    disabled={processingPayment && paymentInvoiceId === invoice.id}
                                    size="sm"
                                    className="bg-orange-600 hover:bg-orange-700 text-white"
                                  >
                                    {processingPayment && paymentInvoiceId === invoice.id ? 'Processing...' : '💳 Pay Now'}
                                  </Button>
                                  <Button 
                                    onClick={() => updateInvoiceStatus(invoice.id, 'Sent')}
                                    disabled={invoiceLoading}
                                    variant="outline"
                                    size="sm"
                                    className="text-blue-600 border-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:border-blue-400"
                                  >
                                    Mark as Sent
                                  </Button>
                                  <Button 
                                    onClick={() => updateInvoiceStatus(invoice.id, 'Paid')}
                                    disabled={invoiceLoading}
                                    size="sm"
                                    className="bg-green-600 hover:bg-green-700 text-white"
                                  >
                                    Mark as Paid
                                  </Button>
                                </>
                              )}
                              
                              {invoice.status === 'Sent' && (
                                <>
                                  <Button 
                                    onClick={() => handlePayNow(invoice)}
                                    disabled={processingPayment && paymentInvoiceId === invoice.id}
                                    size="sm"
                                    className="bg-orange-600 hover:bg-orange-700 text-white"
                                  >
                                    {processingPayment && paymentInvoiceId === invoice.id ? 'Processing...' : '💳 Pay Now'}
                                  </Button>
                                  <Button 
                                    onClick={() => updateInvoiceStatus(invoice.id, 'Paid')}
                                    disabled={invoiceLoading}
                                    size="sm"
                                    className="bg-green-600 hover:bg-green-700 text-white"
                                  >
                                    Mark as Paid
                                  </Button>
                                  <Button 
                                    onClick={() => updateInvoiceStatus(invoice.id, 'Overdue')}
                                    disabled={invoiceLoading}
                                    variant="outline"
                                    size="sm"
                                    className="text-red-600 border-red-600 hover:bg-red-50 dark:text-red-400 dark:border-red-400"
                                  >
                                    Mark Overdue
                                  </Button>
                                </>
                              )}
                              
                              {(invoice.status === 'Overdue') && (
                                <>
                                  <Button 
                                    onClick={() => handlePayNow(invoice)}
                                    disabled={processingPayment && paymentInvoiceId === invoice.id}
                                    size="sm"
                                    className="bg-orange-600 hover:bg-orange-700 text-white"
                                  >
                                    {processingPayment && paymentInvoiceId === invoice.id ? 'Processing...' : '💳 Pay Now'}
                                  </Button>
                                  <Button 
                                    onClick={() => updateInvoiceStatus(invoice.id, 'Paid')}
                                    disabled={invoiceLoading}
                                    size="sm"
                                    className="bg-green-600 hover:bg-green-700 text-white"
                                  >
                                    Mark as Paid
                                  </Button>
                                </>
                              )}
                              
                              {invoice.status !== 'Paid' && invoice.status !== 'Cancelled' && (
                                <Button 
                                  onClick={() => updateInvoiceStatus(invoice.id, 'Cancelled')}
                                  disabled={invoiceLoading}
                                  variant="outline"
                                  size="sm"
                                  className="text-gray-600 border-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:border-gray-400"
                                >
                                  Cancel
                                </Button>
                              )}
                            </div>
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
              <div className="space-y-8">
                {/* Flutterwave Integration Status */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
                  <div className="flex items-start space-x-4">
                    <div className="bg-blue-100 dark:bg-blue-900/30 rounded-full p-3">
                      <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                        Flutterwave Payment Integration
                      </h3>
                      <p className="text-gray-600 dark:text-gray-300 mb-4">
                        Accept payments from customers across Africa and globally using cards, mobile money, bank transfers, and more.
                      </p>
                      <div className="flex items-center space-x-3">
                        <span className="px-3 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 text-sm font-medium rounded-full">
                          🚧 In Development
                        </span>
                        <a 
                          href="https://developer.flutterwave.com" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm font-medium"
                        >
                          View Flutterwave API Docs →
                        </a>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Planned Features */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white dark:bg-slate-700 rounded-xl p-6 border border-gray-200 dark:border-gray-600">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="bg-green-100 dark:bg-green-900/30 rounded-full p-2">
                        <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                        </svg>
                      </div>
                      <h4 className="font-semibold text-gray-900 dark:text-white">Payment Collection</h4>
                    </div>
                    <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                      <li className="flex items-center space-x-2">
                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                        <span>Generate payment links for invoices</span>
                      </li>
                      <li className="flex items-center space-x-2">
                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                        <span>Accept card payments globally</span>
                      </li>
                      <li className="flex items-center space-x-2">
                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                        <span>Mobile money integration (MTN, Airtel)</span>
                      </li>
                      <li className="flex items-center space-x-2">
                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                        <span>Bank transfer options</span>
                      </li>
                    </ul>
                  </div>

                  <div className="bg-white dark:bg-slate-700 rounded-xl p-6 border border-gray-200 dark:border-gray-600">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="bg-purple-100 dark:bg-purple-900/30 rounded-full p-2">
                        <svg className="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                      </div>
                      <h4 className="font-semibold text-gray-900 dark:text-white">Payment Tracking</h4>
                    </div>
                    <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                      <li className="flex items-center space-x-2">
                        <div className="w-1.5 h-1.5 bg-purple-500 rounded-full"></div>
                        <span>Real-time payment status updates</span>
                      </li>
                      <li className="flex items-center space-x-2">
                        <div className="w-1.5 h-1.5 bg-purple-500 rounded-full"></div>
                        <span>Automatic invoice status updates</span>
                      </li>
                      <li className="flex items-center space-x-2">
                        <div className="w-1.5 h-1.5 bg-purple-500 rounded-full"></div>
                        <span>Payment history and receipts</span>
                      </li>
                      <li className="flex items-center space-x-2">
                        <div className="w-1.5 h-1.5 bg-purple-500 rounded-full"></div>
                        <span>Webhook integration</span>
                      </li>
                    </ul>
                  </div>
                </div>

                {/* Integration Preview */}
                <div className="bg-gray-50 dark:bg-slate-700 rounded-xl p-6 border border-gray-200 dark:border-gray-600">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-4">
                    🔧 Developer Preview
                  </h4>
                  <div className="bg-gray-800 rounded-lg p-4 font-mono text-sm overflow-x-auto">
                    <div className="text-green-400">{`// /lib/payments/flutterwave.js`}</div>
                    <div className="text-gray-300 mt-2">
                      <span className="text-blue-400">import</span> {`{ FlutterwaveCheckout }`} <span className="text-blue-400">from</span> <span className="text-yellow-300">&apos;flutterwave-react-v3&apos;</span>;<br/>
                      <br/>
                      <span className="text-purple-400">export</span> <span className="text-blue-400">const</span> <span className="text-white">createPaymentLink</span> = <span className="text-yellow-300">async</span> (invoiceData) {`=> {`}<br/>
                      &nbsp;&nbsp;<span className="text-gray-500">{`// Generate secure payment link`}</span><br/>
                      &nbsp;&nbsp;<span className="text-blue-400">const</span> config = {`= {`}<br/>
                      &nbsp;&nbsp;&nbsp;&nbsp;public_key: <span className="text-yellow-300">&apos;FLW_PUBLIC_KEY&apos;</span>,<br/>
                      &nbsp;&nbsp;&nbsp;&nbsp;tx_ref: invoiceData.id,<br/>
                      &nbsp;&nbsp;&nbsp;&nbsp;amount: invoiceData.amount,<br/>
                      &nbsp;&nbsp;&nbsp;&nbsp;currency: invoiceData.currency,<br/>
                      &nbsp;&nbsp;&nbsp;&nbsp;customer: {`{`}<br/>
                      &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;email: invoiceData.customer_email,<br/>
                      &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;name: invoiceData.customer_name<br/>
                      &nbsp;&nbsp;&nbsp;&nbsp;{`}`}<br/>
                      &nbsp;&nbsp;{`};`}<br/>
                      {`};`}
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
                    Payment infrastructure is being prepared. Integration will include secure webhooks, automatic status updates, and comprehensive transaction tracking.
                  </p>
                </div>

                {/* Quick Start Guide */}
                <div className="bg-white dark:bg-slate-700 rounded-xl p-6 border border-gray-200 dark:border-gray-600">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Getting Started with Payments
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-start space-x-3">
                      <div className="bg-blue-100 dark:bg-blue-900/30 rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0">
                        <span className="text-blue-600 dark:text-blue-400 font-bold text-sm">1</span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white text-sm">Setup Flutterwave Account</p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">Create merchant account and get API keys</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="bg-blue-100 dark:bg-blue-900/30 rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0">
                        <span className="text-blue-600 dark:text-blue-400 font-bold text-sm">2</span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white text-sm">Configure Webhooks</p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">Set up payment status notifications</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="bg-blue-100 dark:bg-blue-900/30 rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0">
                        <span className="text-blue-600 dark:text-blue-400 font-bold text-sm">3</span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white text-sm">Start Accepting Payments</p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">Generate links and track transactions</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Profile Settings Tab */}
            {activeTab === 'settings' && (
              <div className="max-w-2xl">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                  Profile Settings
                </h2>
                <div className="space-y-6">
                  {/* Current Profile Overview */}
                  <div className="bg-gray-50 dark:bg-slate-700 rounded-xl p-6 border border-gray-200 dark:border-gray-600">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                      Current Profile
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Full Name</p>
                        <p className="font-medium text-gray-900 dark:text-white">{profile?.name || 'Not set'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Business Name</p>
                        <p className="font-medium text-gray-900 dark:text-white">{profile?.business_name || 'Not set'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Email Address</p>
                        <p className="font-medium text-gray-900 dark:text-white">{user?.email || 'Not set'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Phone</p>
                        <p className="font-medium text-gray-900 dark:text-white">{profile?.phone || 'Not set'}</p>
                      </div>
                    </div>
                    
                    <Link 
                      href="/dashboard/profile-settings"
                      className="inline-block"
                    >
                      <Button className="payrush-gradient text-white hover:scale-105 transition-transform">
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Edit Profile Settings
                      </Button>
                    </Link>
                  </div>

                  {/* Additional Settings */}
                  <div className="bg-gray-50 dark:bg-slate-700 rounded-xl p-6 border border-gray-200 dark:border-gray-600">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                      Account Settings
                    </h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between py-2">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">Email Notifications</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Coming soon</p>
                        </div>
                        <div className="text-gray-400">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </div>
                      <div className="flex items-center justify-between py-2">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">Security Settings</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Password, 2FA - Coming soon</p>
                        </div>
                        <div className="text-gray-400">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </div>
                    </div>
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