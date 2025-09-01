# PC Builder API Documentation

## Base URL
```
http://localhost:3001/api/pc-builder
```

## Authentication
Most PC Builder endpoints require authentication via JWT token in the Authorization header:
```
Authorization: Bearer <jwt_token>
```

## Rate Limiting
- **Rate Limit**: 100 requests per 15 minutes per IP
- **Headers**: Rate limit info is included in response headers

---

## PC Build Endpoints

### 1. Create PC Build
**POST** `/builds`

Create a new PC build for the authenticated user.

**Authentication**: Required

**Request Body**:
```json
{
  "name": "Gaming Rig 2024",
  "description": "High-end gaming setup for 4K gaming",
  "buildType": "gaming", // gaming, workstation, budget, custom
  "targetBudget": 2500,
  "tags": ["gaming", "4k", "rgb"],
  "isPublic": false
}
```

**Response**:
```json
{
  "success": true,
  "message": "PC build created successfully",
  "data": {
    "build": {
      "_id": "...",
      "name": "Gaming Rig 2024",
      "description": "High-end gaming setup for 4K gaming",
      "buildType": "gaming",
      "targetBudget": 2500,
      "components": {},
      "totalPrice": 0,
      "isPublic": false,
      // ... other fields
    }
  }
}
```

### 2. Get User's PC Builds
**GET** `/builds`

Get all PC builds for the authenticated user with pagination.

**Authentication**: Required

**Query Parameters**:
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)

**Response**:
```json
{
  "success": true,
  "message": "Builds retrieved successfully",
  "data": {
    "builds": [...],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 25,
      "pages": 3
    }
  }
}
```

### 3. Get Public Builds
**GET** `/builds/public`

Get community/public PC builds with pagination.

**Authentication**: Optional

**Query Parameters**:
- `page` (optional): Page number
- `limit` (optional): Items per page (default: 20)
- `buildType` (optional): Filter by build type

**Response**: Similar to user builds with public builds array.

### 4. Get Specific Build
**GET** `/builds/:buildId`

Get a specific PC build by ID. User can access their own builds or public builds.

**Authentication**: Required

**Response**:
```json
{
  "success": true,
  "message": "Build retrieved successfully",
  "data": {
    "build": {
      // Complete build object with components
    }
  }
}
```

### 5. Update PC Build
**PUT** `/builds/:buildId`

Update PC build details (owner only).

**Authentication**: Required

**Request Body**:
```json
{
  "name": "Updated Build Name",
  "description": "Updated description",
  "targetBudget": 3000,
  "tags": ["updated", "tags"],
  "isPublic": true
}
```

### 6. Delete PC Build
**DELETE** `/builds/:buildId`

Delete a PC build (owner only).

**Authentication**: Required

**Response**:
```json
{
  "success": true,
  "message": "PC build deleted successfully"
}
```

### 7. Add Component to Build
**POST** `/builds/:buildId/components`

Add a component to a PC build.

**Authentication**: Required

**Request Body**:
```json
{
  "category": "cpu",
  "component": {
    "_id": "component_id",
    "name": "Intel Core i7-12700K",
    "brand": "Intel",
    "model": "i7-12700K",
    "price": 399.99,
    "specifications": {
      "socket": "LGA1700",
      "cores": 12,
      "threads": 20
    }
  }
}
```

### 8. Remove Component from Build
**DELETE** `/builds/:buildId/components/:category`

Remove a component from a PC build.

**Authentication**: Required

---

## Component Endpoints

### 1. Get Component Categories
**GET** `/components/categories`

Get all component categories with counts and metadata.

**Authentication**: None

**Response**:
```json
{
  "success": true,
  "message": "Categories retrieved successfully",
  "data": {
    "categories": [
      {
        "_id": "cpu",
        "count": 150,
        "avgPrice": 299.99,
        "brands": ["Intel", "AMD"]
      },
      // ... other categories
    ]
  }
}
```

### 2. Search Components
**GET** `/components/search`

Search components across all categories.

**Authentication**: None

**Query Parameters**:
- `query` (required): Search term (min 2 characters)
- `page`, `limit`: Pagination

**Response**: Components array matching search query.

### 3. Get Component Deals
**GET** `/components/deals`

Get components with active discounts.

**Authentication**: None

**Response**: Array of components with discount information.

### 4. Get Trending Components
**GET** `/components/trending`

Get popular/trending components.

**Authentication**: None

**Query Parameters**:
- `limit` (optional): Number of items (default: 10)
- `category` (optional): Filter by category

### 5. Get Components by Category
**GET** `/components/:category`

Get components for a specific category with filtering and sorting.

**Authentication**: None

**Query Parameters**:
- `page`, `limit`: Pagination
- `minPrice`, `maxPrice`: Price range filter
- `brand`: Brand filter
- `search`: Search within category
- `minRating`: Minimum rating filter
- `available`: Stock availability filter ('true'/'false')
- `sortBy`: Sort criteria ('price', 'rating', 'popularity')
- `sortOrder`: Sort order ('asc', 'desc')

**Response**:
```json
{
  "success": true,
  "message": "Components retrieved successfully",
  "data": {
    "components": [...],
    "pagination": {...},
    "filters": {
      "category": "cpu",
      "priceRange": {"min": "100", "max": "500"},
      // ... applied filters
    }
  }
}
```

### 6. Get Specific Component
**GET** `/components/:category/:componentId`

Get detailed information about a specific component.

**Authentication**: None

**Response**: Complete component object with specifications.

### 7. Get Component Recommendations
**GET** `/components/:category/:componentId/recommendations`

Get recommended components based on the selected component.

**Authentication**: None

**Query Parameters**:
- `limit`: Number of recommendations (default: 5)

### 8. Add to Wishlist
**POST** `/components/:componentId/wishlist`

Add component to user's wishlist.

**Authentication**: Required

### 9. Check Compatibility
**POST** `/compatibility`

Check compatibility between selected components.

**Authentication**: Required

**Request Body**:
```json
{
  "components": {
    "cpu": {
      "_id": "cpu_id",
      "socket": "LGA1700",
      // ... component data
    },
    "motherboard": {
      "_id": "mb_id",
      "socket": "LGA1700",
      // ... component data
    }
    // ... other components
  }
}
```

**Response**:
```json
{
  "success": true,
  "message": "Compatibility check completed",
  "data": {
    "compatibility": {
      "overall": "compatible",
      "issues": [],
      "warnings": ["PSU might be underpowered"]
    },
    "totalPrice": 1599.99,
    "estimatedWattage": 450
  }
}
```

---

## Utility Endpoints

### Health Check
**GET** `/health`

Check API health status.

**Response**:
```json
{
  "success": true,
  "message": "PC Builder API is healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "version": "1.0.0"
}
```

---

## Error Responses

All endpoints return consistent error responses:

```json
{
  "success": false,
  "message": "Error description",
  "error": "ERROR_CODE"
}
```

### Common Error Codes
- `VALIDATION_FAILED`: Request validation failed
- `UNAUTHORIZED`: Authentication required
- `FORBIDDEN`: Access denied
- `NOT_FOUND`: Resource not found
- `RATE_LIMIT_EXCEEDED`: Too many requests
- `INTERNAL_SERVER_ERROR`: Server error

### HTTP Status Codes
- `200`: Success
- `201`: Created
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `409`: Conflict
- `429`: Too Many Requests
- `500`: Internal Server Error

---

## Component Categories

Supported component categories:
- `cpu` - Processors
- `gpu` - Graphics Cards
- `motherboard` - Motherboards
- `ram` - Memory
- `storage` - Storage Devices (SSD/HDD)
- `psu` - Power Supply Units
- `case` - PC Cases
- `cooler` - CPU Coolers
- `fans` - Case Fans

## Build Types

Available build types:
- `gaming` - Gaming builds
- `workstation` - Workstation builds
- `budget` - Budget builds
- `custom` - Custom builds
