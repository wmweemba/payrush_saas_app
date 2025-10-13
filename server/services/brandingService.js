/**
 * Enhanced Business Branding Service
 * 
 * Comprehensive business logic for business branding and asset management operations
 * Updated to support new database schema with brand_assets table and enhanced functionality
 */

const { supabase } = require('../config/database');
const { sanitizeString } = require('../utils');

class BrandingService {
  constructor() {
    this.supabase = supabase;
    this.storageBucket = 'brand-assets'; // Updated bucket name for consistency
  }

  /**
   * Get comprehensive business branding for a user including assets
   */
  async getBranding(userId) {
    try {
      const { data, error } = await this.supabase
        .from('business_branding')
        .select(`
          *,
          brand_assets (
            id,
            asset_name,
            asset_type,
            file_url,
            file_name,
            file_size,
            file_type,
            width,
            height,
            alt_text,
            description,
            is_active,
            usage_context,
            created_at
          )
        `)
        .eq('user_id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No branding found, initialize default branding
          return await this.initializeDefaultBranding(userId);
        }
        console.error('Database error in getBranding:', error);
        return {
          success: false,
          error: 'Failed to retrieve branding',
          statusCode: 500
        };
      }

      return {
        success: true,
        data: data
      };
    } catch (error) {
      console.error('Error in getBranding:', error);
      return {
        success: false,
        error: 'Internal server error',
        statusCode: 500
      };
    }
  }

  /**
   * Initialize default branding for a new user
   */
  async initializeDefaultBranding(userId) {
    try {
      // Use the actual column names that exist in the database
      const defaultBranding = {
        user_id: userId,
        primary_color: '#2563eb',
        secondary_color: '#64748b', 
        accent_color: '#10b981',
        text_color: '#1f2937',
        background_color: '#ffffff',
        heading_font: 'Inter, sans-serif',
        body_font: 'Inter, sans-serif', // Note: using body_font, not primary_font
        display_business_name: true,
        display_address: true,
        display_phone: true,
        display_email: true,
        display_website: true
      };

      const { data, error } = await this.supabase
        .from('business_branding')
        .insert(defaultBranding)
        .select()
        .single();

      if (error) {
        console.error('Error inserting default branding:', error);
        return {
          success: false,
          error: 'Failed to initialize branding',
          statusCode: 500
        };
      }

      return {
        success: true,
        data: data
      };
    } catch (error) {
      console.error('Error in initializeDefaultBranding:', error);
      return {
        success: false,
        error: 'Internal server error',
        statusCode: 500
      };
    }
  }

  /**
   * Update business branding information
   */
  async saveBranding(userId, brandingData) {
    try {
      // Validate color values if provided
      const colorValidation = this.validateColorScheme(brandingData);
      if (!colorValidation.valid) {
        return {
          success: false,
          error: colorValidation.error,
          statusCode: 400
        };
      }

      // Prepare data for update
      const sanitizedData = this.sanitizeBrandingData(brandingData);
      sanitizedData.updated_at = new Date().toISOString();

      const { data, error } = await this.supabase
        .from('business_branding')
        .update(sanitizedData)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        console.error('Database error in saveBranding:', error);
        return {
          success: false,
          error: 'Failed to update branding',
          statusCode: 500
        };
      }

      return {
        success: true,
        data: data
      };
    } catch (error) {
      console.error('Error in saveBranding:', error);
      return {
        success: false,
        error: 'Internal server error',
        statusCode: 500
      };
    }
  }

  /**
   * Upload brand asset (logo, favicon, etc.) with enhanced metadata
   */
  async uploadAsset(userId, file, assetType = 'logo', metadata = {}) {
    try {
      // Validate file
      const validation = this.validateAssetFile(file, assetType);
      if (!validation.valid) {
        return {
          success: false,
          error: validation.error,
          statusCode: 400
        };
      }

      // Generate unique filename
      const fileExtension = file.originalname.split('.').pop().toLowerCase();
      const timestamp = Date.now();
      const filename = `${userId}/${assetType}/${timestamp}.${fileExtension}`;

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await this.supabase.storage
        .from(this.storageBucket)
        .upload(filename, file.buffer, {
          contentType: file.mimetype,
          upsert: false
        });

      if (uploadError) {
        console.error('Storage error in uploadAsset:', uploadError);
        return {
          success: false,
          error: 'Failed to upload asset',
          statusCode: 500
        };
      }

      // Get public URL
      const { data: publicUrlData } = this.supabase.storage
        .from(this.storageBucket)
        .getPublicUrl(filename);

      const fileUrl = publicUrlData.publicUrl;

      // Get user's branding to associate asset
      const brandingResult = await this.getBranding(userId);
      if (!brandingResult.success) {
        // Clean up uploaded file if branding retrieval fails
        await this.supabase.storage.from(this.storageBucket).remove([filename]);
        return {
          success: false,
          error: 'Failed to get user branding information',
          statusCode: 500
        };
      }

      // Save asset information to database
      const assetData = {
        user_id: userId,
        branding_id: brandingResult.data.id,
        asset_name: metadata.name || file.originalname,
        asset_type: assetType,
        file_url: fileUrl,
        file_name: file.originalname,
        file_size: file.size,
        file_type: file.mimetype,
        width: metadata.width || null,
        height: metadata.height || null,
        alt_text: metadata.altText || '',
        description: metadata.description || '',
        is_active: true,
        usage_context: metadata.usageContext || {}
      };

      const { data: assetRecord, error: assetError } = await this.supabase
        .from('brand_assets')
        .insert(assetData)
        .select()
        .single();

      if (assetError) {
        // Clean up uploaded file if database insert fails
        await this.supabase.storage.from(this.storageBucket).remove([filename]);
        console.error('Database error in uploadAsset:', assetError);
        return {
          success: false,
          error: 'Failed to save asset information',
          statusCode: 500
        };
      }

      // If this is a logo, update the branding table
      if (assetType === 'logo') {
        await this.updateLogo(userId, fileUrl, file.originalname, file.size);
      }

      return {
        success: true,
        data: {
          asset: assetRecord,
          url: fileUrl,
          filename: filename
        }
      };
    } catch (error) {
      console.error('Error in uploadAsset:', error);
      return {
        success: false,
        error: 'Internal server error',
        statusCode: 500
      };
    }
  }

  /**
   * Delete brand asset with enhanced cleanup
   */
  async deleteAsset(userId, assetId) {
    try {
      // Get asset information first
      const { data: asset, error: getError } = await this.supabase
        .from('brand_assets')
        .select('*')
        .eq('id', assetId)
        .eq('user_id', userId)
        .single();

      if (getError) {
        console.error('Error getting asset for deletion:', getError);
        return {
          success: false,
          error: 'Asset not found or access denied',
          statusCode: 404
        };
      }

      if (!asset) {
        return {
          success: false,
          error: 'Asset not found',
          statusCode: 404
        };
      }

      // Extract file path from URL for storage deletion
      const urlParts = asset.file_url.split('/');
      const bucketPath = urlParts.slice(-3).join('/'); // Get userId/assetType/filename

      // Delete from storage
      const { error: storageError } = await this.supabase.storage
        .from(this.storageBucket)
        .remove([bucketPath]);

      if (storageError) {
        console.warn('Warning: Failed to delete file from storage:', storageError);
        // Continue with database deletion even if storage deletion fails
      }

      // Delete from database
      const { error: deleteError } = await this.supabase
        .from('brand_assets')
        .delete()
        .eq('id', assetId)
        .eq('user_id', userId);

      if (deleteError) {
        console.error('Database error in deleteAsset:', deleteError);
        return {
          success: false,
          error: 'Failed to delete asset',
          statusCode: 500
        };
      }

      // If this was a logo, update the branding table
      if (asset.asset_type === 'logo') {
        await this.removeLogo(userId);
      }

      return {
        success: true,
        data: { message: 'Asset deleted successfully' }
      };
    } catch (error) {
      console.error('Error in deleteAsset:', error);
      return {
        success: false,
        error: 'Internal server error',
        statusCode: 500
      };
    }
  }

  /**
   * Update logo information in branding table
   */
  async updateLogo(userId, logoUrl, logoFilename, logoSize) {
    try {
      const updateData = {
        logo_url: logoUrl,
        logo_filename: logoFilename,
        logo_size: logoSize
      };

      const result = await this.saveBranding(userId, updateData);
      return result;
    } catch (error) {
      console.error('Error in updateLogo:', error);
      return {
        success: false,
        error: 'Internal server error',
        statusCode: 500
      };
    }
  }

  /**
   * Remove logo from branding with enhanced cleanup
   */
  async removeLogo(userId) {
    try {
      // Update branding to remove logo references
      const updateData = {
        logo_url: null,
        logo_filename: null,
        logo_size: null
      };

      const result = await this.saveBranding(userId, updateData);
      return result;
    } catch (error) {
      console.error('Error in removeLogo:', error);
      return {
        success: false,
        error: 'Internal server error',
        statusCode: 500
      };
    }
  }

  /**
   * Get brand assets with enhanced filtering
   */
  async getBrandAssets(userId, assetType = null) {
    try {
      let query = this.supabase
        .from('brand_assets')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (assetType) {
        query = query.eq('asset_type', assetType);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Database error in getBrandAssets:', error);
        return {
          success: false,
          error: 'Failed to retrieve assets',
          statusCode: 500
        };
      }

      return {
        success: true,
        data: data || []
      };
    } catch (error) {
      console.error('Error in getBrandAssets:', error);
      return {
        success: false,
        error: 'Internal server error',
        statusCode: 500
      };
    }
  }

  /**
   * Apply branding to template data
   */
  applyBrandingToTemplate(templateData, branding) {
    try {
      if (!branding || !branding.apply_branding_to_templates) {
        return templateData;
      }

      const brandedTemplate = {
        ...templateData,
        colors: {
          ...templateData.colors,
          primary: branding.primary_color || templateData.colors.primary,
          secondary: branding.secondary_color || templateData.colors.secondary,
          accent: branding.accent_color || templateData.colors.accent,
          text: branding.text_color || templateData.colors.text,
          background: branding.background_color || templateData.colors.background
        },
        fonts: {
          ...templateData.fonts,
          primary: branding.primary_font || templateData.fonts.primary,
          heading: branding.heading_font || templateData.fonts.heading
        },
        branding: {
          logo_url: branding.logo_url,
          company_name: branding.company_name,
          company_tagline: branding.company_tagline,
          company_website: branding.company_website
        }
      };

      return brandedTemplate;
    } catch (error) {
      console.error('Error applying branding to template:', error);
      return templateData;
    }
  }

  /**
   * Enhanced color scheme validation
   */
  validateColorScheme(colors) {
    const colorFields = ['primary_color', 'secondary_color', 'accent_color', 'text_color', 'background_color'];
    const hexColorRegex = /^#[0-9A-Fa-f]{6}$/;

    for (const colorKey of colorFields) {
      if (colors[colorKey] && !hexColorRegex.test(colors[colorKey])) {
        return {
          valid: false,
          error: `Invalid ${colorKey.replace('_', ' ')} format. Must be a valid hex color (e.g., #FF0000)`
        };
      }
    }

    return { valid: true };
  }

  /**
   * Enhanced asset file validation
   */
  validateAssetFile(file, assetType) {
    if (!file) {
      return { valid: false, error: 'No file provided' };
    }

    // Check file size (5MB limit)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return { valid: false, error: 'File size must be less than 5MB' };
    }

    // Check file type based on asset type
    const allowedTypes = {
      logo: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/svg+xml', 'image/webp'],
      favicon: ['image/x-icon', 'image/vnd.microsoft.icon', 'image/png', 'image/jpeg'],
      letterhead: ['image/jpeg', 'image/jpg', 'image/png', 'image/svg+xml'],
      signature: ['image/jpeg', 'image/jpg', 'image/png', 'image/svg+xml'],
      background: ['image/jpeg', 'image/jpg', 'image/png', 'image/svg+xml']
    };

    const validTypes = allowedTypes[assetType] || allowedTypes.logo;
    if (!validTypes.includes(file.mimetype)) {
      return { 
        valid: false, 
        error: `Invalid file type for ${assetType}. Allowed types: ${validTypes.join(', ')}` 
      };
    }

    // Additional validation for specific asset types
    if (assetType === 'favicon') {
      const maxFaviconSize = 512 * 1024; // 512KB for favicons
      if (file.size > maxFaviconSize) {
        return { valid: false, error: 'Favicon size must be less than 512KB' };
      }
    }

    return { valid: true };
  }

  /**
   * Enhanced branding data sanitization
   */
  sanitizeBrandingData(data) {
    const sanitized = {};

    // Handle text fields
    const textFields = ['company_name', 'company_tagline', 'company_website', 'primary_font', 'heading_font'];
    textFields.forEach(field => {
      if (data[field] !== undefined) {
        sanitized[field] = data[field] ? sanitizeString(data[field]) : null;
      }
    });

    // Handle URL fields
    const urlFields = ['logo_url', 'favicon_url'];
    urlFields.forEach(field => {
      if (data[field] !== undefined) {
        sanitized[field] = data[field];
      }
    });

    // Handle numeric fields
    const numericFields = ['logo_size'];
    numericFields.forEach(field => {
      if (data[field] !== undefined) {
        const num = parseInt(data[field]);
        if (!isNaN(num)) {
          sanitized[field] = num;
        }
      }
    });

    // Handle color fields
    const colorFields = ['primary_color', 'secondary_color', 'accent_color', 'text_color', 'background_color'];
    colorFields.forEach(field => {
      if (data[field] !== undefined) {
        sanitized[field] = data[field];
      }
    });

    // Handle boolean fields
    const booleanFields = ['apply_branding_to_templates', 'apply_branding_to_emails'];
    booleanFields.forEach(field => {
      if (data[field] !== undefined) {
        sanitized[field] = Boolean(data[field]);
      }
    });

    return sanitized;
  }

  /**
   * Create branding preset for reuse
   */
  async createBrandingPreset(userId, presetData) {
    try {
      // Get user's branding to associate preset
      const brandingResult = await this.getBranding(userId);
      if (!brandingResult.success) {
        return {
          success: false,
          error: 'Failed to get user branding information',
          statusCode: 500
        };
      }

      const preset = {
        user_id: userId,
        branding_id: brandingResult.data.id,
        asset_name: presetData.name || 'Custom Preset',
        asset_type: 'preset',
        file_url: '', // Presets don't have files
        file_name: `${presetData.name || 'preset'}.json`,
        file_size: 0,
        file_type: 'application/json',
        description: presetData.description || '',
        is_active: true,
        usage_context: {
          colors: presetData.colors || {},
          fonts: presetData.fonts || {},
          settings: presetData.settings || {}
        }
      };

      const { data, error } = await this.supabase
        .from('brand_assets')
        .insert(preset)
        .select()
        .single();

      if (error) {
        console.error('Error creating branding preset:', error);
        return {
          success: false,
          error: 'Failed to create preset',
          statusCode: 500
        };
      }

      return {
        success: true,
        data: data
      };
    } catch (error) {
      console.error('Error in createBrandingPreset:', error);
      return {
        success: false,
        error: 'Internal server error',
        statusCode: 500
      };
    }
  }

  /**
   * Initialize storage bucket for brand assets
   */
  async initializeStorage() {
    try {
      // Check if bucket exists
      const { data: buckets, error: listError } = await this.supabase.storage.listBuckets();
      
      if (listError) {
        console.error('Error listing buckets:', listError);
        return { success: false, error: 'Failed to initialize storage' };
      }

      const bucketExists = buckets.some(bucket => bucket.name === this.storageBucket);
      
      if (!bucketExists) {
        // Create bucket with public access for brand assets
        const { error: createError } = await this.supabase.storage.createBucket(this.storageBucket, {
          public: true,
          allowedMimeTypes: [
            'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 
            'image/svg+xml', 'image/webp', 'image/x-icon', 'image/vnd.microsoft.icon'
          ],
          fileSizeLimit: 5242880, // 5MB
        });

        if (createError) {
          console.error('Error creating bucket:', createError);
          return { success: false, error: 'Failed to create storage bucket' };
        }

        console.log(`Created storage bucket: ${this.storageBucket}`);
      }

      return { success: true };
    } catch (error) {
      console.error('Error in initializeStorage:', error);
      return { success: false, error: 'Storage initialization failed' };
    }
  }

  /**
   * Get branding statistics for analytics
   */
  async getBrandingStats(userId) {
    try {
      const { data: assets, error } = await this.supabase
        .from('brand_assets')
        .select('asset_type, file_size, created_at')
        .eq('user_id', userId)
        .eq('is_active', true);

      if (error) {
        console.error('Error getting branding stats:', error);
        return {
          success: false,
          error: 'Failed to get branding statistics',
          statusCode: 500
        };
      }

      const stats = {
        total_assets: assets.length,
        total_storage_used: assets.reduce((sum, asset) => sum + (asset.file_size || 0), 0),
        asset_types: assets.reduce((types, asset) => {
          types[asset.asset_type] = (types[asset.asset_type] || 0) + 1;
          return types;
        }, {}),
        latest_upload: assets.length > 0 ? 
          assets.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0].created_at : null
      };

      return {
        success: true,
        data: stats
      };
    } catch (error) {
      console.error('Error in getBrandingStats:', error);
      return {
        success: false,
        error: 'Internal server error',
        statusCode: 500
      };
    }
  }
}

// Export singleton instance
module.exports = new BrandingService();