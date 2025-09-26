/**
 * Webhook Routes
 * 
 * Express routes for handling payment provider webhooks
 * Migrated from Next.js API routes to Express
 */

const express = require('express');
const router = express.Router();
const paymentService = require('../services/paymentService');
const { createApiResponse, createErrorResponse } = require('../utils');

/**
 * POST /api/webhooks/flutterwave
 * Handle Flutterwave webhook notifications
 */
router.post('/flutterwave', async (req, res, next) => {
  try {
    const body = req.body;
    const signature = req.headers['verif-hash'];

    // Log webhook for debugging (remove in production)
    if (process.env.NODE_ENV !== 'production') {
      console.log('Flutterwave webhook received:', {
        event: body.event,
        data: body.data
      });
    }

    // Verify webhook signature
    const isValid = paymentService.verifyWebhookSignature(body, signature);
    if (!isValid) {
      return res.status(401).json(
        createErrorResponse('Invalid webhook signature', 401)
      );
    }

    // Process the webhook
    const result = await paymentService.processWebhook(body);

    if (!result.success) {
      return res.status(result.statusCode || 500).json(result);
    }

    res.json(createApiResponse(true, result.data, 'Webhook processed successfully'));
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/webhooks/flutterwave
 * Health check endpoint for Flutterwave webhook
 */
router.get('/flutterwave', (req, res) => {
  res.json(createApiResponse(true, {
    service: 'flutterwave-webhook',
    status: 'operational',
    timestamp: new Date().toISOString()
  }, 'Flutterwave webhook endpoint is operational'));
});

/**
 * POST /api/webhooks/stripe (Future implementation)
 * Handle Stripe webhook notifications
 */
router.post('/stripe', async (req, res, next) => {
  try {
    // TODO: Implement Stripe webhook handling when needed
    res.json(createApiResponse(false, null, 'Stripe webhooks not implemented yet'));
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/webhooks/stripe
 * Health check endpoint for Stripe webhook
 */
router.get('/stripe', (req, res) => {
  res.json(createApiResponse(true, {
    service: 'stripe-webhook',
    status: 'not-implemented',
    timestamp: new Date().toISOString()
  }, 'Stripe webhook endpoint placeholder'));
});

module.exports = router;