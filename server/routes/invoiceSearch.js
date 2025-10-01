/**
 * Invoice Search API Routes
 * Handles advanced search, filtering, and sorting for invoices
 */

const express = require('express');
const router = express.Router();
const invoiceSearchService = require('../services/invoiceSearchService');

/**
 * POST /api/invoices/search
 * Advanced invoice search with filtering and pagination
 */
router.post('/search', async (req, res) => {
  try {
    const userId = req.user.id;
    const searchParams = req.body;

    // Validate pagination parameters
    const page = Math.max(1, parseInt(searchParams.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.limit) || 10));

    const searchData = {
      ...searchParams,
      page,
      limit
    };

    const results = await invoiceSearchService.searchInvoices(userId, searchData);

    res.json({
      success: true,
      data: results
    });
  } catch (error) {
    console.error('Invoice search API error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to search invoices'
    });
  }
});

/**
 * GET /api/invoices/search/stats
 * Get aggregated statistics for invoices
 */
router.get('/search/stats', async (req, res) => {
  try {
    const userId = req.user.id;
    const filters = req.query;

    // Parse array parameters
    if (filters.statuses && typeof filters.statuses === 'string') {
      filters.statuses = filters.statuses.split(',').filter(Boolean);
    }

    const stats = await invoiceSearchService.getInvoiceStats(userId, filters);

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Invoice stats API error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get invoice statistics'
    });
  }
});

/**
 * GET /api/invoices/search/filters
 * Get available filter options (unique values)
 */
router.get('/search/filters', async (req, res) => {
  try {
    const userId = req.user.id;
    const options = await invoiceSearchService.getFilterOptions(userId);

    res.json({
      success: true,
      data: options
    });
  } catch (error) {
    console.error('Filter options API error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get filter options'
    });
  }
});

/**
 * GET /api/invoices/search/customers
 * Search invoices by customer information
 */
router.get('/search/customers', async (req, res) => {
  try {
    const userId = req.user.id;
    const { q: customerQuery } = req.query;

    if (!customerQuery || customerQuery.length < 2) {
      return res.json({
        success: true,
        data: []
      });
    }

    const invoices = await invoiceSearchService.searchByCustomer(userId, customerQuery);

    res.json({
      success: true,
      data: invoices
    });
  } catch (error) {
    console.error('Customer search API error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to search customers'
    });
  }
});

/**
 * GET /api/invoices/search/recent
 * Get recent search queries for autocomplete
 */
router.get('/search/recent', async (req, res) => {
  try {
    const userId = req.user.id;
    const recentSearches = await invoiceSearchService.getRecentSearches(userId);

    res.json({
      success: true,
      data: recentSearches
    });
  } catch (error) {
    console.error('Recent searches API error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get recent searches'
    });
  }
});

/**
 * GET /api/invoices/search/quick/:preset
 * Quick search presets for common filters
 */
router.get('/search/quick/:preset', async (req, res) => {
  try {
    const userId = req.user.id;
    const { preset } = req.params;

    let searchParams = {};

    // Define preset searches
    switch (preset) {
      case 'overdue':
        const today = new Date().toISOString().split('T')[0];
        searchParams = {
          dateTo: today,
          statuses: ['Pending', 'Sent'],
          sortBy: 'due_date',
          sortOrder: 'asc'
        };
        break;

      case 'draft':
        searchParams = {
          statuses: ['Draft'],
          sortBy: 'created_at',
          sortOrder: 'desc'
        };
        break;

      case 'paid':
        searchParams = {
          statuses: ['Paid'],
          sortBy: 'created_at',
          sortOrder: 'desc'
        };
        break;

      case 'pending':
        searchParams = {
          statuses: ['Pending'],
          sortBy: 'created_at',
          sortOrder: 'desc'
        };
        break;

      case 'this-month':
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        searchParams = {
          dateFrom: startOfMonth.toISOString().split('T')[0],
          sortBy: 'created_at',
          sortOrder: 'desc'
        };
        break;

      case 'last-30-days':
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        searchParams = {
          dateFrom: thirtyDaysAgo.toISOString().split('T')[0],
          sortBy: 'created_at',
          sortOrder: 'desc'
        };
        break;

      case 'high-value':
        searchParams = {
          amountMin: 1000,
          sortBy: 'amount',
          sortOrder: 'desc'
        };
        break;

      default:
        return res.status(400).json({
          success: false,
          error: 'Unknown preset'
        });
    }

    const results = await invoiceSearchService.searchInvoices(userId, searchParams);

    res.json({
      success: true,
      data: results,
      preset: preset
    });
  } catch (error) {
    console.error('Quick search API error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to perform quick search'
    });
  }
});

module.exports = router;