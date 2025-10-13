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
import { useUserProfile } from "@/hooks/useUserProfile";

export default function Dashboard() {
  const router = useRouter();
  
  // Use the centralized user profile hook
  const { user, profile, loading: userLoading, error: userError } = useUserProfile();
  
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

  // Load invoices when user is available
  useEffect(() => {
    if (user?.id) {
      fetchInvoices(user.id);
    }
  }, [user?.id]);

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

  if (userLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading Dashboard...</p>
        </div>
      </div>
    );
  }

  if (userError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 dark:text-red-400 mb-4">
            <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm">{userError}</p>
          </div>
          <Button onClick={() => window.location.reload()} variant="outline">
            Retry
          </Button>
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