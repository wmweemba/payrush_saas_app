/**
 * PayRush Server - Express.js Backend
 * 
 * Main server entry point for PayRush SaaS application
 * Handles API routes, authentication, payments, and database operations
 */

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config();

// Import routes
const clientRoutes = require('./routes/clients');
const paymentRoutes = require('./routes/payments');
const webhookRoutes = require('./routes/webhooks');
const authRoutes = require('./routes/auth');
const invoiceLineItemsRoutes = require('./routes/invoiceLineItems');
const invoiceSearchRoutes = require('./routes/invoiceSearch');
const publicInvoiceRoutes = require('./routes/publicInvoice');
const bulkInvoiceRoutes = require('./routes/bulkInvoices');
const templateRoutes = require('./routes/templates');
const numberingSchemeRoutes = require('./routes/numberingSchemes');
const brandingRoutes = require('./routes/branding');
const invoiceNotesRoutes = require('./routes/invoiceNotes');
const approvalRoutes = require('./routes/approvals');

// Import middleware
const authMiddleware = require('./middleware/auth');
const errorHandler = require('./middleware/errorHandler');
const requestLogger = require('./middleware/logger');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5000;

// Trust proxy for production deployments
app.set('trust proxy', 1);

// Middleware
app.use(requestLogger);

// CORS configuration
const corsOptions = {
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

// Body parsing middleware
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

// Raw body parsing for webhooks (needed for signature verification)
app.use('/api/webhooks', bodyParser.raw({ type: 'application/json' }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'PayRush Server is running',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0'
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/clients', authMiddleware, clientRoutes);
app.use('/api/payments', authMiddleware, paymentRoutes);
app.use('/api/invoices', authMiddleware, invoiceLineItemsRoutes);
app.use('/api/invoices', authMiddleware, invoiceSearchRoutes); // Search routes for invoices
app.use('/api/invoices/bulk', authMiddleware, bulkInvoiceRoutes); // Bulk operations for invoices
app.use('/api/templates', authMiddleware, templateRoutes); // Template management routes
app.use('/api/numbering-schemes', authMiddleware, numberingSchemeRoutes); // Numbering scheme routes
app.use('/api/branding', authMiddleware, brandingRoutes); // Business branding routes
app.use('/api/notes', authMiddleware, invoiceNotesRoutes); // Invoice notes routes
app.use('/api/approvals', authMiddleware, approvalRoutes); // Invoice approval workflow routes
app.use('/api/public', publicInvoiceRoutes); // Public routes don't need auth
app.use('/api/webhooks', webhookRoutes); // Webhooks don't need auth middleware

// API documentation endpoint
app.get('/api', (req, res) => {
  res.json({
    message: 'PayRush API Server',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      clients: '/api/clients',
      payments: '/api/payments',
      templates: '/api/templates',
      numberingSchemes: '/api/numbering-schemes',
      branding: '/api/branding',
      notes: '/api/notes',
      approvals: '/api/approvals',
      webhooks: '/api/webhooks',
      health: '/health'
    },
    documentation: 'https://github.com/your-repo/payrush-api-docs'
  });
});

// 404 handler for undefined routes
app.use((req, res, next) => {
  res.status(404).json({
    error: 'Route not found',
    message: `The route ${req.method} ${req.originalUrl} does not exist`,
    availableRoutes: ['/api', '/health']
  });
});

// Global error handler (must be last)
app.use(errorHandler);

// Graceful shutdown handling
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully...');
  process.exit(0);
});

// Start server
const server = app.listen(PORT, () => {
  console.log(`🚀 PayRush Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`📚 API docs: http://localhost:${PORT}/api`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Client URL: ${process.env.CLIENT_URL || 'http://localhost:3001'}`);
});

// Handle server errors
server.on('error', (error) => {
  if (error.syscall !== 'listen') {
    throw error;
  }

  const bind = typeof PORT === 'string' ? 'Pipe ' + PORT : 'Port ' + PORT;

  switch (error.code) {
    case 'EACCES':
      console.error(`${bind} requires elevated privileges`);
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(`${bind} is already in use`);
      process.exit(1);
      break;
    default:
      throw error;
  }
});

module.exports = app;