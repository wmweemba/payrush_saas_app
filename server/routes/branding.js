/**
 * Business Branding Routes
 * 
 * Express routes for business branding and asset management operations
 */

const express = require('express');
const multer = require('multer');
const router = express.Router();
const brandingService = require('../services/brandingService');
const { createApiResponse, createErrorResponse } = require('../utils');

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 1
  },
  fileFilter: (req, file, cb) => {
    // Basic file type validation
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/svg+xml', 'image/x-icon', 'image/vnd.microsoft.icon'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images are allowed.'), false);
    }
  }
});

/**
 * GET /api/branding
 * Get business branding for the authenticated user
 */
router.get('/', async (req, res, next) => {
  try {
    const userId = req.userId; // From auth middleware

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
 * Create or update business branding
 */
router.put('/', async (req, res, next) => {
  try {
    const userId = req.userId;
    const brandingData = req.body;

    // Validate color scheme if colors are provided
    if (brandingData.primary_color || brandingData.secondary_color || 
        brandingData.accent_color || brandingData.text_color || brandingData.background_color) {
      
      const colorValidation = brandingService.validateColorScheme(brandingData);
      if (!colorValidation.valid) {
        return res.status(400).json(
          createErrorResponse(colorValidation.error, 400)
        );
      }
    }

    const result = await brandingService.saveBranding(userId, brandingData);

    if (!result.success) {
      return res.status(result.statusCode || 500).json(
        createErrorResponse(result.error, result.statusCode || 500)
      );
    }

    res.json(createApiResponse(true, result.data, 'Branding saved successfully'));
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/branding/upload/:assetType
 * Upload a branding asset (logo, favicon, watermark)
 */
router.post('/upload/:assetType', upload.single('file'), async (req, res, next) => {
  try {
    const userId = req.userId;
    const assetType = req.params.assetType;
    const file = req.file;

    // Validate asset type
    const validAssetTypes = ['logo', 'favicon', 'watermark'];
    if (!validAssetTypes.includes(assetType)) {
      return res.status(400).json(
        createErrorResponse('Invalid asset type. Allowed types: logo, favicon, watermark', 400)
      );
    }

    if (!file) {
      return res.status(400).json(
        createErrorResponse('No file provided', 400)
      );
    }

    const result = await brandingService.uploadAsset(userId, file, assetType);

    if (!result.success) {
      return res.status(result.statusCode || 500).json(
        createErrorResponse(result.error, result.statusCode || 500)
      );
    }

    res.status(201).json(createApiResponse(true, result.data, 'Asset uploaded successfully'));
  } catch (error) {
    if (error instanceof multer.MulterError) {
      if (error.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json(
          createErrorResponse('File size too large. Maximum size is 5MB', 400)
        );
      }
      if (error.code === 'LIMIT_FILE_COUNT') {
        return res.status(400).json(
          createErrorResponse('Too many files. Only one file allowed', 400)
        );
      }
    }
    next(error);
  }
});

/**
 * PUT /api/branding/logo
 * Update logo in branding settings
 */
router.put('/logo', async (req, res, next) => {
  try {
    const userId = req.userId;
    const { logoUrl, logoWidth, logoHeight } = req.body;

    if (!logoUrl) {
      return res.status(400).json(
        createErrorResponse('Logo URL is required', 400)
      );
    }

    const result = await brandingService.updateLogo(userId, logoUrl, logoWidth, logoHeight);

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
 * DELETE /api/branding/logo
 * Remove logo from branding settings
 */
router.delete('/logo', async (req, res, next) => {
  try {
    const userId = req.userId;

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

/**
 * GET /api/branding/assets
 * Get all assets for the authenticated user
 */
router.get('/assets', async (req, res, next) => {
  try {
    const userId = req.userId;

    const result = await brandingService.getUserAssets(userId);

    if (!result.success) {
      return res.status(result.statusCode || 500).json(
        createErrorResponse(result.error, result.statusCode || 500)
      );
    }

    res.json(createApiResponse(true, result.data, 'Assets retrieved successfully'));
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/branding/assets/:filename
 * Delete a specific asset
 */
router.delete('/assets/:filename', async (req, res, next) => {
  try {
    const userId = req.userId;
    const filename = req.params.filename;

    if (!filename) {
      return res.status(400).json(
        createErrorResponse('Filename is required', 400)
      );
    }

    const result = await brandingService.deleteAsset(userId, filename);

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
 * POST /api/branding/upload-and-set-logo
 * Upload a logo and immediately set it in branding (combined operation)
 */
router.post('/upload-and-set-logo', upload.single('logo'), async (req, res, next) => {
  try {
    const userId = req.userId;
    const file = req.file;
    const logoWidth = req.body.logoWidth ? parseInt(req.body.logoWidth) : 150;
    const logoHeight = req.body.logoHeight ? parseInt(req.body.logoHeight) : 75;

    if (!file) {
      return res.status(400).json(
        createErrorResponse('No logo file provided', 400)
      );
    }

    // Upload the asset
    const uploadResult = await brandingService.uploadAsset(userId, file, 'logo');
    if (!uploadResult.success) {
      return res.status(uploadResult.statusCode || 500).json(
        createErrorResponse(uploadResult.error, uploadResult.statusCode || 500)
      );
    }

    // Set as logo in branding
    const updateResult = await brandingService.updateLogo(userId, uploadResult.data.url, logoWidth, logoHeight);
    if (!updateResult.success) {
      // If setting logo fails, try to clean up uploaded file
      await brandingService.deleteAsset(userId, uploadResult.data.filename);
      return res.status(updateResult.statusCode || 500).json(
        createErrorResponse(updateResult.error, updateResult.statusCode || 500)
      );
    }

    res.status(201).json(createApiResponse(true, {
      ...updateResult.data,
      uploadedAsset: uploadResult.data
    }, 'Logo uploaded and set successfully'));
  } catch (error) {
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
 * POST /api/branding/validate-colors
 * Validate a color scheme
 */
router.post('/validate-colors', async (req, res, next) => {
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
 * POST /api/branding/initialize-storage
 * Initialize storage bucket (admin/setup endpoint)
 */
router.post('/initialize-storage', async (req, res, next) => {
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

module.exports = router;