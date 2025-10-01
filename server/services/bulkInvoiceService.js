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
      // Validate status
      const validStatuses = ['draft', 'sent', 'paid', 'overdue', 'cancelled'];
      if (!validStatuses.includes(newStatus.toLowerCase())) {
        throw new Error(`Invalid status: ${newStatus}`);
      }

      // Update invoices
      const { data, error } = await supabase
        .from('invoices')
        .update({ 
          status: newStatus.toLowerCase(),
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .in('id', invoiceIds)
        .select();

      if (error) {
        console.error('Bulk status update error:', error);
        throw new Error('Failed to update invoice statuses');
      }

      return {
        success: true,
        updated: data.length,
        invoices: data
      };
    } catch (error) {
      console.error('BulkInvoiceService.bulkUpdateStatus error:', error);
      throw error;
    }
  }

  /**
   * Soft delete multiple invoices
   */
  async bulkDelete(userId, invoiceIds) {
    try {
      // Soft delete by updating deleted_at timestamp
      const { data, error } = await supabase
        .from('invoices')
        .update({ 
          deleted_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .in('id', invoiceIds)
        .is('deleted_at', null) // Only delete non-deleted invoices
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
          created_at,
          updated_at
        `)
        .eq('user_id', userId)
        .in('id', invoiceIds)
        .is('deleted_at', null)
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
          .from('invoice_line_items')
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
        .is('deleted_at', null)
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
        .in('id', invoiceIds)
        .is('deleted_at', null);

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
   * Restore deleted invoices
   */
  async bulkRestore(userId, invoiceIds) {
    try {
      const { data, error } = await supabase
        .from('invoices')
        .update({ 
          deleted_at: null,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .in('id', invoiceIds)
        .not('deleted_at', 'is', null) // Only restore deleted invoices
        .select();

      if (error) {
        console.error('Bulk restore error:', error);
        throw new Error('Failed to restore invoices');
      }

      return {
        success: true,
        restored: data.length,
        invoices: data
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