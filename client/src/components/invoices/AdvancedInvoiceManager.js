/**
 * Advanced Invoice Management Component
 * Integrates search, filtering, and results display with the existing dashboard
 */

import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import InvoiceSearchInterface from './InvoiceSearchInterface';
import EnhancedInvoiceSearchResults from './EnhancedInvoiceSearchResults';
import InvoiceSearchStats from './InvoiceSearchStats';
import EnhancedInvoiceForm from './EnhancedInvoiceForm';
import { downloadInvoicePDF, previewInvoicePDF } from '@/lib/pdf/invoicePDF';
import { supabase } from '@/lib/supabaseClient';
import { apiClient, API_BASE_URL } from '@/lib/apiConfig';

const AdvancedInvoiceManager = ({ 
  user, 
  profile, 
  onMessage, 
  onRefreshInvoices 
}) => {
  // Search state
  const [searchResults, setSearchResults] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [currentSearchParams, setCurrentSearchParams] = useState({});
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Invoice form state
  const [showInvoiceForm, setShowInvoiceForm] = useState(false);

  // Payment dialog state
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [currentInvoice, setCurrentInvoice] = useState(null);

  // Action loading state
  const [actionLoading, setActionLoading] = useState({});

  // Active tab
  const [activeTab, setActiveTab] = useState('search');

  // Check if a specific action is loading for an invoice
  const isActionLoading = (invoiceId, action) => {
    return actionLoading[`${invoiceId}-${action}`] || false;
  };

  // Set loading state for a specific action on an invoice
  const setLoading = (invoiceId, action, loading) => {
    const key = `${invoiceId}-${action}`;
    setActionLoading(prev => ({
      ...prev,
      [key]: loading
    }));
  };

  // Load initial results (recent invoices)
  useEffect(() => {
    if (user && user.id) {
      handleSearch({
        sortBy: 'created_at',
        sortOrder: 'desc',
        limit: 10,
        page: 1
      });
    }
  }, [user?.id]);

  // Perform search
  const handleSearch = async (searchParams) => {
    if (!user || !user.id) {
      console.log('User not ready for search');
      return;
    }

    try {
      setSearchLoading(true);
      setCurrentSearchParams(searchParams);
      
      // Handle quick filter presets
      if (searchParams.preset) {
        const data = await apiClient(`/api/invoices/search/quick/${searchParams.preset}`);
        setSearchResults(data.data);
        return;
      }

      // Regular search
      const data = await apiClient('/api/invoices/search', {
        method: 'POST',
        body: JSON.stringify({
          ...searchParams,
          page: searchParams.page || 1,
          limit: searchParams.limit || 10
        })
      });

      setSearchResults(data.data);
    } catch (error) {
      console.error('Search error:', error);
      // Only show error message if it's a real error, not just empty results
      if (error.message !== 'No results found') {
        onMessage(`Search failed: ${error.message}`, true);
      }
    } finally {
      setSearchLoading(false);
    }
  };

  // Handle page change
  const handlePageChange = (page) => {
    handleSearch({
      ...currentSearchParams,
      page
    });
  };

  // Clear filters and show all invoices
  const handleClearFilters = () => {
    const defaultParams = {
      sortBy: 'created_at',
      sortOrder: 'desc',
      limit: 10,
      page: 1
    };
    setCurrentSearchParams(defaultParams);
    handleSearch(defaultParams);
  };

  // Handle invoice actions
  const handleInvoiceAction = async (action, invoice) => {
    // Set loading state for non-dialog actions
    if (action !== 'markPaid' && action !== 'view' && action !== 'edit') {
      setLoading(invoice.id, action, true);
    }

    try {
      switch (action) {
        case 'markPaid':
          await handleMarkAsPaid(invoice);
          break;
        case 'send':
          await handleSendInvoiceEmail(invoice);
          break;
        case 'cancel':
          await updateInvoiceStatus(invoice.id, 'Cancelled');
          break;
        case 'edit':
          onMessage('Edit functionality coming soon!', false);
          break;
        case 'view':
          // Open public invoice view
          const publicUrl = `${window.location.origin}/invoice/${invoice.id}`;
          window.open(publicUrl, '_blank');
          break;
        case 'download':
          await handleDownloadPDF(invoice);
          break;
        case 'submitApproval':
          await handleSubmitForApproval(invoice);
          break;
        default:
          console.warn('Unknown action:', action);
      }
    } catch (error) {
      console.error('Invoice action error:', error);
      onMessage(`Failed to ${action} invoice: ${error.message}`, true);
    } finally {
      // Clear loading state for non-dialog actions
      if (action !== 'markPaid' && action !== 'view' && action !== 'edit') {
        setLoading(invoice.id, action, false);
      }
    }
  };

  // Payment processing
  // Send invoice via email (Server-Side PDF Generation - Clean & Simple)
  const handleSendInvoiceEmail = async (invoice) => {
    try {
      console.log('🚀 Starting handleSendInvoiceEmail with:', {
        invoiceId: invoice?.id,
        hasUser: !!user,
        hasProfile: !!profile,
        userId: user?.id
      });
      
      onMessage('📧 Sending invoice email with PDF attachment...', false);
      
      // Simple, clean approach - let server handle PDF generation
      const response = await apiClient(`/api/invoice-email/send/${invoice.id}`, {
        method: 'POST',
        body: JSON.stringify({
          includePdf: true, // Server will generate PDF
          customMessage: '' // Optional custom message
        })
      });

      if (response.success) {
        const attachmentText = response.data.pdfAttached ? ' with PDF attachment' : '';
        onMessage(`✅ Invoice sent successfully${attachmentText} to ${invoice.customer_email}!`, false);
        // Refresh invoices to update status
        setRefreshTrigger(prev => prev + 1);
        if (onRefreshInvoices) onRefreshInvoices();
      } else {
        throw new Error(response.error || 'Failed to send email');
      }
    } catch (error) {
      console.error('❌ EMAIL FUNCTION ERROR:', error);
      console.error('❌ ERROR STACK:', error.stack);
      onMessage(`❌ Failed to send invoice: ${error.message}`, true);
      throw error;
    }
  };

  // Update invoice status
  const updateInvoiceStatus = async (invoiceId, newStatus, paymentDetails = {}) => {
    try {
      // Map status to match updated database constraint
      // Updated constraint now allows: 'draft', 'sent', 'paid', 'overdue', 'cancelled'
      const statusMapping = {
        'Paid': 'paid',
        'Sent': 'sent', 
        'Cancelled': 'cancelled', // Now allowed by updated constraint!
        'Overdue': 'overdue',
        'Pending': 'draft'
      };
      
      const approvalStatusMapping = {
        'Paid': 'draft',
        'Sent': 'draft',
        'Cancelled': 'cancelled',
        'Overdue': 'draft',
        'Pending': 'draft'
      };
      
      const dbStatus = statusMapping[newStatus] || newStatus.toLowerCase();
      const dbApprovalStatus = approvalStatusMapping[newStatus] || 'draft';
      
      // Prepare update data
      const updateData = { 
        status: dbStatus,
        approval_status: dbApprovalStatus
      };
      
      // Add payment tracking fields when marking as paid
      if (newStatus === 'Paid') {
        updateData.paid_at = new Date().toISOString();
        updateData.payment_method = paymentDetails.method || 'manual';
        updateData.payment_reference = paymentDetails.reference || null;
        updateData.payment_notes = paymentDetails.notes || null;
      }
      
      // Add sent_at timestamp when marking as sent
      if (newStatus === 'Sent') {
        updateData.sent_at = new Date().toISOString();
      }
      
      const { error } = await supabase
        .from('invoices')
        .update(updateData)
        .eq('id', invoiceId)
        .eq('user_id', user.id);

      if (error) {
        throw new Error(error.message);
      }

      onMessage(`✅ Invoice marked as ${newStatus}`, false);
      
      // Refresh search results to show updated status
      handleSearch(currentSearchParams);
      
      // Also refresh the main invoice list if callback provided
      if (onRefreshInvoices) {
        onRefreshInvoices();
      }
    } catch (error) {
      console.error('Status update error:', error);
      throw error;
    }
  };

  // Download PDF
  const handleDownloadPDF = async (invoice) => {
    try {
      // Fetch full invoice data with line items for PDF generation
      const { data: fullInvoice, error } = await supabase
        .from('invoices')
        .select(`
          *,
          invoice_items (
            id,
            description,
            quantity,
            unit_price,
            line_total,
            sort_order
          )
        `)
        .eq('id', invoice.id)
        .eq('user_id', user.id)
        .single();

      if (error) {
        throw new Error(`Failed to fetch invoice data: ${error.message}`);
      }

      // Transform invoice_items to line_items for PDF compatibility
      if (fullInvoice.invoice_items && fullInvoice.invoice_items.length > 0) {
        fullInvoice.line_items = fullInvoice.invoice_items.map(item => ({
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total: item.line_total
        }));
      }

      // Use the template selected for this invoice
      const templateId = fullInvoice.template_id || null;
      const result = await downloadInvoicePDF(fullInvoice, profile, templateId);
      if (result.success) {
        onMessage(`✅ Invoice PDF downloaded successfully: ${result.filename}`, false);
      } else {
        throw new Error(result.error || 'Failed to generate PDF');
      }
    } catch (error) {
      console.error('PDF generation error:', error);
      throw error;
    }
  };

  // Handle marking invoice as paid with payment details
  const handleMarkAsPaid = async (invoice) => {
    setCurrentInvoice(invoice);
    setShowPaymentDialog(true);
  };

  // Process payment with collected details
  const handleProcessPayment = async (paymentDetails) => {
    try {
      setLoading(currentInvoice.id, 'markPaid', true);
      
      console.log('💳 Marking invoice as paid with details:', paymentDetails);
      
      // Use new mark-paid API endpoint
      const response = await apiClient(`/api/invoices/${currentInvoice.id}/mark-paid`, {
        method: 'PUT',
        body: JSON.stringify({
          payment_method: paymentDetails.method || 'bank_transfer',
          payment_notes: paymentDetails.notes || 'Marked as paid manually',
          payment_date: paymentDetails.date || null
        })
      });

      if (response.success) {
        const invoiceNumber = currentInvoice.custom_invoice_number || 
                            currentInvoice.invoice_number || 
                            `INV-${currentInvoice.id.slice(0, 8)}`;
        
        onMessage(`✅ Invoice ${invoiceNumber} marked as paid successfully!`, false);
        
        // Try to send payment confirmation email (non-blocking)
        try {
          await apiClient(`/api/invoice-email/confirm-payment/${currentInvoice.id}`, {
            method: 'POST',
            body: JSON.stringify({
              paymentDetails: {
                method: paymentDetails.method,
                date: paymentDetails.date || new Date().toISOString(),
                notes: paymentDetails.notes
              }
            })
          });
          console.log('✅ Payment confirmation email sent');
        } catch (emailError) {
          console.warn('⚠️ Payment confirmation email failed (non-critical):', emailError.message);
        }
        
        // Refresh search results
        if (currentSearchParams) {
          await handleSearch(currentSearchParams);
        }
        
        // Refresh parent invoices if callback provided
        if (onRefreshInvoices) {
          onRefreshInvoices();
        }
      } else {
        throw new Error(response.error || 'Failed to mark invoice as paid');
      }
      
      // Close dialog
      setShowPaymentDialog(false);
      setCurrentInvoice(null);
      
    } catch (error) {
      console.error('Error marking invoice as paid:', error);
      onMessage(`❌ Failed to mark invoice as paid: ${error.message}`, true);
    } finally {
      setLoading(currentInvoice.id, 'markPaid', false);
    }
  };

  // Submit invoice for approval
  const handleSubmitForApproval = async (invoice) => {
    try {
      // First, get user's workflows to select from
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('No authentication token found');
      }

      // Fetch available workflows
      const workflowsResponse = await fetch(`${API_BASE_URL}/api/approvals/workflows`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!workflowsResponse.ok) {
        throw new Error('Failed to fetch approval workflows');
      }

      const workflowsResult = await workflowsResponse.json();
      const workflows = workflowsResult.data || [];

      if (workflows.length === 0) {
        onMessage('❌ No approval workflows found. Please create an approval workflow first.', true);
        return;
      }

      // For now, use the first active workflow
      // In a real implementation, you'd show a dialog to select workflow
      const activeWorkflow = workflows.find(w => w.is_active) || workflows[0];

      // Submit for approval
      const approvalResponse = await fetch(`${API_BASE_URL}/api/approvals/invoices/${invoice.id}/submit`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          workflow_id: activeWorkflow.id,
          notes: `Invoice submitted for approval via workflow: ${activeWorkflow.workflow_name || activeWorkflow.name}`
        })
      });

      if (!approvalResponse.ok) {
        const errorData = await approvalResponse.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to submit invoice for approval');
      }

      const approvalResult = await approvalResponse.json();
      
      onMessage(`✅ Invoice submitted for approval using workflow: ${activeWorkflow.workflow_name || activeWorkflow.name}`, false);
      
      // Refresh search results to show updated status
      handleSearch(currentSearchParams);
      
      // Also refresh the main invoice list if callback provided
      if (onRefreshInvoices) {
        onRefreshInvoices();
      }
    } catch (error) {
      console.error('Approval submission error:', error);
      throw error;
    }
  };

  // Handle bulk actions
  const handleBulkAction = async (action, data) => {
    try {
      const invoiceIds = data.invoices.map(invoice => invoice.id);
      
      // Handle bulk action initiation
      switch (action) {
        case 'updateStatus':
          await handleBulkStatusUpdate(invoiceIds, data.status);
          break;
        case 'delete':
          await handleBulkDelete(invoiceIds);
          break;
        case 'export':
          await handleBulkExport(invoiceIds, data);
          break;
        case 'sendEmail':
          await handleBulkEmail(invoiceIds, data);
          break;
        default:
          throw new Error(`Unknown bulk action: ${action}`);
      }

      // Refresh search results after bulk action (except for email notifications)
      if (action !== 'sendEmail') {
        handleSearch(currentSearchParams);
        onMessage(`✅ Bulk ${action} completed successfully for ${invoiceIds.length} invoice(s)`, false);
      }
      // Email success message is handled within handleBulkEmail function
    } catch (error) {
      console.error('Bulk action error:', error);
      onMessage(`❌ Bulk ${action} failed: ${error.message}`, true);
    }
  };

  // Bulk status update
  const handleBulkStatusUpdate = async (invoiceIds, status) => {
    const response = await apiClient('/api/invoices/bulk/status', {
      method: 'POST',
      body: JSON.stringify({ invoiceIds, status })
    });

    if (!response.success) {
      throw new Error(response.error || 'Failed to update status');
    }
  };

  // Bulk delete
  const handleBulkDelete = async (invoiceIds) => {
    const response = await apiClient('/api/invoices/bulk/delete', {
      method: 'POST',
      body: JSON.stringify({ invoiceIds })
    });

    if (!response.success) {
      throw new Error(response.error || 'Failed to delete invoices');
    }
  };

  // Bulk export
  const handleBulkExport = async (invoiceIds, data) => {
    if (data.format === 'pdf') {
      // For PDF export, use client-side PDF generation like individual downloads
      await handleBulkPDFExport(invoiceIds, data);
      return;
    }

    // For other formats (CSV, Excel), use server-side generation
    const response = await apiClient('/api/invoices/bulk/export', {
      method: 'POST',
      body: JSON.stringify({ 
        invoiceIds, 
        format: data.format,
        includeLineItems: data.includeLineItems,
        includePayments: data.includePayments
      })
    });

    if (!response.success) {
      throw new Error(response.error || 'Failed to export invoices');
    }

    // Handle CSV and Excel formats
    if (data.format === 'csv' && response.isCsv) {
      // Create CSV download
      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `invoice_export_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      onMessage(`📊 CSV export completed for ${invoiceIds.length} invoices`, false);
    } else if (data.format === 'excel' && response.isExcel) {
      // Create Excel download
      const url = window.URL.createObjectURL(response.data);
      const link = document.createElement('a');
      link.href = url;
      link.download = `invoice_export_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      onMessage(`📊 Excel export completed for ${invoiceIds.length} invoices`, false);
    } else {
      // For other formats, process response
      onMessage(`📊 Export prepared: ${response.data?.count || invoiceIds.length} invoices ready for ${data.format.toUpperCase()}`, false);
    }
  };

  // Handle bulk PDF export using client-side PDF generation
  const handleBulkPDFExport = async (invoiceIds, data) => {
    try {
      onMessage(`📊 Generating PDFs for ${invoiceIds.length} invoices...`, false);
      
      // First, fetch the invoice data for all selected invoices with line items
      const invoicePromises = invoiceIds.map(async (invoiceId) => {
        try {
          // Fetch invoice with line items
          const { data: invoice, error } = await supabase
            .from('invoices')
            .select(`
              *,
              invoice_items (
                id,
                description,
                quantity,
                unit_price,
                line_total,
                sort_order
              )
            `)
            .eq('id', invoiceId)
            .eq('user_id', user.id)
            .single();
          
          if (error) {
            console.warn(`Failed to fetch invoice ${invoiceId}:`, error);
            return null;
          }
          
          // Transform invoice_items to line_items for PDF compatibility
          if (invoice.invoice_items && invoice.invoice_items.length > 0) {
            invoice.line_items = invoice.invoice_items.map(item => ({
              description: item.description,
              quantity: item.quantity,
              unit_price: item.unit_price,
              total: item.line_total
            }));
          }
          
          return invoice;
        } catch (error) {
          console.warn(`Error fetching invoice ${invoiceId}:`, error);
          return null;
        }
      });

      const invoices = (await Promise.all(invoicePromises)).filter(Boolean);
      
      if (invoices.length === 0) {
        throw new Error('Failed to fetch invoice data');
      }

      // Generate PDFs for all invoices
      const pdfPromises = invoices.map(async (invoice, index) => {
        try {
          const templateId = invoice.template_id || null;
          const result = await downloadInvoicePDF(invoice, profile, templateId);
          
          if (result.success) {
            return {
              success: true,
              filename: result.filename,
              invoice: invoice
            };
          } else {
            throw new Error(result.error || 'Failed to generate PDF');
          }
        } catch (error) {
          console.warn(`Failed to generate PDF for invoice ${invoice.id}:`, error);
          return {
            success: false,
            error: error.message,
            invoice: invoice
          };
        }
      });

      const results = await Promise.all(pdfPromises);
      const successful = results.filter(r => r.success);
      const failed = results.filter(r => !r.success);

      if (successful.length > 0) {
        onMessage(`📊 Generated ${successful.length} PDF(s) successfully${failed.length > 0 ? `, ${failed.length} failed` : ''}`, false);
      } else {
        throw new Error('Failed to generate any PDFs');
      }

    } catch (error) {
      console.error('Bulk PDF export error:', error);
      throw new Error(`Bulk PDF export failed: ${error.message}`);
    }
  };

  // Bulk email
  const handleBulkEmail = async (invoiceIds, data = {}) => {
    try {
      onMessage(`📧 Generating PDFs and sending emails to ${invoiceIds.length} invoice(s)...`, false);
      
      let successCount = 0;
      let failureCount = 0;
      const errors = [];

      // Send emails for each invoice (server handles PDF generation)
      for (const invoiceId of invoiceIds) {
        try {

          const response = await apiClient(`/api/invoice-email/send/${invoiceId}`, {
            method: 'POST',
            body: JSON.stringify({
              includePdf: data.includePdf !== false, // Default to true unless explicitly false
              customMessage: data.customMessage || ''
            })
          });

          if (response.success) {
            successCount++;
          } else {
            throw new Error(response.error || 'Failed to send email');
          }
        } catch (error) {
          failureCount++;
          errors.push(`Invoice ${invoiceId}: ${error.message}`);
          console.error(`Failed to send email for invoice ${invoiceId}:`, error);
        }
      }

      // Show results
      if (successCount > 0 && failureCount === 0) {
        const attachmentText = data.includePdf ? ' with PDF attachments' : '';
        onMessage(`✅ Successfully sent ${successCount} email(s)${attachmentText}!`, false);
      } else if (successCount > 0 && failureCount > 0) {
        onMessage(`⚠️ Sent ${successCount} email(s), ${failureCount} failed. Check console for details.`, true);
        console.error('Email sending errors:', errors);
      } else {
        throw new Error(`Failed to send all ${failureCount} email(s). ${errors.join('; ')}`);
      }

      // Refresh invoices to update statuses
      setRefreshTrigger(prev => prev + 1);
      if (onRefreshInvoices) onRefreshInvoices();

    } catch (error) {
      console.error('Bulk email error:', error);
      onMessage(`❌ Failed to send emails: ${error.message}`, true);
      throw error;
    }
  };

  // Handle invoice form actions
  const handleCreateInvoice = () => {
    setShowInvoiceForm(true);
  };

  const handleInvoiceFormSuccess = (newInvoice) => {
    setShowInvoiceForm(false);
    onMessage('✅ Invoice created successfully!', false);
    // Trigger a refresh of search results
    setRefreshTrigger(prev => prev + 1);
    if (onRefreshInvoices) {
      onRefreshInvoices();
    }
  };

  const handleInvoiceFormCancel = () => {
    setShowInvoiceForm(false);
  };

  // Show invoice form if requested
  if (showInvoiceForm) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Create New Invoice
            </h2>
            <p className="text-gray-600 dark:text-gray-300 text-sm">
              Fill in the details below to create a new invoice
            </p>
          </div>
          <Button
            onClick={handleInvoiceFormCancel}
            variant="outline"
            className="bg-white dark:bg-slate-700 border-gray-300 dark:border-gray-600"
          >
            ← Back to Invoices
          </Button>
        </div>

        {/* Invoice Form */}
        <EnhancedInvoiceForm
          onSuccess={handleInvoiceFormSuccess}
          onCancel={handleInvoiceFormCancel}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Simple Style like other tabs */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Your Invoices
          </h2>
          <p className="text-gray-600 dark:text-gray-300 text-sm">
            Search, filter, and manage your invoices with advanced tools
          </p>
        </div>
        <div className="flex space-x-3">
          <Button
            onClick={() => {
              setRefreshTrigger(prev => prev + 1);
              // Refresh the current search results to get latest data
              handleSearch(currentSearchParams);
              // Also trigger parent refresh if available
              if (onRefreshInvoices) {
                onRefreshInvoices();
              }
              onMessage('🔄 Invoices refreshed', false);
            }}
            variant="outline"
            size="sm"
            disabled={searchLoading}
            className="bg-white dark:bg-slate-700 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-600"
          >
            {searchLoading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
            ) : (
              '🔄 Refresh'
            )}
          </Button>
          <Button 
            onClick={handleCreateInvoice}
            className="payrush-gradient text-white hover:scale-105 transition-transform"
          >
            ➕ New Invoice
          </Button>
        </div>
      </div>

      {/* Clean Search Interface - Match Clients page style */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <InvoiceSearchInterface
          onSearch={handleSearch}
          onClearFilters={handleClearFilters}
          loading={searchLoading}
          totalResults={searchResults?.total || 0}
          currentFilters={currentSearchParams}
        />
      </div>

      {/* Results Section */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-white dark:bg-slate-700 border border-gray-300 dark:border-gray-600">
          <TabsTrigger 
            value="search" 
            className="data-[state=active]:bg-blue-50 dark:data-[state=active]:bg-blue-900/30 data-[state=active]:text-blue-700 dark:data-[state=active]:text-blue-300 text-gray-700 dark:text-gray-300"
          >
            📊 Results ({searchResults?.total || 0})
          </TabsTrigger>
          <TabsTrigger 
            value="analytics"
            className="data-[state=active]:bg-blue-50 dark:data-[state=active]:bg-blue-900/30 data-[state=active]:text-blue-700 dark:data-[state=active]:text-blue-300 text-gray-700 dark:text-gray-300"
          >
            📈 Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="search" className="space-y-6 mt-6">
          <EnhancedInvoiceSearchResults
            results={searchResults}
            loading={searchLoading}
            onPageChange={handlePageChange}
            onInvoiceAction={handleInvoiceAction}
            onBulkAction={handleBulkAction}
            currentPage={searchResults?.page || 1}
          />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6 mt-6">
          <InvoiceSearchStats
            searchParams={currentSearchParams}
            refreshTrigger={refreshTrigger}
          />
        </TabsContent>
      </Tabs>

      {/* Payment Details Dialog */}
      <PaymentDetailsDialog
        open={showPaymentDialog}
        onOpenChange={setShowPaymentDialog}
        invoice={currentInvoice}
        onConfirm={handleProcessPayment}
        loading={currentInvoice ? isActionLoading(currentInvoice.id, 'markPaid') : false}
      />
    </div>
  );
};

// Payment Details Dialog Component
const PaymentDetailsDialog = ({ open, onOpenChange, invoice, onConfirm, loading }) => {
  const [paymentDetails, setPaymentDetails] = useState({
    method: 'bank_transfer',
    reference: '',
    notes: '',
    date: '' // Add payment date field
  });

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (open) {
      setPaymentDetails({
        method: 'bank_transfer',
        reference: '',
        notes: '',
        date: new Date().toISOString().split('T')[0] // Default to today
      });
    }
  }, [open]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onConfirm(paymentDetails);
  };

  // Payment methods matching backend constraints
  const paymentMethods = [
    { value: 'bank_transfer', label: '🏦 Bank Transfer' },
    { value: 'cash', label: '💵 Cash Payment' },
    { value: 'mobile_money', label: '📱 Mobile Money' },
    { value: 'card', label: '💳 Credit/Debit Card' },
    { value: 'flutterwave', label: '🌊 Flutterwave Payment' },
    { value: 'stripe', label: '💙 Stripe Payment' },
    { value: 'paypal', label: '🅿️ PayPal' },
    { value: 'other', label: '📋 Other Method' }
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Mark Invoice as Paid</DialogTitle>
          {invoice && (
            <p className="text-sm text-gray-500">
              Invoice: {invoice.custom_invoice_number || invoice.invoice_number || `#${invoice.id?.slice(0, 8)}`}
              <br />
              Amount: ${parseFloat(invoice.amount || 0).toFixed(2)} {invoice.currency || 'USD'}
            </p>
          )}
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="payment-method">Payment Method</Label>
            <Select
              value={paymentDetails.method}
              onValueChange={(value) => setPaymentDetails(prev => ({ ...prev, method: value }))}
            >
              <SelectTrigger id="payment-method">
                <SelectValue placeholder="Select payment method" />
              </SelectTrigger>
              <SelectContent>
                {paymentMethods.map(method => (
                  <SelectItem key={method.value} value={method.value}>
                    {method.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="payment-date">Payment Date</Label>
            <Input
              id="payment-date"
              type="date"
              value={paymentDetails.date}
              onChange={(e) => setPaymentDetails(prev => ({ ...prev, date: e.target.value }))}
              className="bg-white dark:bg-slate-700 border-gray-300 dark:border-gray-600"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="payment-reference">Payment Reference (Optional)</Label>
            <Input
              id="payment-reference"
              type="text"
              placeholder="Transaction ID, check number, etc."
              value={paymentDetails.reference}
              onChange={(e) => setPaymentDetails(prev => ({ ...prev, reference: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="payment-notes">Payment Notes (Optional)</Label>
            <Textarea
              id="payment-notes"
              placeholder="Additional notes about this payment..."
              value={paymentDetails.notes}
              onChange={(e) => setPaymentDetails(prev => ({ ...prev, notes: e.target.value }))}
              rows={3}
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-green-600 hover:bg-green-700"
            >
              {loading ? 'Processing...' : '✅ Mark as Paid'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AdvancedInvoiceManager;