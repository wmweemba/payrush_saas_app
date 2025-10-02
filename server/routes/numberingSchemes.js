/**
 * Invoice Numbering Scheme Routes
 * 
 * Express routes for invoice numbering scheme management operations
 */

const express = require('express');
const router = express.Router();
const numberingSchemeService = require('../services/numberingSchemeService');
const { createApiResponse, createErrorResponse, parsePaginationParams } = require('../utils');

/**
 * GET /api/numbering-schemes
 * Get all numbering schemes for the authenticated user
 */
router.get('/', async (req, res, next) => {
  try {
    const userId = req.userId; // From auth middleware
    const { sortBy, sortOrder } = req.query;
    const { page, limit, offset } = parsePaginationParams(req);

    const options = {
      limit,
      offset,
      sortBy,
      sortOrder
    };

    const result = await numberingSchemeService.getNumberingSchemes(userId, options);

    if (!result.success) {
      return res.status(result.statusCode || 500).json(
        createErrorResponse(result.error, result.statusCode || 500)
      );
    }

    res.json(createApiResponse(true, result.data, 'Numbering schemes retrieved successfully'));
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/numbering-schemes/:id
 * Get a specific numbering scheme by ID
 */
router.get('/:id', async (req, res, next) => {
  try {
    const userId = req.userId;
    const schemeId = req.params.id;

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(schemeId)) {
      return res.status(400).json(
        createErrorResponse('Invalid scheme ID format', 400)
      );
    }

    const result = await numberingSchemeService.getNumberingScheme(schemeId, userId);

    if (!result.success) {
      return res.status(result.statusCode || 500).json(
        createErrorResponse(result.error, result.statusCode || 500)
      );
    }

    res.json(createApiResponse(true, result.data, 'Numbering scheme retrieved successfully'));
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/numbering-schemes
 * Create a new numbering scheme
 */
router.post('/', async (req, res, next) => {
  try {
    const userId = req.userId;
    const schemeData = req.body;

    // Basic validation
    if (!schemeData.scheme_name) {
      return res.status(400).json(
        createErrorResponse('Scheme name is required', 400)
      );
    }

    const result = await numberingSchemeService.createNumberingScheme(userId, schemeData);

    if (!result.success) {
      return res.status(result.statusCode || 500).json(
        createErrorResponse(result.error, result.statusCode || 500)
      );
    }

    res.status(201).json(createApiResponse(true, result.data, 'Numbering scheme created successfully'));
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/numbering-schemes/:id
 * Update an existing numbering scheme
 */
router.put('/:id', async (req, res, next) => {
  try {
    const userId = req.userId;
    const schemeId = req.params.id;
    const updateData = req.body;

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(schemeId)) {
      return res.status(400).json(
        createErrorResponse('Invalid scheme ID format', 400)
      );
    }

    const result = await numberingSchemeService.updateNumberingScheme(schemeId, userId, updateData);

    if (!result.success) {
      return res.status(result.statusCode || 500).json(
        createErrorResponse(result.error, result.statusCode || 500)
      );
    }

    res.json(createApiResponse(true, result.data, 'Numbering scheme updated successfully'));
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/numbering-schemes/:id
 * Delete a numbering scheme
 */
router.delete('/:id', async (req, res, next) => {
  try {
    const userId = req.userId;
    const schemeId = req.params.id;

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(schemeId)) {
      return res.status(400).json(
        createErrorResponse('Invalid scheme ID format', 400)
      );
    }

    const result = await numberingSchemeService.deleteNumberingScheme(schemeId, userId);

    if (!result.success) {
      return res.status(result.statusCode || 500).json(
        createErrorResponse(result.error, result.statusCode || 500)
      );
    }

    res.json(createApiResponse(true, result.data, 'Numbering scheme deleted successfully'));
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/numbering-schemes/:id/default
 * Set a numbering scheme as the default scheme
 */
router.put('/:id/default', async (req, res, next) => {
  try {
    const userId = req.userId;
    const schemeId = req.params.id;

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(schemeId)) {
      return res.status(400).json(
        createErrorResponse('Invalid scheme ID format', 400)
      );
    }

    const result = await numberingSchemeService.setDefaultScheme(schemeId, userId);

    if (!result.success) {
      return res.status(result.statusCode || 500).json(
        createErrorResponse(result.error, result.statusCode || 500)
      );
    }

    res.json(createApiResponse(true, result.data, 'Default numbering scheme updated successfully'));
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/numbering-schemes/:id/generate
 * Generate the next invoice number for a scheme
 */
router.post('/:id/generate', async (req, res, next) => {
  try {
    const userId = req.userId;
    const schemeId = req.params.id;

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(schemeId)) {
      return res.status(400).json(
        createErrorResponse('Invalid scheme ID format', 400)
      );
    }

    const result = await numberingSchemeService.generateNextInvoiceNumber(schemeId, userId);

    if (!result.success) {
      return res.status(result.statusCode || 500).json(
        createErrorResponse(result.error, result.statusCode || 500)
      );
    }

    res.json(createApiResponse(true, result.data, 'Invoice number generated successfully'));
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/numbering-schemes/:id/preview
 * Preview what the next invoice number would be
 */
router.get('/:id/preview', async (req, res, next) => {
  try {
    const userId = req.userId;
    const schemeId = req.params.id;

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(schemeId)) {
      return res.status(400).json(
        createErrorResponse('Invalid scheme ID format', 400)
      );
    }

    const result = await numberingSchemeService.previewNextInvoiceNumber(schemeId, userId);

    if (!result.success) {
      return res.status(result.statusCode || 500).json(
        createErrorResponse(result.error, result.statusCode || 500)
      );
    }

    res.json(createApiResponse(true, result.data, 'Invoice number preview generated successfully'));
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/numbering-schemes/initialize
 * Initialize default numbering scheme for a new user
 */
router.post('/initialize', async (req, res, next) => {
  try {
    const userId = req.userId;

    const result = await numberingSchemeService.initializeDefaultScheme(userId);

    if (!result.success) {
      return res.status(result.statusCode || 500).json(
        createErrorResponse(result.error, result.statusCode || 500)
      );
    }

    res.json(createApiResponse(true, { message: result.message }, 'Numbering scheme initialized successfully'));
  } catch (error) {
    next(error);
  }
});

module.exports = router;