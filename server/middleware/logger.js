/**
 * Request Logger Middleware
 * 
 * Logs incoming requests for debugging and monitoring
 */

const logger = (req, res, next) => {
  const start = Date.now();
  
  // Skip logging for health check in production
  if (process.env.NODE_ENV === 'production' && req.path === '/health') {
    return next();
  }

  // Log request start
  console.log(`📝 ${new Date().toISOString()} - ${req.method} ${req.originalUrl}`);
  
  // Log request details in development
  if (process.env.NODE_ENV !== 'production') {
    if (req.body && Object.keys(req.body).length > 0) {
      console.log('   Body:', JSON.stringify(req.body, null, 2));
    }
    if (req.query && Object.keys(req.query).length > 0) {
      console.log('   Query:', req.query);
    }
  }

  // Capture the original end function
  const originalEnd = res.end;

  // Override the end function to log response
  res.end = function(chunk, encoding) {
    const duration = Date.now() - start;
    const statusColor = res.statusCode >= 400 ? '🔴' : res.statusCode >= 300 ? '🟡' : '🟢';
    
    console.log(`${statusColor} ${res.statusCode} - ${req.method} ${req.originalUrl} - ${duration}ms`);
    
    // Call the original end function
    originalEnd.call(this, chunk, encoding);
  };

  next();
};

module.exports = logger;