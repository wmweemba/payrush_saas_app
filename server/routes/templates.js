/**
 * Invoice Template Routes
 * 
 * Express routes for invoice template management operations
 */

const express = require('express');
const router = express.Router();
const templateService = require('../services/templateService');
const { createApiResponse, createErrorResponse, parsePaginationParams } = require('../utils');

/**
 * GET /api/templates
 * Get all templates for the authenticated user
 */
router.get('/', async (req, res, next) => {
  try {
    const userId = req.userId; // From auth middleware
    const { 
      includeSystem, 
      templateType, 
      sortBy, 
      sortOrder 
    } = req.query;
    const { page, limit, offset } = parsePaginationParams(req);

    const options = {
      includeSystem: includeSystem === 'true',
      templateType,
      limit,
      offset,
      sortBy,
      sortOrder
    };

    const result = await templateService.getTemplates(userId, options);

    if (!result.success) {
      return res.status(result.statusCode || 500).json(
        createErrorResponse(result.error, result.statusCode || 500)
      );
    }

    res.json(createApiResponse(true, result.data, 'Templates retrieved successfully'));
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/templates/stats
 * Get template usage statistics
 */
router.get('/stats', async (req, res, next) => {
  try {
    const userId = req.userId;

    const result = await templateService.getTemplateStats(userId);

    if (!result.success) {
      return res.status(result.statusCode || 500).json(
        createErrorResponse(result.error, result.statusCode || 500)
      );
    }

    res.json(createApiResponse(true, result.data, 'Template statistics retrieved successfully'));
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/templates/:id
 * Get a specific template by ID
 */
router.get('/:id', async (req, res, next) => {
  try {
    const userId = req.userId;
    const templateId = req.params.id;

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(templateId)) {
      return res.status(400).json(
        createErrorResponse('Invalid template ID format', 400)
      );
    }

    const result = await templateService.getTemplate(templateId, userId);

    if (!result.success) {
      return res.status(result.statusCode || 500).json(
        createErrorResponse(result.error, result.statusCode || 500)
      );
    }

    res.json(createApiResponse(true, result.data, 'Template retrieved successfully'));
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/templates
 * Create a new template
 */
router.post('/', async (req, res, next) => {
  try {
    const userId = req.userId;
    const templateData = req.body;

    // Basic validation
    if (!templateData.template_name) {
      return res.status(400).json(
        createErrorResponse('Template name is required', 400)
      );
    }

    if (!templateData.template_data) {
      return res.status(400).json(
        createErrorResponse('Template data is required', 400)
      );
    }

    // Validate template data structure
    if (typeof templateData.template_data !== 'object') {
      return res.status(400).json(
        createErrorResponse('Template data must be a valid JSON object', 400)
      );
    }

    const result = await templateService.createTemplate(userId, templateData);

    if (!result.success) {
      return res.status(result.statusCode || 500).json(
        createErrorResponse(result.error, result.statusCode || 500)
      );
    }

    res.status(201).json(createApiResponse(true, result.data, 'Template created successfully'));
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/templates/:id
 * Update an existing template
 */
router.put('/:id', async (req, res, next) => {
  try {
    const userId = req.userId;
    const templateId = req.params.id;
    const updateData = req.body;

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(templateId)) {
      return res.status(400).json(
        createErrorResponse('Invalid template ID format', 400)
      );
    }

    // Validate template data if provided
    if (updateData.template_data && typeof updateData.template_data !== 'object') {
      return res.status(400).json(
        createErrorResponse('Template data must be a valid JSON object', 400)
      );
    }

    const result = await templateService.updateTemplate(templateId, userId, updateData);

    if (!result.success) {
      return res.status(result.statusCode || 500).json(
        createErrorResponse(result.error, result.statusCode || 500)
      );
    }

    res.json(createApiResponse(true, result.data, 'Template updated successfully'));
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/templates/:id
 * Delete a template
 */
router.delete('/:id', async (req, res, next) => {
  try {
    const userId = req.userId;
    const templateId = req.params.id;

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(templateId)) {
      return res.status(400).json(
        createErrorResponse('Invalid template ID format', 400)
      );
    }

    const result = await templateService.deleteTemplate(templateId, userId);

    if (!result.success) {
      return res.status(result.statusCode || 500).json(
        createErrorResponse(result.error, result.statusCode || 500)
      );
    }

    res.json(createApiResponse(true, result.data, 'Template deleted successfully'));
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/templates/:id/duplicate
 * Duplicate an existing template
 */
router.post('/:id/duplicate', async (req, res, next) => {
  try {
    const userId = req.userId;
    const templateId = req.params.id;
    const { newName } = req.body;

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(templateId)) {
      return res.status(400).json(
        createErrorResponse('Invalid template ID format', 400)
      );
    }

    const result = await templateService.duplicateTemplate(templateId, userId, newName);

    if (!result.success) {
      return res.status(result.statusCode || 500).json(
        createErrorResponse(result.error, result.statusCode || 500)
      );
    }

    res.status(201).json(createApiResponse(true, result.data, 'Template duplicated successfully'));
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/templates/:id/default
 * Set a template as the default template
 */
router.put('/:id/default', async (req, res, next) => {
  try {
    const userId = req.userId;
    const templateId = req.params.id;

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(templateId)) {
      return res.status(400).json(
        createErrorResponse('Invalid template ID format', 400)
      );
    }

    const result = await templateService.setDefaultTemplate(templateId, userId);

    if (!result.success) {
      return res.status(result.statusCode || 500).json(
        createErrorResponse(result.error, result.statusCode || 500)
      );
    }

    res.json(createApiResponse(true, result.data, 'Default template updated successfully'));
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/templates/:id/use
 * Update template usage statistics (called when template is used)
 */
router.post('/:id/use', async (req, res, next) => {
  try {
    const userId = req.userId;
    const templateId = req.params.id;

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(templateId)) {
      return res.status(400).json(
        createErrorResponse('Invalid template ID format', 400)
      );
    }

    const result = await templateService.updateTemplateUsage(templateId, userId);

    if (!result.success) {
      return res.status(result.statusCode || 500).json(
        createErrorResponse(result.error, result.statusCode || 500)
      );
    }

    res.json(createApiResponse(true, { message: 'Template usage updated' }, 'Template usage recorded successfully'));
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/templates/initialize
 * Initialize default templates for a new user
 */
router.post('/initialize', async (req, res, next) => {
  try {
    const userId = req.userId;

    const result = await templateService.initializeDefaultTemplates(userId);

    if (!result.success) {
      return res.status(result.statusCode || 500).json(
        createErrorResponse(result.error, result.statusCode || 500)
      );
    }

    res.json(createApiResponse(true, { message: result.message }, 'Templates initialized successfully'));
  } catch (error) {
    next(error);
  }
});

module.exports = router;