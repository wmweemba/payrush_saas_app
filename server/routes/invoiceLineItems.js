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

module.exports = router;