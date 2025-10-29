/**
 * Bulk Invoice Operations Routes
 * API endpoints for bulk invoice operations
 */

const express = require('express');
const router = express.Router();
const bulkInvoiceService = require('../services/bulkInvoiceService');

/**
 * POST /api/invoices/bulk/status
 * Update status for multiple invoices
 */
router.post('/status', async (req, res) => {
  try {
    const userId = req.user.id;
    const { invoiceIds, status } = req.body;

    // Validation
    if (!invoiceIds || !Array.isArray(invoiceIds) || invoiceIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Invoice IDs are required and must be a non-empty array'
      });
    }

    if (!status || typeof status !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Status is required and must be a string'
      });
    }

    const result = await bulkInvoiceService.bulkUpdateStatus(userId, invoiceIds, status);
    
    res.json({
      success: true,
      message: `Successfully updated ${result.updated} invoice(s) to ${status}`,
      data: result
    });
  } catch (error) {
    console.error('Bulk status update error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update invoice statuses'
    });
  }
});

/**
 * POST /api/invoices/bulk/delete
 * Soft delete multiple invoices
 */
router.post('/delete', async (req, res) => {
  try {
    const userId = req.user.id;
    const { invoiceIds } = req.body;

    // Validation
    if (!invoiceIds || !Array.isArray(invoiceIds) || invoiceIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Invoice IDs are required and must be a non-empty array'
      });
    }

    const result = await bulkInvoiceService.bulkDelete(userId, invoiceIds);
    
    res.json({
      success: true,
      message: `Successfully deleted ${result.deleted} invoice(s)`,
      data: result
    });
  } catch (error) {
    console.error('Bulk delete error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to delete invoices'
    });
  }
});

/**
 * POST /api/invoices/bulk/export
 * Export multiple invoices
 */
router.post('/export', async (req, res) => {
  try {
    const userId = req.user.id;
    const { 
      invoiceIds, 
      format = 'csv',
      includeLineItems = false,
      includePayments = false 
    } = req.body;

    // Validation
    if (!invoiceIds || !Array.isArray(invoiceIds) || invoiceIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Invoice IDs are required and must be a non-empty array'
      });
    }

    const validFormats = ['csv', 'excel', 'pdf'];
    if (!validFormats.includes(format)) {
      return res.status(400).json({
        success: false,
        error: `Invalid format: ${format}. Must be one of: ${validFormats.join(', ')}`
      });
    }

    const result = await bulkInvoiceService.bulkExport(userId, invoiceIds, {
      format,
      includeLineItems,
      includePayments
    });

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.message || 'Export failed'
      });
    }

    // Handle different export formats
    switch (format) {
      case 'csv':
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
        return res.send(result.data);
      
      case 'excel':
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
        return res.send(result.data);
      
      case 'pdf':
        if (result.success && result.data) {
          // For now, we return HTML that can be printed to PDF by the browser
          res.setHeader('Content-Type', result.mimeType || 'text/html');
          res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
          return res.send(result.data);
        } else {
          return res.status(501).json({
            success: false,
            error: result.message || 'PDF export failed'
          });
        }
      
      default:
        // For other formats or errors, return JSON
        res.json({
          success: true,
          message: `Successfully prepared ${result.count} invoice(s) for ${format.toUpperCase()} export`,
          data: result
        });
    }
  } catch (error) {
    console.error('Bulk export error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to export invoices'
    });
  }
});

/**
 * POST /api/invoices/bulk/email
 * Prepare invoices for bulk email sending
 */
router.post('/email', async (req, res) => {
  try {
    const userId = req.user.id;
    const { invoiceIds, emailTemplate = 'default' } = req.body;

    // Validation
    if (!invoiceIds || !Array.isArray(invoiceIds) || invoiceIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Invoice IDs are required and must be a non-empty array'
      });
    }

    const result = await bulkInvoiceService.bulkGetForEmail(userId, invoiceIds);
    
    res.json({
      success: true,
      message: `Prepared ${result.count} invoice(s) for email sending`,
      data: {
        ...result,
        emailTemplate,
        readyToSend: result.count,
        skippedReason: result.skipped > 0 ? 'Missing or invalid email addresses' : null
      }
    });
  } catch (error) {
    console.error('Bulk email preparation error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to prepare invoices for email'
    });
  }
});

/**
 * POST /api/invoices/bulk/stats
 * Get statistics for selected invoices
 */
router.post('/stats', async (req, res) => {
  try {
    const userId = req.user.id;
    const { invoiceIds } = req.body;

    // Validation
    if (!invoiceIds || !Array.isArray(invoiceIds) || invoiceIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Invoice IDs are required and must be a non-empty array'
      });
    }

    const result = await bulkInvoiceService.getBulkStats(userId, invoiceIds);
    
    res.json({
      success: true,
      data: result.stats
    });
  } catch (error) {
    console.error('Bulk stats error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get bulk statistics'
    });
  }
});

/**
 * POST /api/invoices/bulk/restore
 * Restore deleted invoices
 */
router.post('/restore', async (req, res) => {
  try {
    const userId = req.user.id;
    const { invoiceIds } = req.body;

    // Validation
    if (!invoiceIds || !Array.isArray(invoiceIds) || invoiceIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Invoice IDs are required and must be a non-empty array'
      });
    }

    const result = await bulkInvoiceService.bulkRestore(userId, invoiceIds);
    
    res.json({
      success: true,
      message: `Successfully restored ${result.restored} invoice(s)`,
      data: result
    });
  } catch (error) {
    console.error('Bulk restore error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to restore invoices'
    });
  }
});

/**
 * POST /api/invoices/bulk/send-emails
 * Send bulk email notifications for invoices
 */
router.post('/send-emails', async (req, res) => {
  try {
    const userId = req.user.id;
    const { invoiceIds, emailOptions = {} } = req.body;

    // Validation
    if (!invoiceIds || !Array.isArray(invoiceIds) || invoiceIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Invoice IDs are required and must be a non-empty array'
      });
    }

    const result = await bulkInvoiceService.bulkSendEmails(userId, invoiceIds, emailOptions);
    
    res.json({
      success: true,
      message: `Email notifications sent: ${result.sent} successful, ${result.failed} failed`,
      data: result
    });
  } catch (error) {
    console.error('Bulk email sending error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to send email notifications'
    });
  }
});

/**
 * GET /api/invoices/bulk/email-stats
 * Get email delivery statistics
 */
router.get('/email-stats', async (req, res) => {
  try {
    const userId = req.user.id;
    const { invoiceIds } = req.query;

    const parsedInvoiceIds = invoiceIds ? JSON.parse(invoiceIds) : null;
    const stats = await bulkInvoiceService.getBulkEmailStats(userId, parsedInvoiceIds);
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Bulk email stats error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch email statistics'
    });
  }
});

/**
 * GET /api/invoices/bulk/email-logs
 * Get email logs for bulk operations
 */
router.get('/email-logs', async (req, res) => {
  try {
    const userId = req.user.id;
    const { 
      invoiceIds, 
      limit = 50, 
      offset = 0, 
      status, 
      startDate, 
      endDate 
    } = req.query;

    const options = {
      invoiceIds: invoiceIds ? JSON.parse(invoiceIds) : null,
      limit: parseInt(limit),
      offset: parseInt(offset),
      status,
      startDate,
      endDate
    };

    const logs = await bulkInvoiceService.getBulkEmailLogs(userId, options);
    
    res.json({
      success: true,
      data: logs
    });
  } catch (error) {
    console.error('Bulk email logs error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch email logs'
    });
  }
});

module.exports = router;