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
    approval_request: {
      subject: 'Approval Required - Invoice #{invoice_number}',
      template: `
        <h2>Invoice Approval Request</h2>
        <p>Dear {approver_name},</p>
        <p>A new invoice requires your approval. Please review the details below:</p>
        
        <div style="background: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
          <h3>Invoice Details</h3>
          <p><strong>Invoice Number:</strong> #{invoice_number}</p>
          <p><strong>Customer:</strong> {customer_name}</p>
          <p><strong>Amount:</strong> {amount} {currency}</p>
          <p><strong>Submitted By:</strong> {submitted_by}</p>
          <p><strong>Submitted Date:</strong> {submitted_date}</p>
          <p><strong>Workflow:</strong> {workflow_name}</p>
          <p><strong>Approval Step:</strong> {approval_step}</p>
        </div>
        
        {notes}
        
        <div style="margin: 30px 0;">
          <a href="{approval_link}" style="background: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin-right: 10px;">
            Review & Approve
          </a>
          <a href="{rejection_link}" style="background: #dc3545; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Reject
          </a>
        </div>
        
        <p>Please process this approval at your earliest convenience.</p>
        
        <p>Best regards,<br>{company_name}</p>
      `
    },
    approval_approved: {
      subject: 'Invoice #{invoice_number} Approved',
      template: `
        <h2>Invoice Approved</h2>
        <p>Dear {requester_name},</p>
        <p>Great news! Your invoice has been approved.</p>
        
        <div style="background: #d4edda; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #28a745;">
          <h3>Approval Details</h3>
          <p><strong>Invoice Number:</strong> #{invoice_number}</p>
          <p><strong>Customer:</strong> {customer_name}</p>
          <p><strong>Amount:</strong> {amount} {currency}</p>
          <p><strong>Approved By:</strong> {approved_by}</p>
          <p><strong>Approved Date:</strong> {approved_date}</p>
          <p><strong>Workflow:</strong> {workflow_name}</p>
        </div>
        
        {approval_comments}
        
        <p>Your invoice is now ready to be sent to the customer.</p>
        
        <p>Best regards,<br>{company_name}</p>
      `
    },
    approval_rejected: {
      subject: 'Invoice #{invoice_number} Rejected',
      template: `
        <h2>Invoice Rejected</h2>
        <p>Dear {requester_name},</p>
        <p>Your invoice has been rejected and requires revision.</p>
        
        <div style="background: #f8d7da; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc3545;">
          <h3>Rejection Details</h3>
          <p><strong>Invoice Number:</strong> #{invoice_number}</p>
          <p><strong>Customer:</strong> {customer_name}</p>
          <p><strong>Amount:</strong> {amount} {currency}</p>
          <p><strong>Rejected By:</strong> {rejected_by}</p>
          <p><strong>Rejected Date:</strong> {rejected_date}</p>
          <p><strong>Workflow:</strong> {workflow_name}</p>
        </div>
        
        <div style="background: #fff3cd; padding: 15px; border-radius: 6px; margin: 20px 0;">
          <h4>Rejection Reason:</h4>
          <p>{rejection_reason}</p>
        </div>
        
        <p>Please review the feedback and make the necessary changes before resubmitting.</p>
        
        <p>Best regards,<br>{company_name}</p>
      `
    },
    approval_reminder: {
      subject: 'Reminder: Approval Required - Invoice #{invoice_number}',
      template: `
        <h2>Approval Reminder</h2>
        <p>Dear {approver_name},</p>
        <p>This is a friendly reminder that an invoice is still awaiting your approval.</p>
        
        <div style="background: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
          <h3>Invoice Details</h3>
          <p><strong>Invoice Number:</strong> #{invoice_number}</p>
          <p><strong>Customer:</strong> {customer_name}</p>
          <p><strong>Amount:</strong> {amount} {currency}</p>
          <p><strong>Submitted Date:</strong> {submitted_date}</p>
          <p><strong>Days Pending:</strong> {days_pending}</p>
          <p><strong>Workflow:</strong> {workflow_name}</p>
        </div>
        
        <div style="margin: 30px 0;">
          <a href="{approval_link}" style="background: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin-right: 10px;">
            Review & Approve
          </a>
          <a href="{rejection_link}" style="background: #dc3545; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Reject
          </a>
        </div>
        
        <p>Please process this approval to avoid delays.</p>
        
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
   * Send approval notification email
   */
  static async sendApprovalNotification(approvalData, approverEmail, approverName = 'Approver') {
    try {
      const templateVars = {
        invoice_number: approvalData.invoice?.custom_invoice_number || `INV-${approvalData.invoice_id?.slice(-8)}`,
        customer_name: approvalData.invoice?.customer_name || 'Unknown Customer',
        amount: approvalData.invoice?.total_amount || '0.00',
        currency: approvalData.invoice?.currency || 'USD',
        submitted_by: approvalData.submitted_by_name || 'User',
        submitted_date: new Date(approvalData.submitted_at).toLocaleDateString(),
        workflow_name: approvalData.workflow?.name || 'Approval Workflow',
        approval_step: `${(approvalData.current_step || 0) + 1}`,
        approver_name: approverName,
        company_name: approvalData.company_name || 'Your Company',
        approval_link: `${process.env.CLIENT_URL || 'http://localhost:3000'}/dashboard/approvals`,
        rejection_link: `${process.env.CLIENT_URL || 'http://localhost:3000'}/dashboard/approvals`,
        notes: approvalData.notes ? `<div style="background: #e3f2fd; padding: 15px; border-radius: 6px; margin: 20px 0;"><h4>Submission Notes:</h4><p>${approvalData.notes}</p></div>` : ''
      };

      const emailTemplate = this.EMAIL_TEMPLATES.approval_request;
      const subject = this.replaceTemplateVariables(emailTemplate.subject, templateVars);
      const htmlContent = this.replaceTemplateVariables(emailTemplate.template, templateVars);

      // Create email log
      const emailLog = {
        invoice_id: approvalData.invoice_id,
        user_id: approvalData.user_id,
        recipient_email: approverEmail,
        recipient_name: approverName,
        subject,
        template_used: 'approval_request',
        status: 'pending',
        metadata: {
          approval_id: approvalData.id,
          workflow_id: approvalData.workflow_id,
          approval_step: approvalData.current_step
        }
      };

      const { data: logData, error: logError } = await supabase
        .from('email_logs')
        .insert(emailLog)
        .select()
        .single();

      if (logError) {
        console.error('Error creating approval email log:', logError);
        throw new Error('Failed to create email log');
      }

      // Simulate sending email
      const emailJob = {
        to_email: approverEmail,
        to_name: approverName,
        subject,
        html_content: htmlContent,
        template_used: 'approval_request',
        priority: 'high'
      };

      const result = await this.simulateEmailSending([emailJob], [logData]);

      return {
        success: true,
        data: {
          sent: result.sent,
          failed: result.failed,
          email_log: logData
        }
      };
    } catch (error) {
      console.error('EmailService.sendApprovalNotification error:', error);
      throw error;
    }
  }

  /**
   * Send approval result notification (approved/rejected)
   */
  static async sendApprovalResultNotification(approvalData, action, actionBy, comments = '') {
    try {
      const template = action === 'approve' ? 'approval_approved' : 'approval_rejected';
      const templateVars = {
        invoice_number: approvalData.invoice?.custom_invoice_number || `INV-${approvalData.invoice_id?.slice(-8)}`,
        customer_name: approvalData.invoice?.customer_name || 'Unknown Customer',
        amount: approvalData.invoice?.total_amount || '0.00',
        currency: approvalData.invoice?.currency || 'USD',
        requester_name: approvalData.submitted_by_name || 'User',
        approved_by: actionBy,
        rejected_by: actionBy,
        approved_date: new Date().toLocaleDateString(),
        rejected_date: new Date().toLocaleDateString(),
        workflow_name: approvalData.workflow?.name || 'Approval Workflow',
        company_name: approvalData.company_name || 'Your Company',
        approval_comments: comments ? `<div style="background: #e8f5e8; padding: 15px; border-radius: 6px; margin: 20px 0;"><h4>Approval Comments:</h4><p>${comments}</p></div>` : '',
        rejection_reason: comments || 'No specific reason provided'
      };

      const emailTemplate = this.EMAIL_TEMPLATES[template];
      const subject = this.replaceTemplateVariables(emailTemplate.subject, templateVars);
      const htmlContent = this.replaceTemplateVariables(emailTemplate.template, templateVars);

      // Get requester email
      const { data: requesterData, error: userError } = await supabase
        .from('profiles')
        .select('email, full_name')
        .eq('id', approvalData.submitted_by)
        .single();

      if (userError || !requesterData?.email) {
        console.warn('Could not get requester email for approval notification');
        return { success: false, error: 'Requester email not found' };
      }

      // Create email log
      const emailLog = {
        invoice_id: approvalData.invoice_id,
        user_id: approvalData.submitted_by,
        recipient_email: requesterData.email,
        recipient_name: requesterData.full_name || 'User',
        subject,
        template_used: template,
        status: 'pending',
        metadata: {
          approval_id: approvalData.id,
          workflow_id: approvalData.workflow_id,
          action: action,
          action_by: actionBy
        }
      };

      const { data: logData, error: logError } = await supabase
        .from('email_logs')
        .insert(emailLog)
        .select()
        .single();

      if (logError) {
        console.error('Error creating approval result email log:', logError);
        throw new Error('Failed to create email log');
      }

      // Simulate sending email
      const emailJob = {
        to_email: requesterData.email,
        to_name: requesterData.full_name || 'User',
        subject,
        html_content: htmlContent,
        template_used: template,
        priority: 'high'
      };

      const result = await this.simulateEmailSending([emailJob], [logData]);

      return {
        success: true,
        data: {
          sent: result.sent,
          failed: result.failed,
          email_log: logData
        }
      };
    } catch (error) {
      console.error('EmailService.sendApprovalResultNotification error:', error);
      throw error;
    }
  }

  /**
   * Send approval reminder emails
   */
  static async sendApprovalReminders(userId) {
    try {
      // Get pending approvals older than reminder threshold
      const reminderThreshold = new Date();
      reminderThreshold.setHours(reminderThreshold.getHours() - 24); // 24 hours ago

      const { data: pendingApprovals, error } = await supabase
        .from('invoice_approvals')
        .select(`
          *,
          invoices (custom_invoice_number, customer_name, total_amount, currency),
          invoice_approval_workflows (name, approval_steps)
        `)
        .eq('status', 'pending')
        .lt('submitted_at', reminderThreshold.toISOString())
        .is('reminder_sent_at', null);

      if (error) {
        console.error('Error fetching pending approvals for reminders:', error);
        throw new Error('Failed to fetch pending approvals');
      }

      if (!pendingApprovals || pendingApprovals.length === 0) {
        return { success: true, data: { reminders_sent: 0 } };
      }

      let remindersSent = 0;

      for (const approval of pendingApprovals) {
        try {
          const workflow = approval.invoice_approval_workflows;
          const currentStep = approval.current_step || 0;
          const approvers = workflow?.approval_steps?.[currentStep]?.approvers || [];

          for (const approverEmail of approvers) {
            const daysPending = Math.floor((new Date() - new Date(approval.submitted_at)) / (1000 * 60 * 60 * 24));
            
            const templateVars = {
              invoice_number: approval.invoices?.custom_invoice_number || `INV-${approval.invoice_id?.slice(-8)}`,
              customer_name: approval.invoices?.customer_name || 'Unknown Customer',
              amount: approval.invoices?.total_amount || '0.00',
              currency: approval.invoices?.currency || 'USD',
              submitted_date: new Date(approval.submitted_at).toLocaleDateString(),
              days_pending: daysPending,
              workflow_name: workflow?.name || 'Approval Workflow',
              approver_name: approverEmail.split('@')[0],
              company_name: 'Your Company',
              approval_link: `${process.env.CLIENT_URL || 'http://localhost:3000'}/dashboard/approvals`,
              rejection_link: `${process.env.CLIENT_URL || 'http://localhost:3000'}/dashboard/approvals`
            };

            const emailTemplate = this.EMAIL_TEMPLATES.approval_reminder;
            const subject = this.replaceTemplateVariables(emailTemplate.subject, templateVars);
            const htmlContent = this.replaceTemplateVariables(emailTemplate.template, templateVars);

            // Create email log
            const emailLog = {
              invoice_id: approval.invoice_id,
              user_id: userId,
              recipient_email: approverEmail,
              recipient_name: approverEmail.split('@')[0],
              subject,
              template_used: 'approval_reminder',
              status: 'pending',
              metadata: {
                approval_id: approval.id,
                workflow_id: approval.workflow_id,
                reminder_type: 'approval_reminder'
              }
            };

            const { data: logData, error: logError } = await supabase
              .from('email_logs')
              .insert(emailLog)
              .select()
              .single();

            if (!logError) {
              // Simulate sending
              const emailJob = {
                to_email: approverEmail,
                to_name: approverEmail.split('@')[0],
                subject,
                html_content: htmlContent,
                template_used: 'approval_reminder',
                priority: 'normal'
              };

              await this.simulateEmailSending([emailJob], [logData]);
              remindersSent++;
            }
          }

          // Mark reminder as sent
          await supabase
            .from('invoice_approvals')
            .update({ reminder_sent_at: new Date().toISOString() })
            .eq('id', approval.id);

        } catch (approvalError) {
          console.error(`Error sending reminder for approval ${approval.id}:`, approvalError);
        }
      }

      return {
        success: true,
        data: {
          reminders_sent: remindersSent,
          pending_approvals_checked: pendingApprovals.length
        }
      };
    } catch (error) {
      console.error('EmailService.sendApprovalReminders error:', error);
      throw error;
    }
  }

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