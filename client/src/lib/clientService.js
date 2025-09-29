/**
 * Client Service
 * 
 * Client-side service for managing client data
 * Updated to use Express server endpoints instead of Next.js API routes
 */

import { apiClient, API_ENDPOINTS } from './apiConfig';

// Client management utilities
export const clientService = {
  // Fetch all clients for a user
  async getClients(userId, options = {}) {
    // Remove userId from params since it comes from auth middleware
    const params = new URLSearchParams({
      ...options
    });

    const endpoint = `${API_ENDPOINTS.clients}?${params}`;
    return apiClient(endpoint);
  },

  // Get a specific client
  async getClient(clientId, userId) {
    // Remove userId from params since it comes from auth middleware
    const endpoint = `${API_ENDPOINTS.client(clientId)}`;
    return apiClient(endpoint);
  },

  // Create a new client
  async createClient(clientData) {
    return apiClient(API_ENDPOINTS.clients, {
      method: 'POST',
      body: JSON.stringify(clientData),
    });
  },

  // Update a client
  async updateClient(clientId, clientData) {
    return apiClient(API_ENDPOINTS.client(clientId), {
      method: 'PUT',
      body: JSON.stringify(clientData),
    });
  },

  // Delete a client
  async deleteClient(clientId, userId) {
    // Remove userId from params since it comes from auth middleware
    const endpoint = `${API_ENDPOINTS.client(clientId)}`;
    return apiClient(endpoint, {
      method: 'DELETE',
    });
  },

  // Get client statistics
  async getClientStats(userId) {
    // Remove userId from params since it comes from auth middleware
    const endpoint = `${API_ENDPOINTS.clientStats}`;
    return apiClient(endpoint);
  }
};

// Client validation utilities
export const clientValidation = {
  validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  validatePhone(phone) {
    if (!phone) return true; // Optional field
    const phoneRegex = /^\+?[\d\s\-\(\)]{7,}$/;
    return phoneRegex.test(phone);
  },

  validateWebsite(website) {
    if (!website) return true; // Optional field
    try {
      new URL(website);
      return true;
    } catch {
      return false;
    }
  },

  validateRequiredFields(clientData) {
    const required = ['companyName', 'email'];
    const missing = required.filter(field => !clientData[field]?.trim());
    return {
      isValid: missing.length === 0,
      missingFields: missing
    };
  },

  validateClientData(clientData) {
    const errors = {};

    // Required fields
    if (!clientData.companyName?.trim()) {
      errors.companyName = 'Company name is required';
    }

    if (!clientData.email?.trim()) {
      errors.email = 'Email is required';
    } else if (!this.validateEmail(clientData.email)) {
      errors.email = 'Invalid email format';
    }

    // Optional fields validation
    if (clientData.phone && !this.validatePhone(clientData.phone)) {
      errors.phone = 'Invalid phone number format';
    }

    if (clientData.website && !this.validateWebsite(clientData.website)) {
      errors.website = 'Invalid website URL';
    }

    if (clientData.paymentTerms && (clientData.paymentTerms < 0 || clientData.paymentTerms > 365)) {
      errors.paymentTerms = 'Payment terms must be between 0 and 365 days';
    }

    if (clientData.discountRate && (clientData.discountRate < 0 || clientData.discountRate > 100)) {
      errors.discountRate = 'Discount rate must be between 0 and 100%';
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }
};

// Client formatting utilities
export const clientFormatters = {
  formatAddress(client) {
    const parts = [
      client.address,
      client.city,
      client.state,
      client.postalCode,
      client.country
    ].filter(Boolean);
    
    return parts.join(', ');
  },

  formatClientName(client) {
    if (client.contactPerson) {
      return `${client.companyName} (${client.contactPerson})`;
    }
    return client.companyName;
  },

  formatPaymentTerms(days) {
    if (days === 0) return 'Due on receipt';
    if (days === 1) return 'Due in 1 day';
    return `Due in ${days} days`;
  },

  formatCurrency(amount, currency = 'USD') {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  },

  getClientStatus(client) {
    if (client.outstandingBalance > 0) {
      return { status: 'outstanding', label: 'Outstanding Balance', color: 'orange' };
    }
    
    if (client.lastInvoiceDate) {
      const lastInvoice = new Date(client.lastInvoiceDate);
      const daysSince = Math.floor((new Date() - lastInvoice) / (1000 * 60 * 60 * 24));
      
      if (daysSince > 90) {
        return { status: 'inactive', label: 'Inactive', color: 'gray' };
      }
    }
    
    return { status: 'active', label: 'Active', color: 'green' };
  }
};

// Client search and filter utilities
export const clientFilters = {
  searchClients(clients, searchTerm) {
    if (!searchTerm) return clients;
    
    const term = searchTerm.toLowerCase();
    return clients.filter(client => 
      client.companyName.toLowerCase().includes(term) ||
      client.contactPerson?.toLowerCase().includes(term) ||
      client.email.toLowerCase().includes(term) ||
      client.tags?.some(tag => tag.toLowerCase().includes(term))
    );
  },

  filterByTag(clients, tag) {
    if (!tag) return clients;
    return clients.filter(client => client.tags?.includes(tag));
  },

  sortClients(clients, sortBy = 'companyName', sortOrder = 'asc') {
    return [...clients].sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];

      // Handle null/undefined values
      if (aValue === null || aValue === undefined) aValue = '';
      if (bValue === null || bValue === undefined) bValue = '';

      // Convert to strings for comparison
      aValue = String(aValue).toLowerCase();
      bValue = String(bValue).toLowerCase();

      const result = aValue.localeCompare(bValue);
      return sortOrder === 'desc' ? -result : result;
    });
  },

  getUniqueTagsFromClients(clients) {
    const allTags = clients.flatMap(client => client.tags || []);
    return [...new Set(allTags)].sort();
  }
};