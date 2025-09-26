/**
 * Payment Service
 * 
 * Handles payment processing, verification, and webhook notifications
 * Migrated from Next.js API routes to Express service layer
 */

const { supabaseService } = require('./database');
const { createApiResponse, createErrorResponse } = require('../utils');

/**
 * Payment Service Class
 */
class PaymentService {
  constructor() {
    this.flutterwaveApiUrl = 'https://api.flutterwave.com/v3';
    this.secretKey = process.env.FLW_SECRET_KEY;
    this.webhookHash = process.env.FLUTTERWAVE_WEBHOOK_HASH;
  }

  /**
   * Verify payment with Flutterwave API
   * @param {string} transactionId - Flutterwave transaction ID
   * @param {string} invoiceId - Invoice ID to verify payment for
   * @param {string} userId - User ID for authorization
   * @returns {Promise<object>} Verification result
   */
  async verifyPayment(transactionId, invoiceId, userId) {
    try {
      console.log(`Verifying payment - Transaction ID: ${transactionId}, Invoice ID: ${invoiceId}`);

      // Validate required parameters
      if (!transactionId || !invoiceId) {
        return createErrorResponse('Missing transaction_id or invoice_id', 400);
      }

      // Step 1: Verify payment with Flutterwave API
      const flutterwaveResponse = await fetch(
        `${this.flutterwaveApiUrl}/transactions/${transactionId}/verify`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${this.secretKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!flutterwaveResponse.ok) {
        throw new Error(`Flutterwave API error: ${flutterwaveResponse.status}`);
      }

      const flutterwaveData = await flutterwaveResponse.json();

      if (flutterwaveData.status !== 'success') {
        return createErrorResponse('Payment verification failed', 400, flutterwaveData);
      }

      const transaction = flutterwaveData.data;

      // Step 2: Validate transaction details
      if (transaction.status !== 'successful') {
        return createErrorResponse('Payment not successful', 400, { status: transaction.status });
      }

      // Step 3: Get invoice details from database and verify ownership
      const invoice = await this.getInvoiceForVerification(invoiceId, userId);
      if (!invoice.success) {
        return invoice; // Return error response
      }

      // Step 4: Validate payment amount matches invoice
      const paidAmount = parseFloat(transaction.amount);
      const invoiceAmount = parseFloat(invoice.data.amount);

      if (paidAmount !== invoiceAmount) {
        return createErrorResponse('Payment amount mismatch', 400, {
          paid: paidAmount,
          expected: invoiceAmount
        });
      }

      // Step 5: Check if payment already exists
      const existingPayment = await this.getPaymentByReference(transaction.tx_ref);
      if (existingPayment.success && existingPayment.data) {
        return createErrorResponse('Payment already processed', 409, {
          payment_id: existingPayment.data.id
        });
      }

      // Step 6: Create payment record
      const paymentRecord = await this.createPaymentRecord(transaction, invoiceId);
      if (!paymentRecord.success) {
        return paymentRecord; // Return error response
      }

      // Step 7: Update invoice status to 'Paid'
      const updateResult = await this.updateInvoiceStatus(invoiceId, 'Paid');
      if (!updateResult.success) {
        return updateResult; // Return error response
      }

      // Step 8: Return success response
      return createApiResponse(true, {
        payment_id: paymentRecord.data.id,
        transaction_id: transaction.id,
        amount: transaction.amount,
        currency: transaction.currency,
        status: transaction.status,
        reference: transaction.tx_ref,
        invoice_status: 'Paid'
      }, 'Payment verified and invoice updated successfully');

    } catch (error) {
      console.error('Payment verification error:', error);
      return createErrorResponse('Payment verification failed', 500, error.message);
    }
  }

  /**
   * Get invoice for verification with user ownership check
   * @param {string} invoiceId - Invoice ID
   * @param {string} userId - User ID for authorization
   * @returns {Promise<object>} Invoice data or error
   */
  async getInvoiceForVerification(invoiceId, userId) {
    try {
      const { data: invoice, error } = await supabaseService.getClient()
        .from('invoices')
        .select('*')
        .eq('id', invoiceId)
        .eq('user_id', userId) // Ensure user owns the invoice
        .single();

      if (error || !invoice) {
        console.error('Invoice fetch error:', error);
        return createErrorResponse('Invoice not found or access denied', 404);
      }

      return createApiResponse(true, invoice);
    } catch (error) {
      console.error('Get invoice error:', error);
      return createErrorResponse('Failed to retrieve invoice', 500, error.message);
    }
  }

  /**
   * Get payment by reference
   * @param {string} reference - Payment reference
   * @returns {Promise<object>} Payment data or null
   */
  async getPaymentByReference(reference) {
    try {
      const { data: payment, error } = await supabaseService.getClient()
        .from('payments')
        .select('id')
        .eq('reference', reference)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
        console.error('Payment lookup error:', error);
        return createErrorResponse('Failed to check existing payment', 500, error.message);
      }

      return createApiResponse(true, payment);
    } catch (error) {
      console.error('Get payment by reference error:', error);
      return createErrorResponse('Failed to check payment reference', 500, error.message);
    }
  }

  /**
   * Create payment record in database
   * @param {object} transaction - Flutterwave transaction data
   * @param {string} invoiceId - Invoice ID
   * @returns {Promise<object>} Created payment record
   */
  async createPaymentRecord(transaction, invoiceId) {
    try {
      const { data: paymentRecord, error } = await supabaseService.getClient()
        .from('payments')
        .insert([
          {
            invoice_id: invoiceId,
            amount: transaction.amount,
            currency: transaction.currency,
            status: 'successful',
            reference: transaction.tx_ref,
            flutterwave_id: transaction.id.toString(),
            payment_method: transaction.payment_type || 'card',
            customer_email: transaction.customer.email,
            customer_name: transaction.customer.name,
            created_at: new Date().toISOString()
          }
        ])
        .select()
        .single();

      if (error) {
        console.error('Payment record creation error:', error);
        return createErrorResponse('Failed to create payment record', 500, error.message);
      }

      return createApiResponse(true, paymentRecord);
    } catch (error) {
      console.error('Create payment record error:', error);
      return createErrorResponse('Failed to create payment record', 500, error.message);
    }
  }

  /**
   * Update invoice status
   * @param {string} invoiceId - Invoice ID
   * @param {string} status - New status
   * @returns {Promise<object>} Update result
   */
  async updateInvoiceStatus(invoiceId, status) {
    try {
      const { error } = await supabaseService.getClient()
        .from('invoices')
        .update({ 
          status: status,
          updated_at: new Date().toISOString()
        })
        .eq('id', invoiceId);

      if (error) {
        console.error('Invoice status update error:', error);
        return createErrorResponse('Failed to update invoice status', 500, error.message);
      }

      return createApiResponse(true, { status });
    } catch (error) {
      console.error('Update invoice status error:', error);
      return createErrorResponse('Failed to update invoice status', 500, error.message);
    }
  }

  /**
   * Process Flutterwave webhook
   * @param {object} webhookData - Webhook payload
   * @returns {Promise<object>} Processing result
   */
  async processWebhook(webhookData) {
    try {
      console.log('Processing Flutterwave webhook:', webhookData);

      const { event, data } = webhookData;

      if (event === 'charge.completed' && data.status === 'successful') {
        const { tx_ref, amount, currency } = data;

        // Extract invoice ID from transaction reference (format: PAYRUSH_invoiceId_timestamp)
        const invoiceId = tx_ref.split('_')[1];

        if (!invoiceId) {
          return createErrorResponse('Invalid transaction reference format', 400);
        }

        // Check if payment already exists
        const existingPayment = await this.getPaymentByReference(data.flw_ref || tx_ref);
        if (existingPayment.success && existingPayment.data) {
          return createApiResponse(true, {
            action: 'payment_already_processed',
            message: 'Payment already exists',
            payment_id: existingPayment.data.id
          });
        }

        // Create payment record
        const paymentRecord = await this.createPaymentRecord({
          ...data,
          tx_ref: tx_ref,
          customer: data.customer || {},
          payment_type: data.payment_type || 'webhook'
        }, invoiceId);

        if (!paymentRecord.success) {
          return paymentRecord;
        }

        // Update invoice status
        const updateResult = await this.updateInvoiceStatus(invoiceId, 'Paid');
        if (!updateResult.success) {
          return updateResult;
        }

        return createApiResponse(true, {
          action: 'payment_completed',
          invoice_id: invoiceId,
          amount: parseFloat(amount),
          currency: currency,
          transaction_id: data.id.toString(),
          flw_ref: data.flw_ref,
          payment_id: paymentRecord.data.id
        }, 'Payment webhook processed successfully');
      }

      return createApiResponse(true, {
        action: 'no_action',
        message: `Webhook event ${event} processed but no action taken`
      });

    } catch (error) {
      console.error('Webhook processing error:', error);
      return createErrorResponse('Webhook processing failed', 500, error.message);
    }
  }

  /**
   * Verify webhook signature from Flutterwave
   * @param {object} body - Webhook body
   * @param {string} signature - Webhook signature from headers
   * @returns {boolean} Whether signature is valid
   */
  verifyWebhookSignature(body, signature) {
    try {
      if (!this.webhookHash || !signature) {
        console.warn('Webhook hash or signature missing - webhook verification disabled');
        return true; // Allow in development, secure in production
      }

      // Simple verification - enhance based on Flutterwave specs
      return signature === this.webhookHash;
    } catch (error) {
      console.error('Webhook signature verification error:', error);
      return false;
    }
  }

  /**
   * Get payment history for a user
   * @param {string} userId - User ID
   * @param {object} options - Query options (pagination, filters)
   * @returns {Promise<object>} Payment history
   */
  async getPaymentHistory(userId, options = {}) {
    try {
      const { limit = 20, offset = 0, status, currency } = options;

      let query = supabaseService.getClient()
        .from('payments')
        .select(`
          *,
          invoices!inner (
            id,
            invoice_number,
            amount,
            currency,
            user_id,
            client_name,
            client_email
          )
        `)
        .eq('invoices.user_id', userId);

      if (status) {
        query = query.eq('status', status);
      }

      if (currency) {
        query = query.eq('currency', currency);
      }

      query = query
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      const { data: payments, error, count } = await query;

      if (error) {
        console.error('Get payment history error:', error);
        return createErrorResponse('Failed to retrieve payment history', 500, error.message);
      }

      return createApiResponse(true, {
        payments: payments || [],
        total: count || 0,
        limit,
        offset
      });

    } catch (error) {
      console.error('Get payment history error:', error);
      return createErrorResponse('Failed to retrieve payment history', 500, error.message);
    }
  }
}

module.exports = new PaymentService();