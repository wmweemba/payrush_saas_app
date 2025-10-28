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
    console.log('=== PUBLIC INVOICE REQUEST ===');
    console.log('Invoice ID:', invoiceId);

    if (!invoiceId) {
      console.log('ERROR: No invoice ID provided');
      return res.status(400).json(
        createErrorResponse('Invoice ID is required', 400)
      );
    }

    // Get invoice details with line items
    console.log('Fetching invoice from database...');
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
        user_id
      `)
      .eq('id', invoiceId)
      .single();

    console.log('Invoice query result:', { 
      found: !!invoice, 
      error: invoiceError ? invoiceError.message : null,
      errorCode: invoiceError ? invoiceError.code : null,
      errorDetails: invoiceError ? invoiceError.details : null
    });

    if (invoiceError) {
      console.error('Invoice fetch error:', JSON.stringify(invoiceError, null, 2));
      return res.status(404).json(
        createErrorResponse(`Invoice not found: ${invoiceError.message}`, 404)
      );
    }

    if (!invoice) {
      console.log('ERROR: Invoice query returned no data');
      return res.status(404).json(
        createErrorResponse('Invoice not found', 404)
      );
    }

    console.log('Invoice found:', {
      id: invoice.id,
      customer: invoice.customer_name,
      user_id: invoice.user_id,
      is_line_item: invoice.is_line_item_invoice
    });

    console.log('Invoice found:', {
      id: invoice.id,
      customer: invoice.customer_name,
      user_id: invoice.user_id,
      is_line_item: invoice.is_line_item_invoice
    });

    // Get profile/business information separately
    let businessInfo = {
      name: null,
      business_name: null,
      phone: null,
      address: null,
      website: null
    };

    if (invoice.user_id) {
      console.log('Fetching profile for user_id:', invoice.user_id);
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('name, business_name, phone, address, website')
        .eq('id', invoice.user_id)
        .single();

      if (!profileError && profile) {
        console.log('Profile found:', profile.business_name || profile.name);
        businessInfo = profile;
      } else {
        console.warn('Profile not found for invoice:', invoiceId, profileError?.message);
      }
    } else {
      console.warn('Invoice has no user_id');
    }

    // Get line items if it's a line item invoice
    let lineItems = [];
    if (invoice.is_line_item_invoice) {
      console.log('Fetching line items...');
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
        console.log(`Found ${lineItems.length} line items`);
      } else {
        console.warn('Error fetching line items:', itemsError?.message);
      }
    }

    // Calculate final amount
    const finalAmount = invoice.is_line_item_invoice 
      ? (invoice.calculated_total || 0)
      : (invoice.amount || 0);

    console.log('Preparing response with final amount:', finalAmount);

    // Don't expose sensitive information (user_id removed)
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
      line_items: lineItems,
      line_item_count: lineItems.length,
      business: {
        name: businessInfo.name,
        business_name: businessInfo.business_name,
        phone: businessInfo.phone,
        address: businessInfo.address,
        website: businessInfo.website
      }
    };

    console.log('Successfully returning invoice data');
    console.log('=== END PUBLIC INVOICE REQUEST ===\n');
    res.json(createApiResponse(true, { invoice: publicInvoice }, 'Invoice retrieved successfully'));
  } catch (error) {
    console.error('ERROR in public invoice route:', error);
    console.error('Error stack:', error.stack);
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