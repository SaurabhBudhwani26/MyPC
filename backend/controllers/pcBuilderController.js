const { validationResult } = require('express-validator');
const PCBuild = require('../models/PCBuild');
const Component = require('../models/Component');

class PCBuilderController {
  
  /**
   * Create a new PC build
   */
  static async createBuild(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }
      
      const { name, description, buildType, targetBudget, tags, isPublic } = req.body;
      const userId = req.user._id;
      
      const buildData = {
        name,
        description,
        user: userId,
        buildType: buildType || 'custom',
        targetBudget,
        tags: tags || [],
        isPublic: isPublic || false,
        components: {}
      };
      
      const build = new PCBuild(buildData);
      await build.save();
      
      console.log(`✅ PC build created: ${build.name} by ${req.user.email}`);
      
      res.status(201).json({
        success: true,
        message: 'PC build created successfully',
        data: {
          build: build.toJSON()
        }
      });
      
    } catch (error) {
      console.error('Create build error:', error);
      
      res.status(500).json({
        success: false,
        message: 'Failed to create PC build',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
  
  /**
   * Get user's PC builds
   */
  static async getUserBuilds(req, res) {
    try {
      const userId = req.user._id;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const skip = (page - 1) * limit;
      
      const builds = await PCBuild.find({ user: userId })
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('user', 'name avatar');
      
      const total = await PCBuild.countDocuments({ user: userId });
      
      res.status(200).json({
        success: true,
        message: 'Builds retrieved successfully',
        data: {
          builds,
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit)
          }
        }
      });
      
    } catch (error) {
      console.error('Get user builds error:', error);
      
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve builds',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
  
  /**
   * Get a specific PC build
   */
  static async getBuild(req, res) {
    try {
      const { buildId } = req.params;
      const userId = req.user._id;
      
      const build = await PCBuild.findOne({
        _id: buildId,
        $or: [
          { user: userId },
          { isPublic: true }
        ]
      }).populate('user', 'name avatar');
      
      if (!build) {
        return res.status(404).json({
          success: false,
          message: 'PC build not found or access denied'
        });
      }
      
      // Increment view count if not owner
      if (build.user._id.toString() !== userId.toString()) {
        build.views += 1;
        await build.save();
      }
      
      res.status(200).json({
        success: true,
        message: 'Build retrieved successfully',
        data: {
          build: build.toJSON()
        }
      });
      
    } catch (error) {
      console.error('Get build error:', error);
      
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve build',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
  
  /**
   * Update PC build
   */
  static async updateBuild(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }
      
      const { buildId } = req.params;
      const userId = req.user._id;
      const updates = req.body;
      
      // Find build and verify ownership
      const build = await PCBuild.findOne({ _id: buildId, user: userId });
      
      if (!build) {
        return res.status(404).json({
          success: false,
          message: 'PC build not found or access denied'
        });
      }
      
      // Update allowed fields
      const allowedUpdates = ['name', 'description', 'buildType', 'targetBudget', 'tags', 'isPublic'];
      const filteredUpdates = {};
      
      Object.keys(updates).forEach(key => {
        if (allowedUpdates.includes(key)) {
          filteredUpdates[key] = updates[key];
        }
      });
      
      // Update build
      const updatedBuild = await PCBuild.findByIdAndUpdate(
        buildId,
        filteredUpdates,
        { new: true, runValidators: true }
      );
      
      console.log(`✅ PC build updated: ${updatedBuild.name} by ${req.user.email}`);
      
      res.status(200).json({
        success: true,
        message: 'PC build updated successfully',
        data: {
          build: updatedBuild.toJSON()
        }
      });
      
    } catch (error) {
      console.error('Update build error:', error);
      
      res.status(500).json({
        success: false,
        message: 'Failed to update PC build',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
  
  /**
   * Add component to PC build
   */
  static async addComponent(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }
      
      const { buildId } = req.params;
      const { category, component } = req.body;
      const userId = req.user._id;
      
      // Find build and verify ownership
      const build = await PCBuild.findOne({ _id: buildId, user: userId });
      
      if (!build) {
        return res.status(404).json({
          success: false,
          message: 'PC build not found or access denied'
        });
      }
      
      // Convert category to match enum values (capitalize first letter)
      const categoryMapping = {
        'cpu': 'CPU',
        'gpu': 'GPU', 
        'ram': 'RAM',
        'motherboard': 'Motherboard',
        'storage': 'Storage',
        'psu': 'PSU',
        'case': 'Case',
        'cooling': 'Cooling'
      };
      
      const enumCategory = categoryMapping[category] || 'Other';
      
      // Create component with proper category enum value
      const componentData = {
        ...component,
        category: enumCategory  // Use the proper enum value
      };
      
      console.log(`📝 Adding component with data:`, {
        category: category,
        enumCategory: enumCategory,
        componentName: componentData.name
      });
      
      // Add component to build
      await build.addComponent(category, componentData);
      
      // Check compatibility after adding component
      await build.checkCompatibility();
      
      console.log(`🔧 Component added to build: ${componentData.name} in ${category} (${enumCategory}) for build ${build.name}`);
      
      res.status(200).json({
        success: true,
        message: 'Component added successfully',
        data: {
          build: build.toJSON()
        }
      });
      
    } catch (error) {
      console.error('Add component error:', error);
      
      res.status(500).json({
        success: false,
        message: 'Failed to add component',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
  
  /**
   * Remove component from PC build
   */
  static async removeComponent(req, res) {
    try {
      const { buildId, category } = req.params;
      const userId = req.user._id;
      
      // Find build and verify ownership
      const build = await PCBuild.findOne({ _id: buildId, user: userId });
      
      if (!build) {
        return res.status(404).json({
          success: false,
          message: 'PC build not found or access denied'
        });
      }
      
      // Remove component from build
      await build.removeComponent(category);
      
      // Check compatibility after removing component
      await build.checkCompatibility();
      
      console.log(`🗑️ Component removed from build: ${category} from build ${build.name}`);
      
      res.status(200).json({
        success: true,
        message: 'Component removed successfully',
        data: {
          build: build.toJSON()
        }
      });
      
    } catch (error) {
      console.error('Remove component error:', error);
      
      res.status(500).json({
        success: false,
        message: 'Failed to remove component',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
  
  /**
   * Delete PC build
   */
  static async deleteBuild(req, res) {
    try {
      const { buildId } = req.params;
      const userId = req.user._id;
      
      // Find and delete build (verify ownership)
      const build = await PCBuild.findOneAndDelete({ _id: buildId, user: userId });
      
      if (!build) {
        return res.status(404).json({
          success: false,
          message: 'PC build not found or access denied'
        });
      }
      
      console.log(`🗑️ PC build deleted: ${build.name} by ${req.user.email}`);
      
      res.status(200).json({
        success: true,
        message: 'PC build deleted successfully'
      });
      
    } catch (error) {
      console.error('Delete build error:', error);
      
      res.status(500).json({
        success: false,
        message: 'Failed to delete PC build',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
  
  /**
   * Get public builds (community builds)
   */
  static async getPublicBuilds(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const buildType = req.query.buildType;
      const skip = (page - 1) * limit;
      
      let query = { isPublic: true };
      if (buildType) {
        query.buildType = buildType;
      }
      
      const builds = await PCBuild.find(query)
        .sort({ likes: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('user', 'name avatar');
      
      const total = await PCBuild.countDocuments(query);
      
      res.status(200).json({
        success: true,
        message: 'Public builds retrieved successfully',
        data: {
          builds,
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit)
          }
        }
      });
      
    } catch (error) {
      console.error('Get public builds error:', error);
      
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve public builds',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
}

module.exports = PCBuilderController;
