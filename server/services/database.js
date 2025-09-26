/**
 * Database Service
 * 
 * Server-side Supabase service with service role key for secure operations
 */

const { supabase } = require('../config/database');
const { createApiResponse, createErrorResponse } = require('../utils');

class DatabaseService {
  constructor() {
    this.supabase = supabase;
  }

  /**
   * Test database connection
   */
  async testConnection() {
    try {
      const { data, error } = await this.supabase
        .from('profiles')
        .select('count')
        .limit(1);
      
      if (error) {
        throw new Error(`Database connection failed: ${error.message}`);
      }
      
      return { success: true, message: 'Database connection successful' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get user profile
   */
  async getUserProfile(userId) {
    try {
      const { data, error } = await this.supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return { success: false, error: 'Profile not found', statusCode: 404 };
        }
        throw error;
      }

      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message, statusCode: 500 };
    }
  }

  /**
   * Create or update user profile
   */
  async upsertUserProfile(userId, profileData) {
    try {
      const { data, error } = await this.supabase
        .from('profiles')
        .upsert({ id: userId, ...profileData }, { onConflict: 'id' })
        .select()
        .single();

      if (error) {
        throw error;
      }

      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message, statusCode: 500 };
    }
  }

  /**
   * Execute raw SQL query (use with caution)
   */
  async executeQuery(query, params = []) {
    try {
      const { data, error } = await this.supabase.rpc('execute_sql', {
        query,
        params
      });

      if (error) {
        throw error;
      }

      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message, statusCode: 500 };
    }
  }
}

// Export singleton instance
module.exports = new DatabaseService();