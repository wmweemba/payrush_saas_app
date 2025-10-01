/**
 * Invoice Search Service
 * Provides advanced search, filtering, and sorting functionality for invoices
 */

const { supabase } = require('../config/database');

/**
 * Search invoices with advanced filtering and sorting
 * @param {string} userId - User ID to filter invoices by
 * @param {Object} searchParams - Search parameters
 * @param {string} searchParams.query - Text search query
 * @param {string[]} searchParams.statuses - Array of status filters
 * @param {string} searchParams.dateFrom - Start date filter (YYYY-MM-DD)
 * @param {string} searchParams.dateTo - End date filter (YYYY-MM-DD)
 * @param {string} searchParams.currency - Currency filter
 * @param {number} searchParams.amountMin - Minimum amount filter
 * @param {number} searchParams.amountMax - Maximum amount filter
 * @param {string} searchParams.sortBy - Field to sort by (created_at, due_date, amount, customer_name, status)
 * @param {string} searchParams.sortOrder - Sort order (asc/desc)
 * @param {number} searchParams.page - Page number (1-based)
 * @param {number} searchParams.limit - Results per page
 * @returns {Promise<{invoices: Array, total: number, page: number, totalPages: number}>}
 */
async function searchInvoices(userId, searchParams = {}) {
  try {
    const {
      query = '',
      statuses = [],
      dateFrom = null,
      dateTo = null,
      currency = null,
      amountMin = null,
      amountMax = null,
      sortBy = 'created_at',
      sortOrder = 'desc',
      page = 1,
      limit = 10
    } = searchParams;

    // Validate sort parameters
    const validSortFields = ['created_at', 'due_date', 'amount', 'customer_name', 'status'];
    const validSortOrders = ['asc', 'desc'];
    
    const safeSortBy = validSortFields.includes(sortBy) ? sortBy : 'created_at';
    const safeSortOrder = validSortOrders.includes(sortOrder) ? sortOrder : 'desc';
    
    // Calculate offset for pagination
    const offset = (page - 1) * limit;

    // Build the base query
    let queryBuilder = supabase
      .from('invoices')
      .select('*', { count: 'exact' })
      .eq('user_id', userId);

    // Apply text search filter (search in customer name and email)
    if (query && query.trim()) {
      const searchQuery = query.trim();
      queryBuilder = queryBuilder.or(
        `customer_name.ilike.%${searchQuery}%,customer_email.ilike.%${searchQuery}%`
      );
    }

    // Apply status filters
    if (statuses && statuses.length > 0) {
      queryBuilder = queryBuilder.in('status', statuses);
    }

    // Apply date range filters
    if (dateFrom) {
      queryBuilder = queryBuilder.gte('created_at', `${dateFrom}T00:00:00.000Z`);
    }
    if (dateTo) {
      queryBuilder = queryBuilder.lte('created_at', `${dateTo}T23:59:59.999Z`);
    }

    // Apply currency filter
    if (currency) {
      queryBuilder = queryBuilder.eq('currency', currency);
    }

    // Apply amount range filters
    if (amountMin !== null && !isNaN(amountMin)) {
      queryBuilder = queryBuilder.gte('amount', amountMin);
    }
    if (amountMax !== null && !isNaN(amountMax)) {
      queryBuilder = queryBuilder.lte('amount', amountMax);
    }

    // Apply sorting
    queryBuilder = queryBuilder.order(safeSortBy, { ascending: safeSortOrder === 'asc' });

    // Apply pagination
    queryBuilder = queryBuilder.range(offset, offset + limit - 1);

    const { data: invoices, error, count } = await queryBuilder;

    if (error) {
      throw new Error(`Search query failed: ${error.message}`);
    }

    const totalPages = Math.ceil(count / limit);

    return {
      invoices: invoices || [],
      total: count || 0,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1
    };
  } catch (error) {
    console.error('Invoice search error:', error);
    throw error;
  }
}

/**
 * Get aggregated statistics for invoices
 * @param {string} userId - User ID
 * @param {Object} filters - Optional filters to apply to stats
 * @returns {Promise<Object>} Aggregated statistics
 */
async function getInvoiceStats(userId, filters = {}) {
  try {
    const {
      dateFrom = null,
      dateTo = null,
      statuses = [],
      currency = null
    } = filters;

    // Build query for stats
    let queryBuilder = supabase
      .from('invoices')
      .select('status, amount, currency, created_at, due_date')
      .eq('user_id', userId);

    // Apply filters
    if (statuses && statuses.length > 0) {
      queryBuilder = queryBuilder.in('status', statuses);
    }
    if (dateFrom) {
      queryBuilder = queryBuilder.gte('created_at', `${dateFrom}T00:00:00.000Z`);
    }
    if (dateTo) {
      queryBuilder = queryBuilder.lte('created_at', `${dateTo}T23:59:59.999Z`);
    }
    if (currency) {
      queryBuilder = queryBuilder.eq('currency', currency);
    }

    const { data: invoices, error } = await queryBuilder;

    if (error) {
      throw new Error(`Stats query failed: ${error.message}`);
    }

    // Calculate statistics
    const stats = {
      total: invoices.length,
      byStatus: {},
      byCurrency: {},
      totalAmount: {},
      avgAmount: {},
      overdue: 0
    };

    const now = new Date();

    // Process each invoice
    invoices.forEach(invoice => {
      const status = invoice.status;
      const currency = invoice.currency;
      const amount = parseFloat(invoice.amount) || 0;
      const dueDate = new Date(invoice.due_date);

      // Count by status
      stats.byStatus[status] = (stats.byStatus[status] || 0) + 1;

      // Count by currency
      stats.byCurrency[currency] = (stats.byCurrency[currency] || 0) + 1;

      // Sum amounts by currency
      if (!stats.totalAmount[currency]) {
        stats.totalAmount[currency] = 0;
      }
      stats.totalAmount[currency] += amount;

      // Check if overdue
      if (status !== 'Paid' && status !== 'Cancelled' && dueDate < now) {
        stats.overdue++;
      }
    });

    // Calculate averages
    Object.keys(stats.totalAmount).forEach(currency => {
      const currencyInvoices = invoices.filter(inv => inv.currency === currency);
      stats.avgAmount[currency] = currencyInvoices.length > 0 
        ? stats.totalAmount[currency] / currencyInvoices.length 
        : 0;
    });

    return stats;
  } catch (error) {
    console.error('Invoice stats error:', error);
    throw error;
  }
}

/**
 * Get unique values for filter dropdowns
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Unique filter values
 */
async function getFilterOptions(userId) {
  try {
    const { data: invoices, error } = await supabase
      .from('invoices')
      .select('status, currency, customer_name')
      .eq('user_id', userId);

    if (error) {
      throw new Error(`Filter options query failed: ${error.message}`);
    }

    const options = {
      statuses: [...new Set(invoices.map(inv => inv.status))].filter(Boolean),
      currencies: [...new Set(invoices.map(inv => inv.currency))].filter(Boolean),
      customers: [...new Set(invoices.map(inv => inv.customer_name))].filter(Boolean)
    };

    return options;
  } catch (error) {
    console.error('Filter options error:', error);
    throw error;
  }
}

/**
 * Search invoices by customer information
 * @param {string} userId - User ID
 * @param {string} customerQuery - Customer search query
 * @returns {Promise<Array>} Matching invoices
 */
async function searchByCustomer(userId, customerQuery) {
  try {
    if (!customerQuery || !customerQuery.trim()) {
      return [];
    }

    const query = customerQuery.trim();
    
    const { data: invoices, error } = await supabase
      .from('invoices')
      .select('*')
      .eq('user_id', userId)
      .or(`customer_name.ilike.%${query}%,customer_email.ilike.%${query}%`)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      throw new Error(`Customer search failed: ${error.message}`);
    }

    return invoices || [];
  } catch (error) {
    console.error('Customer search error:', error);
    throw error;
  }
}

/**
 * Get recent search queries for autocomplete
 * This is a simplified version - in production you'd store search history
 * @param {string} userId - User ID
 * @returns {Promise<Array>} Recent searches
 */
async function getRecentSearches(userId) {
  try {
    // For now, return common search patterns
    // In production, you'd store and retrieve actual user search history
    const commonSearches = [
      'draft',
      'paid',
      'overdue',
      'pending',
      'last 30 days',
      'this month',
      'high value',
      'USD invoices'
    ];

    return commonSearches;
  } catch (error) {
    console.error('Recent searches error:', error);
    return [];
  }
}

module.exports = {
  searchInvoices,
  getInvoiceStats,
  getFilterOptions,
  searchByCustomer,
  getRecentSearches
};