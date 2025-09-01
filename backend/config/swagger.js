const swaggerJSDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'MyPC Backend API',
    version: '1.0.0',
    description: `
      Comprehensive API for MyPC - PC Building and Component Management Platform
      
      ## Features
      - 🔐 JWT-based authentication
      - 👤 User management with profiles and preferences
      - 🛠️ PC Build creation and management
      - 🔍 Component search and filtering
      - ❤️ Wishlist functionality
      - 💰 Price tracking and alerts
      - ✅ Component compatibility checking
      - 🏪 Multi-retailer price comparison
      
      ## Authentication
      Most endpoints require authentication. Include the JWT token in the Authorization header:
      \`\`\`
      Authorization: Bearer <your-jwt-token>
      \`\`\`
    `,
    contact: {
      name: 'MyPC API Support',
      email: 'support@mypc.com'
    },
    license: {
      name: 'MIT',
      url: 'https://opensource.org/licenses/MIT'
    }
  },
  servers: [
    {
      url: 'http://localhost:3001',
      description: 'Development server'
    },
    {
      url: 'https://api.mypc.com',
      description: 'Production server'
    }
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'JWT Authorization header using the Bearer scheme'
      }
    },
    schemas: {
      // User Schemas
      User: {
        type: 'object',
        properties: {
          _id: { type: 'string', example: '64a1b2c3d4e5f6789012345' },
          name: { type: 'string', example: 'John Doe' },
          email: { type: 'string', format: 'email', example: 'john.doe@example.com' },
          phoneNumber: { type: 'string', example: '+91-9876543210' },
          avatar: { type: 'string', format: 'uri', example: 'https://ui-avatars.com/api/?name=JD' },
          role: { type: 'string', enum: ['user', 'admin', 'moderator'], example: 'user' },
          isActive: { type: 'boolean', example: true },
          isEmailVerified: { type: 'boolean', example: false },
          preferences: {
            type: 'object',
            properties: {
              notifications: { type: 'boolean', example: true },
              newsletter: { type: 'boolean', example: false },
              darkMode: { type: 'boolean', example: false },
              currency: { type: 'string', enum: ['INR', 'USD', 'EUR', 'GBP'], example: 'INR' },
              language: { type: 'string', enum: ['en', 'hi', 'es', 'fr'], example: 'en' }
            }
          },
          stats: {
            type: 'object',
            properties: {
              totalBuilds: { type: 'number', example: 3 },
              totalDealsFound: { type: 'number', example: 15 },
              totalMoneySaved: { type: 'number', example: 2500 },
              wishlistItems: { type: 'number', example: 8 }
            }
          },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' }
        }
      },
      
      // Component Schemas
      Component: {
        type: 'object',
        properties: {
          _id: { type: 'string', example: '64a1b2c3d4e5f6789012345' },
          id: { type: 'string', example: 'cpu-intel-i7-13700k' },
          name: { type: 'string', example: 'Intel Core i7-13700K' },
          brand: { type: 'string', example: 'Intel' },
          category: { 
            type: 'string', 
            enum: ['CPU', 'GPU', 'RAM', 'Motherboard', 'Storage', 'PSU', 'Case', 'Cooling', 'Other'],
            example: 'CPU'
          },
          model: { type: 'string', example: '13700K' },
          description: { type: 'string' },
          imageUrl: { type: 'string', format: 'uri' },
          rating: { type: 'number', minimum: 0, maximum: 5, example: 4.6 },
          reviewCount: { type: 'number', example: 1250 },
          availability: { 
            type: 'string', 
            enum: ['in_stock', 'out_of_stock', 'discontinued'],
            example: 'in_stock'
          },
          averagePrice: { type: 'number', example: 32000 },
          priceRange: {
            type: 'object',
            properties: {
              min: { type: 'number', example: 31500 },
              max: { type: 'number', example: 35000 }
            }
          },
          specifications: { type: 'object' },
          offers: {
            type: 'array',
            items: { $ref: '#/components/schemas/Offer' }
          },
          tags: { type: 'array', items: { type: 'string' }, example: ['gaming', 'high-performance'] },
          popularity: { type: 'number', example: 95 }
        }
      },
      
      Offer: {
        type: 'object',
        properties: {
          retailer: { 
            type: 'string', 
            enum: ['Amazon', 'Flipkart', 'EarnKaro', 'Other'],
            example: 'Amazon'
          },
          price: { type: 'number', example: 32000 },
          originalPrice: { type: 'number', example: 35000 },
          discount: { type: 'number', minimum: 0, maximum: 100, example: 8.5 },
          availability: { 
            type: 'string', 
            enum: ['in_stock', 'out_of_stock', 'limited_stock', 'pre_order'],
            example: 'in_stock'
          },
          url: { type: 'string', format: 'uri' },
          shipping: {
            type: 'object',
            properties: {
              cost: { type: 'number', example: 0 },
              estimatedDays: { type: 'number', example: 2 },
              free: { type: 'boolean', example: true }
            }
          },
          badges: { type: 'array', items: { type: 'string' }, example: ['Prime', 'Best Seller'] }
        }
      },
      
      // PC Build Schemas
      PCBuild: {
        type: 'object',
        properties: {
          _id: { type: 'string', example: '64a1b2c3d4e5f6789012345' },
          name: { type: 'string', example: 'My Gaming Build' },
          description: { type: 'string', example: 'High-performance gaming setup for 1440p gaming' },
          user: { type: 'string', example: '64a1b2c3d4e5f6789012345' },
          components: {
            type: 'object',
            properties: {
              cpu: { $ref: '#/components/schemas/BuildComponent' },
              gpu: { $ref: '#/components/schemas/BuildComponent' },
              ram: { $ref: '#/components/schemas/BuildComponent' },
              motherboard: { $ref: '#/components/schemas/BuildComponent' },
              storage: { $ref: '#/components/schemas/BuildComponent' },
              psu: { $ref: '#/components/schemas/BuildComponent' },
              case: { $ref: '#/components/schemas/BuildComponent' },
              cooling: { $ref: '#/components/schemas/BuildComponent' }
            }
          },
          totalPrice: { type: 'number', example: 125000 },
          originalTotalPrice: { type: 'number', example: 135000 },
          totalSavings: { type: 'number', example: 10000 },
          totalDiscount: { type: 'number', example: 7.4 },
          compatibility: { $ref: '#/components/schemas/CompatibilityCheck' },
          isPublic: { type: 'boolean', example: false },
          isComplete: { type: 'boolean', example: true },
          buildType: { 
            type: 'string', 
            enum: ['gaming', 'workstation', 'office', 'budget', 'high-end', 'custom'],
            example: 'gaming'
          },
          targetBudget: { type: 'number', example: 130000 },
          tags: { type: 'array', items: { type: 'string' }, example: ['1440p', 'rgb'] },
          likes: { type: 'number', example: 42 },
          views: { type: 'number', example: 156 },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' }
        }
      },
      
      BuildComponent: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 'cpu-intel-i7-13700k' },
          name: { type: 'string', example: 'Intel Core i7-13700K' },
          brand: { type: 'string', example: 'Intel' },
          price: { type: 'number', example: 32000 },
          imageUrl: { type: 'string', format: 'uri' },
          url: { type: 'string', format: 'uri' },
          retailer: { type: 'string', example: 'Amazon' },
          selectedAt: { type: 'string', format: 'date-time' }
        }
      },
      
      CompatibilityCheck: {
        type: 'object',
        properties: {
          isCompatible: { type: 'boolean', example: true },
          warnings: { 
            type: 'array', 
            items: { type: 'string' },
            example: ['⚠️ PSU wattage is close to requirements. Recommend 750W for safety']
          },
          issues: { 
            type: 'array', 
            items: { type: 'string' },
            example: []
          },
          estimatedWattage: { type: 'number', example: 580 },
          lastChecked: { type: 'string', format: 'date-time' }
        }
      },
      
      // Authentication Schemas
      LoginRequest: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email', example: 'john.doe@example.com' },
          password: { type: 'string', format: 'password', example: 'SecurePass123' }
        }
      },
      
      SignupRequest: {
        type: 'object',
        required: ['name', 'email', 'password'],
        properties: {
          name: { type: 'string', example: 'John Doe' },
          email: { type: 'string', format: 'email', example: 'john.doe@example.com' },
          password: { type: 'string', format: 'password', example: 'SecurePass123' },
          phoneNumber: { type: 'string', example: '+91-9876543210' }
        }
      },
      
      AuthResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string', example: 'Login successful' },
          data: {
            type: 'object',
            properties: {
              user: { $ref: '#/components/schemas/User' },
              tokens: {
                type: 'object',
                properties: {
                  accessToken: { type: 'string' },
                  refreshToken: { type: 'string' },
                  tokenType: { type: 'string', example: 'Bearer' },
                  expiresIn: { type: 'string', example: '7d' }
                }
              }
            }
          }
        }
      },
      
      // Generic Response Schemas
      SuccessResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string' },
          data: { type: 'object' }
        }
      },
      
      ErrorResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          message: { type: 'string' },
          error: { type: 'string' },
          errors: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                field: { type: 'string' },
                message: { type: 'string' }
              }
            }
          }
        }
      },
      
      PaginationResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string' },
          data: {
            type: 'object',
            properties: {
              pagination: {
                type: 'object',
                properties: {
                  page: { type: 'number', example: 1 },
                  limit: { type: 'number', example: 20 },
                  total: { type: 'number', example: 150 },
                  pages: { type: 'number', example: 8 }
                }
              }
            }
          }
        }
      }
    },
    
    parameters: {
      PageParam: {
        name: 'page',
        in: 'query',
        description: 'Page number for pagination',
        schema: { type: 'integer', minimum: 1, default: 1 }
      },
      LimitParam: {
        name: 'limit',
        in: 'query', 
        description: 'Number of items per page',
        schema: { type: 'integer', minimum: 1, maximum: 100, default: 20 }
      },
      SearchParam: {
        name: 'search',
        in: 'query',
        description: 'Search query string',
        schema: { type: 'string', minLength: 1, maxLength: 100 }
      },
      CategoryParam: {
        name: 'category',
        in: 'query',
        description: 'Component category filter',
        schema: { 
          type: 'string', 
          enum: ['CPU', 'GPU', 'RAM', 'Motherboard', 'Storage', 'PSU', 'Case', 'Cooling', 'Other'] 
        }
      },
      SortParam: {
        name: 'sortBy',
        in: 'query',
        description: 'Sort criteria',
        schema: { 
          type: 'string', 
          enum: ['price', 'rating', 'popularity', 'latest'],
          default: 'popularity'
        }
      },
      ObjectIdParam: {
        name: 'id',
        in: 'path',
        required: true,
        description: 'MongoDB ObjectId',
        schema: { type: 'string', pattern: '^[0-9a-fA-F]{24}$' }
      }
    },
    
    responses: {
      UnauthorizedError: {
        description: 'Access token is missing or invalid',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ErrorResponse' },
            example: {
              success: false,
              message: 'Authentication failed',
              error: 'INVALID_TOKEN'
            }
          }
        }
      },
      ForbiddenError: {
        description: 'Insufficient permissions',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ErrorResponse' },
            example: {
              success: false,
              message: 'Insufficient permissions',
              error: 'INSUFFICIENT_PERMISSIONS'
            }
          }
        }
      },
      NotFoundError: {
        description: 'Resource not found',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ErrorResponse' },
            example: {
              success: false,
              message: 'Resource not found',
              error: 'NOT_FOUND'
            }
          }
        }
      },
      ValidationError: {
        description: 'Validation failed',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ErrorResponse' },
            example: {
              success: false,
              message: 'Validation failed',
              errors: [
                { field: 'email', message: 'Please provide a valid email address' }
              ]
            }
          }
        }
      },
      ServerError: {
        description: 'Internal server error',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ErrorResponse' },
            example: {
              success: false,
              message: 'Internal server error',
              error: 'INTERNAL_SERVER_ERROR'
            }
          }
        }
      }
    }
  },
  
  security: [
    { BearerAuth: [] }
  ],
  
  tags: [
    {
      name: 'Authentication',
      description: 'User authentication and authorization endpoints'
    },
    {
      name: 'Users',
      description: 'User profile management'
    },
    {
      name: 'Components',
      description: 'PC component search, filtering, and management'
    },
    {
      name: 'PC Builds',
      description: 'PC build creation, management, and sharing'
    },
    {
      name: 'Wishlist',
      description: 'User wishlist and price alert management'
    },
    {
      name: 'Compatibility',
      description: 'Component compatibility checking'
    },
    {
      name: 'Health',
      description: 'API health and status endpoints'
    }
  ]
};

const options = {
  swaggerDefinition,
  apis: [
    './routes/*.js',
    './controllers/*.js',
    './models/*.js'
  ]
};

const swaggerSpec = swaggerJSDoc(options);

module.exports = {
  swaggerSpec,
  swaggerUi,
  serve: swaggerUi.serve,
  setup: swaggerUi.setup(swaggerSpec, {
    explorer: true,
    customCss: `
      .swagger-ui .topbar { display: none }
      .swagger-ui .info h1 { color: #1E40AF }
      .swagger-ui .scheme-container { background: #F8FAFC; padding: 10px }
    `,
    customSiteTitle: "MyPC API Documentation",
    customfavIcon: "/assets/favicon.ico"
  })
};
