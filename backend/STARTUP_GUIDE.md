# MyPC Backend API - Startup Guide

Welcome to the MyPC Backend API! This comprehensive PC building platform provides everything you need to create, manage, and share PC builds with advanced compatibility checking and price tracking.

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or cloud instance)
- npm or yarn

### Installation
```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your database URI and other settings
```

### Configuration
Update your `.env` file with appropriate values:
```env
NODE_ENV=development
PORT=3001
MONGODB_URI=mongodb://localhost:27017/mypc-database
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
CORS_ORIGIN=http://localhost:8081,exp://192.168.29.22:8081
```

### Start the Server
```bash
# Development mode (with auto-reload)
npm run dev

# Production mode
npm start

# Seed database with sample components
npm run seed
```

### Access the API
- **API Base URL**: http://localhost:3001
- **Health Check**: http://localhost:3001/health
- **API Documentation**: http://localhost:3001/api-docs
- **JSON Spec**: http://localhost:3001/api-docs.json

## 📚 API Documentation

Visit **http://localhost:3001/api-docs** for comprehensive interactive API documentation with:
- All endpoints with examples
- Authentication requirements
- Request/response schemas
- Try-it-now functionality

## 🏗️ Architecture Overview

### Core Components

1. **Authentication System** (`/api/auth`)
   - JWT-based authentication with refresh tokens
   - User registration, login, profile management
   - Role-based access control (user, admin, moderator)

2. **PC Builder System** (`/api/pc-builder`)
   - Create, update, delete PC builds
   - Component management within builds
   - Advanced compatibility checking
   - Public build sharing and discovery

3. **Component Management** (`/api/pc-builder/components`)
   - Search and filter components across categories
   - Multi-retailer price comparison
   - Trending and deals discovery
   - Detailed component specifications

4. **Wishlist System** (`/api/pc-builder/wishlist`)
   - Add/remove components from wishlist
   - Price tracking and alerts
   - Price history and trends

### Key Features

✅ **Comprehensive Compatibility Checking**
- CPU-Motherboard socket compatibility
- RAM type and capacity validation  
- PSU wattage calculations with 20% safety margin
- GPU clearance and case fit analysis
- Cooling adequacy for CPU TDP
- Chipset compatibility warnings

✅ **Advanced Component Search**
- Full-text search across names, models, brands
- Category-based filtering (CPU, GPU, RAM, etc.)
- Price range and brand filtering
- Sort by price, rating, popularity, latest

✅ **Multi-Retailer Price Tracking**
- Real-time price comparison across retailers
- Discount tracking and deal discovery  
- Price alerts for wishlist items
- Historical price trends

✅ **User Management & Profiles**
- Secure JWT authentication
- User preferences (currency, language, theme)
- Build statistics and activity tracking
- Avatar generation and customization

## 🔧 Sample API Usage

### 1. User Registration
```bash
curl -X POST http://localhost:3001/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "SecurePass123"
  }'
```

### 2. Login and Get Token
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "SecurePass123"
  }'
```

### 3. Search Components
```bash
curl "http://localhost:3001/api/pc-builder/components/search?query=rtx%204070&limit=5"
```

### 4. Create PC Build
```bash
curl -X POST http://localhost:3001/api/pc-builder/builds \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My Gaming Build",
    "description": "High-performance setup for 1440p gaming",
    "buildType": "gaming",
    "targetBudget": 150000
  }'
```

### 5. Add Component to Build
```bash
curl -X POST http://localhost:3001/api/pc-builder/builds/BUILD_ID/components \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "category": "cpu",
    "component": {
      "id": "cpu-intel-i7-13700k",
      "name": "Intel Core i7-13700K",
      "brand": "Intel",
      "price": 32000
    }
  }'
```

## 🗃️ Database Setup

### Seed Sample Data
```bash
# Populate database with sample components
npm run seed

# Clear existing data and reseed
npm run seed:clear
```

The seeding script includes:
- CPUs (Intel, AMD)
- GPUs (NVIDIA, AMD)
- RAM (DDR4, DDR5)
- Motherboards
- Storage (NVMe, SATA)
- Power supplies
- Cases and cooling

## 🛡️ Security Features

- **Rate Limiting**: Global and endpoint-specific rate limits
- **CORS Protection**: Configurable cross-origin policies
- **Input Validation**: Comprehensive request validation
- **JWT Security**: Secure token generation and verification
- **Password Hashing**: bcrypt with configurable salt rounds
- **Helmet.js**: Security headers and protections

## 📊 Data Models

### User Model
- Authentication and profile data
- Preferences and settings
- Wishlist with price tracking
- Build statistics and activity

### Component Model
- Detailed specifications by category
- Multi-retailer offers and pricing
- Ratings, reviews, and popularity
- Compatibility metadata

### PC Build Model
- Component selection and pricing
- Compatibility analysis results
- Sharing and community features
- Build statistics and metrics

## 🧪 Testing & Development

### Available Scripts
```bash
npm run dev          # Start development server with auto-reload
npm start           # Start production server
npm run seed        # Seed database with sample data
npm run seed:clear  # Clear and reseed database
```

### Development Features
- Hot reloading with nodemon
- Comprehensive error handling
- Development-only stack traces
- MongoDB connection monitoring
- Graceful shutdown handling

## 🔮 Future Enhancements

The todo list includes several advanced features planned for future releases:

1. **Price Tracking & Alerts** - Background price monitoring with email notifications
2. **Comprehensive Testing Suite** - Unit, integration, and API tests
3. **Admin Panel Endpoints** - Management interface for components and users  
4. **Redis Caching Layer** - Performance optimization for frequent queries
5. **Background Job System** - Automated tasks and data synchronization

## 🤝 API Integration

The backend is designed to work seamlessly with:
- **Mobile App** (React Native)
- **Web Dashboard** (Next.js)
- **Third-party Services** (Price APIs, Affiliate networks)

### CORS Configuration
```javascript
// Configured for development
CORS_ORIGIN=http://localhost:8081,exp://192.168.29.22:8081
```

## 📞 Support & Documentation

- **API Docs**: http://localhost:3001/api-docs
- **Health Check**: http://localhost:3001/health
- **OpenAPI Spec**: http://localhost:3001/api-docs.json

For technical support or questions about API usage, refer to the interactive documentation or check the health endpoint for system status.

---

**Ready to build some PCs!** 🖥️⚡
