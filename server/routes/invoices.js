/**
 * Invoice Routes
 * 
 * Express routes for invoice management operations related to clients
 */

const express = require('express');
const router = express.Router();
const invoiceService = require('../services/invoiceService');
const { createApiResponse, createErrorResponse, parsePaginationParams } = require('../utils');

/**
 * GET /api/clients/:clientId/invoices
 * Get all invoices for a specific client
 */
router.get('/:clientId/invoices', async (req, res, next) => {
  try {
    const userId = req.userId; // From auth middleware
    const clientId = req.params.clientId;
    const { status, sortBy, sortOrder } = req.query;
    const { page, limit, offset } = parsePaginationParams(req);

    const options = {
      status,
      limit,
      offset,
      sortBy,
      sortOrder
    };

    const result = await invoiceService.getClientInvoices(clientId, userId, options);

    if (!result.success) {
      return res.status(result.statusCode || 500).json(
        createErrorResponse(result.error, result.statusCode || 500)
      );
    }

    res.json(createApiResponse(true, result.data, 'Client invoices retrieved successfully'));
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/clients/:clientId/payments
 * Get payment history for a specific client
 */
router.get('/:clientId/payments', async (req, res, next) => {
  try {
    const userId = req.userId; // From auth middleware
    const clientId = req.params.clientId;
    const { sortBy, sortOrder } = req.query;
    const { page, limit, offset } = parsePaginationParams(req);

    const options = {
      limit,
      offset,
      sortBy,
      sortOrder
    };

    const result = await invoiceService.getClientPaymentHistory(clientId, userId, options);

    if (!result.success) {
      return res.status(result.statusCode || 500).json(
        createErrorResponse(result.error, result.statusCode || 500)
      );
    }

    res.json(createApiResponse(true, result.data, 'Client payment history retrieved successfully'));
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/clients/:clientId/financial-summary
 * Get financial summary for a specific client
 */
router.get('/:clientId/financial-summary', async (req, res, next) => {
  try {
    const userId = req.userId; // From auth middleware
    const clientId = req.params.clientId;

    const result = await invoiceService.getClientFinancialSummary(clientId, userId);

    if (!result.success) {
      return res.status(result.statusCode || 500).json(
        createErrorResponse(result.error, result.statusCode || 500)
      );
    }

    res.json(createApiResponse(true, result.data, 'Client financial summary retrieved successfully'));
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/clients/:clientId/invoice-aging
 * Get invoice aging report for a specific client
 */
router.get('/:clientId/invoice-aging', async (req, res, next) => {
  try {
    const userId = req.userId; // From auth middleware
    const clientId = req.params.clientId;

    const result = await invoiceService.getClientInvoiceAging(clientId, userId);

    if (!result.success) {
      return res.status(result.statusCode || 500).json(
        createErrorResponse(result.error, result.statusCode || 500)
      );
    }

    res.json(createApiResponse(true, result.data, 'Client invoice aging retrieved successfully'));
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/clients/:clientId/activity
 * Get recent activity (invoices and payments) for a specific client
 */
router.get('/:clientId/activity', async (req, res, next) => {
  try {
    const userId = req.userId; // From auth middleware
    const clientId = req.params.clientId;
    const { limit } = req.query;

    const options = {
      limit: limit ? parseInt(limit) : 20
    };

    const result = await invoiceService.getClientActivity(clientId, userId, options);

    if (!result.success) {
      return res.status(result.statusCode || 500).json(
        createErrorResponse(result.error, result.statusCode || 500)
      );
    }

    res.json(createApiResponse(true, result.data, 'Client activity retrieved successfully'));
  } catch (error) {
    next(error);
  }
});

module.exports = router;