/**
 * Error Handler Middleware
 * 
 * Global error handling for the Express application
 */

const errorHandler = (error, req, res, next) => {
  console.error('Server Error:', {
    message: error.message,
    stack: error.stack,
    url: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString(),
    userAgent: req.get('User-Agent'),
    ip: req.ip
  });

  // Default error response
  let statusCode = 500;
  let message = 'Internal server error';
  let details = null;

  // Handle specific error types
  if (error.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation error';
    details = error.details || error.message;
  } else if (error.name === 'UnauthorizedError' || error.message.includes('unauthorized')) {
    statusCode = 401;
    message = 'Unauthorized';
  } else if (error.name === 'ForbiddenError' || error.message.includes('forbidden')) {
    statusCode = 403;
    message = 'Forbidden';
  } else if (error.name === 'NotFoundError' || error.message.includes('not found')) {
    statusCode = 404;
    message = 'Resource not found';
  } else if (error.name === 'ConflictError' || error.message.includes('conflict')) {
    statusCode = 409;
    message = 'Conflict';
  } else if (error.code === 'ECONNREFUSED') {
    statusCode = 503;
    message = 'Service unavailable';
    details = 'Database connection failed';
  } else if (error.code && error.code.startsWith('23')) {
    // PostgreSQL errors
    statusCode = 400;
    message = 'Database constraint violation';
    if (error.code === '23505') {
      message = 'Duplicate entry';
    } else if (error.code === '23503') {
      message = 'Referenced record not found';
    }
  }

  // Don't expose internal errors in production
  if (process.env.NODE_ENV === 'production') {
    if (statusCode === 500) {
      message = 'Something went wrong';
      details = null;
    }
  } else {
    // In development, include stack trace
    details = error.stack;
  }

  const errorResponse = {
    error: true,
    message,
    statusCode,
    timestamp: new Date().toISOString()
  };

  // Include details if available
  if (details) {
    errorResponse.details = details;
  }

  // Include request info in development
  if (process.env.NODE_ENV !== 'production') {
    errorResponse.request = {
      method: req.method,
      url: req.originalUrl,
      headers: req.headers
    };
  }

  res.status(statusCode).json(errorResponse);
};

module.exports = errorHandler;