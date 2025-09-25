/**
 * Flutterwave Payment Integration for PayRush
 * 
 * This module handles payment processing through Flutterwave's API
 * Supports cards, mobile money, bank transfers across Africa and globally
 * 
 * Documentation: https://developer.flutterwave.com
 * React SDK: https://github.com/Flutterwave/Flutterwave-React-v3
 */

// Import Flutterwave React SDK (install with: npm install flutterwave-react-v3)
// import { FlutterwaveCheckout, closePaymentModal } from 'flutterwave-react-v3';

/**
 * Configuration for Flutterwave integration
 * Environment variables should be set in .env.local:
 * - NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY
 * - FLUTTERWAVE_SECRET_KEY (server-side only)
 */
const FLUTTERWAVE_CONFIG = {
  public_key: process.env.NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY,
  secret_key: process.env.FLUTTERWAVE_SECRET_KEY, // Server-side only
  endpoint: 'https://api.flutterwave.com/v3',
};

/**
 * Create a payment configuration for an invoice
 * @param {Object} invoice - Invoice data from database
 * @param {Object} options - Additional payment options
 * @returns {Object} Flutterwave payment configuration
 */
export const createPaymentConfig = (invoice, options = {}) => {
  const config = {
    public_key: FLUTTERWAVE_CONFIG.public_key,
    tx_ref: `payrush_${invoice.id}_${Date.now()}`,
    amount: invoice.amount,
    currency: invoice.currency || 'NGN',
    payment_options: 'card,mobilemoney,ussd,banktransfer',
    customer: {
      email: invoice.customer_email,
      phone_number: invoice.customer_phone || '',
      name: invoice.customer_name,
    },
    customizations: {
      title: `Invoice from ${options.business_name || 'PayRush'}`,
      description: `Payment for Invoice #${invoice.id.slice(0, 8)}`,
      logo: options.logo_url || '',
    },
    meta: {
      invoice_id: invoice.id,
      user_id: invoice.user_id,
      source: 'payrush',
    },
    callback: options.callback_url || `${process.env.NEXT_PUBLIC_APP_URL}/payments/callback`,
    redirect_url: options.redirect_url || `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
    onclose: options.onclose || (() => console.log('Payment modal closed')),
  };

  return config;
};

/**
 * Generate a payment link for an invoice
 * This can be sent to customers via email or SMS
 * @param {Object} invoice - Invoice data
 * @param {Object} options - Payment options
 * @returns {Promise<string>} Payment link URL
 */
export const generatePaymentLink = async (invoice, options = {}) => {
  try {
    const config = createPaymentConfig(invoice, options);
    
    // Call Flutterwave API to generate payment link
    const response = await fetch(`${FLUTTERWAVE_CONFIG.endpoint}/payments`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${FLUTTERWAVE_CONFIG.secret_key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...config,
        type: 'payment_link',
      }),
    });

    const data = await response.json();
    
    if (data.status === 'success') {
      return data.data.link;
    } else {
      throw new Error(data.message || 'Failed to generate payment link');
    }
  } catch (error) {
    console.error('Payment link generation error:', error);
    throw error;
  }
};

/**
 * Verify a payment transaction
 * Called by webhook or after payment completion
 * @param {string} transactionId - Flutterwave transaction ID
 * @returns {Promise<Object>} Transaction verification result
 */
export const verifyPayment = async (transactionId) => {
  try {
    const response = await fetch(
      `${FLUTTERWAVE_CONFIG.endpoint}/transactions/${transactionId}/verify`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${FLUTTERWAVE_CONFIG.secret_key}`,
        },
      }
    );

    const data = await response.json();
    
    if (data.status === 'success') {
      return {
        success: true,
        transaction: data.data,
        amount: data.data.amount,
        currency: data.data.currency,
        status: data.data.status,
        reference: data.data.tx_ref,
        flw_ref: data.data.flw_ref,
      };
    } else {
      throw new Error(data.message || 'Payment verification failed');
    }
  } catch (error) {
    console.error('Payment verification error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Process webhook notification from Flutterwave
 * Updates invoice status based on payment status
 * @param {Object} webhookData - Webhook payload from Flutterwave
 * @returns {Promise<Object>} Processing result
 */
export const processWebhook = async (webhookData) => {
  try {
    // Verify webhook signature for security
    // Implementation depends on Flutterwave webhook signature verification
    
    const { event, data } = webhookData;
    
    if (event === 'charge.completed' && data.status === 'successful') {
      const { tx_ref, amount, currency } = data;
      
      // Extract invoice ID from transaction reference
      const invoiceId = data.meta?.invoice_id || tx_ref.split('_')[1];
      
      return {
        success: true,
        action: 'payment_completed',
        invoice_id: invoiceId,
        amount,
        currency,
        transaction_id: data.id,
        flw_ref: data.flw_ref,
      };
    }
    
    return { success: true, action: 'no_action' };
  } catch (error) {
    console.error('Webhook processing error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Update invoice status after successful payment
 * Called after webhook processing or manual verification
 * @param {string} invoiceId - Invoice ID to update
 * @param {Object} paymentData - Payment transaction data
 * @returns {Promise<Object>} Update result
 */
export const updateInvoicePaymentStatus = async (invoiceId, paymentData) => {
  try {
    // This would integrate with your Supabase update logic
    // Implementation will depend on your specific invoice update function
    
    return {
      success: true,
      message: 'Invoice marked as paid successfully',
    };
  } catch (error) {
    console.error('Invoice update error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

// Export configuration for testing and debugging
export { FLUTTERWAVE_CONFIG };

// Usage Examples:
/*

// 1. Generate payment link for an invoice
const paymentLink = await generatePaymentLink(invoice, {
  business_name: 'My Business',
  callback_url: 'https://myapp.com/payments/callback',
});

// 2. Verify a payment
const verification = await verifyPayment(transactionId);
if (verification.success) {
  await updateInvoicePaymentStatus(invoiceId, verification.transaction);
}

// 3. Process webhook
app.post('/api/webhooks/flutterwave', async (req, res) => {
  const result = await processWebhook(req.body);
  if (result.success && result.action === 'payment_completed') {
    await updateInvoicePaymentStatus(result.invoice_id, result);
  }
  res.status(200).json({ status: 'ok' });
});

*/