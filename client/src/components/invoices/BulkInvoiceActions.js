/**
 * Bulk Invoice Actions Component
 * Provides bulk operation controls and confirmation dialogs
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { formatCurrency } from '@/lib/currency/currencies';

const BulkInvoiceActions = ({ 
  selectedInvoices, 
  onBulkAction, 
  onClearSelection,
  loading = false 
}) => {
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  const [bulkActionData, setBulkActionData] = useState({});

  // Calculate totals for selected invoices
  const selectedTotal = selectedInvoices.reduce((sum, invoice) => sum + parseFloat(invoice.amount), 0);
  const statusCounts = selectedInvoices.reduce((counts, invoice) => {
    counts[invoice.status] = (counts[invoice.status] || 0) + 1;
    return counts;
  }, {});

  // Handle bulk action initiation
  const handleBulkAction = (action, additionalData = {}) => {
    setPendingAction(action);
    setBulkActionData(additionalData);
    setShowConfirmDialog(true);
  };

  // Confirm and execute bulk action
  const confirmBulkAction = async () => {
    if (!pendingAction) return;

    setShowConfirmDialog(false);
    
    try {
      await onBulkAction(pendingAction, {
        invoices: selectedInvoices,
        ...bulkActionData
      });
    } catch (error) {
      console.error('Bulk action failed:', error);
    } finally {
      setPendingAction(null);
      setBulkActionData({});
    }
  };

  // Cancel bulk action
  const cancelBulkAction = () => {
    setShowConfirmDialog(false);
    setPendingAction(null);
    setBulkActionData({});
  };

  // Get action confirmation message
  const getConfirmationMessage = () => {
    const count = selectedInvoices.length;
    const total = formatCurrency(selectedTotal, selectedInvoices[0]?.currency || 'USD');

    switch (pendingAction) {
      case 'updateStatus':
        return `Change status of ${count} invoice${count > 1 ? 's' : ''} to "${bulkActionData.status}"?`;
      case 'delete':
        return `Delete ${count} invoice${count > 1 ? 's' : ''} worth ${total}? This action can be undone.`;
      case 'export':
        return `Export ${count} invoice${count > 1 ? 's' : ''} as ${bulkActionData.format?.toUpperCase()}?`;
      case 'sendEmail':
        return `Send ${bulkActionData.template || 'invoice'} email notifications to ${count} customer${count > 1 ? 's' : ''}?`;
      default:
        return `Perform bulk action on ${count} invoice${count > 1 ? 's' : ''}?`;
    }
  };

  if (selectedInvoices.length === 0) {
    return null;
  }

  return (
    <>
      {/* Bulk Actions Bar */}
      <Card className="mb-4 border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/20">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg text-blue-900 dark:text-blue-100">
              Bulk Actions
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={onClearSelection}
              className="text-blue-700 border-blue-300 hover:bg-blue-100 dark:text-blue-300 dark:border-blue-600"
            >
              Clear Selection
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Selection Summary */}
          <div className="mb-4 p-3 bg-white dark:bg-slate-800 rounded-lg border">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium text-gray-900 dark:text-white">
                {selectedInvoices.length} invoice{selectedInvoices.length > 1 ? 's' : ''} selected
              </span>
              <span className="font-bold text-lg text-gray-900 dark:text-white">
                {formatCurrency(selectedTotal, selectedInvoices[0]?.currency || 'USD')}
              </span>
            </div>
            
            {/* Status breakdown */}
            <div className="flex flex-wrap gap-2">
              {Object.entries(statusCounts).map(([status, count]) => (
                <Badge key={status} variant="outline" className="text-xs">
                  {status}: {count}
                </Badge>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {/* Status Updates */}
            <div className="col-span-2 md:col-span-1">
              <StatusUpdateButton 
                onStatusUpdate={(status) => handleBulkAction('updateStatus', { status })}
                disabled={loading}
              />
            </div>

            {/* Export Options */}
            <div className="col-span-2 md:col-span-1">
              <ExportButton 
                onExport={(format) => handleBulkAction('export', { format })}
                disabled={loading}
              />
            </div>

            {/* Email Action */}
            <EmailButton 
              onSendEmail={(template) => handleBulkAction('sendEmail', { template })}
              disabled={loading}
            />

            {/* Delete Action */}
            <Button
              variant="outline"
              onClick={() => handleBulkAction('delete')}
              disabled={loading}
              className="col-span-1 text-red-600 border-red-300 hover:bg-red-50 dark:text-red-400 dark:border-red-600"
            >
              🗑️ Delete
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Bulk Action</DialogTitle>
            <DialogDescription>
              {getConfirmationMessage()}
            </DialogDescription>
          </DialogHeader>
          
          {/* Additional options for specific actions */}
          {pendingAction === 'export' && (
            <div className="py-4">
              <label className="block text-sm font-medium mb-2">Include Options:</label>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="includeLineItems" 
                    checked={bulkActionData.includeLineItems}
                    onCheckedChange={(checked) => 
                      setBulkActionData(prev => ({ ...prev, includeLineItems: checked }))
                    }
                  />
                  <label htmlFor="includeLineItems" className="text-sm">Include line items</label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="includePayments" 
                    checked={bulkActionData.includePayments}
                    onCheckedChange={(checked) => 
                      setBulkActionData(prev => ({ ...prev, includePayments: checked }))
                    }
                  />
                  <label htmlFor="includePayments" className="text-sm">Include payment history</label>
                </div>
              </div>
            </div>
          )}

          {pendingAction === 'sendEmail' && (
            <div className="py-4 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Email Template:</label>
                <Select 
                  value={bulkActionData.template || 'invoice_sent'} 
                  onValueChange={(template) => 
                    setBulkActionData(prev => ({ ...prev, template }))
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select email template" />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-600 shadow-lg">
                    <SelectItem value="invoice_sent">Invoice Sent</SelectItem>
                    <SelectItem value="payment_reminder">Payment Reminder</SelectItem>
                    <SelectItem value="invoice_overdue">Overdue Notice</SelectItem>
                    <SelectItem value="payment_confirmation">Payment Confirmation</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="includeAttachment" 
                    checked={bulkActionData.includeAttachment !== false}
                    onCheckedChange={(checked) => 
                      setBulkActionData(prev => ({ ...prev, includeAttachment: checked }))
                    }
                  />
                  <label htmlFor="includeAttachment" className="text-sm">Include PDF attachment</label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Priority:</label>
                <Select 
                  value={bulkActionData.priority || 'normal'} 
                  onValueChange={(priority) => 
                    setBulkActionData(prev => ({ ...prev, priority }))
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-600 shadow-lg">
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={cancelBulkAction}>
              Cancel
            </Button>
            <Button onClick={confirmBulkAction} disabled={loading}>
              {loading ? 'Processing...' : 'Confirm'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

// Status Update Dropdown Component
const StatusUpdateButton = ({ onStatusUpdate, disabled }) => {
  const [selectedStatus, setSelectedStatus] = useState('');

  const statusOptions = [
    { value: 'draft', label: 'Draft' },
    { value: 'sent', label: 'Sent' },
    { value: 'paid', label: 'Paid' },
    { value: 'overdue', label: 'Overdue' },
    { value: 'cancelled', label: 'Cancelled' }
  ];

  const handleStatusChange = (status) => {
    setSelectedStatus(status);
    onStatusUpdate(status);
  };

  return (
    <Select value={selectedStatus} onValueChange={handleStatusChange} disabled={disabled}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Update Status" />
      </SelectTrigger>
      <SelectContent className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-600 shadow-lg">
        {statusOptions.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

// Export Options Dropdown Component
const ExportButton = ({ onExport, disabled }) => {
  const [selectedFormat, setSelectedFormat] = useState('');

  const exportOptions = [
    { value: 'pdf', label: 'Export as PDF' },
    { value: 'csv', label: 'Export as CSV' },
    { value: 'excel', label: 'Export as Excel' }
  ];

  const handleExportChange = (format) => {
    setSelectedFormat(format);
    onExport(format);
  };

  return (
    <Select value={selectedFormat} onValueChange={handleExportChange} disabled={disabled}>
      <SelectTrigger className="w-full bg-white dark:bg-slate-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white">
        <SelectValue placeholder="Export" />
      </SelectTrigger>
      <SelectContent className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-600 shadow-lg">
        {exportOptions.map((option) => (
          <SelectItem key={option.value} value={option.value} className="bg-white dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-900 dark:text-white cursor-pointer">
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

// Email Options Dropdown Component
const EmailButton = ({ onSendEmail, disabled }) => {
  const [selectedTemplate, setSelectedTemplate] = useState('');

  const emailTemplates = [
    { value: 'invoice_sent', label: '📧 Send Invoice' },
    { value: 'payment_reminder', label: '⏰ Payment Reminder' },
    { value: 'invoice_overdue', label: '🚨 Overdue Notice' },
    { value: 'payment_confirmation', label: '✅ Payment Confirmation' }
  ];

  const handleEmailTemplateChange = (template) => {
    setSelectedTemplate(template);
    onSendEmail(template);
  };

  return (
    <Select value={selectedTemplate} onValueChange={handleEmailTemplateChange} disabled={disabled}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder="📧 Send Emails" />
      </SelectTrigger>
      <SelectContent className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-600 shadow-lg">
        {emailTemplates.map((template) => (
          <SelectItem key={template.value} value={template.value}>
            {template.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default BulkInvoiceActions;