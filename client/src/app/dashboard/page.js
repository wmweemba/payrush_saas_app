"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabaseClient";
import { processPayment } from "@/lib/payments/flutterwave";
import { CurrencySelect, CurrencyInput, CurrencyDisplay } from "@/components/ui/CurrencySelect";
import { getDefaultCurrency, formatCurrency } from "@/lib/currency/currencies";
import { downloadInvoicePDF, previewInvoicePDF } from "@/lib/pdf/invoicePDF";
import ClientList from "@/components/clients/ClientList";
import ClientForm from "@/components/clients/ClientForm";
import ClientProfile from "@/components/clients/ClientProfile";
import AdvancedInvoiceManager from "@/components/invoices/AdvancedInvoiceManager";
import { clientService } from "@/lib/clientService";

export default function Dashboard() {
  const router = useRouter();
  
  // Auth state
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Navigation state
  const [activeTab, setActiveTab] = useState('invoices');
  
  // Client management state
  const [clientView, setClientView] = useState('list'); // 'list', 'form', 'profile'
  const [selectedClient, setSelectedClient] = useState(null);
  const [clientRefreshTrigger, setClientRefreshTrigger] = useState(0);
  const [clientFormLoading, setClientFormLoading] = useState(false);
  
  // Invoice state
  const [invoices, setInvoices] = useState([]);
  const [invoiceLoading, setInvoiceLoading] = useState(false);
  
  // New invoice form state
  const [showInvoiceForm, setShowInvoiceForm] = useState(false);
  const [invoiceForm, setInvoiceForm] = useState({
    customer_name: '',
    customer_email: '',
    amount: '',
    currency: getDefaultCurrency(), // Add currency support
    due_date: ''
  });
  
  // Message state
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  
  // Payment processing state
  const [processingPayment, setProcessingPayment] = useState(false);
  const [paymentInvoiceId, setPaymentInvoiceId] = useState(null);
  
  // PDF processing state
  const [processingPDF, setProcessingPDF] = useState(false);
  const [pdfInvoiceId, setPdfInvoiceId] = useState(null);

  // Authentication guard and data loading
  useEffect(() => {
    const initializeDashboard = async () => {
      try {
        // Debug Supabase connectivity
        console.log('Dashboard initializing - checking Supabase connectivity...');
        console.log('Supabase client URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
        console.log('Supabase anon key exists:', !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

        // Get current session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        console.log('Session retrieval result:', { session: !!session, sessionError });
        
        if (sessionError) {
          console.error('Session retrieval error:', sessionError);
        }
        
        if (!session?.user) {
          console.log('No valid session found, redirecting to login...');
          router.push('/login');
          return;
        }

        console.log('Valid session found for user:', session.user.id);
        setUser(session.user);
        
        // Store auth token for API requests - temporary solution for existing components
        if (session.access_token) {
          localStorage.setItem('authToken', session.access_token);
          localStorage.setItem('token', session.access_token); // For components using 'token' key
        }

        // Fetch user profile
        console.log('Fetching profile for user:', session.user.id);
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        console.log('Profile query result:', { profileData, profileError });

        if (profileError && profileError.code === 'PGRST116') {
          // Profile doesn't exist, create one
          console.log('Creating new profile for user:', session.user.id);
          console.log('User session details:', {
            id: session.user.id,
            email: session.user.email,
            aud: session.user.aud,
            role: session.user.role
          });

          // Test if user can access profiles table at all
          console.log('Testing profiles table access...');
          const { data: testAccess, error: testError } = await supabase
            .from('profiles')
            .select('id')
            .limit(1);
          
          console.log('Profiles table access test:', { testAccess, testError });
          
          // Try insert first
          console.log('Attempting profile insert...');
          
          // Create flexible profile data based on available schema
          const profileInsertData = {
            id: session.user.id,
            business_name: 'My Business'
          };
          
          // Test if name column exists and add it if available
          try {
            const { error: nameTestError } = await supabase
              .from('profiles')
              .select('name')
              .limit(0);
              
            if (!nameTestError) {
              profileInsertData.name = session.user.email?.split('@')[0] || 'User';
            }
          } catch (e) {
            console.log('Name column not available in current schema');
          }

          let { data: newProfile, error: createError } = await supabase
            .from('profiles')
            .insert(profileInsertData)
            .select()
            .single();

          console.log('Insert result:', { newProfile, createError });

          // If insert fails, try upsert as fallback
          if (createError) {
            console.log('Insert failed, trying upsert...');
            console.log('Insert error details:', {
              error: createError,
              message: createError?.message,
              details: createError?.details,
              hint: createError?.hint,
              code: createError?.code,
              status: createError?.status,
              statusText: createError?.statusText
            });
            
            // Create flexible profile data for upsert as well
            const profileUpsertData = {
              id: session.user.id,
              business_name: 'My Business'
            };
            
            // Add name if column exists
            try {
              const { error: nameTestError } = await supabase
                .from('profiles')
                .select('name')
                .limit(0);
                
              if (!nameTestError) {
                profileUpsertData.name = session.user.email?.split('@')[0] || 'User';
              }
            } catch (e) {
              console.log('Name column not available for upsert');
            }
            
            const { data: upsertProfile, error: upsertError } = await supabase
              .from('profiles')
              .upsert(profileUpsertData, {
                onConflict: 'id'
              })
              .select()
              .single();

            console.log('Upsert result:', { upsertProfile, upsertError });
              
            if (upsertError) {
              console.error('Both insert and upsert failed');
              console.error('Insert error:', {
                error: createError,
                message: createError?.message,
                details: createError?.details,
                hint: createError?.hint,
                code: createError?.code,
                status: createError?.status
              });
              console.error('Upsert error:', {
                error: upsertError,
                message: upsertError?.message,
                details: upsertError?.details,
                hint: upsertError?.hint,
                code: upsertError?.code,
                status: upsertError?.status
              });

              // Check if this is an RLS policy issue
              console.log('Checking if this might be an RLS policy issue...');
              console.log('Current user authentication state:', {
                isAuthenticated: !!session?.user,
                userId: session?.user?.id,
                userAud: session?.user?.aud,
                accessToken: !!session?.access_token
              });

              // Set a default profile to allow the app to continue working
              console.log('Setting default profile as fallback...');
              setProfile({ 
                id: session.user.id,
                name: session.user.email?.split('@')[0] || 'User', 
                business_name: 'My Business' 
              });
            } else {
              console.log('Profile created via upsert successfully:', upsertProfile);
              setProfile(upsertProfile);
            }
          } else {
            console.log('Profile created via insert successfully:', newProfile);
            setProfile(newProfile);
          }
        } else if (profileError) {
          console.error('Error fetching profile:', {
            error: profileError,
            message: profileError.message,
            details: profileError.details,
            hint: profileError.hint,
            code: profileError.code
          });
          // Set a default profile to allow the app to continue working
          setProfile({ 
            id: session.user.id,
            name: session.user.email?.split('@')[0] || 'User', 
            business_name: 'My Business' 
          });
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
        
        // Try to create profile with flexible schema handling
        const profileData = {
          id: user.id,
          business_name: profile.business_name || 'My Business'
        };
        
        // Only add name field if we can confirm it exists in the schema
        try {
          // Test if name column exists by trying a small operation first
          const { error: schemaTestError } = await supabase
            .from('profiles')
            .select('name')
            .limit(0);
            
          if (!schemaTestError) {
            // Name column exists, safe to include it
            profileData.name = user.email?.split('@')[0] || 'User';
          }
        } catch (e) {
          console.log('Name column not available, creating profile without it');
        }

        const { error: createProfileError } = await supabase
          .from('profiles')
          .insert(profileData);

        if (createProfileError) {
          console.error('Profile creation failed:', createProfileError);
          
          // If profile creation fails, try to proceed anyway
          // The user might already have a profile but the check failed
          console.log('Attempting to continue invoice creation despite profile creation failure...');
        } else {
          console.log('Profile created successfully');
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
        currency: invoiceForm.currency, // Use selected currency
        status: 'draft', // Try original common status
        due_date: invoiceForm.due_date || defaultDueDate.toISOString().split('T')[0]
      };

      console.log('Creating invoice with data:', invoiceData);

      const { data, error } = await supabase
        .from('invoices')
        .insert(invoiceData)
        .select();

      if (error) {
        console.error('Invoice creation error:', error);
        console.error('Error details:', JSON.stringify(error, null, 2));
        console.error('Invoice data that failed:', JSON.stringify(invoiceData, null, 2));
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
        currency: getDefaultCurrency(),
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

  // Download invoice as PDF
  const handleDownloadPDF = async (invoice) => {
    setProcessingPDF(true);
    setPdfInvoiceId(invoice.id);
    setMessage('');
    
    try {
      const result = await downloadInvoicePDF(invoice, profile);
      if (result.success) {
        setMessage(`✅ Invoice PDF downloaded successfully: ${result.filename}`);
        setIsError(false);
      } else {
        throw new Error(result.error || 'Failed to generate PDF');
      }
    } catch (error) {
      console.error('PDF generation error:', error);
      setMessage(`❌ Failed to generate PDF: ${error.message}`);
      setIsError(true);
    } finally {
      setProcessingPDF(false);
      setPdfInvoiceId(null);
    }
  };

  // Preview invoice as PDF
  const handlePreviewPDF = async (invoice) => {
    setProcessingPDF(true);
    setPdfInvoiceId(invoice.id);
    setMessage('');
    
    try {
      const result = await previewInvoicePDF(invoice, profile);
      if (result.success) {
        setMessage('✅ Invoice PDF preview opened in new tab');
        setIsError(false);
      } else {
        throw new Error(result.error || 'Failed to preview PDF');
      }
    } catch (error) {
      console.error('PDF preview error:', error);
      setMessage(`❌ Failed to preview PDF: ${error.message}`);
      setIsError(true);
    } finally {
      setProcessingPDF(false);
      setPdfInvoiceId(null);
    }
  };

  // Format date - using consistent formatting to prevent hydration mismatches
  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      // Use a more consistent format that won't vary by locale
      const options = {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        timeZone: 'UTC' // Use UTC to ensure consistency between server and client
      };
      return date.toLocaleDateString('en-US', options);
    } catch (error) {
      console.error('Date formatting error:', error);
      return dateString; // Fallback to original string
    }
  };

  // Client Management Functions
  const handleCreateClient = () => {
    setSelectedClient(null);
    setClientView('form');
  };

  const handleEditClient = (client) => {
    setSelectedClient(client);
    setClientView('form');
  };

  const handleSelectClient = (client) => {
    setSelectedClient(client);
    setClientView('profile');
  };

  const handleClientFormSubmit = async (formData) => {
    if (!user) return;

    setClientFormLoading(true);
    try {
      // Don't include userId - server gets it from JWT token authentication
      if (selectedClient) {
        // Update existing client
        await clientService.updateClient(selectedClient.id, formData);
        setMessage('✅ Client updated successfully!');
      } else {
        // Create new client
        await clientService.createClient(formData);
        setMessage('✅ Client created successfully!');
      }

      setIsError(false);
      // Refresh the list and return to list view
      setClientRefreshTrigger(prev => prev + 1);
      setClientView('list');
      setSelectedClient(null);
    } catch (error) {
      setMessage(`❌ Error ${selectedClient ? 'updating' : 'creating'} client: ${error.message}`);
      setIsError(true);
    } finally {
      setClientFormLoading(false);
    }
  };

  const handleClientFormCancel = () => {
    setClientView('list');
    setSelectedClient(null);
  };

  const handleClientProfileClose = () => {
    setClientView('list');
    setSelectedClient(null);
  };

  const handleDeleteClient = () => {
    // Refresh the list after deletion
    setClientRefreshTrigger(prev => prev + 1);
    setMessage('✅ Client deleted successfully!');
    setIsError(false);
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
                onClick={() => setActiveTab('clients')}
                className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'clients'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                👥 Clients
              </button>
              <Link 
                href="/dashboard/templates"
                className="py-4 px-2 border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300 font-medium text-sm transition-colors"
              >
                🎨 Templates
              </Link>
              <Link 
                href="/dashboard/notes"
                className="py-4 px-2 border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300 font-medium text-sm transition-colors"
              >
                📝 Notes
              </Link>
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
          </div>          <div className="p-6">
            {/* Invoices Tab */}
            {activeTab === 'invoices' && (
              <AdvancedInvoiceManager
                user={user}
                profile={profile}
                onMessage={(msg, isError = false) => {
                  setMessage(msg);
                  setIsError(isError);
                }}
                onRefreshInvoices={() => fetchInvoices(user?.id)}
              />
            )}

            {/* Clients Tab */}
            {activeTab === 'clients' && (
              <div className="space-y-6">
                {clientView === 'list' && (
                  <>
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                          Client Management
                        </h2>
                        <p className="text-gray-600 dark:text-gray-300 text-sm">
                          Manage your client relationships and information
                        </p>
                      </div>
                      <Button 
                        onClick={handleCreateClient}
                        className="payrush-gradient text-white hover:scale-105 transition-transform"
                      >
                        ➕ Add New Client
                      </Button>
                    </div>

                    <ClientList
                      userId={user?.id}
                      onSelectClient={handleSelectClient}
                      onEditClient={handleEditClient}
                      onDeleteClient={handleDeleteClient}
                      refreshTrigger={clientRefreshTrigger}
                    />
                  </>
                )}

                {clientView === 'form' && (
                  <div>
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                          {selectedClient ? 'Edit Client' : 'Create New Client'}
                        </h2>
                        <p className="text-gray-600 dark:text-gray-300 text-sm">
                          {selectedClient 
                            ? 'Update client information and settings'
                            : 'Add a new client to your system'
                          }
                        </p>
                      </div>
                      <Button 
                        onClick={() => setClientView('list')}
                        variant="outline"
                      >
                        ← Back to List
                      </Button>
                    </div>
                    
                    <ClientForm
                      client={selectedClient}
                      onSubmit={handleClientFormSubmit}
                      onCancel={handleClientFormCancel}
                      isLoading={clientFormLoading}
                    />
                  </div>
                )}

                {clientView === 'profile' && selectedClient && (
                  <ClientProfile
                    client={selectedClient}
                    onEdit={handleEditClient}
                    onClose={handleClientProfileClose}
                  />
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