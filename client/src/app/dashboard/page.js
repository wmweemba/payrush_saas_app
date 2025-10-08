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
import AdvancedInvoiceManager from "@/components/invoices/AdvancedInvoiceManager";
import DashboardLayout from "@/components/layout/DashboardLayout";

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
      // Use the template selected for this invoice
      const templateId = invoice.template_id || null;
      const result = await downloadInvoicePDF(invoice, profile, templateId);
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
      // Use the template selected for this invoice
      const templateId = invoice.template_id || null;
      const result = await previewInvoicePDF(invoice, profile, templateId);
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
    <DashboardLayout 
      currentTab="invoices"
      user={user}
      profile={profile}
      onSignOut={handleSignOut}
    >
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

      {/* Dashboard Content Based on Active Tab */}
      <div className="space-y-8">
        {/* Main Invoices Interface */}
        <AdvancedInvoiceManager
          user={user}
          profile={profile}
          onMessage={(msg, isError = false) => {
            setMessage(msg);
            setIsError(isError);
          }}
          onRefreshInvoices={() => fetchInvoices(user?.id)}
        />
      </div>      {/* Message Display */}
      {message && (
        <div className={`p-4 rounded-lg text-sm ${
          isError 
            ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800' 
            : 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800'
        }`}>
          {message}
        </div>
      )}
    </DashboardLayout>
  );
}