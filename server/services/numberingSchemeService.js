/**
 * Invoice Numbering Scheme Service
 * 
 * Business logic for invoice numbering scheme management operations
 */

const { supabase } = require('../config/database');
const { sanitizeString } = require('../utils');

class NumberingSchemeService {
  constructor() {
    this.supabase = supabase;
  }

  /**
   * Get all numbering schemes for a user
   */
  async getNumberingSchemes(userId, options = {}) {
    try {
      const { 
        limit = 50, 
        offset = 0, 
        sortBy = 'updated_at', 
        sortOrder = 'desc' 
      } = options;

      let query = this.supabase
        .from('invoice_numbering_schemes')
        .select(`
          id,
          scheme_name,
          is_default,
          prefix,
          suffix,
          sequence_length,
          current_number,
          reset_frequency,
          last_reset_date,
          pattern_preview,
          include_year,
          include_month,
          include_quarter,
          date_format,
          created_at,
          updated_at
        `)
        .eq('user_id', userId);

      // Add sorting
      query = query.order(sortBy, { ascending: sortOrder === 'asc' });

      // Add pagination
      if (limit) {
        query = query.range(offset, offset + limit - 1);
      }

      const { data, error, count } = await query;

      if (error) {
        console.error('Database error in getNumberingSchemes:', error);
        return {
          success: false,
          error: 'Failed to retrieve numbering schemes',
          statusCode: 500
        };
      }

      return {
        success: true,
        data: {
          schemes: data || [],
          pagination: {
            total: count,
            limit,
            offset,
            page: Math.floor(offset / limit) + 1
          }
        }
      };
    } catch (error) {
      console.error('Error in getNumberingSchemes:', error);
      return {
        success: false,
        error: 'Internal server error',
        statusCode: 500
      };
    }
  }

  /**
   * Get a specific numbering scheme by ID
   */
  async getNumberingScheme(schemeId, userId) {
    try {
      const { data, error } = await this.supabase
        .from('invoice_numbering_schemes')
        .select('*')
        .eq('id', schemeId)
        .eq('user_id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return {
            success: false,
            error: 'Numbering scheme not found',
            statusCode: 404
          };
        }
        console.error('Database error in getNumberingScheme:', error);
        return {
          success: false,
          error: 'Failed to retrieve numbering scheme',
          statusCode: 500
        };
      }

      return {
        success: true,
        data: data
      };
    } catch (error) {
      console.error('Error in getNumberingScheme:', error);
      return {
        success: false,
        error: 'Internal server error',
        statusCode: 500
      };
    }
  }

  /**
   * Create a new numbering scheme
   */
  async createNumberingScheme(userId, schemeData) {
    try {
      // Validate required fields
      if (!schemeData.scheme_name) {
        return {
          success: false,
          error: 'Scheme name is required',
          statusCode: 400
        };
      }

      // Sanitize scheme name
      const schemeName = sanitizeString(schemeData.scheme_name);
      if (!schemeName) {
        return {
          success: false,
          error: 'Invalid scheme name',
          statusCode: 400
        };
      }

      // Check if scheme name already exists for this user
      const { data: existingScheme } = await this.supabase
        .from('invoice_numbering_schemes')
        .select('id')
        .eq('user_id', userId)
        .eq('scheme_name', schemeName)
        .single();

      if (existingScheme) {
        return {
          success: false,
          error: 'Scheme name already exists',
          statusCode: 409
        };
      }

      // If this is being set as default, unset other defaults
      if (schemeData.is_default) {
        await this.supabase
          .from('invoice_numbering_schemes')
          .update({ is_default: false })
          .eq('user_id', userId)
          .eq('is_default', true);
      }

      // Generate pattern preview
      const patternPreview = this.generatePatternPreview(schemeData);

      // Prepare insert data
      const insertData = {
        user_id: userId,
        scheme_name: schemeName,
        is_default: schemeData.is_default || false,
        prefix: schemeData.prefix || '',
        suffix: schemeData.suffix || '',
        sequence_length: schemeData.sequence_length || 3,
        current_number: schemeData.current_number || 1,
        reset_frequency: schemeData.reset_frequency || 'never',
        last_reset_date: null,
        pattern_preview: patternPreview,
        include_year: schemeData.include_year || false,
        include_month: schemeData.include_month || false,
        include_quarter: schemeData.include_quarter || false,
        date_format: schemeData.date_format || 'YYYY'
      };

      // Validate data
      if (insertData.sequence_length < 1 || insertData.sequence_length > 10) {
        return {
          success: false,
          error: 'Sequence length must be between 1 and 10',
          statusCode: 400
        };
      }

      if (insertData.current_number < 1) {
        return {
          success: false,
          error: 'Current number must be greater than 0',
          statusCode: 400
        };
      }

      const validResetFrequencies = ['never', 'yearly', 'monthly', 'quarterly'];
      if (!validResetFrequencies.includes(insertData.reset_frequency)) {
        return {
          success: false,
          error: 'Invalid reset frequency',
          statusCode: 400
        };
      }

      const { data, error } = await this.supabase
        .from('invoice_numbering_schemes')
        .insert(insertData)
        .select()
        .single();

      if (error) {
        console.error('Database error in createNumberingScheme:', error);
        return {
          success: false,
          error: 'Failed to create numbering scheme',
          statusCode: 500
        };
      }

      return {
        success: true,
        data: data
      };
    } catch (error) {
      console.error('Error in createNumberingScheme:', error);
      return {
        success: false,
        error: 'Internal server error',
        statusCode: 500
      };
    }
  }

  /**
   * Update an existing numbering scheme
   */
  async updateNumberingScheme(schemeId, userId, updateData) {
    try {
      // First check if scheme exists and belongs to user
      const existingScheme = await this.getNumberingScheme(schemeId, userId);
      if (!existingScheme.success) {
        return existingScheme;
      }

      // Prepare update data
      const updateFields = {};

      if (updateData.scheme_name !== undefined) {
        const schemeName = sanitizeString(updateData.scheme_name);
        if (!schemeName) {
          return {
            success: false,
            error: 'Invalid scheme name',
            statusCode: 400
          };
        }

        // Check if new name conflicts with existing schemes
        const { data: existingScheme } = await this.supabase
          .from('invoice_numbering_schemes')
          .select('id')
          .eq('user_id', userId)
          .eq('scheme_name', schemeName)
          .neq('id', schemeId)
          .single();

        if (existingScheme) {
          return {
            success: false,
            error: 'Scheme name already exists',
            statusCode: 409
          };
        }

        updateFields.scheme_name = schemeName;
      }

      // Update other fields
      if (updateData.prefix !== undefined) updateFields.prefix = updateData.prefix;
      if (updateData.suffix !== undefined) updateFields.suffix = updateData.suffix;
      if (updateData.sequence_length !== undefined) {
        if (updateData.sequence_length < 1 || updateData.sequence_length > 10) {
          return {
            success: false,
            error: 'Sequence length must be between 1 and 10',
            statusCode: 400
          };
        }
        updateFields.sequence_length = updateData.sequence_length;
      }
      if (updateData.current_number !== undefined) {
        if (updateData.current_number < 1) {
          return {
            success: false,
            error: 'Current number must be greater than 0',
            statusCode: 400
          };
        }
        updateFields.current_number = updateData.current_number;
      }
      if (updateData.reset_frequency !== undefined) {
        const validResetFrequencies = ['never', 'yearly', 'monthly', 'quarterly'];
        if (!validResetFrequencies.includes(updateData.reset_frequency)) {
          return {
            success: false,
            error: 'Invalid reset frequency',
            statusCode: 400
          };
        }
        updateFields.reset_frequency = updateData.reset_frequency;
      }
      if (updateData.include_year !== undefined) updateFields.include_year = updateData.include_year;
      if (updateData.include_month !== undefined) updateFields.include_month = updateData.include_month;
      if (updateData.include_quarter !== undefined) updateFields.include_quarter = updateData.include_quarter;
      if (updateData.date_format !== undefined) updateFields.date_format = updateData.date_format;

      // Handle default flag
      if (updateData.is_default !== undefined) {
        if (updateData.is_default) {
          // Unset other defaults first
          await this.supabase
            .from('invoice_numbering_schemes')
            .update({ is_default: false })
            .eq('user_id', userId)
            .eq('is_default', true);
        }
        updateFields.is_default = updateData.is_default;
      }

      // Generate new pattern preview if any relevant fields changed
      if (updateFields.prefix !== undefined || 
          updateFields.suffix !== undefined || 
          updateFields.sequence_length !== undefined ||
          updateFields.include_year !== undefined ||
          updateFields.include_month !== undefined ||
          updateFields.include_quarter !== undefined ||
          updateFields.date_format !== undefined) {
        
        const updatedSchemeData = { ...existingScheme.data, ...updateFields };
        updateFields.pattern_preview = this.generatePatternPreview(updatedSchemeData);
      }

      if (Object.keys(updateFields).length === 0) {
        return {
          success: false,
          error: 'No fields to update',
          statusCode: 400
        };
      }

      const { data, error } = await this.supabase
        .from('invoice_numbering_schemes')
        .update(updateFields)
        .eq('id', schemeId)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        console.error('Database error in updateNumberingScheme:', error);
        return {
          success: false,
          error: 'Failed to update numbering scheme',
          statusCode: 500
        };
      }

      return {
        success: true,
        data: data
      };
    } catch (error) {
      console.error('Error in updateNumberingScheme:', error);
      return {
        success: false,
        error: 'Internal server error',
        statusCode: 500
      };
    }
  }

  /**
   * Delete a numbering scheme
   */
  async deleteNumberingScheme(schemeId, userId) {
    try {
      // First check if scheme exists and belongs to user
      const existingScheme = await this.getNumberingScheme(schemeId, userId);
      if (!existingScheme.success) {
        return existingScheme;
      }

      // Check if scheme is being used by invoices
      const { data: invoicesUsing, error: invoiceError } = await this.supabase
        .from('invoices')
        .select('id')
        .eq('numbering_scheme_id', schemeId)
        .limit(1);

      if (invoiceError) {
        console.error('Error checking scheme usage:', invoiceError);
        return {
          success: false,
          error: 'Failed to check scheme usage',
          statusCode: 500
        };
      }

      if (invoicesUsing && invoicesUsing.length > 0) {
        return {
          success: false,
          error: 'Cannot delete scheme that is being used by invoices',
          statusCode: 409
        };
      }

      const { error } = await this.supabase
        .from('invoice_numbering_schemes')
        .delete()
        .eq('id', schemeId)
        .eq('user_id', userId);

      if (error) {
        console.error('Database error in deleteNumberingScheme:', error);
        return {
          success: false,
          error: 'Failed to delete numbering scheme',
          statusCode: 500
        };
      }

      return {
        success: true,
        data: { message: 'Numbering scheme deleted successfully' }
      };
    } catch (error) {
      console.error('Error in deleteNumberingScheme:', error);
      return {
        success: false,
        error: 'Internal server error',
        statusCode: 500
      };
    }
  }

  /**
   * Set a numbering scheme as default
   */
  async setDefaultScheme(schemeId, userId) {
    try {
      // First check if scheme exists and belongs to user
      const existingScheme = await this.getNumberingScheme(schemeId, userId);
      if (!existingScheme.success) {
        return existingScheme;
      }

      // Unset current default
      await this.supabase
        .from('invoice_numbering_schemes')
        .update({ is_default: false })
        .eq('user_id', userId)
        .eq('is_default', true);

      // Set new default
      const { data, error } = await this.supabase
        .from('invoice_numbering_schemes')
        .update({ is_default: true })
        .eq('id', schemeId)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        console.error('Database error in setDefaultScheme:', error);
        return {
          success: false,
          error: 'Failed to set default scheme',
          statusCode: 500
        };
      }

      return {
        success: true,
        data: data
      };
    } catch (error) {
      console.error('Error in setDefaultScheme:', error);
      return {
        success: false,
        error: 'Internal server error',
        statusCode: 500
      };
    }
  }

  /**
   * Generate next invoice number for a scheme
   */
  async generateNextInvoiceNumber(schemeId, userId) {
    try {
      // Get the scheme
      const schemeResult = await this.getNumberingScheme(schemeId, userId);
      if (!schemeResult.success) {
        return schemeResult;
      }

      const scheme = schemeResult.data;

      // Check if reset is needed
      const shouldReset = this.shouldResetSequence(scheme);
      if (shouldReset) {
        await this.resetSequence(schemeId, userId);
        // Re-fetch the scheme with reset values
        const updatedScheme = await this.getNumberingScheme(schemeId, userId);
        if (!updatedScheme.success) {
          return updatedScheme;
        }
        scheme.current_number = updatedScheme.data.current_number;
      }

      // Generate the invoice number
      const invoiceNumber = this.formatInvoiceNumber(scheme);

      // Increment the current number
      await this.supabase
        .from('invoice_numbering_schemes')
        .update({ 
          current_number: scheme.current_number + 1,
          updated_at: new Date().toISOString()
        })
        .eq('id', schemeId)
        .eq('user_id', userId);

      return {
        success: true,
        data: {
          invoice_number: invoiceNumber,
          sequence_number: scheme.current_number
        }
      };
    } catch (error) {
      console.error('Error in generateNextInvoiceNumber:', error);
      return {
        success: false,
        error: 'Internal server error',
        statusCode: 500
      };
    }
  }

  /**
   * Preview what the next invoice number would be
   */
  async previewNextInvoiceNumber(schemeId, userId) {
    try {
      const schemeResult = await this.getNumberingScheme(schemeId, userId);
      if (!schemeResult.success) {
        return schemeResult;
      }

      const scheme = schemeResult.data;
      const invoiceNumber = this.formatInvoiceNumber(scheme);

      return {
        success: true,
        data: {
          preview_number: invoiceNumber,
          sequence_number: scheme.current_number
        }
      };
    } catch (error) {
      console.error('Error in previewNextInvoiceNumber:', error);
      return {
        success: false,
        error: 'Internal server error',
        statusCode: 500
      };
    }
  }

  /**
   * Helper method to generate pattern preview
   */
  generatePatternPreview(schemeData) {
    const mockScheme = {
      prefix: schemeData.prefix || '',
      suffix: schemeData.suffix || '',
      sequence_length: schemeData.sequence_length || 3,
      current_number: 1, // Use 1 for preview
      include_year: schemeData.include_year || false,
      include_month: schemeData.include_month || false,
      include_quarter: schemeData.include_quarter || false,
      date_format: schemeData.date_format || 'YYYY'
    };

    return this.formatInvoiceNumber(mockScheme);
  }

  /**
   * Helper method to format invoice number
   */
  formatInvoiceNumber(scheme) {
    let result = scheme.prefix || '';
    
    // Add date components
    const now = new Date();
    const dateParts = [];

    if (scheme.include_year) {
      switch (scheme.date_format) {
        case 'YYYY':
          dateParts.push(now.getFullYear().toString());
          break;
        case 'YY':
          dateParts.push(now.getFullYear().toString().slice(-2));
          break;
      }
    }

    if (scheme.include_quarter) {
      const quarter = Math.ceil((now.getMonth() + 1) / 3);
      dateParts.push(`Q${quarter}`);
    }

    if (scheme.include_month) {
      dateParts.push(String(now.getMonth() + 1).padStart(2, '0'));
    }

    // Add date parts to result
    if (dateParts.length > 0) {
      if (result) result += '-';
      result += dateParts.join('-');
    }

    // Add sequence number
    const sequenceNumber = String(scheme.current_number).padStart(scheme.sequence_length, '0');
    if (result) result += '-';
    result += sequenceNumber;

    // Add suffix
    if (scheme.suffix) {
      result += scheme.suffix;
    }

    return result;
  }

  /**
   * Helper method to check if sequence should be reset
   */
  shouldResetSequence(scheme) {
    if (scheme.reset_frequency === 'never') return false;

    const now = new Date();
    const lastUpdated = new Date(scheme.updated_at);

    switch (scheme.reset_frequency) {
      case 'yearly':
        return now.getFullYear() > lastUpdated.getFullYear();
      case 'monthly':
        return now.getFullYear() > lastUpdated.getFullYear() || 
               (now.getFullYear() === lastUpdated.getFullYear() && now.getMonth() > lastUpdated.getMonth());
      case 'quarterly':
        const nowQuarter = Math.ceil((now.getMonth() + 1) / 3);
        const lastQuarter = Math.ceil((lastUpdated.getMonth() + 1) / 3);
        return now.getFullYear() > lastUpdated.getFullYear() ||
               (now.getFullYear() === lastUpdated.getFullYear() && nowQuarter > lastQuarter);
      default:
        return false;
    }
  }

  /**
   * Helper method to reset sequence
   */
  async resetSequence(schemeId, userId) {
    await this.supabase
      .from('invoice_numbering_schemes')
      .update({ current_number: 1 })
      .eq('id', schemeId)
      .eq('user_id', userId);
  }

  /**
   * Initialize default numbering scheme for new user
   */
  async initializeDefaultScheme(userId) {
    try {
      // Check if user already has schemes
      const { data: existingSchemes } = await this.supabase
        .from('invoice_numbering_schemes')
        .select('id')
        .eq('user_id', userId)
        .limit(1);

      if (existingSchemes && existingSchemes.length > 0) {
        return { success: true, message: 'Schemes already initialized' };
      }

      // Create default scheme
      const defaultScheme = {
        scheme_name: 'Default Numbering',
        is_default: true,
        prefix: 'INV',
        sequence_length: 3,
        current_number: 1
      };

      await this.createNumberingScheme(userId, defaultScheme);

      return {
        success: true,
        message: 'Default numbering scheme initialized successfully'
      };
    } catch (error) {
      console.error('Error in initializeDefaultScheme:', error);
      return {
        success: false,
        error: 'Failed to initialize default scheme',
        statusCode: 500
      };
    }
  }
}

// Export singleton instance
module.exports = new NumberingSchemeService();