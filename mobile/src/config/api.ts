// API Configuration
export const API_CONFIG = {
  BASE_URL: process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001/api',
  WEB_URL: process.env.EXPO_PUBLIC_WEB_URL || 'http://localhost:3000',
  DEBUG_MODE: process.env.EXPO_PUBLIC_DEBUG_MODE === 'true',
  ENABLE_MOCK_DATA: process.env.EXPO_PUBLIC_ENABLE_MOCK_DATA === 'true',
};

// API Endpoints
export const API_ENDPOINTS = {
  PC_BUILDER: '/pc-builder',
  COMPONENTS_SEARCH: '/components/search',
  HEALTH: '/health',
  PARTS_CATEGORY: '/parts/category',
};

// Helper function to build full URL
export const buildApiUrl = (endpoint: string): string => {
  return `${API_CONFIG.BASE_URL}${endpoint}`;
};
