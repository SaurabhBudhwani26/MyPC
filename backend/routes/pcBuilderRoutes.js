const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');

// Controllers
const PCBuilderController = require('../controllers/pcBuilderController');
const ComponentController = require('../controllers/componentController');

// Middleware
const { authenticate, optionalAuth } = require('../middleware/auth');
const {
  validatePCBuildCreation,
  validatePCBuildUpdate,
  validateComponentAddition,
  validateObjectIdParam,
  validateQuery
} = require('../middleware/validation');

// Rate limiting
const builderRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Max 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests for PC builder API, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Apply rate limiting to all routes in this router
router.use(builderRateLimit);

// =======================
// PC BUILD ROUTES
// =======================

/**
 * @route   POST /api/pc-builder/builds
 * @desc    Create a new PC build
 * @access  Private
 */
router.post('/builds',
  authenticate,
  validatePCBuildCreation,
  PCBuilderController.createBuild
);

/**
 * @route   GET /api/pc-builder/builds
 * @desc    Get user's PC builds
 * @access  Private
 */
router.get('/builds',
  authenticate,
  validateQuery,
  PCBuilderController.getUserBuilds
);

/**
 * @route   GET /api/pc-builder/builds/public
 * @desc    Get public/community PC builds
 * @access  Public
 */
router.get('/builds/public',
  optionalAuth,
  validateQuery,
  PCBuilderController.getPublicBuilds
);

/**
 * @route   GET /api/pc-builder/builds/:buildId
 * @desc    Get a specific PC build
 * @access  Private (owner) or Public (if build is public)
 */
router.get('/builds/:buildId',
  authenticate,
  validateObjectIdParam('buildId'),
  PCBuilderController.getBuild
);

/**
 * @route   PUT /api/pc-builder/builds/:buildId
 * @desc    Update PC build
 * @access  Private (owner only)
 */
router.put('/builds/:buildId',
  authenticate,
  validateObjectIdParam('buildId'),
  validatePCBuildUpdate,
  PCBuilderController.updateBuild
);

/**
 * @route   DELETE /api/pc-builder/builds/:buildId
 * @desc    Delete PC build
 * @access  Private (owner only)
 */
router.delete('/builds/:buildId',
  authenticate,
  validateObjectIdParam('buildId'),
  PCBuilderController.deleteBuild
);

/**
 * @route   POST /api/pc-builder/builds/:buildId/components
 * @desc    Add component to PC build
 * @access  Private (owner only)
 */
router.post('/builds/:buildId/components',
  authenticate,
  validateObjectIdParam('buildId'),
  validateComponentAddition,
  PCBuilderController.addComponent
);

/**
 * @route   DELETE /api/pc-builder/builds/:buildId/components/:category
 * @desc    Remove component from PC build
 * @access  Private (owner only)
 */
router.delete('/builds/:buildId/components/:category',
  authenticate,
  validateObjectIdParam('buildId'),
  PCBuilderController.removeComponent
);

// =======================
// COMPONENT ROUTES
// =======================

/**
 * @route   GET /api/pc-builder/components/categories
 * @desc    Get component categories with counts
 * @access  Public
 */
router.get('/components/categories',
  ComponentController.getCategories
);

/**
 * @route   GET /api/pc-builder/components/search
 * @desc    Search components across all categories
 * @access  Public
 */
router.get('/components/search',
  validateQuery,
  ComponentController.searchComponents
);

/**
 * @route   GET /api/pc-builder/components/deals
 * @desc    Get component deals and discounted items
 * @access  Public
 */
router.get('/components/deals',
  validateQuery,
  ComponentController.getDeals
);

/**
 * @route   GET /api/pc-builder/components/trending
 * @desc    Get trending/popular components
 * @access  Public
 */
router.get('/components/trending',
  validateQuery,
  ComponentController.getTrendingComponents
);

/**
 * @route   GET /api/pc-builder/components/:category
 * @desc    Get components by category with filtering
 * @access  Public
 */
router.get('/components/:category',
  validateQuery,
  ComponentController.getComponents
);

/**
 * @route   GET /api/pc-builder/components/:category/:componentId
 * @desc    Get a specific component
 * @access  Public
 */
router.get('/components/:category/:componentId',
  validateObjectIdParam('componentId'),
  ComponentController.getComponent
);

/**
 * @route   GET /api/pc-builder/components/:category/:componentId/recommendations
 * @desc    Get component recommendations
 * @access  Public
 */
router.get('/components/:category/:componentId/recommendations',
  validateObjectIdParam('componentId'),
  validateQuery,
  ComponentController.getRecommendations
);

/**
 * @route   POST /api/pc-builder/components/:componentId/wishlist
 * @desc    Add component to user's wishlist
 * @access  Private
 */
router.post('/components/:componentId/wishlist',
  authenticate,
  validateObjectIdParam('componentId'),
  ComponentController.addToWishlist
);

/**
 * @route   DELETE /api/pc-builder/components/:componentId/wishlist
 * @desc    Remove component from user's wishlist
 * @access  Private
 */
router.delete('/components/:componentId/wishlist',
  authenticate,
  validateObjectIdParam('componentId'),
  ComponentController.removeFromWishlist
);

/**
 * @route   GET /api/pc-builder/wishlist
 * @desc    Get user's wishlist
 * @access  Private
 */
router.get('/wishlist',
  authenticate,
  validateQuery,
  ComponentController.getWishlist
);

/**
 * @route   POST /api/pc-builder/components/:componentId/price-alert
 * @desc    Set price alert for wishlist item
 * @access  Private
 */
router.post('/components/:componentId/price-alert',
  authenticate,
  validateObjectIdParam('componentId'),
  ComponentController.setPriceAlert
);

/**
 * @route   POST /api/pc-builder/compatibility
 * @desc    Check compatibility of components
 * @access  Private
 */
router.post('/compatibility',
  authenticate,
  ComponentController.checkCompatibility
);

// =======================
// UTILITY ROUTES
// =======================

/**
 * @route   GET /api/pc-builder/health
 * @desc    Health check for PC Builder API
 * @access  Public
 */
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'PC Builder API is healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

module.exports = router;
