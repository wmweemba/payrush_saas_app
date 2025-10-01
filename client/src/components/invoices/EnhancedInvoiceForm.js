/**
 * Enhanced Invoice Creation Form
 * 
 * React component for creating invoices with line items support
 */

"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CurrencySelect, CurrencyInput } from "@/components/ui/CurrencySelect";
import { getDefaultCurrency, formatCurrency } from "@/lib/currency/currencies";
import InvoiceLineItemsManager from "./InvoiceLineItemsManager";
import { Calculator, Receipt, FileText } from "lucide-react";

const EnhancedInvoiceForm = ({ onSuccess, onCancel, initialData = null }) => {
  const [invoiceType, setInvoiceType] = useState('simple'); // 'simple' or 'detailed'
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const [createdInvoiceId, setCreatedInvoiceId] = useState(null);

  // Form data for invoice header
  const [formData, setFormData] = useState({
    customer_name: initialData?.customer_name || '',
    customer_email: initialData?.customer_email || '',
    currency: initialData?.currency || getDefaultCurrency(),
    due_date: initialData?.due_date || '',
    // Simple invoice fields
    amount: initialData?.amount || '',
    // Detailed invoice will use line items
    description: initialData?.description || 'Professional Services',
    notes: initialData?.notes || ''
  });

  // Line items total for detailed invoices
  const [lineItemsTotal, setLineItemsTotal] = useState(0);

  // Set default due date (30 days from now)
  useEffect(() => {
    if (!formData.due_date) {
      const defaultDueDate = new Date();
      defaultDueDate.setDate(defaultDueDate.getDate() + 30);
      setFormData(prev => ({
        ...prev,
        due_date: defaultDueDate.toISOString().split('T')[0]
      }));
    }
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCurrencyChange = (currency) => {
    setFormData(prev => ({
      ...prev,
      currency
    }));
  };

  const handleAmountChange = (amount) => {
    setFormData(prev => ({
      ...prev,
      amount
    }));
  };

  const handleLineItemsTotalChange = (total) => {
    setLineItemsTotal(total);
  };

  const validateForm = () => {
    if (!formData.customer_name.trim()) {
      setMessage('Customer name is required');
      setIsError(true);
      return false;
    }

    if (invoiceType === 'simple') {
      if (!formData.amount || parseFloat(formData.amount) <= 0) {
        setMessage('Amount must be greater than 0');
        setIsError(true);
        return false;
      }
    } else {
      if (lineItemsTotal <= 0) {
        setMessage('Please add at least one line item with a positive amount');
        setIsError(true);
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setIsError(false);

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const token = localStorage.getItem('authToken');
      
      // Create the invoice first
      const invoiceData = {
        customer_name: formData.customer_name.trim(),
        customer_email: formData.customer_email.trim() || null,
        currency: formData.currency,
        due_date: formData.due_date,
        notes: formData.notes.trim() || null,
        // For simple invoices, use the amount. For detailed, we'll update it after line items
        amount: invoiceType === 'simple' ? parseFloat(formData.amount) : lineItemsTotal,
        is_line_item_invoice: invoiceType === 'detailed',
        status: 'draft'
      };

      const response = await fetch('http://localhost:5000/api/invoices', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(invoiceData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create invoice');
      }

      const result = await response.json();
      const newInvoiceId = result.data.invoice.id;
      setCreatedInvoiceId(newInvoiceId);

      // For detailed invoices, we need to add the initial line item if creating from simple form
      if (invoiceType === 'detailed' && formData.description) {
        try {
          const lineItemResponse = await fetch(`http://localhost:5000/api/invoices/${newInvoiceId}/line-items`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              description: formData.description,
              quantity: 1,
              unit_price: lineItemsTotal || 0
            })
          });

          if (!lineItemResponse.ok) {
            console.warn('Failed to create initial line item, but invoice was created');
          }
        } catch (lineItemError) {
          console.warn('Error creating initial line item:', lineItemError);
        }
      }

      setMessage('Invoice created successfully!');
      setIsError(false);

      // Call success callback after a short delay to show the success message
      setTimeout(() => {
        if (onSuccess) {
          onSuccess(result.data.invoice);
        }
      }, 1500);

    } catch (error) {
      console.error('Error creating invoice:', error);
      setMessage(`Error creating invoice: ${error.message}`);
      setIsError(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getFinalAmount = () => {
    return invoiceType === 'simple' 
      ? parseFloat(formData.amount) || 0
      : lineItemsTotal;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Create New Invoice
        </h2>
        <p className="text-gray-600 dark:text-gray-300">
          Choose between a simple invoice or detailed line items
        </p>
      </div>

      {/* Messages */}
      {message && (
        <Alert className={isError ? "border-red-200 bg-red-50 dark:bg-red-900/20" : "border-green-200 bg-green-50 dark:bg-green-900/20"}>
          <AlertDescription className={isError ? "text-red-700 dark:text-red-300" : "text-green-700 dark:text-green-300"}>
            {message}
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText className="w-5 h-5 mr-2" />
            Invoice Details
          </CardTitle>
          <CardDescription>
            Enter the basic information for your invoice
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Customer Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Customer Name *
                </label>
                <input
                  type="text"
                  name="customer_name"
                  value={formData.customer_name}
                  onChange={handleInputChange}
                  required
                  disabled={isSubmitting}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                           bg-white dark:bg-slate-800 text-gray-900 dark:text-white 
                           focus:ring-2 focus:ring-blue-500 focus:border-transparent
                           disabled:opacity-50 disabled:cursor-not-allowed"
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
                  value={formData.customer_email}
                  onChange={handleInputChange}
                  disabled={isSubmitting}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                           bg-white dark:bg-slate-800 text-gray-900 dark:text-white 
                           focus:ring-2 focus:ring-blue-500 focus:border-transparent
                           disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="Enter customer email (optional)"
                />
              </div>
            </div>

            {/* Currency and Due Date */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Currency
                </label>
                <CurrencySelect
                  value={formData.currency}
                  onChange={handleCurrencyChange}
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Due Date
                </label>
                <input
                  type="date"
                  name="due_date"
                  value={formData.due_date}
                  onChange={handleInputChange}
                  disabled={isSubmitting}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                           bg-white dark:bg-slate-800 text-gray-900 dark:text-white 
                           focus:ring-2 focus:ring-blue-500 focus:border-transparent
                           disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
            </div>

            {/* Invoice Type Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Invoice Type
              </label>
              <Tabs value={invoiceType} onValueChange={setInvoiceType} className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="simple" className="flex items-center">
                    <Receipt className="w-4 h-4 mr-2" />
                    Simple Invoice
                  </TabsTrigger>
                  <TabsTrigger value="detailed" className="flex items-center">
                    <Calculator className="w-4 h-4 mr-2" />
                    Detailed Line Items
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="simple" className="mt-4 space-y-4">
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <h4 className="font-medium text-blue-900 dark:text-blue-300 mb-2">
                      Simple Invoice
                    </h4>
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      Perfect for single services or products. Enter one total amount.
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Amount ({formData.currency}) *
                    </label>
                    <CurrencyInput
                      value={formData.amount}
                      currency={formData.currency}
                      onChange={handleAmountChange}
                      disabled={isSubmitting}
                      placeholder="0.00"
                      className="w-full"
                    />
                  </div>
                </TabsContent>

                <TabsContent value="detailed" className="mt-4 space-y-4">
                  <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                    <h4 className="font-medium text-purple-900 dark:text-purple-300 mb-2">
                      Detailed Line Items
                    </h4>
                    <p className="text-sm text-purple-700 dark:text-purple-300">
                      Add multiple items with quantities and individual prices. Perfect for detailed billing.
                    </p>
                  </div>

                  {/* Preview of line items total */}
                  <div className="bg-gray-50 dark:bg-slate-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-700 dark:text-gray-300">
                        Line Items Total:
                      </span>
                      <span className="text-xl font-bold text-gray-900 dark:text-white">
                        {formatCurrency(lineItemsTotal, formData.currency)}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Add line items after creating the invoice
                    </p>
                  </div>
                </TabsContent>
              </Tabs>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Notes (Optional)
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                disabled={isSubmitting}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                         bg-white dark:bg-slate-800 text-gray-900 dark:text-white 
                         focus:ring-2 focus:ring-blue-500 focus:border-transparent
                         disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder="Add any additional notes or terms..."
              />
            </div>

            {/* Total Summary */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white">
                    Invoice Total
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    {invoiceType === 'simple' ? 'Simple invoice amount' : 'Based on line items'}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {formatCurrency(getFinalAmount(), formData.currency)}
                  </div>
                  <Badge variant="secondary" className="mt-1">
                    {invoiceType === 'simple' ? 'Simple' : 'Detailed'}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-700">
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || (invoiceType === 'simple' && getFinalAmount() <= 0)}
                className="bg-blue-600 hover:bg-blue-700 text-white min-w-[120px]"
              >
                {isSubmitting ? 'Creating...' : 'Create Invoice'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default EnhancedInvoiceForm;