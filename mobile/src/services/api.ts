import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { PCComponent, ComponentOffer, PCBuild, PriceAlert } from '../types';
import { useAuth } from '../context/AuthContext';

// API Configuration
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001/api';
const WEB_URL = process.env.EXPO_PUBLIC_WEB_URL || 'http://localhost:3000';
const DEBUG_MODE = process.env.EXPO_PUBLIC_DEBUG_MODE === 'true';

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for debugging
apiClient.interceptors.request.use(
  (config) => {
    if (DEBUG_MODE) {
      console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`);
    }
    return config;
  },
  (error) => {
    console.error('❌ API Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for debugging and error handling
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    if (DEBUG_MODE) {
      console.log(`✅ API Response: ${response.status} ${response.config.url}`);
    }
    return response;
  },
  (error) => {
    console.error('❌ API Response Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// API Service Class
class ApiService {
  // Component Search and Retrieval
  async searchComponents(query: string, filters?: {
    category?: string;
    minPrice?: number;
    maxPrice?: number;
    brand?: string;
    limit?: number;
  }): Promise<PCComponent[]> {
    try {
      console.log(`🔍 Searching backend for: ${query}`);
      
      const params = new URLSearchParams();
      params.append('query', query);
      if (filters?.category) params.append('category', filters.category);
      if (filters?.minPrice) params.append('minPrice', filters.minPrice.toString());
      if (filters?.maxPrice) params.append('maxPrice', filters.maxPrice.toString());
      if (filters?.brand) params.append('brand', filters.brand);
      if (filters?.limit) params.append('limit', filters.limit.toString());
      
      const response = await apiClient.get(`/components/search?${params.toString()}`);
      
      if (response.data.success && response.data.data) {
        console.log(`📦 Backend returned ${response.data.data.components.length} components`);
        return response.data.data.components;
      } else {
        throw new Error(response.data.message || 'Search failed');
      }
    } catch (error) {
      console.error('Error searching backend components:', error);
      console.log('🚑 Falling back to mock data...');
      return this.getMockSearchResults(query);
    }
  }

  // Paginated search for infinite scroll using multi-source affiliate service
  async searchComponentsPaginated(
    query: string, 
    page: number = 1, 
    filters?: {
      category?: string;
      minPrice?: number;
      maxPrice?: number;
      brand?: string;
    }
  ): Promise<{
    components: PCComponent[];
    totalComponents: number;
    hasMore: boolean;
    currentPage: number;
  }> {
    try {
      // Use multi-source affiliate service (Amazon + Flipkart + EarnKaro)
      const { affiliateService } = await import('./affiliate-service');
      
      const resultsPerPage = 20;
      const startIndex = (page - 1) * resultsPerPage;
      
      console.log(`🔍 Multi-source paginated search: "${query}" - Page ${page}`);
      
      // Get results from all sources combined
      const searchOptions = {
        query,
        category: filters?.category,
        priceRange: (filters?.minPrice || filters?.maxPrice) ? {
          min: filters?.minPrice || 0,
          max: filters?.maxPrice || 999999
        } : undefined,
        sortBy: 'popular' as const,
        limit: resultsPerPage * Math.max(page, 3) // Get more results for pagination
      };
      
      const allResults = await affiliateService.searchComponents(searchOptions);
      
      // Apply brand filter if specified
      let filteredResults = allResults;
      if (filters?.brand) {
        filteredResults = allResults.filter(comp => 
          comp.brand?.toLowerCase().includes(filters.brand!.toLowerCase())
        );
        console.log(`🏷️ After brand filter: ${filteredResults.length} components`);
      }
      
      // Calculate pagination
      const totalComponents = filteredResults.length;
      const paginatedComponents = filteredResults.slice(startIndex, startIndex + resultsPerPage);
      const hasMore = startIndex + resultsPerPage < totalComponents;
      
      console.log(`📦 Page ${page}: Showing ${paginatedComponents.length}/${totalComponents} components from Amazon + Flipkart + EarnKaro`);
      
      // Log source breakdown
      const sourceCounts = paginatedComponents.reduce((acc, comp) => {
        const retailer = comp.offers?.[0]?.retailer || 'Unknown';
        acc[retailer] = (acc[retailer] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      console.log(`📊 Source breakdown for page ${page}:`, sourceCounts);
      
      return {
        components: paginatedComponents,
        totalComponents,
        hasMore,
        currentPage: page
      };
      
    } catch (error) {
      console.error(`❌ Error in multi-source paginated search (page ${page}):`, error);
      return {
        components: this.getMockSearchResults(query).slice(0, 20),
        totalComponents: 100,
        hasMore: page < 5,
        currentPage: page
      };
    }
  }

  async getComponentById(id: string): Promise<PCComponent | null> {
    try {
      const response = await apiClient.get(`/parts/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching component:', error);
      return null;
    }
  }

  async getComponentsByCategory(category: string): Promise<PCComponent[]> {
    try {
      console.log(`🎯 Fetching backend components for category: ${category}`);
      
      const params = new URLSearchParams();
      params.append('category', category);
      params.append('limit', '50'); // Get more results for category browsing
      
      const response = await apiClient.get(`/components/search?${params.toString()}`);
      
      if (response.data.success && response.data.data) {
        console.log(`📦 Backend returned ${response.data.data.components.length} components for category: ${category}`);
        return response.data.data.components;
      } else {
        throw new Error(response.data.message || 'Category search failed');
      }
    } catch (error) {
      console.error('Error fetching backend components by category:', error);
      console.log('🚑 Falling back to mock data...');
      return this.getMockCategoryResults(category);
    }
  }

  // Component Offers and Pricing
  async getComponentOffers(componentId: string): Promise<ComponentOffer[]> {
    try {
      const response = await apiClient.get(`/parts/${componentId}/offers`);
      return response.data.offers || [];
    } catch (error) {
      console.error('Error fetching component offers:', error);
      return [];
    }
  }

  // PC Build Management
  async calculateBuildPrice(components: string[]): Promise<{ total: number; breakdown: any[] }> {
    try {
      const response = await apiClient.post('/builds/price', { components });
      return response.data;
    } catch (error) {
      console.error('Error calculating build price:', error);
      return { total: 0, breakdown: [] };
    }
  }

  async validateBuildCompatibility(components: string[]): Promise<{ 
    compatible: boolean; 
    issues: string[]; 
    recommendations: string[] 
  }> {
    try {
      const response = await apiClient.post('/builds/validate', { components });
      return response.data;
    } catch (error) {
      console.error('Error validating build compatibility:', error);
      return { compatible: true, issues: [], recommendations: [] };
    }
  }

  // Get Today's Deals from Backend
  async getTodayDeals(): Promise<ComponentOffer[]> {
    console.log('🎯 Fetching today\'s deals from backend...');
    
    try {
      const response = await apiClient.get('/deals/today');
      
      if (response.data.success && response.data.data) {
        const deals = response.data.data.deals || [];
        console.log(`🎉 Backend returned ${deals.length} deals`);
        return deals;
      } else {
        throw new Error(response.data.message || 'Failed to fetch deals');
      }
    } catch (error) {
      console.error('❌ Error fetching backend deals:', error);
      console.log('🚑 Falling back to mock deals...');
      return this.getSimpleMockDeals();
    }
  }

  async createPriceAlert(componentId: string, targetPrice: number): Promise<PriceAlert | null> {
    try {
      const response = await apiClient.post('/alerts', { componentId, targetPrice });
      return response.data;
    } catch (error) {
      console.error('Error creating price alert:', error);
      return null;
    }
  }
  
  // Generate affiliate link when Buy Now is clicked
  async generateAffiliateLink(originalUrl: string): Promise<string> {
    try {
      const { affiliateService } = await import('./affiliate-service');
      
      console.log('💰 Converting to affiliate link:', originalUrl);
      const affiliateLinks = await affiliateService.convertLinksToAffiliate([originalUrl]);
      
      const affiliateUrl = affiliateLinks[originalUrl] || originalUrl;
      console.log('✅ Generated affiliate link:', affiliateUrl);
      
      return affiliateUrl;
    } catch (error) {
      console.error('Error generating affiliate link:', error);
      // Return original URL as fallback
      return originalUrl;
    }
  }

  // Health Check
  async checkApiHealth(): Promise<boolean> {
    try {
      const response = await apiClient.get('/health');
      return response.status === 200;
    } catch (error) {
      console.warn('API health check failed, using offline mode');
      return false;
    }
  }

  // Mock Data Methods (for development without backend)
  private getMockSearchResults(query: string): PCComponent[] {
    const mockComponents: PCComponent[] = [
      {
        id: 'cpu-ryzen-5-7600',
        name: 'AMD Ryzen 5 7600',
        category: 'CPU',
        brand: 'AMD',
        model: '7600',
        description: '6-Core, 12-Thread Desktop Processor',
        specifications: {
          cores: 6,
          threads: 12,
          baseClock: '3.8 GHz',
          boostClock: '5.1 GHz',
          socket: 'AM5',
          tdp: '65W'
        },
        imageUrl: 'https://example.com/ryzen-5-7600.jpg',
        averagePrice: 20999,
        priceRange: { min: 19999, max: 22999 },
        rating: 4.5,
        reviewCount: 128,
        availability: 'in_stock',
        lastUpdated: new Date().toISOString()
      },
      {
        id: 'gpu-rtx-4060-ti',
        name: 'NVIDIA GeForce RTX 4060 Ti',
        category: 'GPU',
        brand: 'NVIDIA',
        model: 'RTX 4060 Ti',
        description: '8GB GDDR6 Graphics Card',
        specifications: {
          memory: '8GB GDDR6',
          memoryBus: '128-bit',
          baseClock: '2310 MHz',
          boostClock: '2535 MHz',
          cuda: 4352
        },
        imageUrl: 'https://example.com/rtx-4060-ti.jpg',
        averagePrice: 35999,
        priceRange: { min: 34999, max: 38999 },
        rating: 4.3,
        reviewCount: 89,
        availability: 'in_stock',
        lastUpdated: new Date().toISOString()
      }
    ];

    return mockComponents.filter(component => 
      component.name.toLowerCase().includes(query.toLowerCase()) ||
      component.category.toLowerCase().includes(query.toLowerCase())
    );
  }

  private getMockCategoryResults(category: string): PCComponent[] {
    const allMockComponents = this.getMockSearchResults('');
    return allMockComponents.filter(component => 
      component.category.toLowerCase() === category.toLowerCase()
    );
  }

  private getMockDeals(): ComponentOffer[] {
    return [
      {
        id: 'deal-rtx-4060-ti-amazon',
        componentId: 'gpu-rtx-4060-ti',
        retailer: 'Amazon',
        price: 34999,
        originalPrice: 38999,
        discount: 10,
        url: 'https://amazon.in/deal-link',
        availability: 'in_stock',
        lastUpdated: new Date().toISOString(),
        validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        shipping: {
          cost: 0,
          estimatedDays: 2,
          free: true
        }
      }
    ];
  }
  
  private getSimpleMockDeals(): ComponentOffer[] {
    const mockDeals: ComponentOffer[] = [];
    
    // 15 Amazon deals
    for (let i = 0; i < 15; i++) {
      mockDeals.push({
        id: `amazon-mock-${i}`,
        componentId: `comp-amazon-${i}`,
        componentName: `Gaming Component ${i + 1}`,
        componentImage: 'https://via.placeholder.com/100',
        retailer: 'Amazon',
        price: 5000 + (i * 500),
        originalPrice: 6000 + (i * 600),
        discount: 15 + (i % 10),
        url: `https://amazon.in/deal-${i}`,
        availability: 'in_stock',
        lastUpdated: new Date().toISOString(),
        shipping: {
          cost: 0,
          estimatedDays: 2,
          free: true
        }
      });
    }
    
    // 15 Flipkart deals
    for (let i = 0; i < 15; i++) {
      mockDeals.push({
        id: `flipkart-mock-${i}`,
        componentId: `comp-flipkart-${i}`,
        componentName: `PC Component ${i + 1}`,
        componentImage: 'https://via.placeholder.com/100',
        retailer: 'Flipkart',
        price: 4500 + (i * 400),
        originalPrice: 5500 + (i * 500),
        discount: 10 + (i % 15),
        url: `https://flipkart.com/deal-${i}`,
        availability: 'in_stock',
        lastUpdated: new Date().toISOString(),
        shipping: {
          cost: 0,
          estimatedDays: 3,
          free: true
        }
      });
    }
    
    // Sort by discount (highest first)
    return mockDeals.sort((a, b) => (b.discount || 0) - (a.discount || 0));
  }
}

// Export singleton instance
export const apiService = new ApiService();

// Export types for external use
export type { PCComponent, ComponentOffer, PCBuild, PriceAlert };

// Export API client for custom requests
export { apiClient };
