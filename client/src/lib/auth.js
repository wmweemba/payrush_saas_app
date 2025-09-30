/**
 * Authentication utilities for API requests
 */

import { supabase } from './supabaseClient';

/**
 * Get the current authentication token from Supabase session
 * @returns {Promise<string|null>} The access token or null if not authenticated
 */
export const getAuthToken = async () => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('Error getting session:', error);
      return null;
    }
    
    return session?.access_token || null;
  } catch (error) {
    console.error('Error retrieving auth token:', error);
    return null;
  }
};

/**
 * Get authorization headers for API requests
 * @returns {Promise<{Authorization?: string}>} Headers object with Authorization if authenticated
 */
export const getAuthHeaders = async () => {
  const token = await getAuthToken();
  
  if (!token) {
    return {};
  }
  
  return {
    'Authorization': `Bearer ${token}`
  };
};

/**
 * Make an authenticated API request
 * @param {string} url - The API endpoint URL
 * @param {object} options - Fetch options (method, body, etc.)
 * @returns {Promise<Response>} The fetch response
 */
export const authenticatedFetch = async (url, options = {}) => {
  const authHeaders = await getAuthHeaders();
  
  return fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders,
      ...options.headers
    }
  });
};

/**
 * Check if user is currently authenticated
 * @returns {Promise<boolean>} True if authenticated, false otherwise
 */
export const isAuthenticated = async () => {
  const token = await getAuthToken();
  return !!token;
};