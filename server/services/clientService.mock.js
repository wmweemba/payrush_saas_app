/**
 * Mock Client Service for Testing
 * 
 * Temporary service that returns mock data to test API endpoints
 * without requiring database connection
 */

// Mock data storage
let mockClients = [
  {
    id: '550e8400-e29b-41d4-a716-446655440001',
    company_name: 'Acme Corporation',
    contact_person: 'John Doe',
    email: 'john@acme.com',
    phone: '+1234567890',
    address: '123 Business St',
    city: 'San Francisco',
    state: 'CA',
    country: 'USA',
    postal_code: '94105',
    default_currency: 'USD',
    payment_terms: 30,
    discount_rate: 0,
    total_invoiced: 15000,
    total_paid: 12000,
    outstanding_balance: 3000,
    invoice_count: 5,
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z',
    tags: ['enterprise', 'priority']
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440002',
    company_name: 'Tech Startup Inc',
    contact_person: 'Jane Smith',
    email: 'jane@techstartup.com',
    phone: '+1987654321',
    address: '456 Innovation Ave',
    city: 'Austin',
    state: 'TX',
    country: 'USA',
    postal_code: '73301',
    default_currency: 'USD',
    payment_terms: 15,
    discount_rate: 5,
    total_invoiced: 8500,
    total_paid: 8500,
    outstanding_balance: 0,
    invoice_count: 3,
    created_at: '2024-02-01T14:30:00Z',
    updated_at: '2024-02-01T14:30:00Z',
    tags: ['startup', 'tech']
  }
];

let nextId = 3;

class MockClientService {
  constructor() {
    console.log('🧪 Using Mock Client Service for testing');
  }

  /**
   * Get all clients for a user with filtering and search
   */
  async getClients(userId, options = {}) {
    try {
      console.log(`Mock: Getting clients for user ${userId}`);
      const { search, tag, limit = 50, offset = 0, sortBy = 'company_name', sortOrder = 'asc' } = options;

      let clients = [...mockClients];

      // Apply search filter
      if (search) {
        const searchTerm = search.toLowerCase();
        clients = clients.filter(client => 
          client.company_name.toLowerCase().includes(searchTerm) ||
          client.contact_person?.toLowerCase().includes(searchTerm) ||
          client.email.toLowerCase().includes(searchTerm)
        );
      }

      // Apply tag filter
      if (tag) {
        clients = clients.filter(client => client.tags?.includes(tag));
      }

      // Apply sorting
      clients.sort((a, b) => {
        const aValue = a[sortBy] || '';
        const bValue = b[sortBy] || '';
        const result = aValue.toString().localeCompare(bValue.toString());
        return sortOrder === 'desc' ? -result : result;
      });

      // Apply pagination
      const paginatedClients = clients.slice(offset, offset + limit);

      return {
        success: true,
        data: {
          clients: paginatedClients,
          total: clients.length
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
      console.log(`Mock: Getting client ${clientId} for user ${userId}`);
      const client = mockClients.find(c => c.id === clientId);
      
      if (!client) {
        return {
          success: false,
          error: 'Client not found',
          statusCode: 404
        };
      }

      return {
        success: true,
        data: { client }
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
      console.log(`Mock: Creating client for user ${userId}`, clientData);
      
      // Validate required fields
      const { companyName, email } = clientData;
      if (!companyName || !email) {
        return {
          success: false,
          error: 'Company name and email are required',
          statusCode: 400
        };
      }

      // Check for duplicate email
      const existingClient = mockClients.find(c => c.email.toLowerCase() === email.toLowerCase());
      if (existingClient) {
        return {
          success: false,
          error: 'A client with this email already exists',
          statusCode: 409
        };
      }

      // Create new client
      const newClient = {
        id: `550e8400-e29b-41d4-a716-44665544000${nextId}`,
        company_name: clientData.companyName,
        contact_person: clientData.contactPerson || null,
        email: email.toLowerCase(),
        phone: clientData.phone || null,
        address: clientData.address || null,
        city: clientData.city || null,
        state: clientData.state || null,
        country: clientData.country || null,
        postal_code: clientData.postalCode || null,
        tax_number: clientData.taxNumber || null,
        website: clientData.website || null,
        notes: clientData.notes || null,
        tags: clientData.tags || [],
        default_currency: clientData.defaultCurrency || 'USD',
        payment_terms: clientData.paymentTerms || 30,
        discount_rate: clientData.discountRate || 0,
        total_invoiced: 0,
        total_paid: 0,
        outstanding_balance: 0,
        invoice_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      mockClients.push(newClient);
      nextId++;

      return {
        success: true,
        data: { client: newClient },
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
      console.log(`Mock: Updating client ${clientId} for user ${userId}`, clientData);
      
      const clientIndex = mockClients.findIndex(c => c.id === clientId);
      if (clientIndex === -1) {
        return {
          success: false,
          error: 'Client not found',
          statusCode: 404
        };
      }

      // Update client
      const updatedClient = {
        ...mockClients[clientIndex],
        company_name: clientData.companyName || mockClients[clientIndex].company_name,
        contact_person: clientData.contactPerson || mockClients[clientIndex].contact_person,
        email: clientData.email?.toLowerCase() || mockClients[clientIndex].email,
        phone: clientData.phone || mockClients[clientIndex].phone,
        address: clientData.address || mockClients[clientIndex].address,
        city: clientData.city || mockClients[clientIndex].city,
        state: clientData.state || mockClients[clientIndex].state,
        country: clientData.country || mockClients[clientIndex].country,
        postal_code: clientData.postalCode || mockClients[clientIndex].postal_code,
        tax_number: clientData.taxNumber || mockClients[clientIndex].tax_number,
        website: clientData.website || mockClients[clientIndex].website,
        notes: clientData.notes || mockClients[clientIndex].notes,
        tags: clientData.tags || mockClients[clientIndex].tags,
        default_currency: clientData.defaultCurrency || mockClients[clientIndex].default_currency,
        payment_terms: clientData.paymentTerms || mockClients[clientIndex].payment_terms,
        discount_rate: clientData.discountRate || mockClients[clientIndex].discount_rate,
        updated_at: new Date().toISOString()
      };

      mockClients[clientIndex] = updatedClient;

      return {
        success: true,
        data: { client: updatedClient }
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
      console.log(`Mock: Deleting client ${clientId} for user ${userId}`);
      
      const clientIndex = mockClients.findIndex(c => c.id === clientId);
      if (clientIndex === -1) {
        return {
          success: false,
          error: 'Client not found',
          statusCode: 404
        };
      }

      mockClients.splice(clientIndex, 1);

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
      console.log(`Mock: Getting client stats for user ${userId}`);
      
      const stats = {
        totalClients: mockClients.length,
        totalInvoiced: mockClients.reduce((sum, client) => sum + (client.total_invoiced || 0), 0),
        totalPaid: mockClients.reduce((sum, client) => sum + (client.total_paid || 0), 0),
        totalOutstanding: mockClients.reduce((sum, client) => sum + (client.outstanding_balance || 0), 0)
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
module.exports = new MockClientService();