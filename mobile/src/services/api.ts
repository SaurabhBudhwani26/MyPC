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
      // Use Amazon API directly for all product search (no limits)
      const { amazonSearchAPIService } = await import('./amazon-search-api');
      
      console.log(`🛒 Searching Amazon for ALL results: ${query}`);
      const components = await amazonSearchAPIService.searchProducts(query, filters?.category);
      
      console.log(`📦 Amazon returned ${components.length} total components`);
      
      // Filter by category if specified
      if (filters?.category) {
        const filtered = components.filter(comp => 
          comp.category?.toLowerCase() === filters.category?.toLowerCase()
        );
        console.log(`🎯 Filtered to ${filtered.length} components for category: ${filters.category}`);
        return filtered;
      }
      
      return components;
    } catch (error) {
      console.error('Error searching Amazon components:', error);
      // Return mock data as fallback
      return this.getMockSearchResults(query);
    }
  }

  // Paginated search for infinite scroll
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
      // Use Amazon API paginated search
      const { amazonSearchAPIService } = await import('./amazon-search-api');
      
      console.log(`🔍 Paginated search: "${query}" - Page ${page}`);
      const result = await amazonSearchAPIService.searchProductsPaginated(query, page, filters?.category);
      
      let components = result.components;
      console.log(`📦 Page ${page}: ${components.length} components from Amazon`);
      
      // Apply additional filters if specified
      if (filters?.minPrice || filters?.maxPrice) {
        components = components.filter(comp => {
          const price = comp.averagePrice || 0;
          const minOk = !filters.minPrice || price >= filters.minPrice;
          const maxOk = !filters.maxPrice || price <= filters.maxPrice;
          return minOk && maxOk;
        });
        console.log(`💰 After price filter: ${components.length} components`);
      }
      
      if (filters?.brand) {
        components = components.filter(comp => 
          comp.brand?.toLowerCase().includes(filters.brand!.toLowerCase())
        );
        console.log(`🏷️ After brand filter: ${components.length} components`);
      }
      
      return {
        components,
        totalComponents: result.totalProducts,
        hasMore: result.hasMore,
        currentPage: result.currentPage
      };
      
    } catch (error) {
      console.error(`❌ Error in paginated search (page ${page}):`, error);
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
      // Use Amazon API directly for all category results (no limits)
      const { amazonSearchAPIService } = await import('./amazon-search-api');
      let searchQuery = category;
      
      // Map category to better search terms for Amazon
      switch (category.toLowerCase()) {
        case 'cpu':
          searchQuery = 'processor intel amd ryzen core i3 i5 i7 i9';
          break;
        case 'gpu':
          searchQuery = 'graphics card rtx gtx radeon nvidia amd';
          break;
        case 'ram':
          searchQuery = 'memory ram ddr4 ddr5 corsair gskill crucial';
          break;
        case 'motherboard':
          searchQuery = 'motherboard mainboard asus msi gigabyte asrock';
          break;
        case 'storage':
          searchQuery = 'ssd nvme hard drive storage samsung wd seagate';
          break;
        case 'psu':
          searchQuery = 'power supply psu smps corsair seasonic evga';
          break;
        case 'case':
          searchQuery = 'pc cabinet case tower mid tower full tower';
          break;
        case 'cooling':
          searchQuery = 'cpu cooler fan liquid cooling aio corsair noctua';
          break;
      }
      
      console.log(`🛒 Fetching ALL Amazon results for category: ${category}`);
      const components = await amazonSearchAPIService.searchProducts(searchQuery, category);
      
      console.log(`📦 Category ${category}: Found ${components.length} total Amazon components`);
      return components;
    } catch (error) {
      console.error('Error fetching Amazon components by category:', error);
      // Return mock data as fallback
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

  // Deals and Price Alerts - Get all Amazon deals
  async getTodayDeals(): Promise<ComponentOffer[]> {
    try {
      // Get deals from Amazon API directly
      const { amazonSearchAPIService } = await import('./amazon-search-api');
      
      console.log('🎯 Fetching ALL Amazon deals...');
      const dealQueries = [
        'gaming laptop deal',
        'graphics card deal', 
        'processor deal',
        'ram memory deal',
        'ssd nvme deal',
        'motherboard deal'
      ];
      
      let allDeals: ComponentOffer[] = [];
      
      for (const query of dealQueries) {
        try {
          const components = await amazonSearchAPIService.searchProducts(query);
          
          // Convert components to offers format
          const offers: ComponentOffer[] = components
            .filter(comp => comp.offers && comp.offers.length > 0)
            .flatMap(comp => comp.offers.map(offer => ({
              ...offer,
              componentId: comp.id,
              componentName: comp.name,
              componentImage: comp.imageUrl
            })));
          
          allDeals = [...allDeals, ...offers];
        } catch (err) {
          console.warn(`Failed to fetch deals for: ${query}`, err);
        }
      }
      
      // Sort by discount and return unique deals
      const uniqueDeals = allDeals
        .filter((deal, index, arr) => 
          arr.findIndex(d => d.componentId === deal.componentId) === index
        )
        .sort((a, b) => (b.discount || 0) - (a.discount || 0));
      
      console.log(`🎉 Found ${uniqueDeals.length} total Amazon deals`);
      return uniqueDeals;
    } catch (error) {
      console.error('Error fetching Amazon deals:', error);
      return this.getMockDeals();
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
}

// Export singleton instance
export const apiService = new ApiService();

// Export types for external use
export type { PCComponent, ComponentOffer, PCBuild, PriceAlert };

// Export API client for custom requests
export { apiClient };
