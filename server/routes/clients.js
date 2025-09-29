/**
 * Client Routes
 * 
 * Express routes for client management operations
 * Migrated from Next.js API routes to Express
 */

const express = require('express');
const router = express.Router();
const clientService = require('../services/clientService');
// Temporarily using mock service for testing - switch back to real service once Supabase is fixed
// const clientService = require('../services/clientService.mock');
const invoiceService = require('../services/invoiceService');
const { createApiResponse, createErrorResponse, parsePaginationParams } = require('../utils');

/**
 * GET /api/clients
 * Fetch all clients for a user with filtering and search
 */
router.get('/', async (req, res, next) => {
  try {
    const userId = req.userId; // From auth middleware
    const { search, tag, sortBy, sortOrder } = req.query;
    const { page, limit, offset } = parsePaginationParams(req);

    const options = {
      search,
      tag,
      limit,
      offset,
      sortBy,
      sortOrder
    };

    const result = await clientService.getClients(userId, options);

    if (!result.success) {
      return res.status(result.statusCode || 500).json(
        createErrorResponse(result.error, result.statusCode || 500)
      );
    }

    res.json(createApiResponse(true, result.data, 'Clients retrieved successfully'));
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/clients/stats
 * Get client statistics for a user
 */
router.get('/stats', async (req, res, next) => {
  try {
    const userId = req.userId; // From auth middleware

    const result = await clientService.getClientStats(userId);

    if (!result.success) {
      return res.status(result.statusCode || 500).json(
        createErrorResponse(result.error, result.statusCode || 500)
      );
    }

    res.json(createApiResponse(true, result.data, 'Client statistics retrieved successfully'));
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/clients
 * Create a new client
 */
router.post('/', async (req, res, next) => {
  try {
    const userId = req.userId; // From auth middleware
    const clientData = req.body;

    const result = await clientService.createClient(userId, clientData);

    if (!result.success) {
      return res.status(result.statusCode || 500).json(
        createErrorResponse(result.error, result.statusCode || 500)
      );
    }

    res.status(201).json(createApiResponse(true, result.data, 'Client created successfully'));
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/clients/:id
 * Get a specific client by ID
 */
router.get('/:id', async (req, res, next) => {
  try {
    const userId = req.userId; // From auth middleware
    const clientId = req.params.id;

    const result = await clientService.getClientById(clientId, userId);

    if (!result.success) {
      return res.status(result.statusCode || 500).json(
        createErrorResponse(result.error, result.statusCode || 500)
      );
    }

    res.json(createApiResponse(true, result.data, 'Client retrieved successfully'));
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/clients/:id
 * Update a client
 */
router.put('/:id', async (req, res, next) => {
  try {
    const userId = req.userId; // From auth middleware
    const clientId = req.params.id;
    const clientData = req.body;

    const result = await clientService.updateClient(clientId, userId, clientData);

    if (!result.success) {
      return res.status(result.statusCode || 500).json(
        createErrorResponse(result.error, result.statusCode || 500)
      );
    }

    res.json(createApiResponse(true, result.data, 'Client updated successfully'));
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/clients/:id
 * Delete a client (soft delete)
 */
router.delete('/:id', async (req, res, next) => {
  try {
    const userId = req.userId; // From auth middleware
    const clientId = req.params.id;

    const result = await clientService.deleteClient(clientId, userId);

    if (!result.success) {
      return res.status(result.statusCode || 500).json(
        createErrorResponse(result.error, result.statusCode || 500)
      );
    }

    res.json(createApiResponse(true, result.data, 'Client deleted successfully'));
  } catch (error) {
    next(error);
  }
});

// ============ ENHANCED CONTACT MANAGEMENT ROUTES ============

/**
 * GET /api/clients/:id/contacts
 * Get all contacts for a client
 */
router.get('/:id/contacts', async (req, res, next) => {
  try {
    const userId = req.userId; // From auth middleware
    const clientId = req.params.id;

    const result = await clientService.getClientContacts(clientId, userId);

    if (!result.success) {
      return res.status(result.statusCode || 500).json(
        createErrorResponse(result.error, result.statusCode || 500)
      );
    }

    res.json(createApiResponse(true, result.data, 'Client contacts retrieved successfully'));
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/clients/:id/contacts
 * Add a new contact to a client
 */
router.post('/:id/contacts', async (req, res, next) => {
  try {
    const userId = req.userId; // From auth middleware
    const clientId = req.params.id;
    const contactData = req.body;

    const result = await clientService.addClientContact(clientId, userId, contactData);

    if (!result.success) {
      return res.status(result.statusCode || 500).json(
        createErrorResponse(result.error, result.statusCode || 500)
      );
    }

    res.status(201).json(createApiResponse(true, result.data, 'Contact added successfully'));
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/clients/:id/contacts/:contactId
 * Update a client contact
 */
router.put('/:id/contacts/:contactId', async (req, res, next) => {
  try {
    const userId = req.userId; // From auth middleware
    const contactId = req.params.contactId;
    const contactData = req.body;

    const result = await clientService.updateClientContact(contactId, userId, contactData);

    if (!result.success) {
      return res.status(result.statusCode || 500).json(
        createErrorResponse(result.error, result.statusCode || 500)
      );
    }

    res.json(createApiResponse(true, result.data, 'Contact updated successfully'));
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/clients/:id/contacts/:contactId
 * Delete a client contact
 */
router.delete('/:id/contacts/:contactId', async (req, res, next) => {
  try {
    const userId = req.userId; // From auth middleware
    const contactId = req.params.contactId;

    const result = await clientService.deleteClientContact(contactId, userId);

    if (!result.success) {
      return res.status(result.statusCode || 500).json(
        createErrorResponse(result.error, result.statusCode || 500)
      );
    }

    res.json(createApiResponse(true, result.data, 'Contact deleted successfully'));
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/clients/:id/addresses
 * Get all addresses for a client
 */
router.get('/:id/addresses', async (req, res, next) => {
  try {
    const userId = req.userId; // From auth middleware
    const clientId = req.params.id;

    const result = await clientService.getClientAddresses(clientId, userId);

    if (!result.success) {
      return res.status(result.statusCode || 500).json(
        createErrorResponse(result.error, result.statusCode || 500)
      );
    }

    res.json(createApiResponse(true, result.data, 'Client addresses retrieved successfully'));
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/clients/:id/addresses
 * Add a new address to a client
 */
router.post('/:id/addresses', async (req, res, next) => {
  try {
    const userId = req.userId; // From auth middleware
    const clientId = req.params.id;
    const addressData = req.body;

    const result = await clientService.addClientAddress(clientId, userId, addressData);

    if (!result.success) {
      return res.status(result.statusCode || 500).json(
        createErrorResponse(result.error, result.statusCode || 500)
      );
    }

    res.status(201).json(createApiResponse(true, result.data, 'Address added successfully'));
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/clients/:id/addresses/:addressId
 * Update a client address
 */
router.put('/:id/addresses/:addressId', async (req, res, next) => {
  try {
    const userId = req.userId; // From auth middleware
    const addressId = req.params.addressId;
    const addressData = req.body;

    const result = await clientService.updateClientAddress(addressId, userId, addressData);

    if (!result.success) {
      return res.status(result.statusCode || 500).json(
        createErrorResponse(result.error, result.statusCode || 500)
      );
    }

    res.json(createApiResponse(true, result.data, 'Address updated successfully'));
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/clients/:id/addresses/:addressId
 * Delete a client address
 */
router.delete('/:id/addresses/:addressId', async (req, res, next) => {
  try {
    const userId = req.userId; // From auth middleware
    const addressId = req.params.addressId;

    const result = await clientService.deleteClientAddress(addressId, userId);

    if (!result.success) {
      return res.status(result.statusCode || 500).json(
        createErrorResponse(result.error, result.statusCode || 500)
      );
    }

    res.json(createApiResponse(true, result.data, 'Address deleted successfully'));
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/clients/:id/invoices
 * Get all invoices for a specific client
 */
router.get('/:id/invoices', async (req, res, next) => {
  try {
    const userId = req.userId; // From auth middleware
    const clientId = req.params.id;
    const { status, dateFrom, dateTo, sortBy, sortOrder } = req.query;

    const result = await invoiceService.getClientInvoices(
      clientId, 
      userId,
      { status, dateFrom, dateTo, sortBy, sortOrder }
    );

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
 * GET /api/clients/:id/payment-history
 * Get payment history for a specific client
 */
router.get('/:id/payment-history', async (req, res, next) => {
  try {
    const userId = req.userId; // From auth middleware
    const clientId = req.params.id;
    const { dateFrom, dateTo, limit } = req.query;

    const result = await invoiceService.getClientPaymentHistory(
      clientId, 
      userId,
      { dateFrom, dateTo, limit: limit ? parseInt(limit) : undefined }
    );

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
 * GET /api/clients/:id/financial-summary
 * Get comprehensive financial summary for a specific client
 */
router.get('/:id/financial-summary', async (req, res, next) => {
  try {
    const userId = req.userId; // From auth middleware
    const clientId = req.params.id;

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
 * GET /api/clients/:id/invoice-aging
 * Get invoice aging analysis for a specific client
 */
router.get('/:id/invoice-aging', async (req, res, next) => {
  try {
    const userId = req.userId; // From auth middleware
    const clientId = req.params.id;

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
 * GET /api/clients/:id/activity
 * Get recent activity for a specific client
 */
router.get('/:id/activity', async (req, res, next) => {
  try {
    const userId = req.userId; // From auth middleware
    const clientId = req.params.id;
    const { limit } = req.query;

    const result = await invoiceService.getClientActivity(
      clientId, 
      userId,
      { limit: limit ? parseInt(limit) : undefined }
    );

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