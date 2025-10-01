/**
 * Invoice Sharing Component
 * 
 * Component for generating and sharing public invoice links
 */

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { 
  Share2, 
  Copy, 
  Mail, 
  MessageCircle, 
  Link as LinkIcon,
  Eye,
  ExternalLink,
  Check
} from "lucide-react";

const InvoiceSharingCard = ({ invoice }) => {
  const [copied, setCopied] = useState(false);
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);

  // Generate public invoice URL
  const getPublicInvoiceUrl = () => {
    const baseUrl = typeof window !== 'undefined' 
      ? `${window.location.protocol}//${window.location.host}`
      : 'http://localhost:3000';
    return `${baseUrl}/invoice/${invoice.id}`;
  };

  const publicUrl = getPublicInvoiceUrl();

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      setMessage('Invoice link copied to clipboard!');
      setIsError(false);
      
      // Reset copied state after 3 seconds
      setTimeout(() => {
        setCopied(false);
        setMessage('');
      }, 3000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      setMessage('Failed to copy link. Please copy manually.');
      setIsError(true);
    }
  };

  const openInNewTab = () => {
    window.open(publicUrl, '_blank', 'noopener,noreferrer');
  };

  const shareViaEmail = () => {
    const subject = encodeURIComponent(`Invoice from ${invoice.business_name || 'PayRush'}`);
    const body = encodeURIComponent(
      `Hi ${invoice.customer_name},\n\n` +
      `Please find your invoice details below:\n\n` +
      `Invoice Amount: ${invoice.currency} ${invoice.final_amount || invoice.amount}\n` +
      `Due Date: ${new Date(invoice.due_date).toLocaleDateString()}\n\n` +
      `You can view and pay your invoice online at:\n${publicUrl}\n\n` +
      `Thank you for your business!\n\n` +
      `Best regards`
    );
    
    const mailtoUrl = `mailto:${invoice.customer_email || ''}?subject=${subject}&body=${body}`;
    window.location.href = mailtoUrl;
  };

  const shareViaWhatsApp = () => {
    const message = encodeURIComponent(
      `Hi ${invoice.customer_name}! 👋\n\n` +
      `Your invoice is ready:\n` +
      `💰 Amount: ${invoice.currency} ${invoice.final_amount || invoice.amount}\n` +
      `📅 Due: ${new Date(invoice.due_date).toLocaleDateString()}\n\n` +
      `View and pay online: ${publicUrl}\n\n` +
      `Thank you! 🙏`
    );
    
    const whatsappUrl = `https://wa.me/?text=${message}`;
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  };

  const canShare = () => {
    return invoice && (invoice.status === 'sent' || invoice.status === 'pending' || invoice.status === 'overdue');
  };

  if (!invoice) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Share2 className="w-5 h-5 mr-2" />
          Share Invoice
        </CardTitle>
        <CardDescription>
          Send your invoice to customers via email, WhatsApp, or direct link
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Messages */}
        {message && (
          <Alert className={isError ? "border-red-200 bg-red-50 dark:bg-red-900/20" : "border-green-200 bg-green-50 dark:bg-green-900/20"}>
            <AlertDescription className={isError ? "text-red-700 dark:text-red-300" : "text-green-700 dark:text-green-300"}>
              {message}
            </AlertDescription>
          </Alert>
        )}

        {/* Public URL Display */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Public Invoice Link
          </label>
          <div className="flex items-center space-x-2">
            <div className="flex-1 px-3 py-2 bg-gray-50 dark:bg-slate-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-mono text-gray-900 dark:text-white overflow-hidden">
              <span className="truncate block">
                {publicUrl}
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={copyToClipboard}
              className={copied ? "text-green-600 border-green-600" : ""}
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 mr-1" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 mr-1" />
                  Copy
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Share Actions */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Share Options
            </span>
            <Badge variant={canShare() ? "default" : "secondary"}>
              {canShare() ? "Ready to Share" : "Not Ready"}
            </Badge>
          </div>

          <div className="grid grid-cols-1 gap-2">
            {/* Preview */}
            <Button
              variant="outline"
              onClick={openInNewTab}
              className="w-full justify-start"
            >
              <Eye className="w-4 h-4 mr-2" />
              Preview Invoice
              <ExternalLink className="w-3 h-3 ml-auto" />
            </Button>

            {/* Email */}
            <Button
              variant="outline"
              onClick={shareViaEmail}
              disabled={!invoice.customer_email}
              className="w-full justify-start"
            >
              <Mail className="w-4 h-4 mr-2" />
              Email to Customer
              {!invoice.customer_email && (
                <span className="ml-auto text-xs text-gray-500">No email</span>
              )}
            </Button>

            {/* WhatsApp */}
            <Button
              variant="outline"
              onClick={shareViaWhatsApp}
              className="w-full justify-start"
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              Share via WhatsApp
            </Button>

            {/* Copy Link */}
            <Button
              variant="outline"
              onClick={copyToClipboard}
              className="w-full justify-start"
            >
              <LinkIcon className="w-4 h-4 mr-2" />
              Copy Link
            </Button>
          </div>
        </div>

        {/* Tips */}
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 border border-blue-200 dark:border-blue-800">
          <h4 className="text-sm font-medium text-blue-900 dark:text-blue-300 mb-2">
            💡 Sharing Tips
          </h4>
          <ul className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
            <li>• Customers can view and pay without creating an account</li>
            <li>• Payment status updates automatically</li>
            <li>• Links work on all devices and browsers</li>
            {!canShare() && (
              <li className="text-orange-600 dark:text-orange-400">
                • Change status to "Sent" to enable sharing
              </li>
            )}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default InvoiceSharingCard;