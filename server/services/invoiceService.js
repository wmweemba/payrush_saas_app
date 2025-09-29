/**
 * Invoice Service
 * 
 * Business logic for invoice management operations related to clients
 */

const { supabase } = require('../config/database');
const { sanitizeString } = require('../utils');

class InvoiceService {
  constructor() {
    this.supabase = supabase;
  }

  /**
   * Get all invoices for a specific client
   */
  async getClientInvoices(clientId, userId, options = {}) {
    try {
      // Verify client ownership
      const { data: client } = await this.supabase
        .from('clients')
        .select('id')
        .eq('id', clientId)
        .eq('user_id', userId)
        .single();

      if (!client) {
        return {
          success: false,
          error: 'Client not found or access denied',
          statusCode: 404
        };
      }

      const { limit = 50, offset = 0, status, sortBy = 'created_at', sortOrder = 'desc' } = options;

      let query = this.supabase
        .from('invoices')
        .select(`
          id,
          invoice_number,
          customer_name,
          customer_email,
          amount,
          currency,
          status,
          due_date,
          created_at,
          updated_at,
          paid_date,
          notes
        `)
        .eq('client_id', clientId)
        .order(sortBy, { ascending: sortOrder === 'asc' })
        .range(offset, offset + limit - 1);

      // Filter by status if provided
      if (status && status !== 'all') {
        query = query.eq('status', status);
      }

      const { data, error, count } = await query;

      if (error) {
        throw new Error(`Failed to get client invoices: ${error.message}`);
      }

      return {
        success: true,
        data: { 
          invoices: data || [],
          pagination: {
            total: count,
            limit,
            offset,
            hasMore: count > offset + limit
          }
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        statusCode: 500
      };
    }
  }

  /**
   * Get payment history for a specific client
   */
  async getClientPaymentHistory(clientId, userId, options = {}) {
    try {
      // Verify client ownership
      const { data: client } = await this.supabase
        .from('clients')
        .select('id')
        .eq('id', clientId)
        .eq('user_id', userId)
        .single();

      if (!client) {
        return {
          success: false,
          error: 'Client not found or access denied',
          statusCode: 404
        };
      }

      const { limit = 50, offset = 0, sortBy = 'created_at', sortOrder = 'desc' } = options;

      // Get payments through invoice relationship
      const { data, error } = await this.supabase
        .from('payments')
        .select(`
          id,
          amount,
          currency,
          status,
          provider,
          reference,
          created_at,
          invoice:invoice_id (
            id,
            invoice_number,
            customer_name,
            amount as invoice_amount
          )
        `)
        .eq('invoice.client_id', clientId)
        .order(sortBy, { ascending: sortOrder === 'asc' })
        .range(offset, offset + limit - 1);

      if (error) {
        throw new Error(`Failed to get client payment history: ${error.message}`);
      }

      return {
        success: true,
        data: { 
          payments: data || [],
          pagination: {
            limit,
            offset,
            hasMore: data && data.length === limit
          }
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        statusCode: 500
      };
    }
  }

  /**
   * Get financial summary for a specific client
   */
  async getClientFinancialSummary(clientId, userId) {
    try {
      // Verify client ownership
      const { data: client } = await this.supabase
        .from('clients')
        .select('id, total_invoiced, total_paid, current_balance, default_currency')
        .eq('id', clientId)
        .eq('user_id', userId)
        .single();

      if (!client) {
        return {
          success: false,
          error: 'Client not found or access denied',
          statusCode: 404
        };
      }

      // Get detailed invoice statistics
      const { data: invoiceStats, error: invoiceError } = await this.supabase
        .from('invoices')
        .select('status, amount, due_date')
        .eq('client_id', clientId);

      if (invoiceError) {
        throw new Error(`Failed to get invoice statistics: ${invoiceError.message}`);
      }

      // Calculate statistics
      const now = new Date();
      const stats = {
        totalInvoices: invoiceStats.length,
        totalInvoiced: client.total_invoiced || 0,
        totalPaid: client.total_paid || 0,
        currentBalance: client.current_balance || 0,
        currency: client.default_currency || 'USD',
        
        // Invoice status breakdown
        paidInvoices: invoiceStats.filter(inv => inv.status === 'paid').length,
        pendingInvoices: invoiceStats.filter(inv => inv.status === 'pending').length,
        overdueInvoices: invoiceStats.filter(inv => 
          inv.status !== 'paid' && new Date(inv.due_date) < now
        ).length,
        
        // Amount breakdowns
        paidAmount: invoiceStats
          .filter(inv => inv.status === 'paid')
          .reduce((sum, inv) => sum + (inv.amount || 0), 0),
        pendingAmount: invoiceStats
          .filter(inv => inv.status === 'pending')
          .reduce((sum, inv) => sum + (inv.amount || 0), 0),
        overdueAmount: invoiceStats
          .filter(inv => inv.status !== 'paid' && new Date(inv.due_date) < now)
          .reduce((sum, inv) => sum + (inv.amount || 0), 0),
      };

      // Calculate payment trends (last 6 months)
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      const { data: recentPayments, error: paymentsError } = await this.supabase
        .from('payments')
        .select(`
          amount,
          created_at,
          invoice:invoice_id (client_id)
        `)
        .eq('invoice.client_id', clientId)
        .eq('status', 'completed')
        .gte('created_at', sixMonthsAgo.toISOString());

      if (!paymentsError && recentPayments) {
        // Group payments by month
        const monthlyPayments = {};
        recentPayments.forEach(payment => {
          const month = new Date(payment.created_at).toISOString().substring(0, 7); // YYYY-MM
          monthlyPayments[month] = (monthlyPayments[month] || 0) + payment.amount;
        });

        stats.paymentTrends = monthlyPayments;
        stats.averageMonthlyPayment = Object.values(monthlyPayments).length > 0
          ? Object.values(monthlyPayments).reduce((sum, amount) => sum + amount, 0) / Object.values(monthlyPayments).length
          : 0;
      }

      return {
        success: true,
        data: { financialSummary: stats }
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        statusCode: 500
      };
    }
  }

  /**
   * Get invoice aging report for a client
   */
  async getClientInvoiceAging(clientId, userId) {
    try {
      // Verify client ownership
      const { data: client } = await this.supabase
        .from('clients')
        .select('id')
        .eq('id', clientId)
        .eq('user_id', userId)
        .single();

      if (!client) {
        return {
          success: false,
          error: 'Client not found or access denied',
          statusCode: 404
        };
      }

      // Get unpaid invoices with due dates
      const { data: unpaidInvoices, error } = await this.supabase
        .from('invoices')
        .select('id, invoice_number, amount, due_date, created_at')
        .eq('client_id', clientId)
        .neq('status', 'paid');

      if (error) {
        throw new Error(`Failed to get invoice aging: ${error.message}`);
      }

      const now = new Date();
      const aging = {
        current: { count: 0, amount: 0, invoices: [] },      // 0-30 days
        days30: { count: 0, amount: 0, invoices: [] },       // 31-60 days
        days60: { count: 0, amount: 0, invoices: [] },       // 61-90 days
        days90: { count: 0, amount: 0, invoices: [] },       // 91+ days
      };

      unpaidInvoices.forEach(invoice => {
        const dueDate = new Date(invoice.due_date);
        const daysOverdue = Math.floor((now - dueDate) / (1000 * 60 * 60 * 24));

        let category;
        if (daysOverdue <= 30) {
          category = 'current';
        } else if (daysOverdue <= 60) {
          category = 'days30';
        } else if (daysOverdue <= 90) {
          category = 'days60';
        } else {
          category = 'days90';
        }

        aging[category].count++;
        aging[category].amount += invoice.amount;
        aging[category].invoices.push({
          ...invoice,
          daysOverdue: Math.max(0, daysOverdue)
        });
      });

      return {
        success: true,
        data: { aging }
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        statusCode: 500
      };
    }
  }

  /**
   * Get recent client activity (invoices and payments)
   */
  async getClientActivity(clientId, userId, options = {}) {
    try {
      // Verify client ownership
      const { data: client } = await this.supabase
        .from('clients')
        .select('id')
        .eq('id', clientId)
        .eq('user_id', userId)
        .single();

      if (!client) {
        return {
          success: false,
          error: 'Client not found or access denied',
          statusCode: 404
        };
      }

      const { limit = 20 } = options;
      const activities = [];

      // Get recent invoices
      const { data: recentInvoices } = await this.supabase
        .from('invoices')
        .select('id, invoice_number, amount, status, created_at, updated_at')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (recentInvoices) {
        recentInvoices.forEach(invoice => {
          activities.push({
            id: `invoice-${invoice.id}`,
            type: 'invoice',
            action: 'created',
            description: `Invoice ${invoice.invoice_number} created`,
            amount: invoice.amount,
            status: invoice.status,
            date: invoice.created_at,
            relatedId: invoice.id
          });
        });
      }

      // Get recent payments
      const { data: recentPayments } = await this.supabase
        .from('payments')
        .select(`
          id,
          amount,
          status,
          created_at,
          invoice:invoice_id (
            id,
            invoice_number,
            client_id
          )
        `)
        .eq('invoice.client_id', clientId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (recentPayments) {
        recentPayments.forEach(payment => {
          if (payment.invoice) {
            activities.push({
              id: `payment-${payment.id}`,
              type: 'payment',
              action: payment.status === 'completed' ? 'received' : 'attempted',
              description: `Payment ${payment.status} for invoice ${payment.invoice.invoice_number}`,
              amount: payment.amount,
              status: payment.status,
              date: payment.created_at,
              relatedId: payment.invoice.id
            });
          }
        });
      }

      // Sort all activities by date
      activities.sort((a, b) => new Date(b.date) - new Date(a.date));

      return {
        success: true,
        data: { 
          activities: activities.slice(0, limit)
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        statusCode: 500
      };
    }
  }
}

// Export singleton instance
module.exports = new InvoiceService();