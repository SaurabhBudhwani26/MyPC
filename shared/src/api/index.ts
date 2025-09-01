// API Configuration
export const API_CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api',
  TIMEOUT: 10000,
  RETRY_ATTEMPTS: 3,
};

// Store configurations for affiliate APIs
export const STORE_CONFIG = {
  AMAZON: {
    BASE_URL: 'https://www.amazon.in',
    AFFILIATE_TAG: process.env.AMAZON_AFFILIATE_TAG || '',
    PA_API_ACCESS_KEY: process.env.AMAZON_PA_API_ACCESS_KEY || '',
    PA_API_SECRET_KEY: process.env.AMAZON_PA_API_SECRET_KEY || '',
  },
  FLIPKART: {
    BASE_URL: 'https://www.flipkart.com',
    AFFILIATE_ID: process.env.FLIPKART_AFFILIATE_ID || '',
    AFFILIATE_TOKEN: process.env.FLIPKART_AFFILIATE_TOKEN || '',
  },
};

// API endpoints
export const ENDPOINTS = {
  SEARCH_PARTS: '/search',
  GET_PART: '/parts/:id',
  GET_OFFERS: '/parts/:id/offers',
  BUILD_PRICE: '/builds/price',
  TODAY_DEALS: '/deals/today',
  PRICE_HISTORY: '/parts/:id/price-history',
} as const;

// HTTP status codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
} as const;

// Cache durations (in minutes)
export const CACHE_DURATION = {
  PART_DETAILS: 30,
  PRICE_DATA: 15,
  HOTLIST: 60,
  SEARCH_RESULTS: 10,
} as const;
