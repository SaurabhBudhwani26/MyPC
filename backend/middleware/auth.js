const User = require('../models/User');
const JWTUtils = require('../utils/jwt');

/**
 * Middleware to authenticate user using JWT token
 */
const authenticate = async (req, res, next) => {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    const token = JWTUtils.extractTokenFromHeader(authHeader);
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token required',
        error: 'NO_TOKEN'
      });
    }
    
    // Verify token
    const decoded = JWTUtils.verifyToken(token);
    
    // Validate token type
    if (!JWTUtils.validateTokenType(decoded, 'access')) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token type',
        error: 'INVALID_TOKEN_TYPE'
      });
    }
    
    // Find user
    const user = await User.findById(decoded.id);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found',
        error: 'USER_NOT_FOUND'
      });
    }
    
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'User account is deactivated',
        error: 'ACCOUNT_DEACTIVATED'
      });
    }
    
    // Add user to request object
    req.user = user;
    req.token = decoded;
    
    next();
    
  } catch (error) {
    console.error('Authentication error:', error);
    
    // Handle different types of token errors
    let statusCode = 401;
    let message = 'Authentication failed';
    let errorCode = 'AUTH_ERROR';
    
    if (error.name === 'TokenExpiredError') {
      message = 'Token has expired';
      errorCode = 'TOKEN_EXPIRED';
    } else if (error.name === 'InvalidTokenError') {
      message = 'Invalid token';
      errorCode = 'INVALID_TOKEN';
    } else if (error.name === 'TokenNotActiveError') {
      message = 'Token not active yet';
      errorCode = 'TOKEN_NOT_ACTIVE';
    }
    
    return res.status(statusCode).json({
      success: false,
      message,
      error: errorCode
    });
  }
};

/**
 * Optional authentication middleware
 * Sets req.user if valid token is provided, but doesn't block request if no token
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = JWTUtils.extractTokenFromHeader(authHeader);
    
    if (!token) {
      return next(); // No token provided, continue without user
    }
    
    const decoded = JWTUtils.verifyToken(token);
    
    if (JWTUtils.validateTokenType(decoded, 'access')) {
      const user = await User.findById(decoded.id);
      
      if (user && user.isActive) {
        req.user = user;
        req.token = decoded;
      }
    }
    
    next();
    
  } catch (error) {
    // Don't block request on optional auth failure
    next();
  }
};

/**
 * Middleware to check if user has specific role
 * @param {string|Array} roles - Required role(s)
 */
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
        error: 'NOT_AUTHENTICATED'
      });
    }
    
    const userRole = req.user.role;
    const requiredRoles = Array.isArray(roles) ? roles : [roles];
    
    if (!requiredRoles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions',
        error: 'INSUFFICIENT_PERMISSIONS',
        required: requiredRoles,
        current: userRole
      });
    }
    
    next();
  };
};

/**
 * Middleware to check if user is admin
 */
const requireAdmin = requireRole('admin');

/**
 * Middleware to check if user is moderator or admin
 */
const requireModerator = requireRole(['admin', 'moderator']);

/**
 * Middleware to check if email is verified
 */
const requireEmailVerification = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required',
      error: 'NOT_AUTHENTICATED'
    });
  }
  
  if (!req.user.isEmailVerified) {
    return res.status(403).json({
      success: false,
      message: 'Email verification required',
      error: 'EMAIL_NOT_VERIFIED'
    });
  }
  
  next();
};

/**
 * Middleware to validate refresh token
 */
const validateRefreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token required',
        error: 'NO_REFRESH_TOKEN'
      });
    }
    
    // Verify refresh token
    const decoded = JWTUtils.verifyToken(refreshToken);
    
    // Validate token type
    if (!JWTUtils.validateTokenType(decoded, 'refresh')) {
      return res.status(401).json({
        success: false,
        message: 'Invalid refresh token',
        error: 'INVALID_REFRESH_TOKEN'
      });
    }
    
    // Find user and check if refresh token matches
    const user = await User.findById(decoded.id).select('+refreshToken');
    
    if (!user || user.refreshToken !== refreshToken) {
      return res.status(401).json({
        success: false,
        message: 'Invalid refresh token',
        error: 'INVALID_REFRESH_TOKEN'
      });
    }
    
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'User account is deactivated',
        error: 'ACCOUNT_DEACTIVATED'
      });
    }
    
    req.user = user;
    req.refreshToken = decoded;
    
    next();
    
  } catch (error) {
    console.error('Refresh token validation error:', error);
    
    let message = 'Invalid refresh token';
    let errorCode = 'INVALID_REFRESH_TOKEN';
    
    if (error.name === 'TokenExpiredError') {
      message = 'Refresh token has expired';
      errorCode = 'REFRESH_TOKEN_EXPIRED';
    }
    
    return res.status(401).json({
      success: false,
      message,
      error: errorCode
    });
  }
};

/**
 * Middleware to check resource ownership
 * Checks if authenticated user owns the resource
 */
const checkOwnership = (resourceIdField = 'id') => {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
        error: 'NOT_AUTHENTICATED'
      });
    }
    
    const resourceId = req.params[resourceIdField];
    const userId = req.user._id.toString();
    
    // Admin can access any resource
    if (req.user.role === 'admin') {
      return next();
    }
    
    // For user-specific routes, check ownership
    if (resourceId === userId) {
      return next();
    }
    
    // For other resources, additional checks might be needed
    // This would depend on the specific resource type
    return res.status(403).json({
      success: false,
      message: 'Access denied',
      error: 'ACCESS_DENIED'
    });
  };
};

module.exports = {
  authenticate,
  optionalAuth,
  requireRole,
  requireAdmin,
  requireModerator,
  requireEmailVerification,
  validateRefreshToken,
  checkOwnership
};
