const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// Import database connection
const connectDB = require('./config/database');

// Import Swagger documentation
const { serve, setup, swaggerSpec } = require('./config/swagger');

// Import routes
const authRoutes = require('./routes/auth');
const pcBuilderRoutes = require('./routes/pcBuilderRoutes');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3001;

// Connect to database
connectDB();

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

// CORS configuration
const corsOptions = {
  origin: process.env.NODE_ENV === 'development' ? true : (process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : ['http://localhost:8081']),
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};

app.use(cors(corsOptions));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Global rate limiting
const globalLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // Limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later',
    error: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false
});

app.use(globalLimiter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'MyPC Backend API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  });
});

// API Documentation
app.use('/api-docs', serve, setup);
app.get('/api-docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/pc-builder', pcBuilderRoutes);

// Additional API routes for mobile app compatibility
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'MyPC Backend API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  });
});

// Import controllers and middleware for direct access
const ComponentController = require('./controllers/componentController');
const PCBuilderController = require('./controllers/pcBuilderController');
const { authenticate } = require('./middleware/auth');
const { validatePCBuildCreation, validateQuery } = require('./middleware/validation');

// Direct component search route for mobile app compatibility
app.get('/api/components/search', validateQuery, ComponentController.searchComponents);

// Direct PC builder routes for mobile app compatibility (with authentication)
app.post('/api/pc-builder', authenticate, validatePCBuildCreation, PCBuilderController.createBuild);

// 404 handler for undefined routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
    error: 'ROUTE_NOT_FOUND'
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(e => ({
      field: e.path,
      message: e.message
    }));
    
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors
    });
  }

  // Mongoose cast error (invalid ObjectId)
  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: 'Invalid ID format',
      error: 'INVALID_ID'
    });
  }

  // MongoDB duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    return res.status(409).json({
      success: false,
      message: `${field} already exists`,
      error: 'DUPLICATE_ENTRY'
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid token',
      error: 'INVALID_TOKEN'
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Token expired',
      error: 'TOKEN_EXPIRED'
    });
  }

  // Default server error
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    error: err.code || 'INTERNAL_SERVER_ERROR',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Start server
const server = app.listen(PORT, '0.0.0.0', () => {
  const isProduction = process.env.NODE_ENV === 'production';
  const baseUrl = isProduction ? 'https://mypc-production.up.railway.app' : `http://localhost:${PORT}`;
  
  console.log(`🚀 MyPC Backend API running on port ${PORT}`);
  console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
  
  if (isProduction) {
    console.log(`🌐 Production deployment ready`);
    console.log(`🔗 Health check: ${baseUrl}/health`);
    console.log(`📚 API Documentation: ${baseUrl}/api-docs`);
    console.log(`🔐 Auth endpoints: ${baseUrl}/api/auth`);
    console.log(`🔧 PC Builder endpoints: ${baseUrl}/api/pc-builder`);
  } else {
    console.log(`🔗 Health check: ${baseUrl}/health`);
    console.log(`📚 API Documentation: ${baseUrl}/api-docs`);
    console.log(`🔐 Auth endpoints: ${baseUrl}/api/auth`);
    console.log(`🔧 PC Builder endpoints: ${baseUrl}/api/pc-builder`);
  }
});

// Graceful shutdown
const gracefulShutdown = (signal) => {
  console.log(`\n🛑 Received ${signal}. Starting graceful shutdown...`);
  
  server.close(async () => {
    console.log('🔌 HTTP server closed');
    
    try {
      // Close database connection
      const mongoose = require('mongoose');
      await mongoose.connection.close();
      console.log('💾 Database connection closed');
      
      console.log('✅ Graceful shutdown completed');
      process.exit(0);
    } catch (error) {
      console.error('❌ Error during shutdown:', error);
      process.exit(1);
    }
  });
  
  // Force shutdown after 10 seconds
  setTimeout(() => {
    console.error('⏰ Forced shutdown after 10 seconds');
    process.exit(1);
  }, 10000);
};

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('🚨 Unhandled Promise Rejection:', err);
  gracefulShutdown('UNHANDLED_REJECTION');
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('🚨 Uncaught Exception:', err);
  gracefulShutdown('UNCAUGHT_EXCEPTION');
});

module.exports = app;
