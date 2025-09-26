/**
 * Client Service
 * 
 * Business logic for client management operations
 */

const { supabase } = require('../config/database');
const { isValidEmail, isValidPhone, sanitizeString } = require('../utils');

class ClientService {
  constructor() {
    this.supabase = supabase;
  }

  /**
   * Get all clients for a user with filtering and search
   */
  async getClients(userId, options = {}) {
    try {
      const { search, tag, limit = 50, offset = 0, sortBy = 'company_name', sortOrder = 'asc' } = options;

      let query = this.supabase
        .from('clients')
        .select(`
          id,
          company_name,
          contact_person,
          email,
          phone,
          address,
          city,
          state,
          country,
          postal_code,
          tax_number,
          website,
          notes,
          tags,
          default_currency,
          payment_terms,
          discount_rate,
          total_invoiced,
          total_paid,
          outstanding_balance,
          last_invoice_date,
          last_payment_date,
          invoice_count,
          created_at,
          updated_at
        `)
        .eq('user_id', userId)
        .eq('is_active', true)
        .order(sortBy, { ascending: sortOrder === 'asc' })
        .limit(limit);

      if (offset > 0) {
        query = query.range(offset, offset + limit - 1);
      }

      // Add search functionality
      if (search) {
        query = query.or(
          `company_name.ilike.%${search}%,contact_person.ilike.%${search}%,email.ilike.%${search}%`
        );
      }

      // Filter by tag
      if (tag) {
        query = query.contains('tags', [tag]);
      }

      const { data, error, count } = await query;

      if (error) {
        throw new Error(`Failed to fetch clients: ${error.message}`);
      }

      return {
        success: true,
        data: {
          clients: data || [],
          total: count || data?.length || 0
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
   * Get a specific client by ID
   */
  async getClientById(clientId, userId) {
    try {
      const { data, error } = await this.supabase
        .from('clients')
        .select(`
          id,
          company_name,
          contact_person,
          email,
          phone,
          address,
          city,
          state,
          country,
          postal_code,
          tax_number,
          website,
          notes,
          tags,
          default_currency,
          payment_terms,
          discount_rate,
          total_invoiced,
          total_paid,
          outstanding_balance,
          last_invoice_date,
          last_payment_date,
          invoice_count,
          created_at,
          updated_at
        `)
        .eq('id', clientId)
        .eq('user_id', userId)
        .eq('is_active', true)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return {
            success: false,
            error: 'Client not found',
            statusCode: 404
          };
        }
        throw new Error(`Failed to fetch client: ${error.message}`);
      }

      return {
        success: true,
        data: { client: data }
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
   * Create a new client
   */
  async createClient(userId, clientData) {
    try {
      // Validate required fields
      const { companyName, email } = clientData;
      if (!companyName || !email) {
        return {
          success: false,
          error: 'Company name and email are required',
          statusCode: 400
        };
      }

      // Validate email format
      if (!isValidEmail(email)) {
        return {
          success: false,
          error: 'Invalid email format',
          statusCode: 400
        };
      }

      // Validate phone if provided
      if (clientData.phone && !isValidPhone(clientData.phone)) {
        return {
          success: false,
          error: 'Invalid phone number format',
          statusCode: 400
        };
      }

      // Check if client with same email already exists for this user
      const { data: existingClient } = await this.supabase
        .from('clients')
        .select('id')
        .eq('user_id', userId)
        .eq('email', email.toLowerCase())
        .eq('is_active', true)
        .single();

      if (existingClient) {
        return {
          success: false,
          error: 'A client with this email already exists',
          statusCode: 409
        };
      }

      // Prepare client data
      const newClientData = {
        user_id: userId,
        company_name: sanitizeString(companyName),
        contact_person: clientData.contactPerson ? sanitizeString(clientData.contactPerson) : null,
        email: email.toLowerCase(),
        phone: clientData.phone || null,
        address: clientData.address ? sanitizeString(clientData.address) : null,
        city: clientData.city ? sanitizeString(clientData.city) : null,
        state: clientData.state ? sanitizeString(clientData.state) : null,
        country: clientData.country ? sanitizeString(clientData.country) : null,
        postal_code: clientData.postalCode ? sanitizeString(clientData.postalCode) : null,
        tax_number: clientData.taxNumber ? sanitizeString(clientData.taxNumber) : null,
        website: clientData.website || null,
        notes: clientData.notes ? sanitizeString(clientData.notes) : null,
        tags: clientData.tags || [],
        default_currency: clientData.defaultCurrency || 'USD',
        payment_terms: clientData.paymentTerms || 30,
        discount_rate: clientData.discountRate || 0,
        total_invoiced: 0,
        total_paid: 0,
        outstanding_balance: 0,
        invoice_count: 0,
        is_active: true
      };

      const { data, error } = await this.supabase
        .from('clients')
        .insert([newClientData])
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to create client: ${error.message}`);
      }

      return {
        success: true,
        data: { client: data },
        statusCode: 201
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
   * Update an existing client
   */
  async updateClient(clientId, userId, clientData) {
    try {
      // Validate required fields
      const { companyName, email } = clientData;
      if (!companyName || !email) {
        return {
          success: false,
          error: 'Company name and email are required',
          statusCode: 400
        };
      }

      // Validate email format
      if (!isValidEmail(email)) {
        return {
          success: false,
          error: 'Invalid email format',
          statusCode: 400
        };
      }

      // Validate phone if provided
      if (clientData.phone && !isValidPhone(clientData.phone)) {
        return {
          success: false,
          error: 'Invalid phone number format',
          statusCode: 400
        };
      }

      // Check if another client with same email exists (excluding current client)
      const { data: existingClient } = await this.supabase
        .from('clients')
        .select('id')
        .eq('user_id', userId)
        .eq('email', email.toLowerCase())
        .eq('is_active', true)
        .neq('id', clientId)
        .single();

      if (existingClient) {
        return {
          success: false,
          error: 'Another client with this email already exists',
          statusCode: 409
        };
      }

      // Prepare update data
      const updateData = {
        company_name: sanitizeString(companyName),
        contact_person: clientData.contactPerson ? sanitizeString(clientData.contactPerson) : null,
        email: email.toLowerCase(),
        phone: clientData.phone || null,
        address: clientData.address ? sanitizeString(clientData.address) : null,
        city: clientData.city ? sanitizeString(clientData.city) : null,
        state: clientData.state ? sanitizeString(clientData.state) : null,
        country: clientData.country ? sanitizeString(clientData.country) : null,
        postal_code: clientData.postalCode ? sanitizeString(clientData.postalCode) : null,
        tax_number: clientData.taxNumber ? sanitizeString(clientData.taxNumber) : null,
        website: clientData.website || null,
        notes: clientData.notes ? sanitizeString(clientData.notes) : null,
        tags: clientData.tags || [],
        default_currency: clientData.defaultCurrency || 'USD',
        payment_terms: clientData.paymentTerms || 30,
        discount_rate: clientData.discountRate || 0,
        updated_at: new Date().toISOString()
      };

      const { data, error } = await this.supabase
        .from('clients')
        .update(updateData)
        .eq('id', clientId)
        .eq('user_id', userId)
        .eq('is_active', true)
        .select()
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return {
            success: false,
            error: 'Client not found',
            statusCode: 404
          };
        }
        throw new Error(`Failed to update client: ${error.message}`);
      }

      return {
        success: true,
        data: { client: data }
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
   * Delete a client (soft delete)
   */
  async deleteClient(clientId, userId) {
    try {
      // Check if client has active invoices
      const { data: invoices, error: invoiceError } = await this.supabase
        .from('invoices')
        .select('id')
        .eq('client_id', clientId)
        .eq('status', 'pending');

      if (invoiceError) {
        throw new Error(`Failed to check client invoices: ${invoiceError.message}`);
      }

      if (invoices && invoices.length > 0) {
        return {
          success: false,
          error: 'Cannot delete client with pending invoices',
          statusCode: 409
        };
      }

      // Soft delete by marking as inactive
      const { data, error } = await this.supabase
        .from('clients')
        .update({ 
          is_active: false, 
          updated_at: new Date().toISOString() 
        })
        .eq('id', clientId)
        .eq('user_id', userId)
        .eq('is_active', true)
        .select()
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return {
            success: false,
            error: 'Client not found',
            statusCode: 404
          };
        }
        throw new Error(`Failed to delete client: ${error.message}`);
      }

      return {
        success: true,
        data: { message: 'Client deleted successfully' }
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
   * Get client statistics
   */
  async getClientStats(userId) {
    try {
      const { data, error } = await this.supabase
        .from('clients')
        .select('id, total_invoiced, total_paid, outstanding_balance')
        .eq('user_id', userId)
        .eq('is_active', true);

      if (error) {
        throw new Error(`Failed to get client stats: ${error.message}`);
      }

      const stats = {
        totalClients: data.length,
        totalInvoiced: data.reduce((sum, client) => sum + (client.total_invoiced || 0), 0),
        totalPaid: data.reduce((sum, client) => sum + (client.total_paid || 0), 0),
        totalOutstanding: data.reduce((sum, client) => sum + (client.outstanding_balance || 0), 0)
      };

      return {
        success: true,
        data: { stats }
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
module.exports = new ClientService();