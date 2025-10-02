/**
 * Business Branding Service
 * 
 * Business logic for business branding and asset management operations
 */

const { supabase } = require('../config/database');
const { sanitizeString } = require('../utils');

class BrandingService {
  constructor() {
    this.supabase = supabase;
    this.storageBucket = 'branding-assets'; // Supabase storage bucket for branding assets
  }

  /**
   * Get business branding for a user
   */
  async getBranding(userId) {
    try {
      const { data, error } = await this.supabase
        .from('business_branding')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No branding found, return default values
          return {
            success: true,
            data: this.getDefaultBranding(userId)
          };
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
   * Create or update business branding
   */
  async saveBranding(userId, brandingData) {
    try {
      // Check if branding already exists
      const { data: existing } = await this.supabase
        .from('business_branding')
        .select('id')
        .eq('user_id', userId)
        .single();

      // Prepare data for insert/update
      const sanitizedData = this.sanitizeBrandingData(brandingData);
      sanitizedData.user_id = userId;

      let result;
      if (existing) {
        // Update existing branding
        const { data, error } = await this.supabase
          .from('business_branding')
          .update(sanitizedData)
          .eq('user_id', userId)
          .select()
          .single();

        if (error) {
          console.error('Database error in saveBranding (update):', error);
          return {
            success: false,
            error: 'Failed to update branding',
            statusCode: 500
          };
        }
        result = data;
      } else {
        // Create new branding
        const { data, error } = await this.supabase
          .from('business_branding')
          .insert(sanitizedData)
          .select()
          .single();

        if (error) {
          console.error('Database error in saveBranding (insert):', error);
          return {
            success: false,
            error: 'Failed to create branding',
            statusCode: 500
          };
        }
        result = data;
      }

      return {
        success: true,
        data: result
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
   * Upload logo or branding asset
   */
  async uploadAsset(userId, file, assetType = 'logo') {
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
      const filename = `${userId}/${assetType}_${Date.now()}.${fileExtension}`;

      // Upload to Supabase Storage
      const { data, error } = await this.supabase.storage
        .from(this.storageBucket)
        .upload(filename, file.buffer, {
          contentType: file.mimetype,
          upsert: false
        });

      if (error) {
        console.error('Storage error in uploadAsset:', error);
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

      return {
        success: true,
        data: {
          filename: filename,
          url: publicUrlData.publicUrl,
          asset_type: assetType,
          size: file.size,
          mime_type: file.mimetype
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
   * Delete an asset from storage
   */
  async deleteAsset(userId, filename) {
    try {
      // Ensure the filename belongs to the user
      if (!filename.startsWith(userId)) {
        return {
          success: false,
          error: 'Unauthorized access to asset',
          statusCode: 403
        };
      }

      const { error } = await this.supabase.storage
        .from(this.storageBucket)
        .remove([filename]);

      if (error) {
        console.error('Storage error in deleteAsset:', error);
        return {
          success: false,
          error: 'Failed to delete asset',
          statusCode: 500
        };
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
   * Update logo in branding
   */
  async updateLogo(userId, logoUrl, logoWidth = 150, logoHeight = 75) {
    try {
      const updateData = {
        logo_url: logoUrl,
        logo_width: logoWidth,
        logo_height: logoHeight
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
   * Remove logo from branding
   */
  async removeLogo(userId) {
    try {
      // Get current branding to find the logo URL
      const brandingResult = await this.getBranding(userId);
      if (!brandingResult.success) {
        return brandingResult;
      }

      const branding = brandingResult.data;
      
      // Delete logo file if it exists
      if (branding.logo_url) {
        // Extract filename from URL
        const url = new URL(branding.logo_url);
        const filename = url.pathname.split('/').pop();
        
        if (filename && filename.includes(userId)) {
          await this.deleteAsset(userId, `${userId}/${filename}`);
        }
      }

      // Update branding to remove logo
      const updateData = {
        logo_url: null,
        logo_width: null,
        logo_height: null
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
   * Get all assets for a user
   */
  async getUserAssets(userId) {
    try {
      const { data, error } = await this.supabase.storage
        .from(this.storageBucket)
        .list(userId, {
          limit: 100,
          offset: 0
        });

      if (error) {
        console.error('Storage error in getUserAssets:', error);
        return {
          success: false,
          error: 'Failed to retrieve assets',
          statusCode: 500
        };
      }

      // Add public URLs to assets
      const assetsWithUrls = data.map(asset => {
        const { data: publicUrlData } = this.supabase.storage
          .from(this.storageBucket)
          .getPublicUrl(`${userId}/${asset.name}`);

        return {
          ...asset,
          url: publicUrlData.publicUrl,
          asset_type: this.getAssetTypeFromName(asset.name)
        };
      });

      return {
        success: true,
        data: assetsWithUrls
      };
    } catch (error) {
      console.error('Error in getUserAssets:', error);
      return {
        success: false,
        error: 'Internal server error',
        statusCode: 500
      };
    }
  }

  /**
   * Validate branding color scheme
   */
  validateColorScheme(colors) {
    const requiredColors = ['primary_color', 'secondary_color', 'accent_color', 'text_color', 'background_color'];
    const hexColorRegex = /^#[0-9A-Fa-f]{6}$/;

    for (const colorKey of requiredColors) {
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
   * Helper: Validate asset file
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

    // Check file type
    const allowedTypes = {
      logo: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/svg+xml'],
      favicon: ['image/x-icon', 'image/vnd.microsoft.icon', 'image/png'],
      watermark: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif']
    };

    const validTypes = allowedTypes[assetType] || allowedTypes.logo;
    if (!validTypes.includes(file.mimetype)) {
      return { 
        valid: false, 
        error: `Invalid file type. Allowed types for ${assetType}: ${validTypes.join(', ')}` 
      };
    }

    return { valid: true };
  }

  /**
   * Helper: Sanitize branding data
   */
  sanitizeBrandingData(data) {
    const sanitized = {};

    // Handle text fields
    const textFields = ['display_business_name', 'display_address', 'display_phone', 
                       'display_email', 'display_website', 'footer_text', 'terms_and_conditions'];
    
    textFields.forEach(field => {
      if (data[field] !== undefined) {
        sanitized[field] = data[field] ? sanitizeString(data[field]) : null;
      }
    });

    // Handle URL fields
    const urlFields = ['logo_url', 'favicon_url', 'watermark_url'];
    urlFields.forEach(field => {
      if (data[field] !== undefined) {
        sanitized[field] = data[field];
      }
    });

    // Handle numeric fields
    const numericFields = ['logo_width', 'logo_height', 'font_size_multiplier'];
    numericFields.forEach(field => {
      if (data[field] !== undefined) {
        const num = parseFloat(data[field]);
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

    // Handle font fields
    const fontFields = ['heading_font', 'body_font'];
    fontFields.forEach(field => {
      if (data[field] !== undefined) {
        sanitized[field] = data[field];
      }
    });

    return sanitized;
  }

  /**
   * Helper: Get default branding values
   */
  getDefaultBranding(userId) {
    return {
      user_id: userId,
      logo_url: null,
      logo_width: 150,
      logo_height: 75,
      favicon_url: null,
      watermark_url: null,
      primary_color: '#2563eb',
      secondary_color: '#64748b',
      accent_color: '#f8fafc',
      text_color: '#1f2937',
      background_color: '#ffffff',
      heading_font: 'Helvetica',
      body_font: 'Helvetica',
      font_size_multiplier: 1.00,
      display_business_name: null,
      display_address: null,
      display_phone: null,
      display_email: null,
      display_website: null,
      footer_text: null,
      terms_and_conditions: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  }

  /**
   * Helper: Get asset type from filename
   */
  getAssetTypeFromName(filename) {
    if (filename.includes('logo_')) return 'logo';
    if (filename.includes('favicon_')) return 'favicon';
    if (filename.includes('watermark_')) return 'watermark';
    return 'unknown';
  }

  /**
   * Initialize storage bucket if needed
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
        // Create bucket
        const { error: createError } = await this.supabase.storage.createBucket(this.storageBucket, {
          public: true
        });

        if (createError) {
          console.error('Error creating bucket:', createError);
          return { success: false, error: 'Failed to create storage bucket' };
        }
      }

      return { success: true };
    } catch (error) {
      console.error('Error in initializeStorage:', error);
      return { success: false, error: 'Storage initialization failed' };
    }
  }
}

// Export singleton instance
module.exports = new BrandingService();