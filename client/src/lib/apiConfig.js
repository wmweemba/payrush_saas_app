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
  const headers = {
    'Content-Type': 'application/json'
  };

  // Add authorization header if user session exists
  if (typeof window !== 'undefined') {
    try {
      // Dynamically import supabase to avoid SSR issues
      const { supabase } = await import('./supabaseClient');
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.access_token) {
        headers.Authorization = `Bearer ${session.access_token}`;
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
  
  const config = {
    headers: defaultHeaders,
    ...options,
    headers: {
      ...defaultHeaders,
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
      
      const error = new Error(errorData.error || errorData.message || 'API request failed');
      error.status = response.status;
      error.data = errorData;
      throw error;
    }

    return response.json();
  } catch (error) {
    console.error(`API call failed for ${endpoint}:`, error);
    throw error;
  }
};