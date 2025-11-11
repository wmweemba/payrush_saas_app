/**
 * Invoice Email Service for PayRush
 * 
 * Handles invoice delivery via Resend.com with PDF attachments
 */

const { Resend } = require('resend');
const { supabase } = require('../config/database');
const { formatCurrency } = require('../utils');
const ServerPDFService = require('./serverPDFService');
const puppeteer = require('puppeteer');

// Initialize Resend client
const resend = new Resend(process.env.RESEND_API_KEY);

class InvoiceEmailService {

  /**
   * Send invoice email to client with PDF attachment (Server-Side PDF Generation)
   */
  static async sendInvoiceEmail(invoiceId, userId, includePdf = true, options = {}) {
    try {
      // Get invoice details with user context for RLS
      console.log(`🔍 Looking for invoice ${invoiceId} for user ${userId}`);
      
      const { data: invoice, error: invoiceError } = await supabase
        .from('invoices')
        .select(`
          *,
          clients (name, email, company)
        `)
        .eq('id', invoiceId)
        .eq('user_id', userId)
        .single();

      console.log('Invoice lookup result:', { invoice: !!invoice, error: invoiceError });
      
      if (invoice) {
        console.log('Invoice details:', { 
          id: invoice.id, 
          invoice_number: invoice.invoice_number,
          status: invoice.status,
          availableFields: Object.keys(invoice)
        });
      }

      if (invoiceError || !invoice) {
        throw new Error('Invoice not found');
      }

      // Get branding information including payment details
      const { data: branding } = await supabase
        .from('business_branding')
        .select('*')
        .eq('user_id', invoice.user_id)
        .single();

      const clientEmail = invoice.clients?.email || invoice.customer_email;
      const clientName = invoice.clients?.company || invoice.customer_name;
      const companyName = invoice.clients?.name || clientName;

      // Handle invoice number - use custom_invoice_number, invoice_number, or generate one
      const invoiceNumber = invoice.custom_invoice_number || 
                           invoice.invoice_number || 
                           `INV-${invoice.id.split('-')[0].toUpperCase()}`;

      if (!clientEmail) {
        throw new Error('No client email address found');
      }

      console.log(`📧 Sending invoice ${invoiceNumber} to ${clientEmail}`);
      
      // Generate PDF attachment on server (Industry Best Practice)
      const attachments = [];
      let pdfGenerated = false;
      
      if (includePdf) {
        try {
          console.log('� Generating PDF on server...');
          
          // Generate PDF HTML using server-side service
          const pdfResult = await ServerPDFService.generateInvoicePDFHTML(invoiceId, userId);
          
          if (pdfResult.success) {
            // Convert HTML to PDF using Puppeteer (industry standard)
            const browser = await puppeteer.launch({ 
              headless: true,
              args: ['--no-sandbox', '--disable-setuid-sandbox']
            });
            const page = await browser.newPage();
            await page.setContent(pdfResult.html, { waitUntil: 'networkidle0' });
            
            const pdfUint8Array = await page.pdf({
              format: 'A4',
              printBackground: true,
              margin: {
                top: '0.5in',
                right: '0.5in',
                bottom: '0.5in',
                left: '0.5in'
              }
            });
            
            await browser.close();
            
            // Convert Puppeteer Uint8Array to Node.js Buffer for Resend
            const pdfBuffer = Buffer.from(pdfUint8Array);
            
            // Verify PDF buffer before adding to attachments
            console.log('📄 PDF Buffer details:', {
              isBuffer: Buffer.isBuffer(pdfBuffer),
              size: pdfBuffer?.length,
              type: typeof pdfBuffer,
              originalType: typeof pdfUint8Array
            });
            
            // Resend expects attachments in this specific format
            attachments.push({
              filename: pdfResult.filename,
              content: pdfBuffer
            });
            
            pdfGenerated = true;
            console.log(`✅ Server-generated PDF attachment: ${pdfResult.filename}, size: ${pdfBuffer.length} bytes`);
          } else {
            console.warn('⚠️ PDF generation failed:', pdfResult.error);
          }
        } catch (pdfError) {
          console.error('⚠️ Server PDF generation error:', pdfError);
          // Continue without PDF attachment
        }
      }

      // Email content
      const emailData = {
        from: `${process.env.INVOICE_FROM_NAME || 'PayRush'} <${process.env.INVOICE_FROM_EMAIL}>`,
        to: [clientEmail],
        subject: `Invoice ${invoiceNumber} from ${process.env.INVOICE_FROM_NAME || 'PayRush'}`,
        html: this.generateInvoiceEmailHTML(invoice, clientName, companyName, branding, invoiceNumber),
        attachments,
        ...options // Allow custom email options
      };

      console.log('📧 Email data being sent to Resend:', {
        to: emailData.to,
        subject: emailData.subject,
        attachmentsCount: attachments.length,
        attachmentDetails: attachments.map(att => ({
          filename: att.filename,
          contentType: att.type,
          contentSize: att.content?.length
        }))
      });

      // Send email via Resend
      const { data, error } = await resend.emails.send(emailData);
      
      if (error) {
        throw new Error(`Resend API error: ${error.message}`);
      }

      // Update invoice status to SENT
      await this.updateInvoiceStatus(invoice.id, 'SENT');
      
      // Log the email
      await this.logEmailAttempt(clientEmail, emailData.subject, 'invoice_delivery', userId, {
        invoiceId: invoice.id,
        invoiceNumber: invoiceNumber,
        resendId: data.id,
        status: 'sent',
        clientName,
        companyName
      });

      console.log(`✅ Invoice email sent successfully to ${clientEmail}, Resend ID: ${data.id}`);
      
      return { 
        success: true, 
        message: `Invoice ${invoiceNumber} sent to ${clientEmail}`,
        emailId: data.id,
        invoice,
        pdfAttached: pdfGenerated
      };
      
    } catch (error) {
      console.error(`❌ Failed to send invoice email:`, error);
      
      // Skip logging failures when invoice not found (since we need a valid invoice_id)
      // The main issue is the invoice lookup, not the logging
      console.error('Email sending failed, skipping failure log due to missing invoice_id constraint');
      
      throw error;
    }
  }

  /**
   * Send payment reminder email
   */
  static async sendPaymentReminder(invoiceId, userId, reminderType = 'gentle') {
    try {
      const { data: invoice, error } = await supabase
        .from('invoices')
        .select(`
          *,
          clients (name, email, company)
        `)
        .eq('id', invoiceId)
        .eq('user_id', userId)
        .single();

      if (error || !invoice) {
        throw new Error('Invoice not found');
      }

      const clientEmail = invoice.clients?.email || invoice.customer_email;
      const clientName = invoice.clients?.company || invoice.customer_name;
      
      if (!clientEmail) {
        throw new Error('No client email address found');
      }

      const dueDate = new Date(invoice.due_date);
      const today = new Date();
      const daysOverdue = Math.ceil((today - dueDate) / (1000 * 60 * 60 * 24));
      
      const emailData = {
        from: `${process.env.INVOICE_FROM_NAME || 'PayRush'} <${process.env.INVOICE_FROM_EMAIL}>`,
        to: [clientEmail],
        subject: this.getReminderSubject(invoice.invoice_number, reminderType, daysOverdue),
        html: this.generateReminderEmailHTML(invoice, clientName, reminderType, daysOverdue)
      };

      const { data, error: sendError } = await resend.emails.send(emailData);
      
      if (sendError) {
        throw new Error(`Resend API error: ${sendError.message}`);
      }

      // Log the reminder
      await this.logEmailAttempt(clientEmail, emailData.subject, 'payment_reminder', userId, {
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoice_number,
        reminderType,
        daysOverdue,
        resendId: data.id,
        status: 'sent'
      });

      return {
        success: true,
        message: `Payment reminder sent to ${clientEmail}`,
        emailId: data.id
      };
      
    } catch (error) {
      console.error('Failed to send payment reminder:', error);
      throw error;
    }
  }

  /**
   * Send payment confirmation email
   */
  static async sendPaymentConfirmation(invoiceId, userId, paymentDetails) {
    try {
      const { data: invoice, error } = await supabase
        .from('invoices')
        .select(`
          *,
          clients (name, email, company)
        `)
        .eq('id', invoiceId)
        .eq('user_id', userId)
        .single();

      if (error || !invoice) {
        throw new Error('Invoice not found');
      }

      const clientEmail = invoice.clients?.email || invoice.customer_email;
      const clientName = invoice.clients?.company || invoice.customer_name;
      
      if (!clientEmail) {
        throw new Error('No client email address found');
      }

      const invoiceNumber = invoice.custom_invoice_number || invoice.invoice_number || `INV-${invoice.id.split('-')[0].toUpperCase()}`;
      
      const emailData = {
        from: `${process.env.INVOICE_FROM_NAME || 'PayRush'} <${process.env.INVOICE_FROM_EMAIL}>`,
        to: [clientEmail],
        subject: `Payment Received - Invoice ${invoiceNumber}`,
        html: this.generatePaymentConfirmationHTML(invoice, clientName, paymentDetails)
      };

      const { data, error: sendError } = await resend.emails.send(emailData);
      
      if (sendError) {
        throw new Error(`Resend API error: ${sendError.message}`);
      }

      // Update invoice status to PAID
      await this.updateInvoiceStatus(invoice.id, 'PAID');

      // Log the confirmation
      await this.logEmailAttempt(clientEmail, emailData.subject, 'payment_confirmation', userId, {
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoice_number,
        paymentAmount: paymentDetails.amount,
        paymentMethod: paymentDetails.method,
        resendId: data.id,
        status: 'sent'
      });

      return {
        success: true,
        message: `Payment confirmation sent to ${clientEmail}`,
        emailId: data.id
      };
      
    } catch (error) {
      console.error('Failed to send payment confirmation:', error);
      throw error;
    }
  }

  /**
   * Generate invoice email HTML content
   */
  static generateInvoiceEmailHTML(invoice, clientName, companyName, branding = null, invoiceNumber = null) {
    const dueDate = new Date(invoice.due_date).toLocaleDateString();
    const invoiceDate = new Date(invoice.invoice_date || invoice.created_at).toLocaleDateString();
    
    // Use passed invoiceNumber or fallback to generating one
    const finalInvoiceNumber = invoiceNumber || 
                              invoice.custom_invoice_number || 
                              invoice.invoice_number || 
                              `INV-${invoice.id.split('-')[0].toUpperCase()}`;
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Invoice ${invoice.invoice_number}</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 20px; background-color: #f8f9fa; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; text-align: center; }
          .header h1 { margin: 0; font-size: 28px; font-weight: 300; }
          .content { padding: 30px; }
          .invoice-details { background: #f8f9fa; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #667eea; }
          .amount-box { background: #e8f5e8; border: 2px solid #28a745; border-radius: 8px; padding: 20px; text-align: center; margin: 25px 0; }
          .amount-box .amount { font-size: 36px; font-weight: bold; color: #28a745; margin: 0; }
          .amount-box .currency { font-size: 18px; color: #666; }
          .footer { background: #f8f9fa; padding: 20px; border-radius: 0 0 8px 8px; text-align: center; color: #666; font-size: 14px; }
          .btn { background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 10px 5px; font-weight: 500; }
          .btn:hover { background: #5a6fd8; }
          .highlight { color: #667eea; font-weight: 600; }
          .divider { height: 1px; background: #e9ecef; margin: 25px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>💼 Invoice ${finalInvoiceNumber}</h1>
            <p>Thank you for your business!</p>
          </div>
          
          <div class="content">
            <p>Dear <strong>${clientName || 'Valued Customer'}</strong>,</p>
            
            <p>We hope this email finds you well. Please find attached your invoice for recent services. Below are the invoice details:</p>
            
            <div class="invoice-details">
              <h3 style="margin-top: 0; color: #667eea;">📋 Invoice Details</h3>
              <p><strong>Invoice Number:</strong> <span class="highlight">${finalInvoiceNumber}</span></p>
              <p><strong>Invoice Date:</strong> ${invoiceDate}</p>
              <p><strong>Due Date:</strong> <span class="highlight">${dueDate}</span></p>
              <p><strong>Client:</strong> ${companyName || clientName}</p>
              ${invoice.description ? `<p><strong>Description:</strong> ${invoice.description}</p>` : ''}
            </div>

            <div class="amount-box">
              <div class="currency">${invoice.currency || 'USD'}</div>
              <div class="amount">${formatCurrency(parseFloat(invoice.amount || 0), invoice.currency || 'USD')}</div>
              <div style="margin-top: 10px; font-size: 16px; color: #666;">Total Amount Due</div>
            </div>

            <div class="divider"></div>
            
            <h3 style="color: #667eea;">💳 Payment Instructions</h3>
            ${this.generatePaymentInstructions(branding)}
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="mailto:${process.env.INVOICE_FROM_EMAIL}?subject=Payment Inquiry - Invoice ${finalInvoiceNumber}" class="btn">
                💬 Contact for Payment
              </a>
              <a href="mailto:${process.env.INVOICE_FROM_EMAIL}?subject=Payment Confirmation - Invoice ${finalInvoiceNumber}" class="btn">
                ✅ Confirm Payment
              </a>
            </div>

            <div class="divider"></div>
            
            <p><strong>⏰ Payment Terms:</strong> Payment is due within ${invoice.payment_terms || '30'} days from the invoice date.</p>
            
            <p>If you have any questions about this invoice or need to discuss payment arrangements, please don't hesitate to contact us. We appreciate your business and look forward to continuing our partnership.</p>
            
            <p>Thank you for choosing ${process.env.INVOICE_FROM_NAME || 'PayRush'}!</p>
          </div>
          
          <div class="footer">
            <p><strong>${process.env.INVOICE_FROM_NAME || 'PayRush'}</strong></p>
            <p>Email: ${process.env.INVOICE_FROM_EMAIL} | This is an automated message, please do not reply to this email.</p>
            <p style="font-size: 12px; margin-top: 15px;">If you believe you received this email in error, please contact us immediately.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Generate payment reminder email HTML
   */
  static generateReminderEmailHTML(invoice, clientName, reminderType, daysOverdue) {
    const dueDate = new Date(invoice.due_date).toLocaleDateString();
    const isOverdue = daysOverdue > 0;
    
    const reminderMessages = {
      gentle: {
        title: '🔔 Friendly Payment Reminder',
        message: 'We hope this email finds you well. This is a friendly reminder that your invoice payment is approaching its due date.',
        urgency: 'reminder'
      },
      firm: {
        title: '⚠️ Payment Due Notice',
        message: 'This is an important notice regarding your overdue invoice. Please arrange payment at your earliest convenience.',
        urgency: 'warning'
      },
      final: {
        title: '🚨 Final Payment Notice',
        message: 'URGENT: This is our final notice regarding your significantly overdue payment. Immediate action is required.',
        urgency: 'urgent'
      }
    };

    const reminder = reminderMessages[reminderType] || reminderMessages.gentle;
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Payment Reminder - Invoice ${invoice.invoice_number}</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 20px; background-color: #f8f9fa; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
          .header { padding: 30px; border-radius: 8px 8px 0 0; text-align: center; }
          .header.reminder { background: linear-gradient(135deg, #17a2b8 0%, #138496 100%); color: white; }
          .header.warning { background: linear-gradient(135deg, #ffc107 0%, #e0a800 100%); color: #212529; }
          .header.urgent { background: linear-gradient(135deg, #dc3545 0%, #c82333 100%); color: white; }
          .header h1 { margin: 0; font-size: 24px; font-weight: 400; }
          .content { padding: 30px; }
          .invoice-details { background: #f8f9fa; padding: 20px; border-radius: 6px; margin: 20px 0; }
          .overdue-notice { background: #f8d7da; border: 1px solid #f5c6cb; color: #721c24; padding: 15px; border-radius: 6px; margin: 20px 0; }
          .amount-highlight { font-size: 24px; font-weight: bold; color: #dc3545; }
          .btn { background: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 10px 5px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header ${reminder.urgency}">
            <h1>${reminder.title}</h1>
            <p>Invoice ${invoice.invoice_number}</p>
          </div>
          
          <div class="content">
            <p>Dear <strong>${clientName}</strong>,</p>
            
            <p>${reminder.message}</p>
            
            ${isOverdue ? `
              <div class="overdue-notice">
                <strong>⚠️ This invoice is ${daysOverdue} day(s) overdue.</strong>
              </div>
            ` : ''}
            
            <div class="invoice-details">
              <h3>Invoice Details</h3>
              <p><strong>Invoice Number:</strong> ${invoice.invoice_number}</p>
              <p><strong>Original Due Date:</strong> ${dueDate}</p>
              <p><strong>Amount Due:</strong> <span class="amount-highlight">${invoice.currency || 'USD'} $${parseFloat(invoice.total_amount || 0).toFixed(2)}</span></p>
              ${isOverdue ? `<p><strong>Days Overdue:</strong> ${daysOverdue}</p>` : ''}
            </div>

            <p>Please arrange payment immediately to avoid any service interruptions or additional fees.</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="mailto:${process.env.INVOICE_FROM_EMAIL}?subject=Payment Confirmation - Invoice ${invoice.invoice_number}" class="btn">
                Confirm Payment Made
              </a>
            </div>

            <p>If you have already made this payment, please disregard this notice. If you have any questions or concerns, please contact us immediately.</p>
            
            <p>Thank you for your prompt attention to this matter.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Generate payment confirmation email HTML
   */
  static generatePaymentConfirmationHTML(invoice, clientName, paymentDetails) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Payment Confirmation - Invoice ${invoice.invoice_number}</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 20px; background-color: #f8f9fa; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #28a745 0%, #20c997 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; text-align: center; }
          .header h1 { margin: 0; font-size: 28px; font-weight: 300; }
          .content { padding: 30px; }
          .payment-details { background: #d4edda; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #28a745; }
          .success-icon { font-size: 48px; text-align: center; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✅ Payment Received!</h1>
            <p>Thank you for your payment</p>
          </div>
          
          <div class="content">
            <div class="success-icon">🎉</div>
            
            <p>Dear <strong>${clientName}</strong>,</p>
            
            <p>Excellent news! We have successfully received your payment. Thank you for your promptness.</p>
            
            <div class="payment-details">
              <h3>Payment Details</h3>
              <p><strong>Invoice Number:</strong> ${invoice.custom_invoice_number || invoice.invoice_number || `INV-${invoice.id.split('-')[0].toUpperCase()}`}</p>
              <p><strong>Amount Paid:</strong> ${formatCurrency(parseFloat(invoice.amount || 0), invoice.currency || 'USD')}</p>
              <p><strong>Payment Date:</strong> ${paymentDetails.date ? new Date(paymentDetails.date).toLocaleDateString() : new Date().toLocaleDateString()}</p>
              <p><strong>Payment Method:</strong> ${paymentDetails.method || 'bank_transfer'}</p>
              <p><strong>Status:</strong> <span style="color: #28a745; font-weight: bold;">PAID IN FULL</span></p>
            </div>

            <p>This invoice has been marked as fully paid in our system. You should receive a receipt shortly for your records.</p>
            
            <p>We appreciate your business and look forward to serving you again in the future!</p>
            
            <p>Best regards,<br><strong>${process.env.INVOICE_FROM_NAME || 'PayRush'} Team</strong></p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Generate payment instructions HTML based on branding data
   */
  static generatePaymentInstructions(branding) {
    if (!branding) {
      return `
        <p>To complete your payment, please follow these options:</p>
        <ul>
          <li><strong>Manual Payment:</strong> Please process payment via your preferred method and notify us when complete</li>
          <li><strong>Bank Transfer:</strong> Contact us for banking details</li>
          <li><strong>Check Payment:</strong> Make payable to ${process.env.INVOICE_FROM_NAME || 'PayRush'}</li>
        </ul>
      `;
    }

    let paymentHTML = '<p>To complete your payment, please use one of the following methods:</p>';
    
    // Bank transfer information
    if (branding.bank_name || branding.account_number || branding.routing_number) {
      paymentHTML += `
        <div style="background: #f8f9fa; padding: 15px; border-radius: 6px; margin: 15px 0; border-left: 4px solid #28a745;">
          <h4 style="margin-top: 0; color: #28a745;">🏦 Bank Transfer</h4>
      `;
      
      if (branding.bank_name) {
        paymentHTML += `<p><strong>Bank Name:</strong> ${branding.bank_name}</p>`;
      }
      
      if (branding.account_holder_name) {
        paymentHTML += `<p><strong>Account Holder:</strong> ${branding.account_holder_name}</p>`;
      }
      
      if (branding.account_number) {
        // Show full account number for payment purposes
        paymentHTML += `<p><strong>Account Number:</strong> ${branding.account_number}</p>`;
      }
      
      if (branding.routing_number) {
        paymentHTML += `<p><strong>Routing Number:</strong> ${branding.routing_number}</p>`;
      }
      
      paymentHTML += '</div>';
    }

    // Custom payment instructions
    if (branding.payment_instructions) {
      paymentHTML += `
        <div style="background: #e3f2fd; padding: 15px; border-radius: 6px; margin: 15px 0; border-left: 4px solid #2196f3;">
          <h4 style="margin-top: 0; color: #1976d2;">💡 Additional Payment Instructions</h4>
          <p>${branding.payment_instructions.replace(/\n/g, '<br>')}</p>
        </div>
      `;
    }

    // Default options if no specific payment info
    if (!branding.bank_name && !branding.account_number && !branding.payment_instructions) {
      paymentHTML += `
        <ul>
          <li><strong>Manual Payment:</strong> Please process payment via your preferred method and notify us when complete</li>
          <li><strong>Check Payment:</strong> Make payable to ${branding.company_name || process.env.INVOICE_FROM_NAME || 'PayRush'}</li>
          <li><strong>Contact Us:</strong> For additional payment options, please reach out to us</li>
        </ul>
      `;
    }

    return paymentHTML;
  }

  /**
   * Get reminder subject based on type and days overdue
   */
  static getReminderSubject(invoiceNumber, reminderType, daysOverdue) {
    const subjects = {
      gentle: `Payment Reminder - Invoice ${invoiceNumber}`,
      firm: `Payment Due Notice - Invoice ${invoiceNumber} (${daysOverdue} days overdue)`,
      final: `FINAL NOTICE - Invoice ${invoiceNumber} (${daysOverdue} days overdue)`
    };
    
    return subjects[reminderType] || subjects.gentle;
  }

  /**
   * Update invoice status
   */
  static async updateInvoiceStatus(invoiceId, status) {
    try {
      const { error } = await supabase
        .from('invoices')
        .update({ 
          status: status.toLowerCase()
        })
        .eq('id', invoiceId);

      if (error) {
        console.error('Error updating invoice status:', error);
        throw new Error('Failed to update invoice status');
      }
    } catch (error) {
      console.error('Error in updateInvoiceStatus:', error);
      throw error;
    }
  }

  /**
   * Log email attempt to database
   */
  static async logEmailAttempt(recipientEmail, subject, type, userId, metadata = {}) {
    try {
      const logEntry = {
        user_id: userId,
        recipient_email: recipientEmail,
        subject,
        template_used: type,
        status: metadata.status || 'sent',
        sent_at: new Date().toISOString(),
        delivery_details: {
          resend_id: metadata.resendId,
          invoice_id: metadata.invoiceId || null,
          invoice_number: metadata.invoiceNumber || null,
          type,
          ...metadata
        },
        invoice_id: metadata.invoiceId || null, // Add invoice_id as a direct field
        error_message: metadata.error || null,
        created_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('email_logs')
        .insert(logEntry);

      if (error) {
        console.error('Error logging email attempt:', error);
        // Don't throw here, as email was successful even if logging failed
      }
    } catch (error) {
      console.error('Error in logEmailAttempt:', error);
      // Don't throw here, as email was successful even if logging failed
    }
  }

  /**
   * Get email delivery status from Resend
   */
  static async getEmailStatus(emailId) {
    try {
      // Note: This would require additional Resend API calls to check email status
      // For now, return a simple status
      return {
        id: emailId,
        status: 'sent',
        created_at: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error getting email status:', error);
      throw error;
    }
  }
}

module.exports = InvoiceEmailService;