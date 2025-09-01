const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const JWTUtils = require('../utils/jwt');

class AuthController {
  
  /**
   * Register a new user
   */
  static async signup(req, res) {
    try {
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }
      
      const { name, email, password, phoneNumber } = req.body;
      
      // Check if user already exists
      const existingUser = await User.findByEmail(email);
      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: 'User already exists with this email'
        });
      }
      
      // Create new user
      const userData = {
        name: name.trim(),
        email: email.toLowerCase().trim(),
        password,
        phoneNumber: phoneNumber?.trim()
      };
      
      const user = new User(userData);
      
      // Generate avatar if not provided
      if (!user.avatar) {
        user.avatar = user.generateAvatar();
      }
      
      await user.save();
      
      // Generate tokens
      const tokens = JWTUtils.generateTokenPair(user._id, {
        name: user.name,
        email: user.email,
        role: user.role
      });
      
      // Save refresh token to user
      user.refreshToken = tokens.refreshToken;
      await user.updateLoginStats();
      
      // Remove sensitive data from response
      const userResponse = user.toJSON();
      
      console.log(`✅ User registered successfully: ${user.email}`);
      
      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: {
          user: userResponse,
          tokens
        }
      });
      
    } catch (error) {
      console.error('Signup error:', error);
      
      // Handle duplicate key error
      if (error.code === 11000) {
        return res.status(409).json({
          success: false,
          message: 'User already exists with this email'
        });
      }
      
      res.status(500).json({
        success: false,
        message: 'Registration failed',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
  
  /**
   * Login user
   */
  static async login(req, res) {
    try {
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }
      
      const { email, password } = req.body;
      
      // Find user with password field
      const user = await User.findByEmail(email).select('+password');
      
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password'
        });
      }
      
      // Check if account is active
      if (!user.isActive) {
        return res.status(401).json({
          success: false,
          message: 'Account is deactivated'
        });
      }
      
      // Verify password
      const isPasswordValid = await user.comparePassword(password);
      
      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password'
        });
      }
      
      // Generate tokens
      const tokens = JWTUtils.generateTokenPair(user._id, {
        name: user.name,
        email: user.email,
        role: user.role
      });
      
      // Save refresh token and update login stats
      user.refreshToken = tokens.refreshToken;
      await user.updateLoginStats();
      
      // Remove sensitive data from response
      const userResponse = user.toJSON();
      
      console.log(`✅ User logged in successfully: ${user.email}`);
      
      res.status(200).json({
        success: true,
        message: 'Login successful',
        data: {
          user: userResponse,
          tokens
        }
      });
      
    } catch (error) {
      console.error('Login error:', error);
      
      res.status(500).json({
        success: false,
        message: 'Login failed',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
  
  /**
   * Refresh access token
   */
  static async refreshToken(req, res) {
    try {
      const user = req.user; // Set by validateRefreshToken middleware
      
      // Generate new access token
      const tokens = JWTUtils.generateTokenPair(user._id, {
        name: user.name,
        email: user.email,
        role: user.role
      });
      
      // Update refresh token in database
      user.refreshToken = tokens.refreshToken;
      await user.save();
      
      console.log(`🔄 Tokens refreshed for user: ${user.email}`);
      
      res.status(200).json({
        success: true,
        message: 'Tokens refreshed successfully',
        data: {
          tokens
        }
      });
      
    } catch (error) {
      console.error('Token refresh error:', error);
      
      res.status(500).json({
        success: false,
        message: 'Token refresh failed',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
  
  /**
   * Logout user
   */
  static async logout(req, res) {
    try {
      const user = req.user;
      
      // Clear refresh token
      user.refreshToken = undefined;
      await user.save();
      
      console.log(`👋 User logged out: ${user.email}`);
      
      res.status(200).json({
        success: true,
        message: 'Logged out successfully'
      });
      
    } catch (error) {
      console.error('Logout error:', error);
      
      res.status(500).json({
        success: false,
        message: 'Logout failed',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
  
  /**
   * Get current user profile
   */
  static async getProfile(req, res) {
    try {
      const user = req.user;
      
      // Get fresh user data
      const userProfile = await User.findById(user._id);
      
      if (!userProfile) {
        return res.status(404).json({
          success: false,
          message: 'User profile not found'
        });
      }
      
      const userResponse = userProfile.toJSON();
      
      res.status(200).json({
        success: true,
        message: 'Profile retrieved successfully',
        data: {
          user: userResponse
        }
      });
      
    } catch (error) {
      console.error('Get profile error:', error);
      
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve profile',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
  
  /**
   * Update user profile
   */
  static async updateProfile(req, res) {
    try {
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }
      
      const user = req.user;
      const updates = req.body;
      
      // Fields that can be updated
      const allowedUpdates = [
        'name', 'phoneNumber', 'preferences'
      ];
      
      // Filter only allowed updates
      const filteredUpdates = {};
      Object.keys(updates).forEach(key => {
        if (allowedUpdates.includes(key)) {
          filteredUpdates[key] = updates[key];
        }
      });
      
      // Special handling for preferences (merge with existing)
      if (filteredUpdates.preferences) {
        filteredUpdates.preferences = {
          ...user.preferences,
          ...filteredUpdates.preferences
        };
      }
      
      // Update user
      const updatedUser = await User.findByIdAndUpdate(
        user._id,
        filteredUpdates,
        { new: true, runValidators: true }
      );
      
      if (!updatedUser) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }
      
      // Regenerate avatar if name changed
      if (filteredUpdates.name) {
        updatedUser.avatar = updatedUser.generateAvatar();
        await updatedUser.save();
      }
      
      const userResponse = updatedUser.toJSON();
      
      console.log(`✅ Profile updated for user: ${updatedUser.email}`);
      
      res.status(200).json({
        success: true,
        message: 'Profile updated successfully',
        data: {
          user: userResponse
        }
      });
      
    } catch (error) {
      console.error('Update profile error:', error);
      
      res.status(500).json({
        success: false,
        message: 'Failed to update profile',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
  
  /**
   * Change password
   */
  static async changePassword(req, res) {
    try {
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }
      
      const { currentPassword, newPassword } = req.body;
      const user = req.user;
      
      // Get user with password
      const userWithPassword = await User.findById(user._id).select('+password');
      
      if (!userWithPassword) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }
      
      // Verify current password
      const isCurrentPasswordValid = await userWithPassword.comparePassword(currentPassword);
      
      if (!isCurrentPasswordValid) {
        return res.status(400).json({
          success: false,
          message: 'Current password is incorrect'
        });
      }
      
      // Update password
      userWithPassword.password = newPassword;
      await userWithPassword.save();
      
      // Clear all refresh tokens for security
      userWithPassword.refreshToken = undefined;
      await userWithPassword.save();
      
      console.log(`🔒 Password changed for user: ${user.email}`);
      
      res.status(200).json({
        success: true,
        message: 'Password changed successfully. Please login again.'
      });
      
    } catch (error) {
      console.error('Change password error:', error);
      
      res.status(500).json({
        success: false,
        message: 'Failed to change password',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
  
  /**
   * Delete user account
   */
  static async deleteAccount(req, res) {
    try {
      const { password } = req.body;
      const user = req.user;
      
      // Get user with password
      const userWithPassword = await User.findById(user._id).select('+password');
      
      if (!userWithPassword) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }
      
      // Verify password
      const isPasswordValid = await userWithPassword.comparePassword(password);
      
      if (!isPasswordValid) {
        return res.status(400).json({
          success: false,
          message: 'Password is incorrect'
        });
      }
      
      // Soft delete (deactivate account)
      userWithPassword.isActive = false;
      userWithPassword.refreshToken = undefined;
      await userWithPassword.save();
      
      console.log(`🗑️ Account deactivated for user: ${user.email}`);
      
      res.status(200).json({
        success: true,
        message: 'Account deleted successfully'
      });
      
    } catch (error) {
      console.error('Delete account error:', error);
      
      res.status(500).json({
        success: false,
        message: 'Failed to delete account',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
  
  /**
   * Get user statistics
   */
  static async getStats(req, res) {
    try {
      const user = req.user;
      
      // Get fresh user data with stats
      const userProfile = await User.findById(user._id);
      
      if (!userProfile) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }
      
      res.status(200).json({
        success: true,
        message: 'User stats retrieved successfully',
        data: {
          stats: userProfile.stats,
          memberSince: userProfile.memberSince,
          loginCount: userProfile.loginCount,
          lastLoginAt: userProfile.lastLoginAt
        }
      });
      
    } catch (error) {
      console.error('Get stats error:', error);
      
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve stats',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
}

module.exports = AuthController;
