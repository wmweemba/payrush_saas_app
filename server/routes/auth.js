/**
 * Authentication Routes
 * 
 * Handles user authentication, registration, and session management
 */

const express = require('express');
const router = express.Router();
const { supabaseClient } = require('../config/database');

/**
 * POST /api/auth/login
 * User login endpoint
 */
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'Email and password are required'
      });
    }

    const { data, error } = await supabaseClient.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      return res.status(401).json({
        error: 'Authentication failed',
        message: error.message
      });
    }

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: data.user,
        session: data.session
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/auth/register
 * User registration endpoint
 */
router.post('/register', async (req, res, next) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'Email and password are required'
      });
    }

    const { data, error } = await supabaseClient.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: name || email.split('@')[0]
        }
      }
    });

    if (error) {
      return res.status(400).json({
        error: 'Registration failed',
        message: error.message
      });
    }

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      data: {
        user: data.user,
        session: data.session
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/auth/logout
 * User logout endpoint
 */
router.post('/logout', async (req, res, next) => {
  try {
    const { error } = await supabaseClient.auth.signOut();

    if (error) {
      return res.status(400).json({
        error: 'Logout failed',
        message: error.message
      });
    }

    res.json({
      success: true,
      message: 'Logout successful'
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/auth/me
 * Get current user information
 */
router.get('/me', async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'No token provided'
      });
    }

    const { data: { user }, error } = await supabaseClient.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({
        error: 'Invalid token',
        message: 'Token verification failed'
      });
    }

    res.json({
      success: true,
      data: { user }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;