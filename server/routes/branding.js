/**
 * Enhanced Business Branding Routes
 * 
 * Express routes for comprehensive business branding and asset management operations
 * Updated to support new database schema with brand_assets table and enhanced functionality
 */

const express = require('express');
const multer = require('multer');
const router = express.Router();
const brandingService = require('../services/brandingService');
const auth = require('../middleware/auth');
const { createApiResponse, createErrorResponse } = require('../utils');

// Configure multer for file uploads with enhanced settings
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 1
  },
  fileFilter: (req, file, cb) => {
    // Enhanced file type validation
    const allowedTypes = [
      'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 
      'image/svg+xml', 'image/webp', 'image/x-icon', 'image/vnd.microsoft.icon'
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only image files are allowed.'), false);
    }
  }
});

/**
 * GET /api/branding
 * Get comprehensive business branding including assets
 */
router.get('/', auth, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const result = await brandingService.getBranding(userId);

    if (!result.success) {
      return res.status(result.statusCode || 500).json(
        createErrorResponse(result.error, result.statusCode || 500)
      );
    }

    res.json(createApiResponse(true, result.data, 'Branding retrieved successfully'));
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/branding
 * Update business branding information
 */
router.put('/', auth, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const brandingData = req.body;

    const result = await brandingService.saveBranding(userId, brandingData);

    if (!result.success) {
      return res.status(result.statusCode || 500).json(
        createErrorResponse(result.error, result.statusCode || 500)
      );
    }

    res.json(createApiResponse(true, result.data, 'Branding updated successfully'));
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/branding/upload
 * Upload brand asset with enhanced metadata support
 */
router.post('/upload', auth, upload.single('asset'), async (req, res, next) => {
  try {
    console.log('=== ASSET UPLOAD REQUEST ===');
    console.log('User ID:', req.user.id);
    console.log('File received:', req.file ? {
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      buffer: req.file.buffer ? 'Buffer present' : 'No buffer'
    } : 'No file');
    console.log('Request body:', req.body);
    
    const userId = req.user.id;
    const file = req.file;
    const { assetType, name, description, altText, width, height, usageContext } = req.body;

    // Validate required fields
    if (!file) {
      console.log('❌ Validation failed: No file provided');
      return res.status(400).json(
        createErrorResponse('No file provided', 400)
      );
    }

    if (!assetType) {
      console.log('❌ Validation failed: No asset type provided');
      return res.status(400).json(
        createErrorResponse('Asset type is required', 400)
      );
    }

    // Validate asset type
    const validAssetTypes = ['logo', 'favicon', 'letterhead', 'signature', 'background'];
    if (!validAssetTypes.includes(assetType)) {
      console.log('❌ Validation failed: Invalid asset type:', assetType);
      return res.status(400).json(
        createErrorResponse(`Invalid asset type. Allowed types: ${validAssetTypes.join(', ')}`, 400)
      );
    }

    console.log('✅ Validation passed, preparing metadata...');
    
    // Prepare metadata
    const metadata = {
      name: name || file.originalname,
      description: description || '',
      altText: altText || '',
      width: width ? parseInt(width) : null,
      height: height ? parseInt(height) : null,
      usageContext: usageContext ? JSON.parse(usageContext) : {}
    };

    console.log('📝 Metadata prepared:', metadata);
    console.log('🚀 Calling brandingService.uploadAsset...');

    const result = await brandingService.uploadAsset(userId, file, assetType, metadata);

    console.log('📥 Upload service result:', result);

    if (!result.success) {
      console.log('❌ Upload service failed:', result.error);
      return res.status(result.statusCode || 500).json(
        createErrorResponse(result.error, result.statusCode || 500)
      );
    }

    console.log('✅ Upload successful, sending response...');
    res.status(201).json(createApiResponse(true, result.data, 'Asset uploaded successfully'));
  } catch (error) {
    console.error('💥 Upload route error:', error);
    if (error instanceof multer.MulterError) {
      if (error.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json(
          createErrorResponse('File size too large. Maximum size is 5MB', 400)
        );
      }
    }
    next(error);
  }
});

/**
 * GET /api/branding/assets
 * Get brand assets with optional filtering
 */
router.get('/assets', auth, async (req, res, next) => {
  try {
    console.log('=== GET ASSETS REQUEST ===');
    console.log('User ID:', req.user.id);
    console.log('Query params:', req.query);
    
    const userId = req.user.id;
    const { assetType } = req.query;

    const result = await brandingService.getBrandAssets(userId, assetType);
    console.log('📥 Assets service result:', result);

    if (!result.success) {
      console.log('❌ Assets service failed:', result.error);
      return res.status(result.statusCode || 500).json(
        createErrorResponse(result.error, result.statusCode || 500)
      );
    }

    console.log('✅ Sending assets response, count:', result.data?.length || 0);
    res.json(createApiResponse(true, result.data, 'Assets retrieved successfully'));
  } catch (error) {
    console.error('💥 Get assets route error:', error);
    next(error);
  }
});

/**
 * DELETE /api/branding/assets/:assetId
 * Delete a brand asset by ID
 */
router.delete('/assets/:assetId', auth, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { assetId } = req.params;

    if (!assetId) {
      return res.status(400).json(
        createErrorResponse('Asset ID is required', 400)
      );
    }

    const result = await brandingService.deleteAsset(userId, assetId);

    if (!result.success) {
      return res.status(result.statusCode || 500).json(
        createErrorResponse(result.error, result.statusCode || 500)
      );
    }

    res.json(createApiResponse(true, result.data, 'Asset deleted successfully'));
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/branding/presets
 * Create a branding preset for reuse
 */
router.post('/presets', auth, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const presetData = req.body;

    if (!presetData.name) {
      return res.status(400).json(
        createErrorResponse('Preset name is required', 400)
      );
    }

    const result = await brandingService.createBrandingPreset(userId, presetData);

    if (!result.success) {
      return res.status(result.statusCode || 500).json(
        createErrorResponse(result.error, result.statusCode || 500)
      );
    }

    res.status(201).json(createApiResponse(true, result.data, 'Branding preset created successfully'));
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/branding/stats
 * Get branding statistics and analytics
 */
router.get('/stats', auth, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const result = await brandingService.getBrandingStats(userId);

    if (!result.success) {
      return res.status(result.statusCode || 500).json(
        createErrorResponse(result.error, result.statusCode || 500)
      );
    }

    res.json(createApiResponse(true, result.data, 'Branding statistics retrieved successfully'));
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/branding/apply-to-template
 * Apply branding to template data
 */
router.post('/apply-to-template', auth, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { templateData } = req.body;

    if (!templateData) {
      return res.status(400).json(
        createErrorResponse('Template data is required', 400)
      );
    }

    // Get user's branding
    const brandingResult = await brandingService.getBranding(userId);
    if (!brandingResult.success) {
      return res.status(brandingResult.statusCode || 500).json(
        createErrorResponse(brandingResult.error, brandingResult.statusCode || 500)
      );
    }

    // Apply branding to template
    const brandedTemplate = brandingService.applyBrandingToTemplate(templateData, brandingResult.data);

    res.json(createApiResponse(true, brandedTemplate, 'Branding applied to template successfully'));
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/branding/initialize
 * Initialize default branding for a user
 */
router.post('/initialize', auth, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const result = await brandingService.initializeDefaultBranding(userId);

    if (!result.success) {
      return res.status(result.statusCode || 500).json(
        createErrorResponse(result.error, result.statusCode || 500)
      );
    }

    res.status(201).json(createApiResponse(true, result.data, 'Default branding initialized successfully'));
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/branding/validate-colors
 * Validate a color scheme
 */
router.post('/validate-colors', auth, async (req, res, next) => {
  try {
    const colors = req.body;
    const validation = brandingService.validateColorScheme(colors);

    if (!validation.valid) {
      return res.status(400).json(
        createErrorResponse(validation.error, 400)
      );
    }

    res.json(createApiResponse(true, { valid: true }, 'Color scheme is valid'));
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/branding/check-tables
 * Check if required database tables exist
 */
router.get('/check-tables', auth, async (req, res, next) => {
  try {
    const result = await brandingService.ensureBrandAssetsTable();

    if (!result.success) {
      return res.status(result.needs_migration ? 400 : 500).json(
        createErrorResponse(result.error, result.needs_migration ? 400 : 500)
      );
    }

    res.json(createApiResponse(true, { message: 'All required tables exist' }, 'Database tables verified'));
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/branding/initialize-storage
 * Initialize storage bucket for brand assets
 */
router.post('/initialize-storage', auth, async (req, res, next) => {
  try {
    const result = await brandingService.initializeStorage();

    if (!result.success) {
      return res.status(500).json(
        createErrorResponse(result.error, 500)
      );
    }

    res.json(createApiResponse(true, { message: 'Storage initialized successfully' }, 'Storage bucket ready'));
  } catch (error) {
    next(error);
  }
});

// Legacy endpoints for backward compatibility

/**
 * PUT /api/branding/logo (Legacy)
 * Update logo in branding settings
 */
router.put('/logo', auth, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { logoUrl, logoFilename, logoSize } = req.body;

    if (!logoUrl) {
      return res.status(400).json(
        createErrorResponse('Logo URL is required', 400)
      );
    }

    const result = await brandingService.updateLogo(userId, logoUrl, logoFilename, logoSize);

    if (!result.success) {
      return res.status(result.statusCode || 500).json(
        createErrorResponse(result.error, result.statusCode || 500)
      );
    }

    res.json(createApiResponse(true, result.data, 'Logo updated successfully'));
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/branding/logo (Legacy)
 * Remove logo from branding settings
 */
router.delete('/logo', auth, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const result = await brandingService.removeLogo(userId);

    if (!result.success) {
      return res.status(result.statusCode || 500).json(
        createErrorResponse(result.error, result.statusCode || 500)
      );
    }

    res.json(createApiResponse(true, result.data, 'Logo removed successfully'));
  } catch (error) {
    next(error);
  }
});

module.exports = router;