const jwt = require('jsonwebtoken');
const crypto = require('crypto');

class JWTUtils {
  
  /**
   * Generate JWT access token
   * @param {string} userId - User ID
   * @param {object} payload - Additional payload data
   * @returns {string} JWT token
   */
  static generateAccessToken(userId, payload = {}) {
    const tokenPayload = {
      id: userId,
      type: 'access',
      ...payload
    };
    
    return jwt.sign(
      tokenPayload,
      process.env.JWT_SECRET,
      {
        expiresIn: process.env.JWT_EXPIRE || '7d',
        issuer: 'mypc-backend',
        audience: 'mypc-app'
      }
    );
  }
  
  /**
   * Generate JWT refresh token
   * @param {string} userId - User ID
   * @returns {string} Refresh token
   */
  static generateRefreshToken(userId) {
    const tokenPayload = {
      id: userId,
      type: 'refresh',
      tokenId: crypto.randomUUID()
    };
    
    return jwt.sign(
      tokenPayload,
      process.env.JWT_SECRET,
      {
        expiresIn: process.env.JWT_REFRESH_EXPIRE || '30d',
        issuer: 'mypc-backend',
        audience: 'mypc-app'
      }
    );
  }
  
  /**
   * Generate both access and refresh tokens
   * @param {string} userId - User ID
   * @param {object} payload - Additional payload data
   * @returns {object} Object containing both tokens
   */
  static generateTokenPair(userId, payload = {}) {
    return {
      accessToken: this.generateAccessToken(userId, payload),
      refreshToken: this.generateRefreshToken(userId),
      tokenType: 'Bearer',
      expiresIn: process.env.JWT_EXPIRE || '7d'
    };
  }
  
  /**
   * Verify JWT token
   * @param {string} token - JWT token to verify
   * @returns {object} Decoded token payload
   */
  static verifyToken(token) {
    try {
      return jwt.verify(token, process.env.JWT_SECRET, {
        issuer: 'mypc-backend',
        audience: 'mypc-app'
      });
    } catch (error) {
      throw this.createTokenError(error);
    }
  }
  
  /**
   * Decode JWT token without verification (for debugging)
   * @param {string} token - JWT token to decode
   * @returns {object} Decoded token payload
   */
  static decodeToken(token) {
    return jwt.decode(token);
  }
  
  /**
   * Extract token from Authorization header
   * @param {string} authHeader - Authorization header value
   * @returns {string|null} Extracted token or null
   */
  static extractTokenFromHeader(authHeader) {
    if (!authHeader) return null;
    
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return null;
    }
    
    return parts[1];
  }
  
  /**
   * Check if token is expired
   * @param {object} decodedToken - Decoded token payload
   * @returns {boolean} True if token is expired
   */
  static isTokenExpired(decodedToken) {
    if (!decodedToken.exp) return false;
    
    const currentTime = Math.floor(Date.now() / 1000);
    return decodedToken.exp < currentTime;
  }
  
  /**
   * Get token expiration time
   * @param {object} decodedToken - Decoded token payload
   * @returns {Date|null} Expiration date or null
   */
  static getTokenExpiration(decodedToken) {
    if (!decodedToken.exp) return null;
    
    return new Date(decodedToken.exp * 1000);
  }
  
  /**
   * Validate token type
   * @param {object} decodedToken - Decoded token payload
   * @param {string} expectedType - Expected token type ('access' or 'refresh')
   * @returns {boolean} True if token type is valid
   */
  static validateTokenType(decodedToken, expectedType) {
    return decodedToken.type === expectedType;
  }
  
  /**
   * Create appropriate error based on JWT error
   * @param {Error} jwtError - Original JWT error
   * @returns {Error} Formatted error
   */
  static createTokenError(jwtError) {
    const error = new Error();
    
    switch (jwtError.name) {
      case 'TokenExpiredError':
        error.name = 'TokenExpiredError';
        error.message = 'Token has expired';
        error.statusCode = 401;
        break;
      case 'JsonWebTokenError':
        error.name = 'InvalidTokenError';
        error.message = 'Invalid token';
        error.statusCode = 401;
        break;
      case 'NotBeforeError':
        error.name = 'TokenNotActiveError';
        error.message = 'Token not active yet';
        error.statusCode = 401;
        break;
      default:
        error.name = 'TokenError';
        error.message = 'Token verification failed';
        error.statusCode = 401;
    }
    
    error.originalError = jwtError;
    return error;
  }
  
  /**
   * Generate a secure random token for password reset, etc.
   * @param {number} length - Token length in bytes (default: 32)
   * @returns {string} Hex string token
   */
  static generateSecureToken(length = 32) {
    return crypto.randomBytes(length).toString('hex');
  }
  
  /**
   * Hash a token for secure storage
   * @param {string} token - Token to hash
   * @returns {string} Hashed token
   */
  static hashToken(token) {
    return crypto.createHash('sha256').update(token).digest('hex');
  }
  
  /**
   * Create a password reset token with expiration
   * @returns {object} Token and expiration info
   */
  static createPasswordResetToken() {
    const token = this.generateSecureToken();
    const hashedToken = this.hashToken(token);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    
    return {
      token,
      hashedToken,
      expiresAt
    };
  }
  
  /**
   * Create an email verification token
   * @returns {object} Token and expiration info
   */
  static createEmailVerificationToken() {
    const token = this.generateSecureToken();
    const hashedToken = this.hashToken(token);
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    
    return {
      token,
      hashedToken,
      expiresAt
    };
  }
}

module.exports = JWTUtils;
