import { PCComponent, ComponentOffer } from '../types';

// Amazon PA-API Configuration
interface AmazonAPIConfig {
  accessKey: string;
  secretKey: string;
  partnerTag: string;
  host: string;
  region: string;
  marketplace: string;
}

// Amazon PA-API Response Types
interface AmazonProduct {
  ASIN: string;
  DetailPageURL: string;
  Images?: {
    Primary?: {
      Large?: {
        URL: string;
        Height: number;
        Width: number;
      };
    };
  };
  ItemInfo?: {
    Title?: {
      DisplayValue: string;
    };
    ByLineInfo?: {
      Brand?: {
        DisplayValue: string;
      };
    };
    Features?: {
      DisplayValues: string[];
    };
  };
  Offers?: {
    Listings?: Array<{
      Price?: {
        Amount: number;
        Currency: string;
        DisplayAmount: string;
      };
      SavingBasis?: {
        Amount: number;
        Currency: string;
        DisplayAmount: string;
      };
      Availability?: {
        Message: string;
      };
    }>;
  };
  CustomerReviews?: {
    Count?: number;
    StarRating?: {
      Value: number;
    };
  };
}

interface AmazonSearchResponse {
  SearchResult?: {
    Items: AmazonProduct[];
    TotalResultCount: number;
  };
  Errors?: Array<{
    Code: string;
    Message: string;
  }>;
}

class AmazonAPIService {
  private config: AmazonAPIConfig;
  private isConfigured: boolean = false;

  constructor() {
    this.config = {
      accessKey: process.env.AMAZON_ACCESS_KEY_ID || '',
      secretKey: process.env.AMAZON_SECRET_ACCESS_KEY || '',
      partnerTag: process.env.AMAZON_PARTNER_TAG || '',
      host: process.env.AMAZON_HOST || 'webservices.amazon.in',
      region: process.env.AMAZON_REGION || 'us-east-1',
      marketplace: 'www.amazon.in',
    };

    this.isConfigured = !!(
      this.config.accessKey &&
      this.config.secretKey &&
      this.config.partnerTag
    );

    if (process.env.EXPO_PUBLIC_DEBUG_MODE === 'true') {
      console.log('🛒 Amazon API Service initialized', {
        configured: this.isConfigured,
        host: this.config.host,
      });
    }
  }

  /**
   * Search for PC components on Amazon
   */
  async searchComponents(query: string, category?: string): Promise<PCComponent[]> {
    if (!this.isConfigured) {
      console.warn('Amazon API not configured, using mock data');
      return this.getMockAmazonProducts(query);
    }

    try {
      const searchIndex = this.mapCategoryToSearchIndex(category);
      const response = await this.performSearch(query, searchIndex);
      
      if (response.Errors && response.Errors.length > 0) {
        console.error('Amazon API errors:', response.Errors);
        return this.getMockAmazonProducts(query);
      }

      if (!response.SearchResult?.Items) {
        return [];
      }

      return response.SearchResult.Items.map(item => this.transformAmazonProduct(item));
    } catch (error) {
      console.error('Error searching Amazon:', error);
      return this.getMockAmazonProducts(query);
    }
  }

  /**
   * Get product details by ASIN
   */
  async getProductDetails(asin: string): Promise<PCComponent | null> {
    if (!this.isConfigured) {
      console.warn('Amazon API not configured');
      return null;
    }

    try {
      const response = await this.performGetItems([asin]);
      
      if (response.Errors && response.Errors.length > 0) {
        console.error('Amazon API errors:', response.Errors);
        return null;
      }

      if (!response.ItemsResult?.Items || response.ItemsResult.Items.length === 0) {
        return null;
      }

      return this.transformAmazonProduct(response.ItemsResult.Items[0]);
    } catch (error) {
      console.error('Error getting Amazon product details:', error);
      return null;
    }
  }

  /**
   * Generate affiliate link for Amazon product
   */
  generateAffiliateLink(asin: string, additionalParams?: Record<string, string>): string {
    const baseUrl = `https://amazon.in/dp/${asin}`;
    const params = new URLSearchParams();
    
    if (this.config.partnerTag) {
      params.append('tag', this.config.partnerTag);
    }
    
    // Add tracking parameters
    params.append('linkCode', 'as2');
    params.append('camp', '3638');
    params.append('creative', '24630');
    
    if (additionalParams) {
      Object.entries(additionalParams).forEach(([key, value]) => {
        params.append(key, value);
      });
    }

    return `${baseUrl}?${params.toString()}`;
  }

  /**
   * Perform Amazon PA-API search
   * Note: This is a simplified implementation. In production, you'd need proper
   * AWS signature calculation and request signing.
   */
  private async performSearch(keyword: string, searchIndex: string): Promise<AmazonSearchResponse> {
    // This is where you'd implement the actual Amazon PA-API call
    // For now, returning mock data structure
    throw new Error('Amazon PA-API implementation required - please configure AWS credentials and implement request signing');
  }

  /**
   * Perform Amazon PA-API GetItems operation
   */
  private async performGetItems(asins: string[]): Promise<any> {
    // This is where you'd implement the actual Amazon PA-API GetItems call
    throw new Error('Amazon PA-API implementation required');
  }

  /**
   * Transform Amazon product data to our PCComponent structure
   */
  private transformAmazonProduct(item: AmazonProduct): PCComponent {
    const title = item.ItemInfo?.Title?.DisplayValue || 'Unknown Product';
    const brand = item.ItemInfo?.ByLineInfo?.Brand?.DisplayValue || 'Unknown';
    
    // Extract category from title/features (simplified logic)
    const category = this.extractCategory(title, item.ItemInfo?.Features?.DisplayValues || []);
    
    const price = item.Offers?.Listings?.[0]?.Price?.Amount || 0;
    const originalPrice = item.Offers?.Listings?.[0]?.SavingBasis?.Amount;
    const discount = originalPrice && price ? Math.round(((originalPrice - price) / originalPrice) * 100) : undefined;

    const availability = item.Offers?.Listings?.[0]?.Availability?.Message || 'in_stock';
    
    const offers: ComponentOffer[] = [{
      id: `amazon-${item.ASIN}`,
      componentId: item.ASIN,
      retailer: 'Amazon',
      price: price,
      originalPrice: originalPrice,
      discount: discount,
      availability: this.mapAvailability(availability),
      url: this.generateAffiliateLink(item.ASIN),
      lastUpdated: new Date().toISOString(),
      shipping: {
        cost: 0, // Amazon typically offers free shipping on eligible items
        estimatedDays: 2,
        free: true,
      },
    }];

    return {
      id: item.ASIN,
      name: title,
      brand: brand,
      category: category,
      model: this.extractModel(title),
      description: item.ItemInfo?.Features?.DisplayValues?.join('; ') || title,
      imageUrl: item.Images?.Primary?.Large?.URL,
      rating: item.CustomerReviews?.StarRating?.Value,
      reviewCount: item.CustomerReviews?.Count,
      availability: this.mapAvailability(availability),
      averagePrice: price,
      priceRange: {
        min: price,
        max: originalPrice || price,
      },
      lastUpdated: new Date().toISOString(),
      specifications: this.extractSpecifications(item.ItemInfo?.Features?.DisplayValues || []),
      offers: offers,
    };
  }

  /**
   * Map category to Amazon search index
   */
  private mapCategoryToSearchIndex(category?: string): string {
    const categoryMap: Record<string, string> = {
      'CPU': 'Electronics',
      'GPU': 'Electronics', 
      'RAM': 'Electronics',
      'Motherboard': 'Electronics',
      'Storage': 'Electronics',
      'PSU': 'Electronics',
      'Case': 'Electronics',
      'Cooling': 'Electronics',
    };

    return categoryMap[category || ''] || 'Electronics';
  }

  /**
   * Extract component category from title and features
   */
  private extractCategory(title: string, features: string[]): string {
    const titleLower = title.toLowerCase();
    const featuresText = features.join(' ').toLowerCase();
    const text = `${titleLower} ${featuresText}`;

    if (text.includes('processor') || text.includes('cpu') || text.includes('ryzen') || text.includes('intel')) {
      return 'CPU';
    }
    if (text.includes('graphics card') || text.includes('gpu') || text.includes('geforce') || text.includes('radeon')) {
      return 'GPU';
    }
    if (text.includes('memory') || text.includes('ram') || text.includes('ddr')) {
      return 'RAM';
    }
    if (text.includes('motherboard') || text.includes('mobo')) {
      return 'Motherboard';
    }
    if (text.includes('ssd') || text.includes('hdd') || text.includes('storage') || text.includes('nvme')) {
      return 'Storage';
    }
    if (text.includes('power supply') || text.includes('psu')) {
      return 'PSU';
    }
    if (text.includes('case') || text.includes('cabinet')) {
      return 'Case';
    }
    if (text.includes('cooler') || text.includes('cooling') || text.includes('fan')) {
      return 'Cooling';
    }

    return 'Other';
  }

  /**
   * Extract model from product title
   */
  private extractModel(title: string): string {
    // Simple regex to extract model numbers/names
    const modelMatch = title.match(/([A-Z0-9]+[-\s][A-Z0-9]+)|([A-Z]+\s?\d+[A-Z]*)/i);
    return modelMatch?.[0] || title.split(' ').slice(0, 3).join(' ');
  }

  /**
   * Map Amazon availability to our enum
   */
  private mapAvailability(availability: string): 'in_stock' | 'out_of_stock' | 'limited' {
    const availLower = availability.toLowerCase();
    if (availLower.includes('in stock') || availLower.includes('available')) {
      return 'in_stock';
    }
    if (availLower.includes('out of stock') || availLower.includes('unavailable')) {
      return 'out_of_stock';
    }
    return 'limited';
  }

  /**
   * Extract specifications from features
   */
  private extractSpecifications(features: string[]): Record<string, any> {
    const specs: Record<string, any> = {};
    
    features.forEach(feature => {
      // Extract common specifications
      if (feature.includes('GHz')) {
        const speedMatch = feature.match(/(\d+\.?\d*)\s*GHz/i);
        if (speedMatch) specs.clockSpeed = `${speedMatch[1]} GHz`;
      }
      
      if (feature.includes('GB') && feature.includes('DDR')) {
        const memoryMatch = feature.match(/(\d+)\s*GB.*?(DDR\d+)/i);
        if (memoryMatch) {
          specs.memory = `${memoryMatch[1]}GB`;
          specs.memoryType = memoryMatch[2];
        }
      }
      
      if (feature.includes('Core')) {
        const coreMatch = feature.match(/(\d+)[-\s]?Core/i);
        if (coreMatch) specs.cores = parseInt(coreMatch[1]);
      }

      if (feature.includes('Thread')) {
        const threadMatch = feature.match(/(\d+)[-\s]?Thread/i);
        if (threadMatch) specs.threads = parseInt(threadMatch[1]);
      }
    });

    return specs;
  }

  /**
   * Get mock Amazon products for development/fallback
   */
  private getMockAmazonProducts(query: string): PCComponent[] {
    const mockProducts: PCComponent[] = [
      {
        id: 'B08166SLDF',
        name: 'AMD Ryzen 7 5800X Desktop Processor',
        brand: 'AMD',
        category: 'CPU',
        model: 'Ryzen 7 5800X',
        description: '8 Cores, 16 Threads Unlocked Desktop Processor Without Cooler',
        imageUrl: 'https://m.media-amazon.com/images/I/61vGQNUEsZL._SL1500_.jpg',
        rating: 4.6,
        reviewCount: 3847,
        availability: 'in_stock',
        averagePrice: 26999,
        priceRange: { min: 25999, max: 29999 },
        lastUpdated: new Date().toISOString(),
        specifications: {
          cores: 8,
          threads: 16,
          baseClock: '3.8 GHz',
          boostClock: '4.7 GHz',
          socket: 'AM4',
          tdp: '105W',
        },
        offers: [{
          id: 'amazon-B08166SLDF',
          componentId: 'B08166SLDF',
          retailer: 'Amazon',
          price: 26999,
          originalPrice: 29999,
          discount: 10,
          availability: 'in_stock',
          url: this.generateAffiliateLink('B08166SLDF'),
          lastUpdated: new Date().toISOString(),
          shipping: { cost: 0, estimatedDays: 1, free: true },
        }],
      },
      {
        id: 'B097YW4FW9',
        name: 'NVIDIA GeForce RTX 3060 Ti Founders Edition',
        brand: 'NVIDIA',
        category: 'GPU',
        model: 'RTX 3060 Ti',
        description: '8GB GDDR6 Graphics Card with Ray Tracing',
        imageUrl: 'https://m.media-amazon.com/images/I/81Q+8RLPL9L._SL1500_.jpg',
        rating: 4.5,
        reviewCount: 1254,
        availability: 'limited',
        averagePrice: 32999,
        priceRange: { min: 31999, max: 35999 },
        lastUpdated: new Date().toISOString(),
        specifications: {
          memory: '8GB GDDR6',
          memoryBus: '256-bit',
          baseClock: '1410 MHz',
          boostClock: '1665 MHz',
          cuda: 4864,
        },
        offers: [{
          id: 'amazon-B097YW4FW9',
          componentId: 'B097YW4FW9',
          retailer: 'Amazon',
          price: 32999,
          availability: 'limited',
          url: this.generateAffiliateLink('B097YW4FW9'),
          lastUpdated: new Date().toISOString(),
          shipping: { cost: 0, estimatedDays: 3, free: true },
        }],
      },
    ];

    return mockProducts.filter(product => 
      product.name.toLowerCase().includes(query.toLowerCase()) ||
      product.category.toLowerCase().includes(query.toLowerCase())
    );
  }
}

// Export singleton instance
export const amazonAPIService = new AmazonAPIService();
