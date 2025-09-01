const express = require('express');
const rateLimit = require('express-rate-limit');
const AuthController = require('../controllers/authController');
const { authenticate, validateRefreshToken } = require('../middleware/auth');
const {
  validateSignup,
  validateLogin,
  validateProfileUpdate,
  validatePasswordChange,
  validateAccountDeletion
} = require('../middleware/validation');

const router = express.Router();

// Rate limiting for authentication routes (lenient for testing)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // Limit each IP to 30 requests per windowMs
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again later',
    error: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  skip: (req) => {
    // Skip rate limiting for token refresh
    return req.path === '/refresh-token';
  }
});

// More lenient rate limiting for signup (for testing)
const signupLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // Limit each IP to 50 signup attempts per 15 minutes
  message: {
    success: false,
    message: 'Too many account creation attempts, please try again later',
    error: 'SIGNUP_RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Rate limiting for password change
const passwordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // Limit each IP to 3 password change attempts per hour
  message: {
    success: false,
    message: 'Too many password change attempts, please try again later',
    error: 'PASSWORD_CHANGE_RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// @route   POST /api/auth/signup
// @desc    Register a new user
// @access  Public
router.post('/signup', signupLimiter, validateSignup, AuthController.signup);

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', authLimiter, validateLogin, AuthController.login);

// @route   POST /api/auth/refresh-token
// @desc    Refresh access token using refresh token
// @access  Public (but requires valid refresh token)
router.post('/refresh-token', validateRefreshToken, AuthController.refreshToken);

// @route   POST /api/auth/logout
// @desc    Logout user (invalidate refresh token)
// @access  Private
router.post('/logout', authenticate, AuthController.logout);

// @route   GET /api/auth/profile
// @desc    Get current user profile
// @access  Private
router.get('/profile', authenticate, AuthController.getProfile);

// @route   PUT /api/auth/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', authenticate, validateProfileUpdate, AuthController.updateProfile);

// @route   PUT /api/auth/change-password
// @desc    Change user password
// @access  Private
router.put('/change-password', authenticate, passwordLimiter, validatePasswordChange, AuthController.changePassword);

// @route   DELETE /api/auth/account
// @desc    Delete user account (soft delete)
// @access  Private
router.delete('/account', authenticate, validateAccountDeletion, AuthController.deleteAccount);

// @route   GET /api/auth/stats
// @desc    Get user statistics
// @access  Private
router.get('/stats', authenticate, AuthController.getStats);

// @route   GET /api/auth/health
// @desc    Health check for auth service
// @access  Public
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Authentication service is healthy',
    timestamp: new Date().toISOString()
  });
});

// @route   POST /api/auth/verify-token
// @desc    Verify if token is valid (for client-side token validation)
// @access  Private
router.post('/verify-token', authenticate, (req, res) => {
  // If middleware passes, token is valid
  res.status(200).json({
    success: true,
    message: 'Token is valid',
    data: {
      user: req.user.toJSON(),
      tokenExpiration: req.token.exp ? new Date(req.token.exp * 1000) : null
    }
  });
});

module.exports = router;
