/**
 * Payment Routes
 * 
 * Express routes for payment processing and verification
 * Migrated from Next.js API routes to Express
 */

const express = require('express');
const router = express.Router();
const paymentService = require('../services/paymentService');
const { createApiResponse, createErrorResponse, parsePaginationParams } = require('../utils');

/**
 * POST /api/payments/verify
 * Verifies payment with Flutterwave and updates invoice status
 */
router.post('/verify', async (req, res, next) => {
  try {
    const userId = req.userId; // From auth middleware
    const { transaction_id, invoice_id } = req.body;

    const result = await paymentService.verifyPayment(transaction_id, invoice_id, userId);

    if (!result.success) {
      return res.status(result.statusCode || 500).json(result);
    }

    res.json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/payments/history
 * Get payment history for the authenticated user
 */
router.get('/history', async (req, res, next) => {
  try {
    const userId = req.userId; // From auth middleware
    const { status, currency } = req.query;
    const { page, limit, offset } = parsePaginationParams(req);

    const options = {
      limit,
      offset,
      status,
      currency
    };

    const result = await paymentService.getPaymentHistory(userId, options);

    if (!result.success) {
      return res.status(result.statusCode || 500).json(result);
    }

    res.json(result);
  } catch (error) {
    next(error);
  }
});

module.exports = router;