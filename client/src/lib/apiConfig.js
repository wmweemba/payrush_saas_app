/**
 * API Configuration
 * 
 * Centralized configuration for API endpoints
 * Supports both development and production environments
 */

// Determine API base URL based on environment
const getApiBaseUrl = () => {
  // In development, use the Express server
  if (process.env.NODE_ENV === 'development') {
    return process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000';
  }
  
  // In production, this could be your deployed server URL
  return process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.payrush.com';
};

export const API_BASE_URL = getApiBaseUrl();
export const API_ENDPOINTS = {
  // Client endpoints
  clients: '/api/clients',
  client: (id) => `/api/clients/${id}`,
  clientStats: '/api/clients/stats',
  
  // Template endpoints
  templates: '/api/templates',
  template: (id) => `/api/templates/${id}`,
  templateStats: '/api/templates/stats',
  
  // Invoice Notes endpoints
  notes: '/api/notes',
  note: (id) => `/api/notes/${id}`,
  invoiceNotes: (invoiceId) => `/api/notes/invoice/${invoiceId}`,
  invoiceNotesSearch: '/api/notes/search',
  invoiceNotesSummary: (invoiceId) => `/api/notes/invoice/${invoiceId}/summary`,
  invoiceNotesCustomer: (invoiceId) => `/api/notes/invoice/${invoiceId}/customer`,
  invoiceNotesSystem: (invoiceId) => `/api/notes/invoice/${invoiceId}/system`,
  notesBulk: '/api/notes/bulk',
  notesBulkVisibility: '/api/notes/bulk/visibility',
  
  // Numbering Schemes endpoints
  numberingSchemes: '/api/numbering-schemes',
  numberingScheme: (id) => `/api/numbering-schemes/${id}`,
  numberingSchemeDefault: (id) => `/api/numbering-schemes/${id}/default`,
  numberingSchemeGenerate: (id) => `/api/numbering-schemes/${id}/generate`,
  numberingSchemePreview: (id) => `/api/numbering-schemes/${id}/preview`,
  numberingSchemesInitialize: '/api/numbering-schemes/initialize',
  
  // Branding endpoints
  branding: '/api/branding',
  brandingUpload: '/api/branding/upload',
  brandingAssets: '/api/branding/assets',
  brandingAsset: (id) => `/api/branding/assets/${id}`,
  brandingPresets: '/api/branding/presets',
  brandingStats: '/api/branding/stats',
  brandingApplyToTemplate: '/api/branding/apply-to-template',
  brandingInitialize: '/api/branding/initialize',
  brandingValidateColors: '/api/branding/validate-colors',
  brandingInitializeStorage: '/api/branding/initialize-storage',
  brandingLogo: '/api/branding/logo',
  
  // Payment endpoints
  paymentVerify: '/api/payments/verify',
  paymentHistory: '/api/payments/history',
  
  // Webhook endpoints
  webhooks: {
    flutterwave: '/api/webhooks/flutterwave',
    stripe: '/api/webhooks/stripe'
  },
  
  // Health check
  health: '/health'
};

/**
 * Create full URL from endpoint
 * @param {string} endpoint - API endpoint
 * @returns {string} Full URL
 */
export const createApiUrl = (endpoint) => {
  return `${API_BASE_URL}${endpoint}`;
};

/**
 * Default headers for API requests
 */
export const getDefaultHeaders = async () => {
  const headers = {};

  // Add authorization header if user session exists
  if (typeof window !== 'undefined') {
    try {
      // Dynamically import supabase to avoid SSR issues
      const { supabase } = await import('./supabaseClient');
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.warn('Session retrieval error:', error.message);
        return headers;
      }
      
      console.log('Auth session check:', { 
        hasSession: !!session, 
        hasToken: !!session?.access_token,
        userId: session?.user?.id,
        tokenLength: session?.access_token?.length
      });
      
      if (session?.access_token) {
        headers.Authorization = `Bearer ${session.access_token}`;
      } else {
        console.warn('No access token found in session');
      }
    } catch (error) {
      console.error('Failed to get auth session:', error);
    }
  }

  return headers;
};

/**
 * Enhanced fetch wrapper for API calls
 * @param {string} endpoint - API endpoint
 * @param {object} options - Fetch options
 * @returns {Promise} Fetch response
 */
export const apiClient = async (endpoint, options = {}) => {
  const url = createApiUrl(endpoint);
  const defaultHeaders = await getDefaultHeaders();
  
  // For JSON requests, add Content-Type header
  const finalHeaders = { ...defaultHeaders };
  if (options.body && typeof options.body === 'string') {
    finalHeaders['Content-Type'] = 'application/json';
  }
  
  const config = {
    headers: finalHeaders,
    ...options,
    headers: {
      ...finalHeaders,
      ...(options.headers || {})
    }
  };

  try {
    const response = await fetch(url, config);
    
    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch {
        errorData = { error: `HTTP ${response.status}: ${response.statusText}` };
      }
      
      // Debug logging
      console.log('API Error Response:', {
        status: response.status,
        statusText: response.statusText,
        errorData,
        url: response.url,
        hasAuth: !!config.headers.Authorization
      });
      
      // Handle specific auth errors
      if (response.status === 401) {
        console.warn('Authentication failed - token may be expired or invalid');
        // Optionally trigger a re-login or token refresh here
      }
      
      const error = new Error(errorData.message || errorData.error || 'API request failed');
      error.status = response.status;
      error.data = errorData;
      throw error;
    }

    // Check content type to determine how to parse response
    const contentType = response.headers.get('content-type');
    
    if (contentType?.includes('application/json')) {
      // Standard JSON response
      return response.json();
    } else if (contentType?.includes('text/html')) {
      // HTML response (like PDF export)
      const htmlContent = await response.text();
      return {
        success: true,
        data: htmlContent,
        contentType: contentType,
        isHtml: true
      };
    } else if (contentType?.includes('text/csv')) {
      // CSV response
      const csvContent = await response.text();
      return {
        success: true,
        data: csvContent,
        contentType: contentType,
        isCsv: true
      };
    } else if (contentType?.includes('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')) {
      // Excel response
      const blob = await response.blob();
      return {
        success: true,
        data: blob,
        contentType: contentType,
        isExcel: true
      };
    } else {
      // Fallback to JSON for other content types
      return response.json();
    }
  } catch (error) {
    console.error(`API call failed for ${endpoint}:`, error);
    throw error;
  }
};