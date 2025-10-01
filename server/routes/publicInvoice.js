/**
 * Public Invoice Routes
 * 
 * Express routes for public invoice access (no authentication required)
 */

const express = require('express');
const router = express.Router();
const { supabase } = require('../config/database');
const { createApiResponse, createErrorResponse } = require('../utils');

/**
 * GET /api/public/invoice/:invoiceId
 * Get public invoice details (no authentication required)
 */
router.get('/invoice/:invoiceId', async (req, res, next) => {
  try {
    const invoiceId = req.params.invoiceId;

    if (!invoiceId) {
      return res.status(400).json(
        createErrorResponse('Invoice ID is required', 400)
      );
    }

    // Get invoice details with line items
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .select(`
        id,
        customer_name,
        customer_email,
        amount,
        currency,
        status,
        due_date,
        created_at,
        is_line_item_invoice,
        calculated_total,
        notes,
        profiles!inner(
          name,
          business_name,
          phone,
          address,
          website
        )
      `)
      .eq('id', invoiceId)
      .single();

    if (invoiceError || !invoice) {
      return res.status(404).json(
        createErrorResponse('Invoice not found', 404)
      );
    }

    // Get line items if it's a line item invoice
    let lineItems = [];
    if (invoice.is_line_item_invoice) {
      const { data: items, error: itemsError } = await supabase
        .from('invoice_items')
        .select(`
          id,
          description,
          quantity,
          unit_price,
          line_total,
          sort_order
        `)
        .eq('invoice_id', invoiceId)
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: true });

      if (!itemsError) {
        lineItems = items || [];
      }
    }

    // Calculate final amount
    const finalAmount = invoice.is_line_item_invoice 
      ? (invoice.calculated_total || 0)
      : (invoice.amount || 0);

    // Don't expose sensitive information
    const publicInvoice = {
      id: invoice.id,
      customer_name: invoice.customer_name,
      customer_email: invoice.customer_email,
      amount: invoice.amount,
      currency: invoice.currency,
      status: invoice.status,
      due_date: invoice.due_date,
      created_at: invoice.created_at,
      is_line_item_invoice: invoice.is_line_item_invoice,
      calculated_total: invoice.calculated_total,
      final_amount: finalAmount,
      notes: invoice.notes,
      line_items: lineItems,
      line_item_count: lineItems.length,
      business: {
        name: invoice.profiles.name,
        business_name: invoice.profiles.business_name,
        phone: invoice.profiles.phone,
        address: invoice.profiles.address,
        website: invoice.profiles.website
      }
    };

    res.json(createApiResponse(true, { invoice: publicInvoice }, 'Invoice retrieved successfully'));
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/public/invoice/:invoiceId/payment-status
 * Check payment status for an invoice (for real-time updates)
 */
router.get('/invoice/:invoiceId/payment-status', async (req, res, next) => {
  try {
    const invoiceId = req.params.invoiceId;

    if (!invoiceId) {
      return res.status(400).json(
        createErrorResponse('Invoice ID is required', 400)
      );
    }

    // Get basic invoice status
    const { data: invoice, error } = await supabase
      .from('invoices')
      .select('id, status, amount, currency, calculated_total, is_line_item_invoice')
      .eq('id', invoiceId)
      .single();

    if (error || !invoice) {
      return res.status(404).json(
        createErrorResponse('Invoice not found', 404)
      );
    }

    const finalAmount = invoice.is_line_item_invoice 
      ? (invoice.calculated_total || 0)
      : (invoice.amount || 0);

    // Get recent payments for this invoice
    const { data: payments } = await supabase
      .from('payments')
      .select('id, amount, status, created_at, provider')
      .eq('invoice_id', invoiceId)
      .order('created_at', { ascending: false })
      .limit(5);

    res.json(createApiResponse(true, {
      invoice_id: invoice.id,
      status: invoice.status,
      amount: finalAmount,
      currency: invoice.currency,
      recent_payments: payments || []
    }, 'Payment status retrieved successfully'));
  } catch (error) {
    next(error);
  }
});

module.exports = router;