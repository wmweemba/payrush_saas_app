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
const currencyService = require('../services/currencyService');
const communicationService = require('../services/communicationService');
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

/**
 * GET /api/clients/:id/currency-preferences
 * Get currency and payment preferences for a specific client
 */
router.get('/:id/currency-preferences', async (req, res, next) => {
  try {
    const userId = req.userId; // From auth middleware
    const clientId = req.params.id;

    const result = await currencyService.getClientCurrencyPreferences(clientId, userId);

    if (!result.success) {
      return res.status(result.statusCode || 500).json(
        createErrorResponse(result.error, result.statusCode || 500)
      );
    }

    res.json(createApiResponse(true, result.data, 'Client currency preferences retrieved successfully'));
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/clients/:id/currency-preferences
 * Update currency and payment preferences for a specific client
 */
router.put('/:id/currency-preferences', async (req, res, next) => {
  try {
    const userId = req.userId; // From auth middleware
    const clientId = req.params.id;
    const preferences = req.body;

    const result = await currencyService.updateClientCurrencyPreferences(clientId, userId, preferences);

    if (!result.success) {
      return res.status(result.statusCode || 500).json(
        createErrorResponse(result.error, result.statusCode || 500)
      );
    }

    res.json(createApiResponse(true, result.data, 'Client currency preferences updated successfully'));
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/clients/currencies
 * Get all supported currencies and payment methods
 */
router.get('/currencies', async (req, res, next) => {
  try {
    const currencies = currencyService.getSupportedCurrencies();
    const paymentMethods = Object.values(currencyService.PAYMENT_METHODS);

    res.json(createApiResponse(true, {
      currencies,
      payment_methods: paymentMethods
    }, 'Supported currencies and payment methods retrieved successfully'));
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/clients/exchange-rates
 * Get current exchange rates
 */
router.get('/exchange-rates', async (req, res, next) => {
  try {
    const { base_currency = 'USD' } = req.query;
    const rates = await currencyService.getExchangeRates(base_currency);

    res.json(createApiResponse(true, {
      base_currency,
      rates,
      last_updated: new Date().toISOString()
    }, 'Exchange rates retrieved successfully'));
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/clients/:id/notes
 * Get all notes for a specific client
 */
router.get('/:id/notes', async (req, res, next) => {
  try {
    const userId = req.userId; // From auth middleware
    const clientId = req.params.id;
    const { 
      note_type, 
      priority, 
      tags, 
      search, 
      start_date, 
      end_date, 
      include_completed = 'true',
      limit = '20',
      offset = '0'
    } = req.query;

    const options = {
      noteType: note_type,
      priority,
      tags: tags ? tags.split(',') : undefined,
      search,
      startDate: start_date,
      endDate: end_date,
      includeCompleted: include_completed === 'true',
      limit: parseInt(limit),
      offset: parseInt(offset)
    };

    const result = await communicationService.getClientNotes(clientId, userId, options);

    if (!result.success) {
      return res.status(result.statusCode || 500).json(
        createErrorResponse(result.error, result.statusCode || 500)
      );
    }

    res.json(createApiResponse(true, result.data, 'Client notes retrieved successfully'));
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/clients/:id/notes
 * Create a new note for a specific client
 */
router.post('/:id/notes', async (req, res, next) => {
  try {
    const userId = req.userId; // From auth middleware
    const clientId = req.params.id;
    const noteData = req.body;

    const result = await communicationService.createClientNote(clientId, userId, noteData);

    if (!result.success) {
      return res.status(result.statusCode || 500).json(
        createErrorResponse(result.error, result.statusCode || 500)
      );
    }

    res.status(201).json(createApiResponse(true, result.data, 'Client note created successfully'));
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/clients/:id/notes/:noteId
 * Update a specific client note
 */
router.put('/:id/notes/:noteId', async (req, res, next) => {
  try {
    const userId = req.userId; // From auth middleware
    const noteId = req.params.noteId;
    const updates = req.body;

    const result = await communicationService.updateClientNote(noteId, userId, updates);

    if (!result.success) {
      return res.status(result.statusCode || 500).json(
        createErrorResponse(result.error, result.statusCode || 500)
      );
    }

    res.json(createApiResponse(true, result.data, 'Client note updated successfully'));
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/clients/:id/notes/:noteId
 * Delete a specific client note
 */
router.delete('/:id/notes/:noteId', async (req, res, next) => {
  try {
    const userId = req.userId; // From auth middleware
    const noteId = req.params.noteId;

    const result = await communicationService.deleteClientNote(noteId, userId);

    if (!result.success) {
      return res.status(result.statusCode || 500).json(
        createErrorResponse(result.error, result.statusCode || 500)
      );
    }

    res.json(createApiResponse(true, result.data, 'Client note deleted successfully'));
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/clients/:id/timeline
 * Get activity timeline for a specific client
 */
router.get('/:id/timeline', async (req, res, next) => {
  try {
    const userId = req.userId; // From auth middleware
    const clientId = req.params.id;
    const { limit = '50' } = req.query;

    const result = await communicationService.getClientTimeline(clientId, userId, {
      limit: parseInt(limit)
    });

    if (!result.success) {
      return res.status(result.statusCode || 500).json(
        createErrorResponse(result.error, result.statusCode || 500)
      );
    }

    res.json(createApiResponse(true, result.data, 'Client timeline retrieved successfully'));
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/clients/:id/reminders
 * Get reminders for a specific client
 */
router.get('/:id/reminders', async (req, res, next) => {
  try {
    const userId = req.userId; // From auth middleware
    const clientId = req.params.id;
    const { 
      status = 'pending', 
      upcoming_only = 'false',
      limit = '20',
      offset = '0'
    } = req.query;

    const options = {
      status,
      upcoming_only: upcoming_only === 'true',
      limit: parseInt(limit),
      offset: parseInt(offset)
    };

    const result = await communicationService.getClientReminders(clientId, userId, options);

    if (!result.success) {
      return res.status(result.statusCode || 500).json(
        createErrorResponse(result.error, result.statusCode || 500)
      );
    }

    res.json(createApiResponse(true, result.data, 'Client reminders retrieved successfully'));
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/clients/:id/reminders
 * Create a new reminder for a specific client
 */
router.post('/:id/reminders', async (req, res, next) => {
  try {
    const userId = req.userId; // From auth middleware
    const clientId = req.params.id;
    const reminderData = req.body;

    const result = await communicationService.createReminder(clientId, userId, reminderData);

    if (!result.success) {
      return res.status(result.statusCode || 500).json(
        createErrorResponse(result.error, result.statusCode || 500)
      );
    }

    res.status(201).json(createApiResponse(true, result.data, 'Client reminder created successfully'));
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/clients/:id/communication-stats
 * Get communication statistics for a specific client
 */
router.get('/:id/communication-stats', async (req, res, next) => {
  try {
    const userId = req.userId; // From auth middleware
    const clientId = req.params.id;

    const result = await communicationService.getClientCommunicationStats(clientId, userId);

    if (!result.success) {
      return res.status(result.statusCode || 500).json(
        createErrorResponse(result.error, result.statusCode || 500)
      );
    }

    res.json(createApiResponse(true, result.data, 'Client communication stats retrieved successfully'));
  } catch (error) {
    next(error);
  }
});

module.exports = router;