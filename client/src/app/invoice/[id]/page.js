"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { formatCurrency } from "@/lib/currency/currencies";
import { processPayment } from "@/lib/payments/flutterwave";
import { 
  FileText, 
  Calendar, 
  Mail, 
  User, 
  Building2, 
  Phone, 
  MapPin, 
  Globe, 
  CreditCard,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle
} from "lucide-react";

export default function PublicInvoicePage() {
  const params = useParams();
  const invoiceId = params.id;
  
  const [invoice, setInvoice] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  useEffect(() => {
    if (invoiceId) {
      loadInvoice();
    }
  }, [invoiceId]);

  const loadInvoice = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`http://localhost:5000/api/public/invoice/${invoiceId}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Invoice not found');
        }
        throw new Error('Failed to load invoice');
      }

      const data = await response.json();
      setInvoice(data.data.invoice);
    } catch (error) {
      console.error('Error loading invoice:', error);
      setMessage(error.message);
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePayNow = async () => {
    if (!invoice) return;

    setIsProcessingPayment(true);
    setMessage('');
    
    try {
      await processPayment(
        invoice,
        // onSuccess callback
        async (response, verificationResult) => {
          setMessage('✅ Payment successful! Thank you for your payment.');
          setIsError(false);
          
          // Refresh invoice to show updated status
          await loadInvoice();
          
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
      setIsProcessingPayment(false);
    }
  };

  const getStatusConfig = (status) => {
    switch (status?.toLowerCase()) {
      case 'paid':
        return {
          color: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
          icon: CheckCircle,
          message: 'This invoice has been paid.'
        };
      case 'overdue':
        return {
          color: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
          icon: AlertCircle,
          message: 'This invoice is past due.'
        };
      case 'cancelled':
        return {
          color: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
          icon: XCircle,
          message: 'This invoice has been cancelled.'
        };
      case 'sent':
        return {
          color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
          icon: Clock,
          message: 'This invoice is awaiting payment.'
        };
      case 'draft':
      default:
        return {
          color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
          icon: Clock,
          message: 'This invoice is still being prepared.'
        };
    }
  };

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      return dateString;
    }
  };

  const canPay = () => {
    return invoice && 
           invoice.status !== 'paid' && 
           invoice.status !== 'cancelled' && 
           invoice.final_amount > 0;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-300">Loading invoice...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isError && !invoice) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Invoice Not Found
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              {message || 'The requested invoice could not be found.'}
            </p>
            <Button onClick={() => window.location.href = '/'} variant="outline">
              Go to Homepage
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const statusConfig = getStatusConfig(invoice?.status);
  const StatusIcon = statusConfig.icon;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-900 dark:to-slate-800">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              PayRush
            </div>
            <Badge className={statusConfig.color}>
              <StatusIcon className="w-4 h-4 mr-1" />
              {invoice?.status?.toUpperCase()}
            </Badge>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Messages */}
        {message && (
          <Alert className={`mb-6 ${isError ? "border-red-200 bg-red-50 dark:bg-red-900/20" : "border-green-200 bg-green-50 dark:bg-green-900/20"}`}>
            <AlertDescription className={isError ? "text-red-700 dark:text-red-300" : "text-green-700 dark:text-green-300"}>
              {message}
            </AlertDescription>
          </Alert>
        )}

        {/* Status Message */}
        <Alert className="mb-6">
          <StatusIcon className="w-4 h-4" />
          <AlertDescription>
            {statusConfig.message}
          </AlertDescription>
        </Alert>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Invoice Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Invoice Header */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="w-5 h-5 mr-2" />
                  Invoice
                </CardTitle>
                <CardDescription>
                  Invoice ID: {invoice?.id?.slice(0, 8)}...
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Bill To:</p>
                    <div className="flex items-start space-x-3">
                      <User className="w-5 h-5 text-gray-400 mt-1" />
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white">
                          {invoice?.customer_name}
                        </p>
                        {invoice?.customer_email && (
                          <p className="text-sm text-gray-600 dark:text-gray-300 flex items-center mt-1">
                            <Mail className="w-3 h-3 mr-1" />
                            {invoice.customer_email}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Invoice Details:</p>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                        <span className="text-gray-600 dark:text-gray-300">Created: </span>
                        <span className="ml-1">{formatDate(invoice?.created_at)}</span>
                      </div>
                      <div className="flex items-center">
                        <Clock className="w-4 h-4 text-gray-400 mr-2" />
                        <span className="text-gray-600 dark:text-gray-300">Due: </span>
                        <span className="ml-1">{formatDate(invoice?.due_date)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Line Items or Simple Amount */}
            <Card>
              <CardHeader>
                <CardTitle>Invoice Items</CardTitle>
                <CardDescription>
                  {invoice?.is_line_item_invoice ? 'Detailed breakdown of charges' : 'Total amount due'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {invoice?.is_line_item_invoice ? (
                  <div className="space-y-4">
                    {/* Line Items Table */}
                    <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                      <div className="bg-gray-50 dark:bg-slate-700 px-4 py-3 grid grid-cols-12 gap-4 text-sm font-medium text-gray-700 dark:text-gray-300">
                        <div className="col-span-6">Description</div>
                        <div className="col-span-2 text-center">Quantity</div>
                        <div className="col-span-2 text-right">Unit Price</div>
                        <div className="col-span-2 text-right">Total</div>
                      </div>
                      {invoice.line_items?.map((item, index) => (
                        <div key={item.id} className={`px-4 py-3 grid grid-cols-12 gap-4 text-sm ${index % 2 === 0 ? 'bg-white dark:bg-slate-800' : 'bg-gray-50 dark:bg-slate-700'}`}>
                          <div className="col-span-6 font-medium text-gray-900 dark:text-white">
                            {item.description}
                          </div>
                          <div className="col-span-2 text-center text-gray-600 dark:text-gray-300">
                            {item.quantity}
                          </div>
                          <div className="col-span-2 text-right text-gray-600 dark:text-gray-300">
                            {formatCurrency(item.unit_price, invoice.currency)}
                          </div>
                          <div className="col-span-2 text-right font-medium text-gray-900 dark:text-white">
                            {formatCurrency(item.line_total, invoice.currency)}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Total */}
                    <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                      <div className="flex justify-end">
                        <div className="text-right">
                          <p className="text-lg font-semibold text-gray-900 dark:text-white">
                            Total: {formatCurrency(invoice.final_amount, invoice.currency)}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-300">
                            {invoice.line_item_count} {invoice.line_item_count === 1 ? 'item' : 'items'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 dark:bg-blue-900/20 rounded-full mb-4">
                      <CreditCard className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                    </div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                      {formatCurrency(invoice?.final_amount, invoice?.currency)}
                    </p>
                    <p className="text-gray-600 dark:text-gray-300">
                      Total amount due
                    </p>
                  </div>
                )}

                {/* Notes */}
                {invoice?.notes && (
                  <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Notes:</p>
                    <p className="text-gray-900 dark:text-white">{invoice.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Payment Section */}
            {canPay() && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-green-600 dark:text-green-400">
                    Pay Invoice
                  </CardTitle>
                  <CardDescription>
                    Secure payment processing
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center space-y-4">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Amount Due</p>
                      <p className="text-3xl font-bold text-gray-900 dark:text-white">
                        {formatCurrency(invoice.final_amount, invoice.currency)}
                      </p>
                    </div>
                    
                    <Button
                      onClick={handlePayNow}
                      disabled={isProcessingPayment}
                      className="w-full bg-green-600 hover:bg-green-700 text-white py-3 text-lg"
                      size="lg"
                    >
                      {isProcessingPayment ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Processing...
                        </>
                      ) : (
                        <>
                          <CreditCard className="w-5 h-5 mr-2" />
                          Pay Now
                        </>
                      )}
                    </Button>

                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Secured by Flutterwave • Cards, Mobile Money, Bank Transfer
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Business Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Building2 className="w-5 h-5 mr-2" />
                  From
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {invoice?.business?.business_name}
                    </p>
                    {invoice?.business?.name && (
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        {invoice.business.name}
                      </p>
                    )}
                  </div>

                  {invoice?.business?.phone && (
                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                      <Phone className="w-4 h-4 mr-2" />
                      {invoice.business.phone}
                    </div>
                  )}

                  {invoice?.business?.address && (
                    <div className="flex items-start text-sm text-gray-600 dark:text-gray-300">
                      <MapPin className="w-4 h-4 mr-2 mt-0.5" />
                      {invoice.business.address}
                    </div>
                  )}

                  {invoice?.business?.website && (
                    <div className="flex items-center text-sm">
                      <Globe className="w-4 h-4 mr-2" />
                      <a 
                        href={invoice.business.website} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        {invoice.business.website}
                      </a>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Support */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Need Help?</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <p className="text-gray-600 dark:text-gray-300">
                    Questions about this invoice? Contact the business directly using the information above.
                  </p>
                  <Separator />
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Powered by PayRush • Secure Invoice Management
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}