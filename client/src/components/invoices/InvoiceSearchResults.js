/**
 * Invoice Search Results Component
 * Displays paginated search results with sorting and action buttons
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { formatCurrency } from '@/lib/currency/currencies';

const InvoiceSearchResults = ({ 
  results, 
  loading = false, 
  onPageChange, 
  onInvoiceAction,
  onSort,
  currentPage = 1 
}) => {
  const [actionLoading, setActionLoading] = useState({});

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-3"></div>
            <span className="text-gray-600 dark:text-gray-300">Searching invoices...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!results || !results.invoices || results.invoices.length === 0) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-slate-700 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No invoices found
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              Try adjusting your search criteria or filters
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Format date consistently
  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      const options = {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        timeZone: 'UTC'
      };
      return date.toLocaleDateString('en-US', options);
    } catch (error) {
      return dateString;
    }
  };

  // Get status badge style
  const getStatusBadgeStyle = (status) => {
    switch (status) {
      case 'Paid':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'Sent':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'Overdue':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      case 'Cancelled':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
      case 'Draft':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      default:
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
    }
  };

  // Handle invoice action with loading state
  const handleAction = async (action, invoice) => {
    setActionLoading(prev => ({ ...prev, [`${invoice.id}-${action}`]: true }));
    try {
      await onInvoiceAction(action, invoice);
    } finally {
      setActionLoading(prev => ({ ...prev, [`${invoice.id}-${action}`]: false }));
    }
  };

  // Check if action is loading
  const isActionLoading = (invoiceId, action) => {
    return actionLoading[`${invoiceId}-${action}`] || false;
  };

  // Render pagination
  const renderPagination = () => {
    if (results.totalPages <= 1) return null;

    const pages = [];
    const currentPage = results.page;
    const totalPages = results.totalPages;

    // Always show first page
    if (currentPage > 3) {
      pages.push(1);
      if (currentPage > 4) {
        pages.push('...');
      }
    }

    // Show pages around current page
    for (let i = Math.max(1, currentPage - 2); i <= Math.min(totalPages, currentPage + 2); i++) {
      pages.push(i);
    }

    // Always show last page
    if (currentPage < totalPages - 2) {
      if (currentPage < totalPages - 3) {
        pages.push('...');
      }
      pages.push(totalPages);
    }

    return (
      <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
          Showing {((currentPage - 1) * results.limit) + 1} to {Math.min(currentPage * results.limit, results.total)} of {results.total} results
        </div>
        <div className="flex items-center space-x-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={!results.hasPrevPage}
          >
            Previous
          </Button>
          {pages.map((page, index) => (
            <Button
              key={index}
              variant={page === currentPage ? "default" : "outline"}
              size="sm"
              onClick={() => typeof page === 'number' && onPageChange(page)}
              disabled={page === '...'}
              className="min-w-[2rem]"
            >
              {page}
            </Button>
          ))}
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={!results.hasNextPage}
          >
            Next
          </Button>
        </div>
      </div>
    );
  };

  return (
    <Card>
      <CardContent className="p-0">
        {/* Results Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Search Results
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {results.total} invoice{results.total !== 1 ? 's' : ''} found
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-xs text-gray-500">Page {results.page} of {results.totalPages}</span>
            </div>
          </div>
        </div>

        {/* Invoice List */}
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {results.invoices.map((invoice) => (
            <div key={invoice.id} className="p-4 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
              <div className="flex items-center justify-between">
                {/* Invoice Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-3 mb-2">
                    <h4 className="font-semibold text-gray-900 dark:text-white truncate">
                      {invoice.customer_name}
                    </h4>
                    <Badge className={getStatusBadgeStyle(invoice.status)}>
                      {invoice.status}
                    </Badge>
                    {/* Overdue indicator */}
                    {invoice.status !== 'Paid' && invoice.status !== 'Cancelled' && new Date(invoice.due_date) < new Date() && (
                      <Badge className="bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400">
                        Overdue
                      </Badge>
                    )}
                  </div>
                  
                  {invoice.customer_email && (
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-1 truncate">
                      {invoice.customer_email}
                    </p>
                  )}
                  
                  <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                    <span>Due: {formatDate(invoice.due_date)}</span>
                    <span>Created: {formatDate(invoice.created_at)}</span>
                    <span>ID: {invoice.id.slice(0, 8)}...</span>
                  </div>
                </div>

                {/* Amount and Actions */}
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <p className="text-xl font-bold text-gray-900 dark:text-white">
                      {formatCurrency(invoice.amount, invoice.currency)}
                    </p>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex space-x-1">
                    {/* Status-specific actions */}
                    {invoice.status === 'Draft' && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleAction('edit', invoice)}
                          disabled={isActionLoading(invoice.id, 'edit')}
                        >
                          ✏️ Edit
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleAction('send', invoice)}
                          disabled={isActionLoading(invoice.id, 'send')}
                          className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          {isActionLoading(invoice.id, 'send') ? 'Sending...' : '📧 Send'}
                        </Button>
                      </>
                    )}

                    {(invoice.status === 'Pending' || invoice.status === 'Sent' || invoice.status === 'Overdue') && (
                      <>
                        <Button
                          size="sm"
                          onClick={() => handleAction('pay', invoice)}
                          disabled={isActionLoading(invoice.id, 'pay')}
                          className="bg-orange-600 hover:bg-orange-700 text-white"
                        >
                          {isActionLoading(invoice.id, 'pay') ? 'Processing...' : '💳 Pay'}
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleAction('markPaid', invoice)}
                          disabled={isActionLoading(invoice.id, 'markPaid')}
                          className="bg-green-600 hover:bg-green-700 text-white"
                        >
                          {isActionLoading(invoice.id, 'markPaid') ? 'Updating...' : '✅ Mark Paid'}
                        </Button>
                      </>
                    )}

                    {/* Universal actions */}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleAction('view', invoice)}
                      disabled={isActionLoading(invoice.id, 'view')}
                    >
                      👁️ View
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleAction('download', invoice)}
                      disabled={isActionLoading(invoice.id, 'download')}
                    >
                      {isActionLoading(invoice.id, 'download') ? 'Generating...' : '📄 PDF'}
                    </Button>

                    {/* Delete/Cancel actions */}
                    {invoice.status !== 'Paid' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleAction('cancel', invoice)}
                        disabled={isActionLoading(invoice.id, 'cancel')}
                        className="text-red-600 border-red-600 hover:bg-red-50 dark:text-red-400 dark:border-red-400"
                      >
                        {isActionLoading(invoice.id, 'cancel') ? 'Cancelling...' : '❌'}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination */}
        {renderPagination()}
      </CardContent>
    </Card>
  );
};

export default InvoiceSearchResults;