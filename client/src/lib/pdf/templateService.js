/**
 * Template Service for PDF Generation
 * Fetches and formats template data from database for PDF generation
 */

import { apiClient } from '@/lib/apiConfig';

/**
 * Fetch business branding data for template integration
 */
export const getBusinessBranding = async () => {
  try {
    const response = await apiClient('/api/branding', {
      method: 'GET'
    });

    if (response.success && response.data) {
      return {
        logoUrl: response.data.brand_assets?.find(asset => 
          asset.asset_type === 'logo' && asset.is_active
        )?.file_url || null,
        primaryColor: response.data.primary_color || '#2563eb',
        secondaryColor: response.data.secondary_color || '#64748b',
        accentColor: response.data.accent_color || '#f8fafc',
        businessName: response.data.business_name || 'Your Business'
      };
    } else {
      return getDefaultBranding();
    }
  } catch (error) {
    console.error('Error fetching business branding:', error);
    return getDefaultBranding();
  }
};

/**
 * Get default branding when none is available
 */
export const getDefaultBranding = () => {
  return {
    logoUrl: null,
    primaryColor: '#2563eb',
    secondaryColor: '#64748b',
    accentColor: '#f8fafc',
    businessName: 'Your Business'
  };
};

/**
 * Fetch template configuration for PDF generation
 */
export const getTemplateForPDF = async (templateId) => {
  try {
    if (!templateId) {
      // Return default professional template if no ID provided
      console.log('📋 No templateId provided, using default');
      return await getDefaultTemplate();
    }

    // Check if templateId is a static template type (not a UUID)
    const staticTemplateTypes = ['professional', 'minimal', 'modern', 'classic'];
    if (staticTemplateTypes.includes(templateId)) {
      console.log('🎨 Static template type detected:', templateId);
      // Return a simplified template config for static templates
      return {
        id: templateId,
        name: templateId.charAt(0).toUpperCase() + templateId.slice(1),
        type: templateId,
        isSystem: true,
        isStatic: true // Flag to indicate this is a static template
      };
    }

    // Only try to fetch from API if it looks like a UUID
    if (templateId.length > 10 && templateId.includes('-')) {
      console.log('🆔 UUID template detected, fetching from API:', templateId);
      
      const response = await apiClient(`/api/templates/${templateId}`, {
        method: 'GET'
      });

      if (response.success && response.data) {
        return await formatTemplateForPDF(response.data);
      } else {
        console.warn(`❌ Template ${templateId} not found in database, using default`);
        return await getDefaultTemplate();
      }
    } else {
      console.warn(`⚠️ Invalid template ID format: ${templateId}, using default`);
      return await getDefaultTemplate();
    }
  } catch (error) {
    console.error('❌ Error fetching template:', error);
    return await getDefaultTemplate();
  }
};

/**
 * Get user's default template for PDF generation
 */
export const getUserDefaultTemplate = async () => {
  try {
    const response = await apiClient('/api/templates?includeSystem=true&sortBy=is_default&sortOrder=desc&limit=1', {
      method: 'GET'
    });

    if (response.success && response.data?.templates?.length > 0) {
      const defaultTemplate = response.data.templates[0];
      return await formatTemplateForPDF(defaultTemplate);
    } else {
      return await getDefaultTemplate();
    }
  } catch (error) {
    console.error('Error fetching default template:', error);
    return await getDefaultTemplate();
  }
};

/**
 * Format database template data for PDF generation with branding integration
 */
export const formatTemplateForPDF = async (dbTemplate, includeBranding = true) => {
  // Extract template data with fallbacks
  const templateData = dbTemplate.template_data || {};
  
  // Get business branding if requested
  let branding = getDefaultBranding();
  if (includeBranding) {
    try {
      branding = await getBusinessBranding();
    } catch (error) {
      console.warn('Failed to load branding, using defaults:', error);
    }
  }
  
  return {
    id: dbTemplate.id,
    name: dbTemplate.template_name,
    type: dbTemplate.template_type || 'custom',
    isSystem: dbTemplate.is_system_template || false,
    colors: {
      // Use branding colors as base, allow template overrides
      primary: templateData.colors?.primary || branding.primaryColor,
      secondary: templateData.colors?.secondary || branding.secondaryColor,
      text: templateData.colors?.text || '#1f2937',
      accent: templateData.colors?.accent || branding.accentColor
    },
    fonts: {
      heading: {
        family: templateData.fonts?.heading?.family || 'Arial, sans-serif',
        size: templateData.fonts?.heading?.size || 24,
        weight: templateData.fonts?.heading?.weight || 'bold',
        lineHeight: templateData.fonts?.heading?.lineHeight || 1.2,
        letterSpacing: templateData.fonts?.heading?.letterSpacing || 0,
        textTransform: templateData.fonts?.heading?.textTransform || 'none'
      },
      subheading: {
        family: templateData.fonts?.subheading?.family || 'Arial, sans-serif',
        size: templateData.fonts?.subheading?.size || 12,
        weight: templateData.fonts?.subheading?.weight || 'bold',
        lineHeight: templateData.fonts?.subheading?.lineHeight || 1.3,
        letterSpacing: templateData.fonts?.subheading?.letterSpacing || 0,
        textTransform: templateData.fonts?.subheading?.textTransform || 'none'
      },
      body: {
        family: templateData.fonts?.body?.family || 'Arial, sans-serif',
        size: templateData.fonts?.body?.size || 10,
        weight: templateData.fonts?.body?.weight || 'normal',
        lineHeight: templateData.fonts?.body?.lineHeight || 1.4,
        letterSpacing: templateData.fonts?.body?.letterSpacing || 0,
        textTransform: templateData.fonts?.body?.textTransform || 'none'
      },
      small: {
        family: templateData.fonts?.small?.family || 'Arial, sans-serif',
        size: templateData.fonts?.small?.size || 8,
        weight: templateData.fonts?.small?.weight || 'normal',
        lineHeight: templateData.fonts?.small?.lineHeight || 1.3,
        letterSpacing: templateData.fonts?.small?.letterSpacing || 0,
        textTransform: templateData.fonts?.small?.textTransform || 'none'
      }
    },
    layout: {
      headerHeight: templateData.layout?.headerHeight || 40,
      marginX: templateData.layout?.marginX || 20,
      marginY: templateData.layout?.marginY || 20
    },
    // Business branding integration
    branding: {
      logoUrl: templateData.branding?.logoUrl || branding.logoUrl,
      showLogo: templateData.branding?.showLogo !== false,
      businessName: branding.businessName
    }
  };
};

/**
 * Get default template configuration with branding integration
 */
export const getDefaultTemplate = async () => {
  const branding = await getBusinessBranding();
  
  return {
    id: 'professional', // Use 'professional' as the fallback ID for static templates
    name: 'Professional',
    type: 'professional',
    isSystem: true,
    colors: {
      primary: branding.primaryColor,
      secondary: branding.secondaryColor, 
      text: '#1f2937',
      accent: branding.accentColor
    },
    fonts: {
      heading: {
        family: 'Arial, sans-serif',
        size: 24,
        weight: 'bold',
        lineHeight: 1.2,
        letterSpacing: 0,
        textTransform: 'none'
      },
      subheading: {
        family: 'Arial, sans-serif',
        size: 12,
        weight: 'bold',
        lineHeight: 1.3,
        letterSpacing: 0,
        textTransform: 'none'
      },
      body: {
        family: 'Arial, sans-serif',
        size: 10,
        weight: 'normal',
        lineHeight: 1.4,
        letterSpacing: 0,
        textTransform: 'none'
      },
      small: {
        family: 'Arial, sans-serif',
        size: 8,
        weight: 'normal',
        lineHeight: 1.3,
        letterSpacing: 0,
        textTransform: 'none'
      }
    },
    layout: {
      headerHeight: 40,
      marginX: 20,
      marginY: 20
    },
    branding: {
      logoUrl: branding.logoUrl,
      showLogo: true,
      businessName: branding.businessName
    }
  };
};

/**
 * Get all available templates for selection
 */
export const getAvailableTemplates = async () => {
  try {
    const response = await apiClient('/api/templates?includeSystem=true', {
      method: 'GET'
    });

    if (response.success && response.data?.templates) {
      return response.data.templates.map(template => ({
        id: template.id,
        name: template.template_name,
        type: template.template_type,
        description: template.description,
        isDefault: template.is_default,
        isSystem: template.is_system_template,
        preview: `Preview for ${template.template_name}`
      }));
    } else {
      return []; 
    }
  } catch (error) {
    console.error('Error fetching available templates:', error);
    return [];
  }
};

/**
 * Update template usage when generating PDF
 */
export const recordTemplateUsage = async (templateId) => {
  try {
    if (!templateId || templateId === 'default' || templateId === 'professional' || templateId === 'minimal' || templateId === 'modern' || templateId === 'classic') {
      return; // Don't track usage for static template fallbacks
    }

    await apiClient(`/api/templates/${templateId}/use`, {
      method: 'POST',
      body: JSON.stringify({})
    });
  } catch (error) {
    // Silently handle usage tracking errors
    console.warn('Failed to record template usage:', error);
  }
};

export default {
  getTemplateForPDF,
  getUserDefaultTemplate,
  formatTemplateForPDF,
  getDefaultTemplate,
  getAvailableTemplates,
  recordTemplateUsage,
  getBusinessBranding,
  getDefaultBranding
};