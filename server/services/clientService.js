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
      const { search, tag, limit = 50, offset = 0, sortBy = 'name', sortOrder = 'asc' } = options;

      let query = this.supabase
        .from('clients')
        .select(`
          id,
          name,
          email,
          phone,
          company,
          address_line1,
          address_line2,
          city,
          state,
          country,
          postal_code,
          default_currency,
          payment_terms_days,
          status,
          client_type,
          credit_limit,
          current_balance,
          total_invoiced,
          total_paid,
          notes,
          tags,
          created_at,
          updated_at,
          last_invoice_date
        `)
        .eq('user_id', userId)
        .eq('status', 'active')
        .order(sortBy, { ascending: sortOrder === 'asc' })
        .limit(limit);

      if (offset > 0) {
        query = query.range(offset, offset + limit - 1);
      }

      // Add search functionality
      if (search) {
        query = query.or(
          `name.ilike.%${search}%,company.ilike.%${search}%,email.ilike.%${search}%`
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
          name,
          email,
          phone,
          company,
          address_line1,
          address_line2,
          city,
          state,
          country,
          postal_code,
          default_currency,
          payment_terms_days,
          status,
          client_type,
          credit_limit,
          current_balance,
          total_invoiced,
          total_paid,
          notes,
          tags,
          created_at,
          updated_at,
          last_invoice_date
        `)
        .eq('id', clientId)
        .eq('user_id', userId)
        .eq('status', 'active')
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
      const { name, email } = clientData;
      if (!name || !email) {
        return {
          success: false,
          error: 'Name and email are required',
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
        .eq('status', 'active')
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
        name: sanitizeString(name),
        email: email.toLowerCase(),
        phone: clientData.phone || null,
        company: clientData.company ? sanitizeString(clientData.company) : null,
        address_line1: clientData.addressLine1 ? sanitizeString(clientData.addressLine1) : null,
        address_line2: clientData.addressLine2 ? sanitizeString(clientData.addressLine2) : null,
        city: clientData.city ? sanitizeString(clientData.city) : null,
        state: clientData.state ? sanitizeString(clientData.state) : null,
        country: clientData.country ? sanitizeString(clientData.country) : null,
        postal_code: clientData.postalCode ? sanitizeString(clientData.postalCode) : null,
        notes: clientData.notes ? sanitizeString(clientData.notes) : null,
        tags: clientData.tags || [],
        default_currency: clientData.defaultCurrency || 'USD',
        payment_terms_days: clientData.paymentTermsDays || 30,
        client_type: clientData.clientType || 'individual',
        status: 'active'
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
      // Debug logging
      console.log('updateClient called with:', { clientId, userId, clientData: Object.keys(clientData) });
      
      // Validate clientId
      if (!clientId || clientId === 'undefined' || clientId === 'null') {
        return {
          success: false,
          error: 'Valid client ID is required',
          statusCode: 400
        };
      }

      // Validate required fields
      const { name, email } = clientData;
      if (!name || !email) {
        return {
          success: false,
          error: 'Name and email are required',
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
        .eq('status', 'active')
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
        name: sanitizeString(name),
        email: email.toLowerCase(),
        phone: clientData.phone || null,
        company: clientData.company ? sanitizeString(clientData.company) : null,
        address_line1: clientData.addressLine1 ? sanitizeString(clientData.addressLine1) : null,
        address_line2: clientData.addressLine2 ? sanitizeString(clientData.addressLine2) : null,
        city: clientData.city ? sanitizeString(clientData.city) : null,
        state: clientData.state ? sanitizeString(clientData.state) : null,
        country: clientData.country ? sanitizeString(clientData.country) : null,
        postal_code: clientData.postalCode ? sanitizeString(clientData.postalCode) : null,
        notes: clientData.notes ? sanitizeString(clientData.notes) : null,
        tags: clientData.tags || [],
        default_currency: clientData.defaultCurrency || 'USD',
        payment_terms_days: clientData.paymentTermsDays || 30,
        client_type: clientData.clientType || 'individual',
        updated_at: new Date().toISOString()
      };

      const { data, error } = await this.supabase
        .from('clients')
        .update(updateData)
        .eq('id', clientId)
        .eq('user_id', userId)
        .eq('status', 'active')
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
          status: 'inactive', 
          updated_at: new Date().toISOString() 
        })
        .eq('id', clientId)
        .eq('user_id', userId)
        .eq('status', 'active')
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
        .select('id, total_invoiced, total_paid, current_balance')
        .eq('user_id', userId)
        .eq('status', 'active');

      if (error) {
        throw new Error(`Failed to get client stats: ${error.message}`);
      }

      const stats = {
        totalClients: data.length,
        totalInvoiced: data.reduce((sum, client) => sum + (client.total_invoiced || 0), 0),
        totalPaid: data.reduce((sum, client) => sum + (client.total_paid || 0), 0),
        totalOutstanding: data.reduce((sum, client) => sum + (client.current_balance || 0), 0)
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

  // ============ ENHANCED CONTACT MANAGEMENT METHODS ============

  /**
   * Get all contacts for a client
   */
  async getClientContacts(clientId, userId) {
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

      const { data, error } = await this.supabase
        .from('client_contacts')
        .select('*')
        .eq('client_id', clientId)
        .order('is_primary_contact', { ascending: false })
        .order('created_at');

      if (error) {
        throw new Error(`Failed to get client contacts: ${error.message}`);
      }

      return {
        success: true,
        data: { contacts: data }
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
   * Add a new contact to a client
   */
  async addClientContact(clientId, userId, contactData) {
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

      // Validate required fields
      const { firstName, lastName } = contactData;
      if (!firstName || !lastName) {
        return {
          success: false,
          error: 'First name and last name are required',
          statusCode: 400
        };
      }

      // Validate email if provided
      if (contactData.primaryEmail && !isValidEmail(contactData.primaryEmail)) {
        return {
          success: false,
          error: 'Invalid primary email format',
          statusCode: 400
        };
      }

      // Prepare contact data
      const newContactData = {
        client_id: clientId,
        first_name: sanitizeString(firstName),
        last_name: sanitizeString(lastName),
        job_title: contactData.jobTitle ? sanitizeString(contactData.jobTitle) : null,
        department: contactData.department ? sanitizeString(contactData.department) : null,
        primary_email: contactData.primaryEmail ? contactData.primaryEmail.toLowerCase() : null,
        secondary_email: contactData.secondaryEmail ? contactData.secondaryEmail.toLowerCase() : null,
        primary_phone: contactData.primaryPhone || null,
        secondary_phone: contactData.secondaryPhone || null,
        mobile_phone: contactData.mobilePhone || null,
        whatsapp_number: contactData.whatsappNumber || null,
        is_primary_contact: contactData.isPrimaryContact || false,
        is_billing_contact: contactData.isBillingContact || false,
        is_technical_contact: contactData.isTechnicalContact || false,
        preferred_contact_method: contactData.preferredContactMethod || 'email',
        email_notifications: contactData.emailNotifications !== false,
        sms_notifications: contactData.smsNotifications || false,
        whatsapp_notifications: contactData.whatsappNotifications || false,
        notes: contactData.notes ? sanitizeString(contactData.notes) : null,
        date_of_birth: contactData.dateOfBirth || null
      };

      const { data, error } = await this.supabase
        .from('client_contacts')
        .insert([newContactData])
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to add contact: ${error.message}`);
      }

      return {
        success: true,
        data: { contact: data },
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
   * Update a client contact
   */
  async updateClientContact(contactId, userId, contactData) {
    try {
      // Verify contact ownership through client relationship
      const { data: contact } = await this.supabase
        .from('client_contacts')
        .select('client_id, clients(user_id)')
        .eq('id', contactId)
        .single();

      if (!contact || contact.clients.user_id !== userId) {
        return {
          success: false,
          error: 'Contact not found or access denied',
          statusCode: 404
        };
      }

      // Validate email if provided
      if (contactData.primaryEmail && !isValidEmail(contactData.primaryEmail)) {
        return {
          success: false,
          error: 'Invalid primary email format',
          statusCode: 400
        };
      }

      // Prepare update data
      const updateData = {};
      if (contactData.firstName) updateData.first_name = sanitizeString(contactData.firstName);
      if (contactData.lastName) updateData.last_name = sanitizeString(contactData.lastName);
      if (contactData.jobTitle !== undefined) updateData.job_title = contactData.jobTitle ? sanitizeString(contactData.jobTitle) : null;
      if (contactData.department !== undefined) updateData.department = contactData.department ? sanitizeString(contactData.department) : null;
      if (contactData.primaryEmail !== undefined) updateData.primary_email = contactData.primaryEmail ? contactData.primaryEmail.toLowerCase() : null;
      if (contactData.secondaryEmail !== undefined) updateData.secondary_email = contactData.secondaryEmail ? contactData.secondaryEmail.toLowerCase() : null;
      if (contactData.primaryPhone !== undefined) updateData.primary_phone = contactData.primaryPhone;
      if (contactData.secondaryPhone !== undefined) updateData.secondary_phone = contactData.secondaryPhone;
      if (contactData.mobilePhone !== undefined) updateData.mobile_phone = contactData.mobilePhone;
      if (contactData.whatsappNumber !== undefined) updateData.whatsapp_number = contactData.whatsappNumber;
      if (contactData.isPrimaryContact !== undefined) updateData.is_primary_contact = contactData.isPrimaryContact;
      if (contactData.isBillingContact !== undefined) updateData.is_billing_contact = contactData.isBillingContact;
      if (contactData.isTechnicalContact !== undefined) updateData.is_technical_contact = contactData.isTechnicalContact;
      if (contactData.preferredContactMethod !== undefined) updateData.preferred_contact_method = contactData.preferredContactMethod;
      if (contactData.emailNotifications !== undefined) updateData.email_notifications = contactData.emailNotifications;
      if (contactData.smsNotifications !== undefined) updateData.sms_notifications = contactData.smsNotifications;
      if (contactData.whatsappNotifications !== undefined) updateData.whatsapp_notifications = contactData.whatsappNotifications;
      if (contactData.notes !== undefined) updateData.notes = contactData.notes ? sanitizeString(contactData.notes) : null;
      if (contactData.dateOfBirth !== undefined) updateData.date_of_birth = contactData.dateOfBirth;

      const { data, error } = await this.supabase
        .from('client_contacts')
        .update(updateData)
        .eq('id', contactId)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to update contact: ${error.message}`);
      }

      return {
        success: true,
        data: { contact: data }
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
   * Delete a client contact
   */
  async deleteClientContact(contactId, userId) {
    try {
      // Verify contact ownership through client relationship
      const { data: contact } = await this.supabase
        .from('client_contacts')
        .select('client_id, clients(user_id)')
        .eq('id', contactId)
        .single();

      if (!contact || contact.clients.user_id !== userId) {
        return {
          success: false,
          error: 'Contact not found or access denied',
          statusCode: 404
        };
      }

      const { error } = await this.supabase
        .from('client_contacts')
        .delete()
        .eq('id', contactId);

      if (error) {
        throw new Error(`Failed to delete contact: ${error.message}`);
      }

      return {
        success: true,
        data: { message: 'Contact deleted successfully' }
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
   * Get all addresses for a client
   */
  async getClientAddresses(clientId, userId) {
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

      const { data, error } = await this.supabase
        .from('client_addresses')
        .select('*')
        .eq('client_id', clientId)
        .order('is_default', { ascending: false })
        .order('address_type')
        .order('created_at');

      if (error) {
        throw new Error(`Failed to get client addresses: ${error.message}`);
      }

      return {
        success: true,
        data: { addresses: data }
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
   * Add a new address to a client
   */
  async addClientAddress(clientId, userId, addressData) {
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

      // Validate required fields
      const { addressType, addressLine1, city, country } = addressData;
      if (!addressType || !addressLine1 || !city || !country) {
        return {
          success: false,
          error: 'Address type, address line 1, city, and country are required',
          statusCode: 400
        };
      }

      // Prepare address data
      const newAddressData = {
        client_id: clientId,
        address_type: addressType,
        address_label: addressData.addressLabel ? sanitizeString(addressData.addressLabel) : null,
        address_line1: sanitizeString(addressLine1),
        address_line2: addressData.addressLine2 ? sanitizeString(addressData.addressLine2) : null,
        address_line3: addressData.addressLine3 ? sanitizeString(addressData.addressLine3) : null,
        city: sanitizeString(city),
        state_province: addressData.stateProvince ? sanitizeString(addressData.stateProvince) : null,
        postal_code: addressData.postalCode ? sanitizeString(addressData.postalCode) : null,
        country: sanitizeString(country),
        is_default: addressData.isDefault || false,
        is_billing_address: addressData.isBillingAddress || false,
        is_shipping_address: addressData.isShippingAddress || false,
        delivery_instructions: addressData.deliveryInstructions ? sanitizeString(addressData.deliveryInstructions) : null,
        landmark: addressData.landmark ? sanitizeString(addressData.landmark) : null
      };

      const { data, error } = await this.supabase
        .from('client_addresses')
        .insert([newAddressData])
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to add address: ${error.message}`);
      }

      return {
        success: true,
        data: { address: data },
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
   * Update a client address
   */
  async updateClientAddress(addressId, userId, addressData) {
    try {
      // Verify address ownership through client relationship
      const { data: address } = await this.supabase
        .from('client_addresses')
        .select('client_id, clients(user_id)')
        .eq('id', addressId)
        .single();

      if (!address || address.clients.user_id !== userId) {
        return {
          success: false,
          error: 'Address not found or access denied',
          statusCode: 404
        };
      }

      // Prepare update data
      const updateData = {};
      if (addressData.addressType !== undefined) updateData.address_type = addressData.addressType;
      if (addressData.addressLabel !== undefined) updateData.address_label = addressData.addressLabel ? sanitizeString(addressData.addressLabel) : null;
      if (addressData.addressLine1 !== undefined) updateData.address_line1 = sanitizeString(addressData.addressLine1);
      if (addressData.addressLine2 !== undefined) updateData.address_line2 = addressData.addressLine2 ? sanitizeString(addressData.addressLine2) : null;
      if (addressData.addressLine3 !== undefined) updateData.address_line3 = addressData.addressLine3 ? sanitizeString(addressData.addressLine3) : null;
      if (addressData.city !== undefined) updateData.city = sanitizeString(addressData.city);
      if (addressData.stateProvince !== undefined) updateData.state_province = addressData.stateProvince ? sanitizeString(addressData.stateProvince) : null;
      if (addressData.postalCode !== undefined) updateData.postal_code = addressData.postalCode ? sanitizeString(addressData.postalCode) : null;
      if (addressData.country !== undefined) updateData.country = sanitizeString(addressData.country);
      if (addressData.isDefault !== undefined) updateData.is_default = addressData.isDefault;
      if (addressData.isBillingAddress !== undefined) updateData.is_billing_address = addressData.isBillingAddress;
      if (addressData.isShippingAddress !== undefined) updateData.is_shipping_address = addressData.isShippingAddress;
      if (addressData.deliveryInstructions !== undefined) updateData.delivery_instructions = addressData.deliveryInstructions ? sanitizeString(addressData.deliveryInstructions) : null;
      if (addressData.landmark !== undefined) updateData.landmark = addressData.landmark ? sanitizeString(addressData.landmark) : null;

      const { data, error } = await this.supabase
        .from('client_addresses')
        .update(updateData)
        .eq('id', addressId)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to update address: ${error.message}`);
      }

      return {
        success: true,
        data: { address: data }
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
   * Delete a client address
   */
  async deleteClientAddress(addressId, userId) {
    try {
      // Verify address ownership through client relationship
      const { data: address } = await this.supabase
        .from('client_addresses')
        .select('client_id, clients(user_id)')
        .eq('id', addressId)
        .single();

      if (!address || address.clients.user_id !== userId) {
        return {
          success: false,
          error: 'Address not found or access denied',
          statusCode: 404
        };
      }

      const { error } = await this.supabase
        .from('client_addresses')
        .delete()
        .eq('id', addressId);

      if (error) {
        throw new Error(`Failed to delete address: ${error.message}`);
      }

      return {
        success: true,
        data: { message: 'Address deleted successfully' }
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