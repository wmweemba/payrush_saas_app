/**
 * Invoice Line Items Routes
 * 
 * Express routes for managing invoice line items
 */

const express = require('express');
const router = express.Router();
const invoiceLineItemsService = require('../services/invoiceLineItemsService');
const { supabase } = require('../config/database');
const { createApiResponse, createErrorResponse, sanitizeString } = require('../utils');

/**
 * POST /api/invoices
 * Create a new invoice
 */
router.post('/', async (req, res, next) => {
  try {
    const userId = req.userId; // From auth middleware
    const {
      customer_name,
      customer_email,
      amount,
      currency,
      status,
      due_date,
      is_line_item_invoice,
      client_id,
      template_id
    } = req.body;

    console.log('🏗️ Creating invoice with template_id:', template_id);

    // Validate required fields
    if (!customer_name || !customer_name.trim()) {
      return res.status(400).json(
        createErrorResponse('Customer name is required', 400)
      );
    }

    if (!amount || amount <= 0) {
      return res.status(400).json(
        createErrorResponse('Amount must be greater than 0', 400)
      );
    }

    if (!currency) {
      return res.status(400).json(
        createErrorResponse('Currency is required', 400)
      );
    }

    // Set default due date if not provided (30 days from now)
    let finalDueDate = due_date;
    if (!finalDueDate) {
      const defaultDueDate = new Date();
      defaultDueDate.setDate(defaultDueDate.getDate() + 30);
      finalDueDate = defaultDueDate.toISOString().split('T')[0];
    }

    // Create invoice
    const invoiceData = {
      user_id: userId,
      customer_name: sanitizeString(customer_name.trim()),
      customer_email: customer_email ? sanitizeString(customer_email.trim()) : null,
      amount: parseFloat(amount),
      currency: currency,
      status: status || 'draft',
      due_date: finalDueDate,
      is_line_item_invoice: is_line_item_invoice || false,
      template_id: template_id || null
    };

    // Add client_id if provided
    if (client_id) {
      invoiceData.client_id = client_id;
    }

    const { data: invoice, error } = await supabase
      .from('invoices')
      .insert(invoiceData)
      .select('*')
      .single();

    if (error) {
      console.error('Invoice creation error:', error);
      throw new Error(`Failed to create invoice: ${error.message}`);
    }

    res.status(201).json(createApiResponse(true, { invoice }, 'Invoice created successfully'));
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/invoices/:invoiceId/status
 * Update invoice status
 */
router.put('/:invoiceId/status', async (req, res, next) => {
  try {
    const userId = req.userId; // From auth middleware
    const invoiceId = req.params.invoiceId;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json(
        createErrorResponse('Status is required', 400)
      );
    }

    // Validate status
    const validStatuses = ['draft', 'sent', 'paid', 'overdue', 'cancelled'];
    if (!validStatuses.includes(status.toLowerCase())) {
      return res.status(400).json(
        createErrorResponse('Invalid status value', 400)
      );
    }

    // Update invoice status
    const { data: invoice, error } = await supabase
      .from('invoices')
      .update({ status: status.toLowerCase() })
      .eq('id', invoiceId)
      .eq('user_id', userId) // Ensure user can only update their own invoices
      .select('*')
      .single();

    if (error) {
      console.error('Invoice status update error:', error);
      throw new Error(`Failed to update invoice status: ${error.message}`);
    }

    if (!invoice) {
      return res.status(404).json(
        createErrorResponse('Invoice not found or access denied', 404)
      );
    }

    res.json(createApiResponse(true, { invoice }, 'Invoice status updated successfully'));
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/invoices/:invoiceId/line-items
 * Get all line items for a specific invoice
 */
router.get('/:invoiceId/line-items', async (req, res, next) => {
  try {
    const userId = req.userId; // From auth middleware
    const invoiceId = req.params.invoiceId;

    const result = await invoiceLineItemsService.getInvoiceLineItems(invoiceId, userId);

    if (!result.success) {
      return res.status(result.statusCode || 500).json(
        createErrorResponse(result.error, result.statusCode || 500)
      );
    }

    res.json(createApiResponse(true, result.data, 'Invoice line items retrieved successfully'));
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/invoices/:invoiceId/line-items
 * Create a new line item for an invoice
 */
router.post('/:invoiceId/line-items', async (req, res, next) => {
  try {
    const userId = req.userId; // From auth middleware
    const invoiceId = req.params.invoiceId;
    const lineItemData = req.body;

    const result = await invoiceLineItemsService.createLineItem(invoiceId, userId, lineItemData);

    if (!result.success) {
      return res.status(result.statusCode || 500).json(
        createErrorResponse(result.error, result.statusCode || 500)
      );
    }

    res.status(201).json(createApiResponse(true, result.data, 'Line item created successfully'));
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/invoices/:invoiceId/line-items/bulk
 * Create multiple line items for an invoice
 */
router.post('/:invoiceId/line-items/bulk', async (req, res, next) => {
  try {
    const userId = req.userId; // From auth middleware
    const invoiceId = req.params.invoiceId;
    const { lineItems } = req.body;

    if (!lineItems || !Array.isArray(lineItems)) {
      return res.status(400).json(
        createErrorResponse('lineItems array is required', 400)
      );
    }

    const result = await invoiceLineItemsService.createMultipleLineItems(invoiceId, userId, lineItems);

    if (!result.success) {
      return res.status(result.statusCode || 500).json(
        createErrorResponse(result.error, result.statusCode || 500)
      );
    }

    res.status(201).json(createApiResponse(true, result.data, 'Line items created successfully'));
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/line-items/:lineItemId
 * Update a specific line item
 */
router.put('/line-items/:lineItemId', async (req, res, next) => {
  try {
    const userId = req.userId; // From auth middleware
    const lineItemId = req.params.lineItemId;
    const lineItemData = req.body;

    const result = await invoiceLineItemsService.updateLineItem(lineItemId, userId, lineItemData);

    if (!result.success) {
      return res.status(result.statusCode || 500).json(
        createErrorResponse(result.error, result.statusCode || 500)
      );
    }

    res.json(createApiResponse(true, result.data, 'Line item updated successfully'));
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/line-items/:lineItemId
 * Delete a specific line item
 */
router.delete('/line-items/:lineItemId', async (req, res, next) => {
  try {
    const userId = req.userId; // From auth middleware
    const lineItemId = req.params.lineItemId;

    const result = await invoiceLineItemsService.deleteLineItem(lineItemId, userId);

    if (!result.success) {
      return res.status(result.statusCode || 500).json(
        createErrorResponse(result.error, result.statusCode || 500)
      );
    }

    res.json(createApiResponse(true, result.data, 'Line item deleted successfully'));
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/invoices/:invoiceId/line-items/reorder
 * Reorder line items for an invoice
 */
router.put('/:invoiceId/line-items/reorder', async (req, res, next) => {
  try {
    const userId = req.userId; // From auth middleware
    const invoiceId = req.params.invoiceId;
    const { itemOrder } = req.body;

    if (!itemOrder || !Array.isArray(itemOrder)) {
      return res.status(400).json(
        createErrorResponse('itemOrder array is required', 400)
      );
    }

    const result = await invoiceLineItemsService.reorderLineItems(invoiceId, userId, itemOrder);

    if (!result.success) {
      return res.status(result.statusCode || 500).json(
        createErrorResponse(result.error, result.statusCode || 500)
      );
    }

    res.json(createApiResponse(true, result.data, 'Line items reordered successfully'));
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/invoices/:invoiceId/summary
 * Get complete invoice with line items
 */
router.get('/:invoiceId/summary', async (req, res, next) => {
  try {
    const userId = req.userId; // From auth middleware
    const invoiceId = req.params.invoiceId;

    const result = await invoiceLineItemsService.getInvoiceWithLineItems(invoiceId, userId);

    if (!result.success) {
      return res.status(result.statusCode || 500).json(
        createErrorResponse(result.error, result.statusCode || 500)
      );
    }

    res.json(createApiResponse(true, result.data, 'Invoice with line items retrieved successfully'));
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/invoices/:invoiceId/mark-paid
 * Mark invoice as paid and create payment record
 */
router.put('/:invoiceId/mark-paid', async (req, res, next) => {
  try {
    console.log('🔍 Mark-paid endpoint called');
    console.log('Request params:', req.params);
    console.log('Request body:', req.body);
    console.log('User ID from auth:', req.userId);

    const userId = req.userId; // From auth middleware
    const invoiceId = req.params.invoiceId;
    
    if (!userId) {
      console.error('❌ No userId found - authentication failed');
      return res.status(401).json(
        createErrorResponse('Authentication required', 401)
      );
    }

    const { 
      payment_method = 'bank_transfer',
      payment_notes = 'Marked as paid manually',
      payment_date = null 
    } = req.body;

    console.log(`💳 Marking invoice ${invoiceId} as paid for user ${userId}`);
    console.log('Payment details:', { payment_method, payment_notes, payment_date });

    // First, verify the invoice exists and belongs to the user
    console.log('🔍 Looking up invoice...');
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .select('*')
      .eq('id', invoiceId)
      .eq('user_id', userId)
      .single();

    console.log('Invoice lookup result:', { 
      found: !!invoice, 
      error: invoiceError?.message || 'None',
      invoiceStatus: invoice?.status 
    });

    if (invoiceError) {
      console.error('❌ Invoice lookup error:', invoiceError);
      return res.status(404).json(
        createErrorResponse(`Invoice lookup failed: ${invoiceError.message}`, 404)
      );
    }

    if (!invoice) {
      console.error('❌ Invoice not found or access denied');
      return res.status(404).json(
        createErrorResponse('Invoice not found or access denied', 404)
      );
    }

    // Check if invoice is already paid
    if (invoice.status === 'paid') {
      console.log('⚠️ Invoice is already paid');
      return res.status(400).json(
        createErrorResponse('Invoice is already marked as paid', 400)
      );
    }

    // Use provided payment date or current timestamp
    const paidAt = payment_date ? new Date(payment_date).toISOString() : new Date().toISOString();

    // Update invoice status and payment details
    const { data: updatedInvoice, error: updateError } = await supabase
      .from('invoices')
      .update({ 
        status: 'paid',
        paid_at: paidAt,
        payment_method: payment_method,
        payment_notes: payment_notes
      })
      .eq('id', invoiceId)
      .eq('user_id', userId)
      .select('*')
      .single();

    if (updateError) {
      console.error('Invoice update error:', updateError);
      throw new Error(`Failed to update invoice: ${updateError.message}`);
    }

    // Create payment record for tracking
    const paymentRecord = {
      invoice_id: invoiceId,
      amount: parseFloat(invoice.amount),
      currency: invoice.currency,
      status: 'successful',
      reference: `MANUAL-${Date.now()}-${invoiceId.slice(0, 8)}`,
      payment_method: payment_method,
      customer_email: invoice.customer_email,
      customer_name: invoice.customer_name,
      created_at: paidAt
    };

    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .insert(paymentRecord)
      .select('*')
      .single();

    if (paymentError) {
      console.warn('Payment record creation failed (non-critical):', paymentError);
      // Continue even if payment record fails - invoice is still marked as paid
    }

    console.log(`✅ Invoice ${invoiceId} marked as paid successfully`);
    console.log('Payment record created:', payment ? 'Yes' : 'No');

    res.json(createApiResponse(true, { 
      invoice: updatedInvoice, 
      payment: payment || null,
      message: 'Invoice marked as paid successfully'
    }, 'Invoice marked as paid successfully'));

  } catch (error) {
    console.error('Mark paid error:', error);
    next(error);
  }
});

module.exports = router;