/**
 * Bulk Invoice Operations Service
 * Handles bulk operations on multiple invoices
 */

const { supabase } = require('../config/database');
const BulkExportService = require('./bulkExportService');
const EmailService = require('./emailService');

class BulkInvoiceService {
  
  /**
   * Update status for multiple invoices
   */
  async bulkUpdateStatus(userId, invoiceIds, newStatus) {
    try {
      // Validate status - using database constraint values
      const validStatuses = ['pending', 'sent', 'paid', 'overdue', 'cancelled'];
      const statusLower = newStatus.toLowerCase();
      
      if (!validStatuses.includes(statusLower)) {
        throw new Error(`Invalid status: ${newStatus}`);
      }

      // Use lowercase status values to match updated database constraint
      // Updated constraint now allows: 'draft', 'sent', 'paid', 'overdue', 'cancelled'
      const statusMapping = {
        'pending': 'draft',      // Map to 'draft' 
        'sent': 'sent',          // Use lowercase
        'paid': 'paid',          // Use lowercase
        'overdue': 'overdue',    // Use lowercase
        'cancelled': 'cancelled' // Now allowed by updated constraint!
      };
      
      // Map status values for approval_status column (lowercase)
      // Keep approval_status as 'draft' for most statuses, 'cancelled' for cancelled
      const approvalStatusMapping = {
        'pending': 'draft',     
        'sent': 'draft',        
        'paid': 'draft',        
        'overdue': 'draft',     
        'cancelled': 'cancelled' 
      };
      
      const dbStatus = statusMapping[statusLower];
      const dbApprovalStatus = approvalStatusMapping[statusLower];
      
      console.log(`🔄 Updating ${invoiceIds.length} invoice(s) to status: ${dbStatus} (lowercase), approval_status: ${dbApprovalStatus}`);

      // Update invoices one by one to better handle constraint violations
      const results = [];
      const errors = [];
      
      for (const invoiceId of invoiceIds) {
        try {
          const { data, error } = await supabase
            .from('invoices')
            .update({ 
              status: dbStatus,
              approval_status: dbApprovalStatus
            })
            .eq('user_id', userId)
            .eq('id', invoiceId)
            .select();

          if (error) {
            console.error(`❌ Error updating invoice ${invoiceId}:`, error);
            errors.push({ invoiceId, error: error.message });
          } else if (data && data.length > 0) {
            console.log(`✅ Updated invoice ${invoiceId} to ${dbStatus}`);
            results.push(data[0]);
          }
        } catch (individualError) {
          console.error(`❌ Exception updating invoice ${invoiceId}:`, individualError);
          errors.push({ invoiceId, error: individualError.message });
        }
      }
      
      if (errors.length > 0) {
        console.error('Some invoices failed to update:', errors);
        if (results.length === 0) {
          throw new Error(`Failed to update any invoices. Errors: ${errors.map(e => e.error).join(', ')}`);
        }
      }

      return {
        success: true,
        updated: results.length,
        invoices: results,
        errors: errors.length > 0 ? errors : undefined
      };
    } catch (error) {
      console.error('BulkInvoiceService.bulkUpdateStatus error:', error);
      throw error;
    }
  }

  /**
   * Delete multiple invoices
   */
  async bulkDelete(userId, invoiceIds) {
    try {
      // Hard delete invoices (since soft delete isn't implemented in current schema)
      const { data, error } = await supabase
        .from('invoices')
        .delete()
        .eq('user_id', userId)
        .in('id', invoiceIds)
        .select();

      if (error) {
        console.error('Bulk delete error:', error);
        throw new Error('Failed to delete invoices');
      }

      return {
        success: true,
        deleted: data.length,
        invoices: data
      };
    } catch (error) {
      console.error('BulkInvoiceService.bulkDelete error:', error);
      throw error;
    }
  }

  /**
   * Export multiple invoices data
   */
  async bulkExport(userId, invoiceIds, options = {}) {
    try {
      const { 
        includeLineItems = false, 
        includePayments = false,
        format = 'csv' 
      } = options;

      // Get invoice data
      let query = supabase
        .from('invoices')
        .select(`
          id,
          customer_name,
          customer_email,
          amount,
          currency,
          due_date,
          status,
          created_at
        `)
        .eq('user_id', userId)
        .in('id', invoiceIds)
        .order('created_at', { ascending: false });

      const { data: invoices, error: invoiceError } = await query;

      if (invoiceError) {
        console.error('Export invoices fetch error:', invoiceError);
        throw new Error('Failed to fetch invoices for export');
      }

      let exportData = invoices;

      // Include line items if requested
      if (includeLineItems) {
        const { data: lineItems, error: lineItemsError } = await supabase
          .from('invoice_items')
          .select('*')
          .in('invoice_id', invoiceIds)
          .order('created_at', { ascending: true });

        if (lineItemsError) {
          console.warn('Failed to fetch line items for export:', lineItemsError);
        } else {
          // Group line items by invoice_id
          const lineItemsMap = lineItems.reduce((acc, item) => {
            if (!acc[item.invoice_id]) acc[item.invoice_id] = [];
            acc[item.invoice_id].push(item);
            return acc;
          }, {});

          exportData = invoices.map(invoice => ({
            ...invoice,
            line_items: lineItemsMap[invoice.id] || []
          }));
        }
      }

      // Include payments if requested
      if (includePayments) {
        const { data: payments, error: paymentsError } = await supabase
          .from('payments')
          .select('*')
          .in('invoice_id', invoiceIds)
          .order('created_at', { ascending: true });

        if (paymentsError) {
          console.warn('Failed to fetch payments for export:', paymentsError);
        } else {
          // Group payments by invoice_id
          const paymentsMap = payments.reduce((acc, payment) => {
            if (!acc[payment.invoice_id]) acc[payment.invoice_id] = [];
            acc[payment.invoice_id].push(payment);
            return acc;
          }, {});

          exportData = exportData.map(invoice => ({
            ...invoice,
            payments: paymentsMap[invoice.id] || []
          }));
        }
      }

      // Generate export data based on format
      let exportResult;
      switch (format.toLowerCase()) {
        case 'csv':
          exportResult = {
            success: true,
            format: 'csv',
            count: exportData.length,
            data: BulkExportService.convertToCSV(exportData, { includeLineItems, includePayments }),
            filename: BulkExportService.getExportFilename('csv'),
            contentType: 'text/csv',
            timestamp: new Date().toISOString()
          };
          break;
        
        case 'excel':
          exportResult = {
            success: true,
            format: 'excel',
            count: exportData.length,
            data: BulkExportService.convertToExcel(exportData, { includeLineItems, includePayments }),
            filename: BulkExportService.getExportFilename('excel'),
            contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            timestamp: new Date().toISOString()
          };
          break;
        
        case 'pdf':
          exportResult = await BulkExportService.generatePDFExport(exportData, { includeLineItems, includePayments });
          break;
        
        default:
          throw new Error(`Unsupported export format: ${format}`);
      }

      return exportResult;
    } catch (error) {
      console.error('BulkInvoiceService.bulkExport error:', error);
      throw error;
    }
  }

  /**
   * Get invoices for email sending
   */
  async bulkGetForEmail(userId, invoiceIds) {
    try {
      const { data, error } = await supabase
        .from('invoices')
        .select(`
          id,
          customer_name,
          customer_email,
          amount,
          currency,
          due_date,
          status,
          created_at
        `)
        .eq('user_id', userId)
        .in('id', invoiceIds)
        .not('customer_email', 'is', null) // Only invoices with email addresses
        .neq('customer_email', ''); // And not empty strings

      if (error) {
        console.error('Bulk email fetch error:', error);
        throw new Error('Failed to fetch invoices for email');
      }

      return {
        success: true,
        count: data.length,
        invoices: data,
        skipped: invoiceIds.length - data.length // Invoices without valid emails
      };
    } catch (error) {
      console.error('BulkInvoiceService.bulkGetForEmail error:', error);
      throw error;
    }
  }

  /**
   * Get bulk operation statistics
   */
  async getBulkStats(userId, invoiceIds) {
    try {
      const { data, error } = await supabase
        .from('invoices')
        .select(`
          id,
          status,
          amount,
          currency,
          customer_email
        `)
        .eq('user_id', userId)
        .in('id', invoiceIds);

      if (error) {
        console.error('Bulk stats error:', error);
        throw new Error('Failed to fetch bulk statistics');
      }

      // Calculate statistics
      const stats = {
        total: data.length,
        totalAmount: data.reduce((sum, invoice) => sum + parseFloat(invoice.amount), 0),
        statusBreakdown: {},
        currencies: new Set(),
        withEmails: 0,
        withoutEmails: 0
      };

      data.forEach(invoice => {
        // Status breakdown
        stats.statusBreakdown[invoice.status] = (stats.statusBreakdown[invoice.status] || 0) + 1;
        
        // Currencies
        stats.currencies.add(invoice.currency);
        
        // Email availability
        if (invoice.customer_email && invoice.customer_email.trim() !== '') {
          stats.withEmails++;
        } else {
          stats.withoutEmails++;
        }
      });

      stats.currencies = Array.from(stats.currencies);

      return {
        success: true,
        stats
      };
    } catch (error) {
      console.error('BulkInvoiceService.getBulkStats error:', error);
      throw error;
    }
  }

  /**
   * Restore deleted invoices (Not implemented - current schema doesn't support soft delete)
   */
  async bulkRestore(userId, invoiceIds) {
    try {
      // Since current schema doesn't support soft delete, this is a no-op
      console.warn('Bulk restore not supported - current schema does not implement soft delete');
      
      return {
        success: false,
        restored: 0,
        invoices: [],
        message: 'Restore functionality not available - schema does not support soft delete'
      };
    } catch (error) {
      console.error('BulkInvoiceService.bulkRestore error:', error);
      throw error;
    }
  }

  /**
   * Send bulk email notifications for invoices
   */
  async bulkSendEmails(userId, invoiceIds, emailOptions = {}) {
    try {
      // Validate input
      if (!invoiceIds || !Array.isArray(invoiceIds) || invoiceIds.length === 0) {
        throw new Error('Invoice IDs are required');
      }

      // Use EmailService to send bulk emails
      const result = await EmailService.sendBulkInvoiceEmails(userId, invoiceIds, emailOptions);

      return {
        success: true,
        sent: result.data.sent,
        failed: result.data.failed,
        scheduled: result.data.scheduled,
        total: result.data.total_emails,
        emailLogs: result.data.email_logs
      };
    } catch (error) {
      console.error('BulkInvoiceService.bulkSendEmails error:', error);
      throw error;
    }
  }

  /**
   * Get email delivery statistics for bulk operations
   */
  async getBulkEmailStats(userId, invoiceIds = null) {
    try {
      const result = await EmailService.getEmailStats(userId, { invoiceIds });
      return result.data;
    } catch (error) {
      console.error('BulkInvoiceService.getBulkEmailStats error:', error);
      throw error;
    }
  }

  /**
   * Get email logs for bulk operations
   */
  async getBulkEmailLogs(userId, options = {}) {
    try {
      const result = await EmailService.getEmailLogs(userId, options);
      return result.data;
    } catch (error) {
      console.error('BulkInvoiceService.getBulkEmailLogs error:', error);
      throw error;
    }
  }
}

module.exports = new BulkInvoiceService();