/**
 * Flutterwave Payment Integration for PayRush
 * Handles payment processing, verification, and invoice updates
 */

import { getCurrency } from '@/lib/currency/currencies';
import { apiClient, API_ENDPOINTS } from '@/lib/apiConfig';

/**
 * Get country code from currency
 */
export const getCountryFromCurrency = (currencyCode) => {
  const countryMap = {
    USD: 'US',
    ZMW: 'ZM', // Zambia
    EUR: 'DE', // Default to Germany for EUR
    GBP: 'GB', // United Kingdom
    NGN: 'NG', // Nigeria
    KES: 'KE', // Kenya
    GHS: 'GH', // Ghana
    ZAR: 'ZA'  // South Africa
  };
  return countryMap[currencyCode] || 'US';
};

/**
 * Get payment options based on currency
 */
export const getPaymentOptionsForCurrency = (currencyCode) => {
  const currency = getCurrency(currencyCode);
  return currency.supported_payment_methods.join(',');
};

// Load Flutterwave inline script dynamically
export const loadFlutterwaveScript = () => {
  return new Promise((resolve, reject) => {
    // Check if already loaded
    if (window.FlutterwaveCheckout) {
      resolve(window.FlutterwaveCheckout);
      return;
    }

    // Create script element
    const script = document.createElement('script');
    script.src = 'https://checkout.flutterwave.com/v3.js';
    script.async = true;
    
    script.onload = () => {
      if (window.FlutterwaveCheckout) {
        resolve(window.FlutterwaveCheckout);
      } else {
        reject(new Error('Failed to load Flutterwave script'));
      }
    };
    
    script.onerror = () => {
      reject(new Error('Failed to load Flutterwave script'));
    };
    
    document.head.appendChild(script);
  });
};

/**
 * Generate unique payment reference
 */
export const generatePaymentReference = (invoiceId) => {
  const timestamp = Date.now();
  return `PAYRUSH_${invoiceId}_${timestamp}`;
};

/**
 * Launch Flutterwave payment modal for an invoice
 */
export const processPayment = async (invoice, onSuccess, onError) => {
  try {
    // Load Flutterwave script
    const FlutterwaveCheckout = await loadFlutterwaveScript();
    
    // Generate payment reference
    const txRef = generatePaymentReference(invoice.id);
    
    // Payment configuration
    const paymentConfig = {
      public_key: process.env.NEXT_PUBLIC_FLW_PUBLIC_KEY,
      tx_ref: txRef,
      amount: parseFloat(invoice.amount),
      currency: invoice.currency || 'USD', // Use invoice currency
      country: getCountryFromCurrency(invoice.currency || 'USD'),
      payment_options: getPaymentOptionsForCurrency(invoice.currency || 'USD'),
      customer: {
        email: invoice.customer_email,
        name: invoice.customer_name,
      },
      customizations: {
        title: 'PayRush Invoice Payment',
        description: `Payment for Invoice #${invoice.id}`,
        logo: '/favicon.ico', // PayRush logo
      },
      callback: async (response) => {
        console.log('Payment response:', response);
        
        if (response.status === 'successful') {
          try {
            // Verify payment on backend
            const verificationResult = await verifyPayment(response.transaction_id, invoice.id);
            
            if (verificationResult.success) {
              onSuccess(response, verificationResult);
            } else {
              onError('Payment verification failed', verificationResult);
            }
          } catch (error) {
            console.error('Payment verification error:', error);
            onError('Payment verification failed', error);
          }
        } else {
          onError('Payment was not successful', response);
        }
      },
      onclose: () => {
        console.log('Payment modal closed');
        // Handle modal close if needed
      }
    };

    // Launch payment modal
    FlutterwaveCheckout(paymentConfig);
    
  } catch (error) {
    console.error('Payment processing error:', error);
    onError('Failed to process payment', error);
  }
};

/**
 * Verify payment with backend API
 */
export const verifyPayment = async (transactionId, invoiceId) => {
  try {
    const response = await apiClient(API_ENDPOINTS.paymentVerify, {
      method: 'POST',
      body: JSON.stringify({
        transaction_id: transactionId,
        invoice_id: invoiceId
      })
    });

    return response;
  } catch (error) {
    console.error('Payment verification API error:', error);
    throw error;
  }
};

/**
 * Get payment method display name
 */
export const getPaymentMethodDisplay = (method) => {
  const methods = {
    'card': 'Credit/Debit Card',
    'banktransfer': 'Bank Transfer', 
    'ussd': 'USSD',
    'mobilemoney': 'Mobile Money',
    'mpesa': 'M-Pesa',
    'airtel': 'Airtel Money',
    'mtn': 'MTN Mobile Money'
  };
  
  return methods[method] || method;
};

/**
 * Process webhook notification from Flutterwave
 * Updates invoice status based on payment status
 */
export const processWebhook = async (webhookData) => {
  try {
    console.log('Processing Flutterwave webhook:', webhookData);
    
    const { event, data } = webhookData;
    
    if (event === 'charge.completed' && data.status === 'successful') {
      const { tx_ref, amount, currency } = data;
      
      // Extract invoice ID from transaction reference (format: PAYRUSH_invoiceId_timestamp)
      const invoiceId = tx_ref.split('_')[1];
      
      return {
        success: true,
        action: 'payment_completed',
        invoice_id: invoiceId,
        amount: parseFloat(amount),
        currency: currency,
        transaction_id: data.id.toString(),
        flw_ref: data.flw_ref,
      };
    }
    
    return { 
      success: true, 
      action: 'no_action',
      message: `Webhook event ${event} processed but no action taken`
    };
  } catch (error) {
    console.error('Webhook processing error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};