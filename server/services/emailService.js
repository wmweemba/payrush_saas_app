/**
 * Email Service
 * 
 * Handles bulk email notifications for invoices with template support and delivery tracking
 */

const { supabase } = require('../config/database');

class EmailService {
  // Email templates
  static EMAIL_TEMPLATES = {
    invoice_sent: {
      subject: 'Invoice #{invoice_number} - Payment Required',
      template: `
        <h2>Invoice #{invoice_number}</h2>
        <p>Dear {customer_name},</p>
        <p>Thank you for your business. Please find your invoice details below:</p>
        
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>Invoice Details</h3>
          <p><strong>Invoice Number:</strong> #{invoice_number}</p>
          <p><strong>Amount:</strong> {amount} {currency}</p>
          <p><strong>Due Date:</strong> {due_date}</p>
          <p><strong>Status:</strong> {status}</p>
        </div>
        
        <p>Please make your payment by the due date to avoid any late fees.</p>
        <p>If you have any questions, please don't hesitate to contact us.</p>
        
        <p>Best regards,<br>{company_name}</p>
      `
    },
    payment_reminder: {
      subject: 'Payment Reminder - Invoice #{invoice_number}',
      template: `
        <h2>Payment Reminder</h2>
        <p>Dear {customer_name},</p>
        <p>This is a friendly reminder that your invoice is due for payment.</p>
        
        <div style="background: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
          <h3>Invoice Details</h3>
          <p><strong>Invoice Number:</strong> #{invoice_number}</p>
          <p><strong>Amount:</strong> {amount} {currency}</p>
          <p><strong>Due Date:</strong> {due_date}</p>
          <p><strong>Days Overdue:</strong> {days_overdue}</p>
        </div>
        
        <p>Please arrange payment at your earliest convenience to avoid any additional charges.</p>
        <p>If you have already made the payment, please disregard this notice.</p>
        
        <p>Best regards,<br>{company_name}</p>
      `
    },
    payment_confirmation: {
      subject: 'Payment Received - Invoice #{invoice_number}',
      template: `
        <h2>Payment Confirmation</h2>
        <p>Dear {customer_name},</p>
        <p>Thank you! We have received your payment for the following invoice:</p>
        
        <div style="background: #d4edda; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #28a745;">
          <h3>Payment Details</h3>
          <p><strong>Invoice Number:</strong> #{invoice_number}</p>
          <p><strong>Amount Paid:</strong> {amount} {currency}</p>
          <p><strong>Payment Date:</strong> {payment_date}</p>
          <p><strong>Payment Method:</strong> {payment_method}</p>
        </div>
        
        <p>Your account is now up to date. A receipt has been generated for your records.</p>
        <p>Thank you for your business!</p>
        
        <p>Best regards,<br>{company_name}</p>
      `
    },
    invoice_overdue: {
      subject: 'URGENT: Overdue Payment - Invoice #{invoice_number}',
      template: `
        <h2>Overdue Payment Notice</h2>
        <p>Dear {customer_name},</p>
        <p><strong>URGENT:</strong> Your invoice payment is now overdue. Immediate attention is required.</p>
        
        <div style="background: #f8d7da; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc3545;">
          <h3>Overdue Invoice Details</h3>
          <p><strong>Invoice Number:</strong> #{invoice_number}</p>
          <p><strong>Amount Due:</strong> {amount} {currency}</p>
          <p><strong>Original Due Date:</strong> {due_date}</p>
          <p><strong>Days Overdue:</strong> {days_overdue}</p>
          <p><strong>Late Fees:</strong> {late_fees}</p>
        </div>
        
        <p>Please arrange immediate payment to avoid further action. If you are experiencing difficulties, please contact us to discuss payment arrangements.</p>
        <p>Continued non-payment may result in additional fees and collection actions.</p>
        
        <p>Urgent regards,<br>{company_name}</p>
      `
    }
  };

  // Email delivery status
  static DELIVERY_STATUS = {
    pending: 'Pending',
    sent: 'Sent',
    delivered: 'Delivered',
    failed: 'Failed',
    bounced: 'Bounced',
    opened: 'Opened',
    clicked: 'Clicked'
  };

  /**
   * Send bulk emails to selected invoices
   */
  static async sendBulkInvoiceEmails(userId, invoiceIds, emailOptions = {}) {
    try {
      const {
        template = 'invoice_sent',
        customSubject,
        customTemplate,
        includeAttachment = true,
        scheduleFor,
        priority = 'normal'
      } = emailOptions;

      // Get invoice data
      const { data: invoices, error: invoiceError } = await supabase
        .from('invoices')
        .select(`
          id,
          invoice_number,
          customer_name,
          customer_email,
          amount,
          currency,
          due_date,
          status,
          created_at,
          user_id
        `)
        .eq('user_id', userId)
        .in('id', invoiceIds)
        .is('deleted_at', null);

      if (invoiceError) {
        console.error('Error fetching invoices for email:', invoiceError);
        throw new Error('Failed to fetch invoices for email sending');
      }

      // Get user/company information
      const { data: userProfile, error: userError } = await supabase
        .from('profiles')
        .select('company_name, email')
        .eq('id', userId)
        .single();

      if (userError) {
        console.error('Error fetching user profile:', userError);
      }

      const companyName = userProfile?.company_name || 'Your Company';

      // Prepare email jobs
      const emailJobs = [];
      const emailLogs = [];

      for (const invoice of invoices) {
        if (!invoice.customer_email) {
          console.warn(`No email address for invoice ${invoice.invoice_number}`);
          continue;
        }

        // Calculate days overdue if applicable
        const daysOverdue = invoice.status === 'overdue' ? 
          Math.floor((new Date() - new Date(invoice.due_date)) / (1000 * 60 * 60 * 24)) : 0;

        // Prepare template variables
        const templateVars = {
          invoice_number: invoice.invoice_number,
          customer_name: invoice.customer_name,
          amount: invoice.amount,
          currency: invoice.currency,
          due_date: new Date(invoice.due_date).toLocaleDateString(),
          status: invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1),
          company_name: companyName,
          days_overdue: daysOverdue,
          payment_date: new Date().toLocaleDateString(),
          payment_method: 'Online Payment',
          late_fees: '0.00' // This would be calculated based on business rules
        };

        // Get email template
        const emailTemplate = customTemplate || this.EMAIL_TEMPLATES[template];
        if (!emailTemplate) {
          throw new Error(`Invalid email template: ${template}`);
        }

        // Replace template variables
        const subject = this.replaceTemplateVariables(
          customSubject || emailTemplate.subject, 
          templateVars
        );
        const htmlContent = this.replaceTemplateVariables(
          emailTemplate.template, 
          templateVars
        );

        // Create email job
        const emailJob = {
          to_email: invoice.customer_email,
          to_name: invoice.customer_name,
          subject,
          html_content: htmlContent,
          template_used: template,
          invoice_id: invoice.id,
          user_id: userId,
          priority,
          scheduled_for: scheduleFor || new Date().toISOString(),
          include_attachment: includeAttachment
        };

        emailJobs.push(emailJob);

        // Create email log entry
        const emailLog = {
          invoice_id: invoice.id,
          user_id: userId,
          recipient_email: invoice.customer_email,
          recipient_name: invoice.customer_name,
          subject,
          template_used: template,
          status: scheduleFor ? 'scheduled' : 'pending',
          scheduled_for: scheduleFor,
          metadata: {
            priority,
            include_attachment: includeAttachment,
            template_variables: templateVars
          }
        };

        emailLogs.push(emailLog);
      }

      if (emailJobs.length === 0) {
        return {
          success: false,
          error: 'No valid email addresses found for selected invoices'
        };
      }

      // Store email logs
      const { data: logData, error: logError } = await supabase
        .from('email_logs')
        .insert(emailLogs)
        .select();

      if (logError) {
        console.error('Error creating email logs:', logError);
        throw new Error('Failed to create email logs');
      }

      // In a real implementation, you would send these emails to an email service
      // For now, we'll simulate the sending process and update the logs
      const sentResults = await this.simulateEmailSending(emailJobs, logData);

      return {
        success: true,
        data: {
          total_emails: emailJobs.length,
          sent: sentResults.sent,
          failed: sentResults.failed,
          scheduled: scheduleFor ? emailJobs.length : 0,
          email_logs: logData
        }
      };

    } catch (error) {
      console.error('EmailService.sendBulkInvoiceEmails error:', error);
      throw error;
    }
  }

  /**
   * Replace template variables in text
   */
  static replaceTemplateVariables(text, variables) {
    let result = text;
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`{${key}}`, 'g');
      result = result.replace(regex, value || '');
    });
    return result;
  }

  /**
   * Simulate email sending (replace with actual email service in production)
   */
  static async simulateEmailSending(emailJobs, emailLogs) {
    const results = { sent: 0, failed: 0 };

    // Simulate sending delay and update logs
    for (let i = 0; i < emailJobs.length; i++) {
      const job = emailJobs[i];
      const log = emailLogs[i];

      try {
        // Simulate email service API call
        // In production, replace this with actual email service (SendGrid, AWS SES, etc.)
        await new Promise(resolve => setTimeout(resolve, 100)); // Simulate API delay

        // Simulate 95% success rate
        const success = Math.random() < 0.95;

        if (success) {
          // Update log status to sent
          await supabase
            .from('email_logs')
            .update({
              status: 'sent',
              sent_at: new Date().toISOString(),
              delivery_details: {
                message_id: `sim_${Date.now()}_${i}`,
                provider: 'simulation',
                status: 'sent'
              }
            })
            .eq('id', log.id);

          results.sent++;
        } else {
          // Update log status to failed
          await supabase
            .from('email_logs')
            .update({
              status: 'failed',
              error_message: 'Simulated delivery failure',
              delivery_details: {
                error: 'Simulated error',
                provider: 'simulation'
              }
            })
            .eq('id', log.id);

          results.failed++;
        }
      } catch (error) {
        console.error('Email sending simulation error:', error);
        results.failed++;
      }
    }

    return results;
  }

  /**
   * Get email logs for invoices
   */
  static async getEmailLogs(userId, options = {}) {
    try {
      const {
        invoiceIds,
        limit = 50,
        offset = 0,
        status,
        startDate,
        endDate
      } = options;

      let query = supabase
        .from('email_logs')
        .select(`
          *,
          invoice:invoices(id, invoice_number, customer_name)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (invoiceIds && invoiceIds.length > 0) {
        query = query.in('invoice_id', invoiceIds);
      }

      if (status) {
        query = query.eq('status', status);
      }

      if (startDate) {
        query = query.gte('created_at', startDate);
      }

      if (endDate) {
        query = query.lte('created_at', endDate);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching email logs:', error);
        throw new Error('Failed to fetch email logs');
      }

      return {
        success: true,
        data: data || []
      };
    } catch (error) {
      console.error('EmailService.getEmailLogs error:', error);
      throw error;
    }
  }

  /**
   * Get email delivery statistics
   */
  static async getEmailStats(userId, options = {}) {
    try {
      const { startDate, endDate, invoiceIds } = options;

      let query = supabase
        .from('email_logs')
        .select('status')
        .eq('user_id', userId);

      if (invoiceIds && invoiceIds.length > 0) {
        query = query.in('invoice_id', invoiceIds);
      }

      if (startDate) {
        query = query.gte('created_at', startDate);
      }

      if (endDate) {
        query = query.lte('created_at', endDate);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching email stats:', error);
        throw new Error('Failed to fetch email statistics');
      }

      // Calculate statistics
      const stats = {
        total: data.length,
        sent: 0,
        delivered: 0,
        failed: 0,
        pending: 0,
        opened: 0,
        clicked: 0
      };

      data.forEach(log => {
        if (stats.hasOwnProperty(log.status)) {
          stats[log.status]++;
        }
      });

      // Calculate rates
      stats.delivery_rate = stats.total > 0 ? ((stats.sent + stats.delivered) / stats.total * 100).toFixed(2) : 0;
      stats.open_rate = stats.sent > 0 ? (stats.opened / stats.sent * 100).toFixed(2) : 0;
      stats.click_rate = stats.opened > 0 ? (stats.clicked / stats.opened * 100).toFixed(2) : 0;

      return {
        success: true,
        data: stats
      };
    } catch (error) {
      console.error('EmailService.getEmailStats error:', error);
      throw error;
    }
  }

  /**
   * Resend failed emails
   */
  static async resendFailedEmails(userId, emailLogIds) {
    try {
      // Get failed email logs
      const { data: failedLogs, error: logError } = await supabase
        .from('email_logs')
        .select(`
          *,
          invoice:invoices(id, invoice_number, customer_name, customer_email, amount, currency, due_date, status)
        `)
        .eq('user_id', userId)
        .in('id', emailLogIds)
        .eq('status', 'failed');

      if (logError) {
        console.error('Error fetching failed email logs:', logError);
        throw new Error('Failed to fetch email logs for resending');
      }

      if (failedLogs.length === 0) {
        return {
          success: false,
          error: 'No failed emails found to resend'
        };
      }

      // Prepare resend jobs
      const resendJobs = failedLogs.map(log => ({
        to_email: log.recipient_email,
        to_name: log.recipient_name,
        subject: log.subject,
        html_content: log.metadata?.html_content || '',
        template_used: log.template_used,
        invoice_id: log.invoice_id,
        user_id: userId,
        priority: 'high',
        original_log_id: log.id
      }));

      // Simulate resending
      const results = await this.simulateEmailSending(resendJobs, failedLogs);

      return {
        success: true,
        data: {
          resent: results.sent,
          failed: results.failed,
          total: resendJobs.length
        }
      };
    } catch (error) {
      console.error('EmailService.resendFailedEmails error:', error);
      throw error;
    }
  }
}

module.exports = EmailService;