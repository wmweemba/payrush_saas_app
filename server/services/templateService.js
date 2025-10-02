/**
 * Invoice Template Service
 * 
 * Business logic for invoice template management operations
 */

const { supabase } = require('../config/database');
const { sanitizeString } = require('../utils');

class TemplateService {
  constructor() {
    this.supabase = supabase;
  }

  /**
   * Get all templates for a user
   */
  async getTemplates(userId, options = {}) {
    try {
      const { 
        includeSystem = true, 
        templateType, 
        limit = 50, 
        offset = 0, 
        sortBy = 'updated_at', 
        sortOrder = 'desc' 
      } = options;

      let query = this.supabase
        .from('invoice_templates')
        .select(`
          id,
          template_name,
          template_type,
          is_default,
          is_system_template,
          template_data,
          description,
          preview_image_url,
          last_used_at,
          usage_count,
          created_at,
          updated_at
        `)
        .eq('user_id', userId);

      // Add filters
      if (!includeSystem) {
        query = query.eq('is_system_template', false);
      }

      if (templateType) {
        query = query.eq('template_type', templateType);
      }

      // Add sorting
      query = query.order(sortBy, { ascending: sortOrder === 'asc' });

      // Add pagination
      if (limit) {
        query = query.range(offset, offset + limit - 1);
      }

      const { data, error, count } = await query;

      if (error) {
        console.error('Database error in getTemplates:', error);
        return {
          success: false,
          error: 'Failed to retrieve templates',
          statusCode: 500
        };
      }

      return {
        success: true,
        data: {
          templates: data || [],
          pagination: {
            total: count,
            limit,
            offset,
            page: Math.floor(offset / limit) + 1
          }
        }
      };
    } catch (error) {
      console.error('Error in getTemplates:', error);
      return {
        success: false,
        error: 'Internal server error',
        statusCode: 500
      };
    }
  }

  /**
   * Get a specific template by ID
   */
  async getTemplate(templateId, userId) {
    try {
      const { data, error } = await this.supabase
        .from('invoice_templates')
        .select('*')
        .eq('id', templateId)
        .eq('user_id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return {
            success: false,
            error: 'Template not found',
            statusCode: 404
          };
        }
        console.error('Database error in getTemplate:', error);
        return {
          success: false,
          error: 'Failed to retrieve template',
          statusCode: 500
        };
      }

      return {
        success: true,
        data: data
      };
    } catch (error) {
      console.error('Error in getTemplate:', error);
      return {
        success: false,
        error: 'Internal server error',
        statusCode: 500
      };
    }
  }

  /**
   * Create a new template
   */
  async createTemplate(userId, templateData) {
    try {
      // Validate required fields
      if (!templateData.template_name || !templateData.template_data) {
        return {
          success: false,
          error: 'Template name and template data are required',
          statusCode: 400
        };
      }

      // Sanitize template name
      const templateName = sanitizeString(templateData.template_name);
      if (!templateName) {
        return {
          success: false,
          error: 'Invalid template name',
          statusCode: 400
        };
      }

      // Check if template name already exists for this user
      const { data: existingTemplate } = await this.supabase
        .from('invoice_templates')
        .select('id')
        .eq('user_id', userId)
        .eq('template_name', templateName)
        .single();

      if (existingTemplate) {
        return {
          success: false,
          error: 'Template name already exists',
          statusCode: 409
        };
      }

      // If this is being set as default, unset other defaults
      if (templateData.is_default) {
        await this.supabase
          .from('invoice_templates')
          .update({ is_default: false })
          .eq('user_id', userId)
          .eq('is_default', true);
      }

      // Prepare insert data
      const insertData = {
        user_id: userId,
        template_name: templateName,
        template_type: templateData.template_type || 'custom',
        is_default: templateData.is_default || false,
        template_data: templateData.template_data,
        description: templateData.description ? sanitizeString(templateData.description) : null,
        preview_image_url: templateData.preview_image_url || null
      };

      const { data, error } = await this.supabase
        .from('invoice_templates')
        .insert(insertData)
        .select()
        .single();

      if (error) {
        console.error('Database error in createTemplate:', error);
        return {
          success: false,
          error: 'Failed to create template',
          statusCode: 500
        };
      }

      return {
        success: true,
        data: data
      };
    } catch (error) {
      console.error('Error in createTemplate:', error);
      return {
        success: false,
        error: 'Internal server error',
        statusCode: 500
      };
    }
  }

  /**
   * Update an existing template
   */
  async updateTemplate(templateId, userId, updateData) {
    try {
      // First check if template exists and belongs to user
      const existingTemplate = await this.getTemplate(templateId, userId);
      if (!existingTemplate.success) {
        return existingTemplate;
      }

      // Check if it's a system template (shouldn't be editable)
      if (existingTemplate.data.is_system_template) {
        return {
          success: false,
          error: 'System templates cannot be modified',
          statusCode: 403
        };
      }

      // Prepare update data
      const updateFields = {};

      if (updateData.template_name !== undefined) {
        const templateName = sanitizeString(updateData.template_name);
        if (!templateName) {
          return {
            success: false,
            error: 'Invalid template name',
            statusCode: 400
          };
        }

        // Check if new name conflicts with existing templates
        const { data: existingTemplate } = await this.supabase
          .from('invoice_templates')
          .select('id')
          .eq('user_id', userId)
          .eq('template_name', templateName)
          .neq('id', templateId)
          .single();

        if (existingTemplate) {
          return {
            success: false,
            error: 'Template name already exists',
            statusCode: 409
          };
        }

        updateFields.template_name = templateName;
      }

      if (updateData.template_data !== undefined) {
        updateFields.template_data = updateData.template_data;
      }

      if (updateData.template_type !== undefined) {
        updateFields.template_type = updateData.template_type;
      }

      if (updateData.description !== undefined) {
        updateFields.description = updateData.description ? sanitizeString(updateData.description) : null;
      }

      if (updateData.preview_image_url !== undefined) {
        updateFields.preview_image_url = updateData.preview_image_url;
      }

      // Handle default flag
      if (updateData.is_default !== undefined) {
        if (updateData.is_default) {
          // Unset other defaults first
          await this.supabase
            .from('invoice_templates')
            .update({ is_default: false })
            .eq('user_id', userId)
            .eq('is_default', true);
        }
        updateFields.is_default = updateData.is_default;
      }

      if (Object.keys(updateFields).length === 0) {
        return {
          success: false,
          error: 'No fields to update',
          statusCode: 400
        };
      }

      const { data, error } = await this.supabase
        .from('invoice_templates')
        .update(updateFields)
        .eq('id', templateId)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        console.error('Database error in updateTemplate:', error);
        return {
          success: false,
          error: 'Failed to update template',
          statusCode: 500
        };
      }

      return {
        success: true,
        data: data
      };
    } catch (error) {
      console.error('Error in updateTemplate:', error);
      return {
        success: false,
        error: 'Internal server error',
        statusCode: 500
      };
    }
  }

  /**
   * Delete a template
   */
  async deleteTemplate(templateId, userId) {
    try {
      // First check if template exists and belongs to user
      const existingTemplate = await this.getTemplate(templateId, userId);
      if (!existingTemplate.success) {
        return existingTemplate;
      }

      // Check if it's a system template (shouldn't be deletable)
      if (existingTemplate.data.is_system_template) {
        return {
          success: false,
          error: 'System templates cannot be deleted',
          statusCode: 403
        };
      }

      // Check if template is being used by invoices
      const { data: invoicesUsing, error: invoiceError } = await this.supabase
        .from('invoices')
        .select('id')
        .eq('template_id', templateId)
        .limit(1);

      if (invoiceError) {
        console.error('Error checking template usage:', invoiceError);
        return {
          success: false,
          error: 'Failed to check template usage',
          statusCode: 500
        };
      }

      if (invoicesUsing && invoicesUsing.length > 0) {
        return {
          success: false,
          error: 'Cannot delete template that is being used by invoices',
          statusCode: 409
        };
      }

      const { error } = await this.supabase
        .from('invoice_templates')
        .delete()
        .eq('id', templateId)
        .eq('user_id', userId);

      if (error) {
        console.error('Database error in deleteTemplate:', error);
        return {
          success: false,
          error: 'Failed to delete template',
          statusCode: 500
        };
      }

      return {
        success: true,
        data: { message: 'Template deleted successfully' }
      };
    } catch (error) {
      console.error('Error in deleteTemplate:', error);
      return {
        success: false,
        error: 'Internal server error',
        statusCode: 500
      };
    }
  }

  /**
   * Set a template as default
   */
  async setDefaultTemplate(templateId, userId) {
    try {
      // First check if template exists and belongs to user
      const existingTemplate = await this.getTemplate(templateId, userId);
      if (!existingTemplate.success) {
        return existingTemplate;
      }

      // Unset current default
      await this.supabase
        .from('invoice_templates')
        .update({ is_default: false })
        .eq('user_id', userId)
        .eq('is_default', true);

      // Set new default
      const { data, error } = await this.supabase
        .from('invoice_templates')
        .update({ is_default: true })
        .eq('id', templateId)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        console.error('Database error in setDefaultTemplate:', error);
        return {
          success: false,
          error: 'Failed to set default template',
          statusCode: 500
        };
      }

      return {
        success: true,
        data: data
      };
    } catch (error) {
      console.error('Error in setDefaultTemplate:', error);
      return {
        success: false,
        error: 'Internal server error',
        statusCode: 500
      };
    }
  }

  /**
   * Duplicate a template
   */
  async duplicateTemplate(templateId, userId, newName = null) {
    try {
      // Get the original template
      const originalTemplate = await this.getTemplate(templateId, userId);
      if (!originalTemplate.success) {
        return originalTemplate;
      }

      // Generate new name if not provided
      const baseName = newName || `${originalTemplate.data.template_name} (Copy)`;
      let templateName = baseName;
      let counter = 1;

      // Ensure unique name
      while (true) {
        const { data: existing } = await this.supabase
          .from('invoice_templates')
          .select('id')
          .eq('user_id', userId)
          .eq('template_name', templateName)
          .single();

        if (!existing) break;
        
        templateName = `${baseName} ${counter}`;
        counter++;
      }

      // Create duplicate
      const duplicateData = {
        template_name: templateName,
        template_type: originalTemplate.data.template_type,
        template_data: originalTemplate.data.template_data,
        description: originalTemplate.data.description ? `Copy of ${originalTemplate.data.description}` : null,
        is_default: false // Duplicates are never default
      };

      return await this.createTemplate(userId, duplicateData);
    } catch (error) {
      console.error('Error in duplicateTemplate:', error);
      return {
        success: false,
        error: 'Internal server error',
        statusCode: 500
      };
    }
  }

  /**
   * Update template usage statistics
   */
  async updateTemplateUsage(templateId, userId) {
    try {
      const { error } = await this.supabase
        .from('invoice_templates')
        .update({ 
          usage_count: this.supabase.sql`usage_count + 1`,
          last_used_at: new Date().toISOString()
        })
        .eq('id', templateId)
        .eq('user_id', userId);

      if (error) {
        console.error('Database error in updateTemplateUsage:', error);
        // Don't fail the request for usage stats
      }

      return { success: true };
    } catch (error) {
      console.error('Error in updateTemplateUsage:', error);
      return { success: false };
    }
  }

  /**
   * Get template usage statistics
   */
  async getTemplateStats(userId) {
    try {
      const { data, error } = await this.supabase
        .from('template_usage_stats')
        .select('*')
        .eq('user_id', userId);

      if (error) {
        console.error('Database error in getTemplateStats:', error);
        return {
          success: false,
          error: 'Failed to retrieve template statistics',
          statusCode: 500
        };
      }

      return {
        success: true,
        data: data || []
      };
    } catch (error) {
      console.error('Error in getTemplateStats:', error);
      return {
        success: false,
        error: 'Internal server error',
        statusCode: 500
      };
    }
  }

  /**
   * Initialize default templates for a new user
   */
  async initializeDefaultTemplates(userId) {
    try {
      // Check if user already has templates
      const { data: existingTemplates } = await this.supabase
        .from('invoice_templates')
        .select('id')
        .eq('user_id', userId)
        .limit(1);

      if (existingTemplates && existingTemplates.length > 0) {
        return { success: true, message: 'Templates already initialized' };
      }

      // Create default templates
      const defaultTemplates = [
        {
          template_name: 'Professional',
          template_type: 'professional',
          is_default: true,
          is_system_template: true,
          description: 'Professional business template with clean layout',
          template_data: {
            colors: {
              primary: '#2563eb',
              secondary: '#64748b',
              text: '#1f2937',
              accent: '#f8fafc'
            },
            fonts: {
              heading: { size: 24, weight: 'bold' },
              subheading: { size: 12, weight: 'bold' },
              body: { size: 10, weight: 'normal' },
              small: { size: 8, weight: 'normal' }
            },
            layout: {
              headerHeight: 40,
              marginX: 20,
              marginY: 20
            }
          }
        },
        {
          template_name: 'Minimal',
          template_type: 'minimal',
          is_default: false,
          is_system_template: true,
          description: 'Clean minimal design with essential information',
          template_data: {
            colors: {
              primary: '#000000',
              secondary: '#666666',
              text: '#333333',
              accent: '#f9f9f9'
            },
            fonts: {
              heading: { size: 20, weight: 'normal' },
              subheading: { size: 11, weight: 'bold' },
              body: { size: 9, weight: 'normal' },
              small: { size: 7, weight: 'normal' }
            },
            layout: {
              headerHeight: 30,
              marginX: 25,
              marginY: 25
            }
          }
        },
        {
          template_name: 'Modern',
          template_type: 'modern',
          is_default: false,
          is_system_template: true,
          description: 'Contemporary design with bold colors',
          template_data: {
            colors: {
              primary: '#7c3aed',
              secondary: '#a855f7',
              text: '#374151',
              accent: '#f3f4f6'
            },
            fonts: {
              heading: { size: 22, weight: 'bold' },
              subheading: { size: 12, weight: 'bold' },
              body: { size: 10, weight: 'normal' },
              small: { size: 8, weight: 'normal' }
            },
            layout: {
              headerHeight: 35,
              marginX: 20,
              marginY: 20
            }
          }
        },
        {
          template_name: 'Classic',
          template_type: 'classic',
          is_default: false,
          is_system_template: true,
          description: 'Traditional business layout with borders',
          template_data: {
            colors: {
              primary: '#1f2937',
              secondary: '#4b5563',
              text: '#374151',
              accent: '#f3f4f6'
            },
            fonts: {
              heading: { size: 22, weight: 'bold' },
              subheading: { size: 12, weight: 'bold' },
              body: { size: 10, weight: 'normal' },
              small: { size: 8, weight: 'normal' }
            },
            layout: {
              headerHeight: 35,
              marginX: 20,
              marginY: 20
            }
          }
        }
      ];

      // Insert default templates
      const insertPromises = defaultTemplates.map(template => 
        this.createTemplate(userId, template)
      );

      await Promise.all(insertPromises);

      return {
        success: true,
        message: 'Default templates initialized successfully'
      };
    } catch (error) {
      console.error('Error in initializeDefaultTemplates:', error);
      return {
        success: false,
        error: 'Failed to initialize default templates',
        statusCode: 500
      };
    }
  }
}

// Export singleton instance
module.exports = new TemplateService();