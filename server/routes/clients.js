/**
 * Client Routes
 * 
 * Express routes for client management operations
 * Migrated from Next.js API routes to Express
 */

const express = require('express');
const router = express.Router();
const clientService = require('../services/clientService');
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

module.exports = router;