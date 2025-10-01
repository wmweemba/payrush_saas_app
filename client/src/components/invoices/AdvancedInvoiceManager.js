/**
 * Advanced Invoice Management Component
 * Integrates search, filtering, and results display with the existing dashboard
 */

import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import InvoiceSearchInterface from './InvoiceSearchInterface';
import EnhancedInvoiceSearchResults from './EnhancedInvoiceSearchResults';
import InvoiceSearchStats from './InvoiceSearchStats';
import { processPayment } from '@/lib/payments/flutterwave';
import { downloadInvoicePDF, previewInvoicePDF } from '@/lib/pdf/invoicePDF';
import { supabase } from '@/lib/supabaseClient';

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

  // Active tab
  const [activeTab, setActiveTab] = useState('search');

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
      
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      // Handle quick filter presets
      if (searchParams.preset) {
        const response = await fetch(`/api/invoices/search/quick/${searchParams.preset}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          setSearchResults(data.data);
        } else {
          const errorData = await response.json().catch(() => ({}));
          console.warn('Quick search response not ok:', response.status, errorData);
          // Don't throw error for 404 or no results
          if (response.status !== 404) {
            throw new Error(errorData.error || 'Quick search failed');
          }
        }
        return;
      }

      // Regular search
      const response = await fetch('/api/invoices/search', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...searchParams,
          page: searchParams.page || 1,
          limit: searchParams.limit || 10
        })
      });

      if (response.ok) {
        const data = await response.json();
        setSearchResults(data.data);
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.warn('Search response not ok:', response.status, errorData);
        // Don't throw error for 404 or no results
        if (response.status !== 404) {
          throw new Error(errorData.error || 'Search request failed');
        }
      }
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
    try {
      switch (action) {
        case 'pay':
          await handlePayNow(invoice);
          break;
        case 'markPaid':
          await updateInvoiceStatus(invoice.id, 'Paid');
          break;
        case 'send':
          await updateInvoiceStatus(invoice.id, 'Sent');
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
        default:
          console.warn('Unknown action:', action);
      }
    } catch (error) {
      console.error('Invoice action error:', error);
      onMessage(`Failed to ${action} invoice: ${error.message}`, true);
    }
  };

  // Payment processing
  const handlePayNow = async (invoice) => {
    try {
      await processPayment(
        invoice,
        // onSuccess callback
        () => {
          onMessage(`✅ Payment successful for invoice ${invoice.id}!`, false);
          // Refresh invoices to update status
          setRefreshTrigger(prev => prev + 1);
          if (onRefreshInvoices) onRefreshInvoices();
        },
        // onError callback
        (error) => {
          console.error('Payment error:', error);
          onMessage(`❌ Payment failed: ${error.message}`, true);
        }
      );
    } catch (error) {
      console.error('Payment processing error:', error);
      throw error;
    }
  };

  // Update invoice status
  const updateInvoiceStatus = async (invoiceId, newStatus) => {
    try {
      const { error } = await supabase
        .from('invoices')
        .update({ status: newStatus.toLowerCase() })
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
      const result = await downloadInvoicePDF(invoice, profile);
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

  // Handle bulk actions
  const handleBulkAction = async (action, data) => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const invoiceIds = data.invoices.map(invoice => invoice.id);
      
      switch (action) {
        case 'updateStatus':
          await handleBulkStatusUpdate(invoiceIds, data.status, token);
          break;
        case 'delete':
          await handleBulkDelete(invoiceIds, token);
          break;
        case 'export':
          await handleBulkExport(invoiceIds, data, token);
          break;
        case 'sendEmail':
          await handleBulkEmail(invoiceIds, data, token);
          break;
        default:
          throw new Error(`Unknown bulk action: ${action}`);
      }

      // Refresh search results after bulk action
      handleSearch(currentSearchParams);
      onMessage(`✅ Bulk ${action} completed successfully for ${invoiceIds.length} invoice(s)`, false);
    } catch (error) {
      console.error('Bulk action error:', error);
      onMessage(`❌ Bulk ${action} failed: ${error.message}`, true);
    }
  };

  // Bulk status update
  const handleBulkStatusUpdate = async (invoiceIds, status, token) => {
    const response = await fetch('/api/invoices/bulk/status', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ invoiceIds, status })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to update status');
    }
  };

  // Bulk delete
  const handleBulkDelete = async (invoiceIds, token) => {
    const response = await fetch('/api/invoices/bulk/delete', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ invoiceIds })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to delete invoices');
    }
  };

  // Bulk export
  const handleBulkExport = async (invoiceIds, data, token) => {
    const response = await fetch('/api/invoices/bulk/export', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        invoiceIds, 
        format: data.format,
        includeLineItems: data.includeLineItems,
        includePayments: data.includePayments
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to export invoices');
    }

    // Handle different export formats
    if (data.format === 'csv') {
      // For CSV, the response will be the file content
      const csvContent = await response.text();
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoices_export_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } else {
      // For other formats, process JSON response
      const result = await response.json();
      onMessage(`📊 Export prepared: ${result.data.count} invoices ready for ${data.format.toUpperCase()}`, false);
    }
  };

  // Bulk email
  const handleBulkEmail = async (invoiceIds, data, token) => {
    const { 
      template = 'invoice_sent',
      includeAttachment = true,
      priority = 'normal'
    } = data;

    const response = await fetch('/api/invoices/bulk/send-emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        invoiceIds,
        emailOptions: {
          template,
          includeAttachment,
          priority
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to send email notifications');
    }

    const result = await response.json();
    if (result.data.failed > 0) {
      onMessage(`📧 Sent ${result.data.sent} emails successfully, ${result.data.failed} failed`, false);
    } else {
      onMessage(`✅ Successfully sent ${result.data.sent} email notifications`, true);
    }
  };

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
            onClick={() => setRefreshTrigger(prev => prev + 1)}
            variant="outline"
            size="sm"
            className="bg-white dark:bg-slate-700 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-600"
          >
            🔄 Refresh
          </Button>
          <Button 
            onClick={() => {/* TODO: Add new invoice modal */}}
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
    </div>
  );
};

export default AdvancedInvoiceManager;