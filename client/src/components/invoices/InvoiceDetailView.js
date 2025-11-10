/**
 * Invoice Detail View Component
 * 
 * React component for viewing invoice details with line items support
 */

"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatCurrency } from "@/lib/currency/currencies";
import InvoiceLineItemsManager from "./InvoiceLineItemsManager";
import { 
  FileText, 
  Calendar, 
  Mail, 
  User, 
  CreditCard, 
  Edit, 
  Trash2, 
  Download,
  Eye,
  Send,
  CheckCircle
} from "lucide-react";

const InvoiceDetailView = ({ 
  invoiceId, 
  onEdit, 
  onDelete, 
  onClose,
  onStatusChange 
}) => {
  const [invoice, setInvoice] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  useEffect(() => {
    if (invoiceId) {
      loadInvoiceDetails();
    }
  }, [invoiceId]);

  const loadInvoiceDetails = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`http://localhost:5000/api/invoices/${invoiceId}/summary`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to load invoice details');
      }

      const data = await response.json();
      setInvoice(data.data.invoice);
    } catch (error) {
      console.error('Error loading invoice:', error);
      setMessage(`Error loading invoice: ${error.message}`);
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusUpdate = async (newStatus) => {
    setIsUpdating(true);
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`http://localhost:5000/api/invoices/${invoiceId}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (!response.ok) {
        throw new Error('Failed to update invoice status');
      }

      setInvoice(prev => ({ ...prev, status: newStatus }));
      setMessage(`Invoice status updated to ${newStatus}`);
      setIsError(false);
      
      if (onStatusChange) {
        onStatusChange(newStatus);
      }
    } catch (error) {
      console.error('Error updating status:', error);
      setMessage(`Error updating status: ${error.message}`);
      setIsError(true);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSendEmail = async () => {
    if (!invoice.customer_email) {
      setMessage('No customer email address found');
      setIsError(true);
      return;
    }

    setIsSendingEmail(true);
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`http://localhost:5000/api/invoice-email/send/${invoiceId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          includePdf: true
        })
      });

      if (!response.ok) {
        throw new Error('Failed to send invoice email');
      }

      const data = await response.json();
      
      // Update invoice status to SENT if it was DRAFT
      if (invoice.status === 'draft') {
        setInvoice(prev => ({ ...prev, status: 'sent' }));
        if (onStatusChange) {
          onStatusChange('sent');
        }
      }

      setMessage(`✅ Invoice email sent successfully to ${invoice.customer_email}!`);
      setIsError(false);
    } catch (error) {
      console.error('Error sending invoice email:', error);
      setMessage(`❌ Failed to send email: ${error.message}`);
      setIsError(true);
    } finally {
      setIsSendingEmail(false);
    }
  };

  const handleSendReminder = async () => {
    if (!invoice.customer_email) {
      setMessage('No customer email address found');
      setIsError(true);
      return;
    }

    setIsSendingEmail(true);
    try {
      const token = localStorage.getItem('authToken');
      
      // Determine reminder type based on how overdue the invoice is
      const dueDate = new Date(invoice.due_date);
      const today = new Date();
      const daysOverdue = Math.ceil((today - dueDate) / (1000 * 60 * 60 * 24));
      
      let reminderType = 'gentle';
      if (daysOverdue > 30) {
        reminderType = 'final';
      } else if (daysOverdue > 7) {
        reminderType = 'firm';
      }

      const response = await fetch(`http://localhost:5000/api/invoice-email/remind/${invoiceId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          reminderType
        })
      });

      if (!response.ok) {
        throw new Error('Failed to send payment reminder');
      }

      const data = await response.json();
      
      setMessage(`🔔 Payment reminder sent successfully to ${invoice.customer_email}!`);
      setIsError(false);
    } catch (error) {
      console.error('Error sending payment reminder:', error);
      setMessage(`❌ Failed to send reminder: ${error.message}`);
      setIsError(true);
    } finally {
      setIsSendingEmail(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'paid': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'sent': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'overdue': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      case 'cancelled': return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
      case 'draft': 
      default: return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
    }
  };

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      return dateString;
    }
  };

  const getStatusActions = (status) => {
    const actions = [];
    
    switch (status?.toLowerCase()) {
      case 'draft':
        actions.push(
          { label: 'Mark as Sent', action: () => handleStatusUpdate('sent'), icon: Send, color: 'blue' },
          { label: 'Mark as Paid', action: () => handleStatusUpdate('paid'), icon: CheckCircle, color: 'green' }
        );
        break;
      case 'sent':
        actions.push(
          { label: 'Mark as Paid', action: () => handleStatusUpdate('paid'), icon: CheckCircle, color: 'green' },
          { label: 'Mark Overdue', action: () => handleStatusUpdate('overdue'), icon: Calendar, color: 'red' }
        );
        break;
      case 'overdue':
        actions.push(
          { label: 'Mark as Paid', action: () => handleStatusUpdate('paid'), icon: CheckCircle, color: 'green' }
        );
        break;
    }

    if (status?.toLowerCase() !== 'paid' && status?.toLowerCase() !== 'cancelled') {
      actions.push(
        { label: 'Cancel Invoice', action: () => handleStatusUpdate('cancelled'), icon: Trash2, color: 'gray' }
      );
    }

    return actions;
  };

  if (isLoading) {
    return (
      <Card className="max-w-4xl mx-auto">
        <CardContent className="p-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-300">Loading invoice details...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!invoice) {
    return (
      <Card className="max-w-4xl mx-auto">
        <CardContent className="p-8 text-center">
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Invoice not found
          </h3>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            The requested invoice could not be loaded.
          </p>
          <Button onClick={onClose} variant="outline">
            Go Back
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Invoice Details
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Invoice ID: {invoice.id?.slice(0, 8)}...
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline" onClick={onClose}>
            ← Back to List
          </Button>
          <Button onClick={() => onEdit && onEdit(invoice)} className="bg-blue-600 hover:bg-blue-700 text-white">
            <Edit className="w-4 h-4 mr-2" />
            Edit Invoice
          </Button>
        </div>
      </div>

      {/* Messages */}
      {message && (
        <Alert className={isError ? "border-red-200 bg-red-50 dark:bg-red-900/20" : "border-green-200 bg-green-50 dark:bg-green-900/20"}>
          <AlertDescription className={isError ? "text-red-700 dark:text-red-300" : "text-green-700 dark:text-green-300"}>
            {message}
          </AlertDescription>
        </Alert>
      )}

      {/* Invoice Header Information */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center">
                <FileText className="w-5 h-5 mr-2" />
                Invoice Information
              </CardTitle>
              <CardDescription>
                {invoice.is_line_item_invoice ? 'Detailed line items invoice' : 'Simple invoice'}
              </CardDescription>
            </div>
            <Badge className={getStatusColor(invoice.status)}>
              {invoice.status?.toUpperCase()}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Customer */}
            <div className="flex items-start space-x-3">
              <User className="w-5 h-5 text-gray-400 mt-1" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Customer</p>
                <p className="font-semibold text-gray-900 dark:text-white">
                  {invoice.customer_name}
                </p>
                {invoice.customer_email && (
                  <p className="text-sm text-gray-600 dark:text-gray-300 flex items-center mt-1">
                    <Mail className="w-3 h-3 mr-1" />
                    {invoice.customer_email}
                  </p>
                )}
              </div>
            </div>

            {/* Amount */}
            <div className="flex items-start space-x-3">
              <CreditCard className="w-5 h-5 text-gray-400 mt-1" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Amount</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">
                  {formatCurrency(invoice.final_amount || invoice.amount, invoice.currency)}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {invoice.currency}
                </p>
              </div>
            </div>

            {/* Due Date */}
            <div className="flex items-start space-x-3">
              <Calendar className="w-5 h-5 text-gray-400 mt-1" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Due Date</p>
                <p className="font-semibold text-gray-900 dark:text-white">
                  {formatDate(invoice.due_date)}
                </p>
                {new Date(invoice.due_date) < new Date() && invoice.status !== 'paid' && (
                  <Badge variant="destructive" className="text-xs mt-1">
                    Overdue
                  </Badge>
                )}
              </div>
            </div>

            {/* Created */}
            <div className="flex items-start space-x-3">
              <FileText className="w-5 h-5 text-gray-400 mt-1" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Created</p>
                <p className="font-semibold text-gray-900 dark:text-white">
                  {formatDate(invoice.created_at)}
                </p>
              </div>
            </div>
          </div>

          {/* Notes */}
          {invoice.notes && (
            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Notes</p>
              <p className="text-gray-900 dark:text-white">{invoice.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Status Actions */}
      {getStatusActions(invoice.status).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Invoice Actions</CardTitle>
            <CardDescription>
              Update invoice status or perform actions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              {getStatusActions(invoice.status).map((action, index) => {
                const IconComponent = action.icon;
                const colorClasses = {
                  blue: 'bg-blue-600 hover:bg-blue-700 text-white',
                  green: 'bg-green-600 hover:bg-green-700 text-white',
                  red: 'bg-red-600 hover:bg-red-700 text-white',
                  gray: 'bg-gray-600 hover:bg-gray-700 text-white'
                };
                
                return (
                  <Button
                    key={index}
                    onClick={action.action}
                    disabled={isUpdating}
                    className={colorClasses[action.color]}
                  >
                    <IconComponent className="w-4 h-4 mr-2" />
                    {action.label}
                  </Button>
                );
              })}

              {/* Email Actions */}
              <div className="border-l border-gray-300 pl-3 ml-3 space-x-2">
                <Button 
                  variant="default"
                  onClick={handleSendEmail}
                  disabled={isUpdating || isSendingEmail || !invoice.customer_email}
                  className="bg-purple-600 hover:bg-purple-700 text-white disabled:opacity-50"
                >
                  <Mail className={`w-4 h-4 mr-2 ${isSendingEmail ? 'animate-pulse' : ''}`} />
                  {isSendingEmail ? 'Sending...' : 'Send Invoice Email'}
                </Button>
                
                {(invoice.status === 'overdue' || invoice.status === 'sent') && (
                  <Button 
                    variant="outline"
                    onClick={() => handleSendReminder()}
                    disabled={isUpdating || isSendingEmail || !invoice.customer_email}
                    className="border-orange-300 text-orange-600 hover:bg-orange-50 dark:border-orange-600 dark:text-orange-400"
                  >
                    <Calendar className={`w-4 h-4 mr-2 ${isSendingEmail ? 'animate-pulse' : ''}`} />
                    Send Reminder
                  </Button>
                )}
              </div>

              {/* Export Actions */}
              <div className="border-l border-gray-300 pl-3 ml-3">
                <Button variant="outline" disabled>
                  <Eye className="w-4 h-4 mr-2" />
                  Preview PDF
                </Button>
                <Button variant="outline" disabled className="ml-2">
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Line Items or Simple Amount */}
      <Tabs defaultValue={invoice.is_line_item_invoice ? "line-items" : "summary"} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="summary">Invoice Summary</TabsTrigger>
          <TabsTrigger value="line-items">
            {invoice.is_line_item_invoice ? 'Line Items' : 'Convert to Line Items'}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="summary" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Invoice Summary</CardTitle>
              <CardDescription>
                Overview of invoice totals and breakdown
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {invoice.is_line_item_invoice ? (
                  <div className="bg-gray-50 dark:bg-slate-700 rounded-lg p-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600 dark:text-gray-400">Line Items Count:</p>
                        <p className="font-semibold">{invoice.line_item_count || 0} items</p>
                      </div>
                      <div>
                        <p className="text-gray-600 dark:text-gray-400">Calculated Total:</p>
                        <p className="font-semibold">
                          {formatCurrency(invoice.calculated_total || 0, invoice.currency)}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                    <h4 className="font-medium text-blue-900 dark:text-blue-300 mb-2">
                      Simple Invoice
                    </h4>
                    <p className="text-blue-700 dark:text-blue-300">
                      This invoice has a single total amount of {formatCurrency(invoice.amount, invoice.currency)}.
                    </p>
                  </div>
                )}

                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                  <div className="flex items-center justify-between text-lg">
                    <span className="font-semibold text-gray-900 dark:text-white">
                      Final Amount:
                    </span>
                    <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {formatCurrency(invoice.final_amount || invoice.amount, invoice.currency)}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="line-items" className="mt-6">
          {invoice.is_line_item_invoice ? (
            <InvoiceLineItemsManager
              invoiceId={invoice.id}
              currency={invoice.currency}
              initialLineItems={invoice.line_items || []}
              readOnly={false}
              onTotalChange={(total) => {
                setInvoice(prev => ({
                  ...prev,
                  calculated_total: total,
                  final_amount: total
                }));
              }}
            />
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Convert to Line Items
                </h4>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  This is currently a simple invoice. You can convert it to use detailed line items.
                </p>
                <Button disabled className="bg-blue-600 hover:bg-blue-700 text-white">
                  Convert to Line Items (Coming Soon)
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default InvoiceDetailView;