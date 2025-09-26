/**
 * Server Utilities
 * 
 * Common utility functions for the PayRush server
 */

/**
 * Async wrapper for route handlers to catch errors
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * Generate a random string of specified length
 */
const generateRandomString = (length = 32) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

/**
 * Validate email format
 */
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate phone number format
 */
const isValidPhone = (phone) => {
  if (!phone) return true; // Optional field
  const phoneRegex = /^\+?[\d\s\-\(\)]{7,}$/;
  return phoneRegex.test(phone);
};

/**
 * Sanitize input string
 */
const sanitizeString = (str) => {
  if (typeof str !== 'string') return str;
  return str.trim().replace(/[<>]/g, '');
};

/**
 * Format currency amount
 */
const formatCurrency = (amount, currency = 'USD') => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

/**
 * Create standardized API response
 */
const createApiResponse = (success, data = null, message = null, meta = null) => {
  const response = {
    success,
    timestamp: new Date().toISOString()
  };

  if (message) response.message = message;
  if (data) response.data = data;
  if (meta) response.meta = meta;

  return response;
};

/**
 * Create standardized error response
 */
const createErrorResponse = (message, statusCode = 500, details = null) => {
  const response = {
    success: false,
    error: true,
    message,
    statusCode,
    timestamp: new Date().toISOString()
  };

  if (details) response.details = details;

  return response;
};

/**
 * Parse and validate pagination parameters
 */
const parsePaginationParams = (req) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
  const offset = (page - 1) * limit;

  return { page, limit, offset };
};

/**
 * Create pagination metadata
 */
const createPaginationMeta = (page, limit, total) => {
  const totalPages = Math.ceil(total / limit);
  
  return {
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1
    }
  };
};

/**
 * Log request details for debugging
 */
const logRequest = (req, message = 'Request') => {
  if (process.env.NODE_ENV !== 'production') {
    console.log(`${message}:`, {
      method: req.method,
      url: req.originalUrl,
      headers: req.headers,
      body: req.body,
      query: req.query,
      params: req.params,
      user: req.user?.id || 'anonymous'
    });
  }
};

module.exports = {
  asyncHandler,
  generateRandomString,
  isValidEmail,
  isValidPhone,
  sanitizeString,
  formatCurrency,
  createApiResponse,
  createErrorResponse,
  parsePaginationParams,
  createPaginationMeta,
  logRequest
};