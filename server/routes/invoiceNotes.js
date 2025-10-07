/**
 * Invoice Notes Routes
 * 
 * Express routes for invoice notes and comments management operations
 */

const express = require('express');
const router = express.Router();
const invoiceNotesService = require('../services/invoiceNotesService');
const { createApiResponse, createErrorResponse, parsePaginationParams } = require('../utils');

/**
 * GET /api/notes/invoice/:invoiceId
 * Get all notes for a specific invoice
 */
router.get('/invoice/:invoiceId', async (req, res, next) => {
  try {
    const userId = req.userId; // From auth middleware
    const invoiceId = req.params.invoiceId;
    const { noteType, includeSystem, sortBy, sortOrder } = req.query;
    const { page, limit, offset } = parsePaginationParams(req);

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(invoiceId)) {
      return res.status(400).json(
        createErrorResponse('Invalid invoice ID format', 400)
      );
    }

    const options = {
      noteType,
      includeSystem: includeSystem === 'true',
      limit,
      offset,
      sortBy,
      sortOrder
    };

    const result = await invoiceNotesService.getInvoiceNotes(invoiceId, userId, options);

    if (!result.success) {
      return res.status(result.statusCode || 500).json(
        createErrorResponse(result.error, result.statusCode || 500)
      );
    }

    res.json(createApiResponse(true, result.data, 'Invoice notes retrieved successfully'));
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/notes/:id
 * Get a specific note by ID
 */
router.get('/:id', async (req, res, next) => {
  try {
    const userId = req.userId;
    const noteId = req.params.id;

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(noteId)) {
      return res.status(400).json(
        createErrorResponse('Invalid note ID format', 400)
      );
    }

    const result = await invoiceNotesService.getNote(noteId, userId);

    if (!result.success) {
      return res.status(result.statusCode || 500).json(
        createErrorResponse(result.error, result.statusCode || 500)
      );
    }

    res.json(createApiResponse(true, result.data, 'Note retrieved successfully'));
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/notes/invoice/:invoiceId
 * Create a new note for an invoice
 */
router.post('/invoice/:invoiceId', async (req, res, next) => {
  try {
    const userId = req.userId;
    const invoiceId = req.params.invoiceId;
    const noteData = req.body;

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(invoiceId)) {
      return res.status(400).json(
        createErrorResponse('Invalid invoice ID format', 400)
      );
    }

    // Basic validation
    if (!noteData.content) {
      return res.status(400).json(
        createErrorResponse('Note content is required', 400)
      );
    }

    const result = await invoiceNotesService.createNote(invoiceId, userId, noteData);

    if (!result.success) {
      return res.status(result.statusCode || 500).json(
        createErrorResponse(result.error, result.statusCode || 500)
      );
    }

    res.status(201).json(createApiResponse(true, result.data, 'Note created successfully'));
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/notes/:id
 * Update an existing note
 */
router.put('/:id', async (req, res, next) => {
  try {
    const userId = req.userId;
    const noteId = req.params.id;
    const updateData = req.body;

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(noteId)) {
      return res.status(400).json(
        createErrorResponse('Invalid note ID format', 400)
      );
    }

    const result = await invoiceNotesService.updateNote(noteId, userId, updateData);

    if (!result.success) {
      return res.status(result.statusCode || 500).json(
        createErrorResponse(result.error, result.statusCode || 500)
      );
    }

    res.json(createApiResponse(true, result.data, 'Note updated successfully'));
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/notes/:id
 * Delete a note
 */
router.delete('/:id', async (req, res, next) => {
  try {
    const userId = req.userId;
    const noteId = req.params.id;

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(noteId)) {
      return res.status(400).json(
        createErrorResponse('Invalid note ID format', 400)
      );
    }

    const result = await invoiceNotesService.deleteNote(noteId, userId);

    if (!result.success) {
      return res.status(result.statusCode || 500).json(
        createErrorResponse(result.error, result.statusCode || 500)
      );
    }

    res.json(createApiResponse(true, result.data, 'Note deleted successfully'));
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/notes/invoice/:invoiceId/summary
 * Get notes summary for an invoice
 */
router.get('/invoice/:invoiceId/summary', async (req, res, next) => {
  try {
    const userId = req.userId;
    const invoiceId = req.params.invoiceId;

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(invoiceId)) {
      return res.status(400).json(
        createErrorResponse('Invalid invoice ID format', 400)
      );
    }

    const result = await invoiceNotesService.getNoteSummary(invoiceId, userId);

    if (!result.success) {
      return res.status(result.statusCode || 500).json(
        createErrorResponse(result.error, result.statusCode || 500)
      );
    }

    res.json(createApiResponse(true, result.data, 'Notes summary retrieved successfully'));
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/notes/invoice/:invoiceId/customer
 * Get customer-visible notes for an invoice (for public invoice view)
 */
router.get('/invoice/:invoiceId/customer', async (req, res, next) => {
  try {
    const invoiceId = req.params.invoiceId;

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(invoiceId)) {
      return res.status(400).json(
        createErrorResponse('Invalid invoice ID format', 400)
      );
    }

    const result = await invoiceNotesService.getCustomerNotes(invoiceId);

    if (!result.success) {
      return res.status(result.statusCode || 500).json(
        createErrorResponse(result.error, result.statusCode || 500)
      );
    }

    res.json(createApiResponse(true, result.data, 'Customer notes retrieved successfully'));
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/notes/search
 * Search notes across all user's invoices
 */
router.get('/search', async (req, res, next) => {
  try {
    const userId = req.userId;
    const { q: searchQuery, noteType, priority, invoiceId } = req.query;
    const { page, limit, offset } = parsePaginationParams(req);

    // Make search query optional - if empty, return all notes
    const finalSearchQuery = searchQuery && searchQuery.trim() ? searchQuery.trim() : '';

    const options = {
      noteType,
      priority,
      invoiceId,
      limit,
      offset
    };

    const result = await invoiceNotesService.searchNotes(userId, finalSearchQuery, options);

    if (!result.success) {
      return res.status(result.statusCode || 500).json(
        createErrorResponse(result.error, result.statusCode || 500)
      );
    }

    res.json(createApiResponse(true, result.data, 'Notes search completed successfully'));
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/notes/bulk
 * Bulk create notes (useful for system events)
 */
router.post('/bulk', async (req, res, next) => {
  try {
    const userId = req.userId;
    const { notes } = req.body;

    if (!notes || !Array.isArray(notes) || notes.length === 0) {
      return res.status(400).json(
        createErrorResponse('Notes array is required', 400)
      );
    }

    // Add user_id to all notes
    const notesWithUserId = notes.map(note => ({
      ...note,
      user_id: userId
    }));

    const result = await invoiceNotesService.bulkCreateNotes(notesWithUserId);

    if (!result.success) {
      return res.status(result.statusCode || 500).json(
        createErrorResponse(result.error, result.statusCode || 500)
      );
    }

    res.status(201).json(createApiResponse(true, result.data, 'Notes created successfully'));
  } catch (error) {
    next(error);
  }
});

module.exports = router;