/**
 * Invoice Email Routes
 * 
 * Handles invoice email delivery, reminders, and notifications
 */

const express = require('express');
const router = express.Router();
const InvoiceEmailService = require('../services/invoiceEmailService');
const authMiddleware = require('../middleware/auth');

/**
 * Send invoice email to client
 * POST /api/invoice-email/send/:invoiceId
 */
router.post('/send/:invoiceId', authMiddleware, async (req, res) => {
  try {
    const { invoiceId } = req.params;
    
    // Simplified request body - no more complex PDF buffer handling
    const requestBody = req.body || {};
    const { 
      includePdf = true, 
      customMessage = ''
    } = requestBody;
    const userId = req.userId; // Get userId from auth middleware

    console.log(`📧 Request to send invoice email for invoice ${invoiceId} (user: ${userId})`);
    console.log('📋 Request details:', { includePdf, customMessage });

    // Server-side PDF generation (Industry Best Practice)
    const result = await InvoiceEmailService.sendInvoiceEmail(
      invoiceId,
      userId,
      includePdf, // Just a boolean flag
      customMessage ? { customMessage } : {}
    );

    res.json({
      success: true,
      message: result.message,
      data: {
        emailId: result.emailId,
        invoiceNumber: result.invoice?.invoice_number,
        clientEmail: result.invoice?.clients?.email || result.invoice?.customer_email,
        pdfAttached: result.pdfAttached
      }
    });

  } catch (error) {
    console.error('Error sending invoice email:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to send invoice email'
    });
  }
});

/**
 * Send payment reminder
 * POST /api/invoice-email/remind/:invoiceId
 */
router.post('/remind/:invoiceId', authMiddleware, async (req, res) => {
  try {
    const { invoiceId } = req.params;
    const { reminderType = 'gentle' } = req.body;
    const userId = req.userId;

    console.log(`🔔 Request to send payment reminder for invoice ${invoiceId}, type: ${reminderType}`);

    const result = await InvoiceEmailService.sendPaymentReminder(invoiceId, userId, reminderType);

    res.json({
      success: true,
      message: result.message,
      data: {
        emailId: result.emailId,
        reminderType
      }
    });

  } catch (error) {
    console.error('Error sending payment reminder:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to send payment reminder'
    });
  }
});

/**
 * Send payment confirmation
 * POST /api/invoice-email/confirm-payment/:invoiceId
 */
router.post('/confirm-payment/:invoiceId', authMiddleware, async (req, res) => {
  try {
    const { invoiceId } = req.params;
    const { paymentDetails = {} } = req.body;
    const userId = req.userId;

    console.log(`✅ Request to send payment confirmation for invoice ${invoiceId}`);

    const result = await InvoiceEmailService.sendPaymentConfirmation(invoiceId, userId, paymentDetails);

    res.json({
      success: true,
      message: result.message,
      data: {
        emailId: result.emailId,
        paymentDetails
      }
    });

  } catch (error) {
    console.error('Error sending payment confirmation:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to send payment confirmation'
    });
  }
});

/**
 * Get email status
 * GET /api/invoice-email/status/:emailId
 */
router.get('/status/:emailId', authMiddleware, async (req, res) => {
  try {
    const { emailId } = req.params;

    const status = await InvoiceEmailService.getEmailStatus(emailId);

    res.json({
      success: true,
      data: status
    });

  } catch (error) {
    console.error('Error getting email status:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get email status'
    });
  }
});

/**
 * Test email configuration
 * POST /api/invoice-email/test
 */
router.post('/test', authMiddleware, async (req, res) => {
  try {
    const { testEmail } = req.body;

    if (!testEmail) {
      return res.status(400).json({
        success: false,
        error: 'Test email address is required'
      });
    }

    // Create a test invoice object
    const testInvoice = {
      id: 'test-' + Date.now(),
      invoice_number: 'TEST-001',
      total_amount: 100.00,
      currency: 'USD',
      due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
      created_at: new Date().toISOString(),
      description: 'Test invoice for email configuration',
      payment_terms: '30'
    };

    const { Resend } = require('resend');
    const resend = new Resend(process.env.RESEND_API_KEY);

    const emailData = {
      from: `${process.env.INVOICE_FROM_NAME || 'PayRush'} <${process.env.INVOICE_FROM_EMAIL}>`,
      to: [testEmail],
      subject: '🧪 PayRush Email Configuration Test',
      html: InvoiceEmailService.generateInvoiceEmailHTML(testInvoice, 'Test User', 'Test Company')
    };

    const { data, error } = await resend.emails.send(emailData);
    
    if (error) {
      throw new Error(`Resend API error: ${error.message}`);
    }

    res.json({
      success: true,
      message: `Test email sent successfully to ${testEmail}`,
      data: {
        emailId: data.id,
        testEmail
      }
    });

  } catch (error) {
    console.error('Error sending test email:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to send test email'
    });
  }
});

module.exports = router;