const { validationResult } = require('express-validator');
const Component = require('../models/Component');
const PCBuild = require('../models/PCBuild');
const User = require('../models/User');

class ComponentController {
  
  /**
   * Get components by category with filtering and pagination
   */
  static async getComponents(req, res) {
    try {
      const { category } = req.params;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const skip = (page - 1) * limit;
      
      // Build search query
      let query = { category };
      
      // Price range filtering
      if (req.query.minPrice || req.query.maxPrice) {
        query['offers.0.price'] = {};
        if (req.query.minPrice) {
          query['offers.0.price'].$gte = parseFloat(req.query.minPrice);
        }
        if (req.query.maxPrice) {
          query['offers.0.price'].$lte = parseFloat(req.query.maxPrice);
        }
      }
      
      // Brand filtering
      if (req.query.brand) {
        query.brand = new RegExp(req.query.brand, 'i');
      }
      
      // Search by name or model
      if (req.query.search) {
        query.$or = [
          { name: new RegExp(req.query.search, 'i') },
          { model: new RegExp(req.query.search, 'i') }
        ];
      }
      
      // Rating filtering
      if (req.query.minRating) {
        query['rating.average'] = { $gte: parseFloat(req.query.minRating) };
      }
      
      // Availability filtering
      if (req.query.available === 'true') {
        query['offers'] = { $elemMatch: { inStock: true } };
      }
      
      // Build sort criteria
      let sort = {};
      switch (req.query.sortBy) {
        case 'price':
          sort = { 'offers.0.price': req.query.sortOrder === 'desc' ? -1 : 1 };
          break;
        case 'rating':
          sort = { 'rating.average': req.query.sortOrder === 'desc' ? -1 : 1 };
          break;
        case 'popularity':
          sort = { popularity: -1 };
          break;
        default:
          sort = { createdAt: -1 };
      }
      
      const components = await Component.find(query)
        .sort(sort)
        .skip(skip)
        .limit(limit);
      
      const total = await Component.countDocuments(query);
      
      res.status(200).json({
        success: true,
        message: 'Components retrieved successfully',
        data: {
          components,
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit)
          },
          filters: {
            category,
            priceRange: req.query.minPrice || req.query.maxPrice ? 
              { min: req.query.minPrice, max: req.query.maxPrice } : null,
            brand: req.query.brand,
            search: req.query.search,
            minRating: req.query.minRating,
            sortBy: req.query.sortBy || 'latest'
          }
        }
      });
      
    } catch (error) {
      console.error('Get components error:', error);
      
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve components',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
  
  /**
   * Get a specific component by ID
   */
  static async getComponent(req, res) {
    try {
      const { componentId } = req.params;
      
      const component = await Component.findById(componentId);
      
      if (!component) {
        return res.status(404).json({
          success: false,
          message: 'Component not found'
        });
      }
      
      // Increment view count
      component.views += 1;
      await component.save();
      
      res.status(200).json({
        success: true,
        message: 'Component retrieved successfully',
        data: {
          component: component.toJSON()
        }
      });
      
    } catch (error) {
      console.error('Get component error:', error);
      
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve component',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
  
  /**
   * Search components across all categories
   */
  static async searchComponents(req, res) {
    try {
      const { query } = req.query;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const skip = (page - 1) * limit;
      
      if (!query || query.trim().length < 2) {
        return res.status(400).json({
          success: false,
          message: 'Search query must be at least 2 characters long'
        });
      }
      
      const searchQuery = {
        $or: [
          { name: new RegExp(query, 'i') },
          { model: new RegExp(query, 'i') },
          { brand: new RegExp(query, 'i') },
          { 'specifications.chipset': new RegExp(query, 'i') },
          { 'specifications.socket': new RegExp(query, 'i') }
        ]
      };
      
      const components = await Component.find(searchQuery)
        .sort({ popularity: -1, 'rating.average': -1 })
        .skip(skip)
        .limit(limit);
      
      const total = await Component.countDocuments(searchQuery);
      
      res.status(200).json({
        success: true,
        message: 'Search completed successfully',
        data: {
          components,
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit)
          },
          query
        }
      });
      
    } catch (error) {
      console.error('Search components error:', error);
      
      res.status(500).json({
        success: false,
        message: 'Failed to search components',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
  
  /**
   * Get component categories with counts
   */
  static async getCategories(req, res) {
    try {
      const categories = await Component.aggregate([
        {
          $group: {
            _id: '$category',
            count: { $sum: 1 },
            avgPrice: { $avg: { $arrayElemAt: ['$offers.price', 0] } },
            brands: { $addToSet: '$brand' }
          }
        },
        {
          $sort: { count: -1 }
        }
      ]);
      
      res.status(200).json({
        success: true,
        message: 'Categories retrieved successfully',
        data: {
          categories
        }
      });
      
    } catch (error) {
      console.error('Get categories error:', error);
      
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve categories',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
  
  /**
   * Get component deals and discounted items
   */
  static async getDeals(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const skip = (page - 1) * limit;
      
      // Find components with offers that have discounts
      const deals = await Component.find({
        'offers': {
          $elemMatch: {
            'discount': { $gt: 0 },
            'inStock': true
          }
        }
      })
      .sort({ 'offers.0.discount': -1, popularity: -1 })
      .skip(skip)
      .limit(limit);
      
      const total = await Component.countDocuments({
        'offers': {
          $elemMatch: {
            'discount': { $gt: 0 },
            'inStock': true
          }
        }
      });
      
      res.status(200).json({
        success: true,
        message: 'Deals retrieved successfully',
        data: {
          deals,
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit)
          }
        }
      });
      
    } catch (error) {
      console.error('Get deals error:', error);
      
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve deals',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
  
  /**
   * Get trending/popular components
   */
  static async getTrendingComponents(req, res) {
    try {
      const limit = parseInt(req.query.limit) || 10;
      const category = req.query.category;
      
      let query = {};
      if (category) {
        query.category = category;
      }
      
      const trending = await Component.find(query)
        .sort({ popularity: -1, views: -1, 'rating.average': -1 })
        .limit(limit);
      
      res.status(200).json({
        success: true,
        message: 'Trending components retrieved successfully',
        data: {
          trending
        }
      });
      
    } catch (error) {
      console.error('Get trending components error:', error);
      
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve trending components',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
  
  /**
   * Get component recommendations based on selected component
   */
  static async getRecommendations(req, res) {
    try {
      const { componentId } = req.params;
      const limit = parseInt(req.query.limit) || 5;
      
      const component = await Component.findById(componentId);
      
      if (!component) {
        return res.status(404).json({
          success: false,
          message: 'Component not found'
        });
      }
      
      // Get recommendations from the same category, similar price range
      const priceRange = component.offers[0]?.price || 0;
      const minPrice = priceRange * 0.7;  // 30% lower
      const maxPrice = priceRange * 1.3;  // 30% higher
      
      const recommendations = await Component.find({
        _id: { $ne: componentId },
        category: component.category,
        'offers.0.price': { $gte: minPrice, $lte: maxPrice },
        'rating.average': { $gte: 3.5 }
      })
      .sort({ 'rating.average': -1, popularity: -1 })
      .limit(limit);
      
      res.status(200).json({
        success: true,
        message: 'Recommendations retrieved successfully',
        data: {
          recommendations,
          baseComponent: {
            id: component._id,
            name: component.name,
            category: component.category,
            price: component.offers[0]?.price
          }
        }
      });
      
    } catch (error) {
      console.error('Get recommendations error:', error);
      
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve recommendations',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
  
  /**
   * Add component to user's wishlist
   */
  static async addToWishlist(req, res) {
    try {
      const { componentId } = req.params;
      const userId = req.user._id;
      
      const component = await Component.findById(componentId);
      
      if (!component) {
        return res.status(404).json({
          success: false,
          message: 'Component not found'
        });
      }
      
      // Get current best price for the component
      const bestOffer = component.bestOffer;
      const priceWhenAdded = bestOffer ? bestOffer.price : null;
      
      // Add to user's wishlist
      const user = req.user;
      await user.addToWishlist(componentId, priceWhenAdded);
      
      console.log(`✅ Component added to wishlist: ${component.name} by ${user.email}`);
      
      res.status(200).json({
        success: true,
        message: 'Component added to wishlist',
        data: {
          componentId,
          componentName: component.name,
          priceWhenAdded,
          wishlistCount: user.stats.wishlistItems + 1
        }
      });
      
    } catch (error) {
      console.error('Add to wishlist error:', error);
      
      let statusCode = 500;
      let message = 'Failed to add component to wishlist';
      
      if (error.message === 'Component already in wishlist') {
        statusCode = 409;
        message = 'Component is already in your wishlist';
      }
      
      res.status(statusCode).json({
        success: false,
        message,
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
  
  /**
   * Remove component from user's wishlist
   */
  static async removeFromWishlist(req, res) {
    try {
      const { componentId } = req.params;
      const user = req.user;
      
      if (!user.isInWishlist(componentId)) {
        return res.status(404).json({
          success: false,
          message: 'Component not found in wishlist'
        });
      }
      
      await user.removeFromWishlist(componentId);
      
      console.log(`🗑️ Component removed from wishlist: ${componentId} by ${user.email}`);
      
      res.status(200).json({
        success: true,
        message: 'Component removed from wishlist',
        data: {
          componentId,
          wishlistCount: user.stats.wishlistItems - 1
        }
      });
      
    } catch (error) {
      console.error('Remove from wishlist error:', error);
      
      res.status(500).json({
        success: false,
        message: 'Failed to remove component from wishlist',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
  
  /**
   * Get user's wishlist
   */
  static async getWishlist(req, res) {
    try {
      const user = req.user;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const skip = (page - 1) * limit;
      
      // Get wishlist with populated component data
      const userWithWishlist = await User.findById(user._id)
        .populate({
          path: 'wishlist.componentId',
          model: 'Component',
          select: 'name brand category imageUrl offers rating availability'
        })
        .select('wishlist');
      
      if (!userWithWishlist) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }
      
      // Sort and paginate wishlist
      const sortedWishlist = userWithWishlist.wishlist.sort((a, b) => 
        new Date(b.addedAt) - new Date(a.addedAt)
      );
      
      const paginatedWishlist = sortedWishlist.slice(skip, skip + limit);
      const total = userWithWishlist.wishlist.length;
      
      // Add price comparison info
      const wishlistWithPriceInfo = paginatedWishlist.map(item => {
        if (item.componentId) {
          const currentBestPrice = item.componentId.bestOffer?.price || null;
          const priceDifference = item.priceWhenAdded && currentBestPrice 
            ? currentBestPrice - item.priceWhenAdded 
            : null;
          
          return {
            ...item.toJSON(),
            currentBestPrice,
            priceDifference,
            priceStatus: priceDifference < 0 ? 'decreased' : 
                        priceDifference > 0 ? 'increased' : 'unchanged'
          };
        }
        return item;
      });
      
      res.status(200).json({
        success: true,
        message: 'Wishlist retrieved successfully',
        data: {
          wishlist: wishlistWithPriceInfo,
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit)
          }
        }
      });
      
    } catch (error) {
      console.error('Get wishlist error:', error);
      
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve wishlist',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
  
  /**
   * Set price alert for wishlist item
   */
  static async setPriceAlert(req, res) {
    try {
      const { componentId } = req.params;
      const { targetPrice } = req.body;
      const user = req.user;
      
      if (!targetPrice || targetPrice <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Valid target price is required'
        });
      }
      
      if (!user.isInWishlist(componentId)) {
        return res.status(404).json({
          success: false,
          message: 'Component not found in wishlist'
        });
      }
      
      await user.setPriceAlert(componentId, targetPrice);
      
      console.log(`🔔 Price alert set: ${componentId} at ₹${targetPrice} by ${user.email}`);
      
      res.status(200).json({
        success: true,
        message: 'Price alert set successfully',
        data: {
          componentId,
          targetPrice
        }
      });
      
    } catch (error) {
      console.error('Set price alert error:', error);
      
      let statusCode = 500;
      let message = 'Failed to set price alert';
      
      if (error.message === 'Component not found in wishlist') {
        statusCode = 404;
        message = error.message;
      }
      
      res.status(statusCode).json({
        success: false,
        message,
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
  
  /**
   * Get compatibility check for components
   */
  static async checkCompatibility(req, res) {
    try {
      const { components } = req.body;
      
      if (!components || Object.keys(components).length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Components data required for compatibility check'
        });
      }
      
      // Create a temporary build to check compatibility
      const tempBuild = new PCBuild({
        name: 'Compatibility Check',
        user: req.user._id,
        components
      });
      
      await tempBuild.checkCompatibility();
      
      res.status(200).json({
        success: true,
        message: 'Compatibility check completed',
        data: {
          compatibility: tempBuild.compatibility,
          totalPrice: tempBuild.totalPrice,
          estimatedWattage: tempBuild.estimatedWattage
        }
      });
      
    } catch (error) {
      console.error('Compatibility check error:', error);
      
      res.status(500).json({
        success: false,
        message: 'Failed to check compatibility',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
}

module.exports = ComponentController;
