/**
 * Authentication Middleware
 * 
 * Validates JWT tokens from Supabase and extracts user information
 */

const jwt = require('jsonwebtoken');
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

/**
 * Middleware to authenticate requests using Supabase JWT
 */
const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'No authorization header provided'
      });
    }

    const token = authHeader.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'No token provided'
      });
    }

    // Verify token with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return res.status(401).json({
        error: 'Invalid token',
        message: 'Token verification failed'
      });
    }

    // Attach user to request object
    req.user = user;
    req.userId = user.id;
    
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(401).json({
      error: 'Authentication failed',
      message: 'Token verification error'
    });
  }
};

/**
 * Optional auth middleware - doesn't fail if no token provided
 */
const optionalAuthMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return next();
    }

    const token = authHeader.replace('Bearer ', '');
    
    if (!token) {
      return next();
    }

    // Verify token with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (!error && user) {
      req.user = user;
      req.userId = user.id;
    }
    
    next();
  } catch (error) {
    console.error('Optional auth middleware error:', error);
    // Continue without authentication
    next();
  }
};

module.exports = authMiddleware;
module.exports.optionalAuthMiddleware = optionalAuthMiddleware;