import { PCComponent, ComponentOffer } from '../types';

// Flipkart API Configuration
interface FlipkartAPIConfig {
  affiliateId: string;
  affiliateToken: string;
  apiUrl: string;
}

// Flipkart API Response Types
interface FlipkartProduct {
  productId: string;
  productUrl: string;
  title: string;
  productBrand?: string;
  productCategory?: string;
  imageUrl?: string;
  images?: {
    '200x200'?: string;
    '400x400'?: string;
  };
  sellingPrice?: {
    amount: number;
    currency: string;
  };
  mrp?: {
    amount: number;
    currency: string;
  };
  discount?: string;
  availability?: boolean;
  inStock?: boolean;
  productRating?: string;
  totalRatingCount?: number;
  productDescription?: string;
  specifications?: Record<string, any>;
}

interface FlipkartSearchResponse {
  products?: FlipkartProduct[];
  totalResults?: number;
  nextUrl?: string;
}

class FlipkartAPIService {
  private config: FlipkartAPIConfig;
  private isConfigured: boolean = false;

  constructor() {
    this.config = {
      affiliateId: process.env.FLIPKART_AFFILIATE_ID || '',
      affiliateToken: process.env.FLIPKART_AFFILIATE_TOKEN || '',
      apiUrl: process.env.FLIPKART_API_URL || 'https://affiliate-api.flipkart.net',
    };

    this.isConfigured = !!(
      this.config.affiliateId &&
      this.config.affiliateToken
    );

    if (process.env.EXPO_PUBLIC_DEBUG_MODE === 'true') {
      console.log('🛍️ Flipkart API Service initialized', {
        configured: this.isConfigured,
        apiUrl: this.config.apiUrl,
      });
    }
  }

  async searchComponents(query: string, category?: string): Promise<PCComponent[]> {
    // Check if using demo/fake credentials
    const isDemoMode = this.config.affiliateId === 'demo_affiliate_id' || 
                       this.config.affiliateToken === 'demo_affiliate_token';
    
    if (!this.isConfigured || isDemoMode) {
      if (isDemoMode) {
        console.log('🎭 Flipkart API in demo mode, using enhanced mock data');
      } else {
        console.warn('Flipkart API not configured, using mock data');
      }
      return
    }

    try {
      const flipkartCategory = this.mapCategoryToFlipkartCategory(category);
      const response = await this.performSearch(query, flipkartCategory);
      
      if (!response.products) {
        return [];
      }

      return response.products.map(item => this.transformFlipkartProduct(item));
    } catch (error) {
      console.error('Error searching Flipkart:', error);
      return
    }
  }

  async getProductDetails(productId: string): Promise<PCComponent | null> {
    if (!this.isConfigured) {
      return null;
    }

    try {
      const response = await this.performGetProduct(productId);
      if (!response) return null;
      return this.transformFlipkartProduct(response);
    } catch (error) {
      console.error('Error getting Flipkart product details:', error);
      return null;
    }
  }

  generateAffiliateLink(productId: string, productUrl?: string): string {
    if (!productUrl) {
      productUrl = `https://www.flipkart.com/p/${productId}`;
    }

    const affiliateUrl = new URL(productUrl);
    
    if (this.config.affiliateId) {
      affiliateUrl.searchParams.append('affid', this.config.affiliateId);
    }
    
    affiliateUrl.searchParams.append('affExtParam1', 'my-pc-app');
    affiliateUrl.searchParams.append('affExtParam2', 'mobile');
    
    return affiliateUrl.toString();
  }

  private async performSearch(query: string, category?: string): Promise<FlipkartSearchResponse> {
    const url = new URL(`${this.config.apiUrl}/affiliate/1.0/search.json`);
    url.searchParams.append('query', query);
    
    if (category) {
      url.searchParams.append('category', category);
    }
    
    const response = await fetch(url.toString(), {
      headers: {
        'Fk-Affiliate-Id': this.config.affiliateId,
        'Fk-Affiliate-Token': this.config.affiliateToken,
      },
    });

    if (!response.ok) {
      throw new Error(`Flipkart API error: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  }

  private async performGetProduct(productId: string): Promise<FlipkartProduct | null> {
    const url = `${this.config.apiUrl}/affiliate/1.0/product.json`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Fk-Affiliate-Id': this.config.affiliateId,
        'Fk-Affiliate-Token': this.config.affiliateToken,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ productId }),
    });

    if (!response.ok) {
      throw new Error(`Flipkart API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.product || null;
  }

  private transformFlipkartProduct(item: FlipkartProduct): PCComponent {
    const title = item.title || 'Unknown Product';
    const brand = item.productBrand || this.extractBrand(title);
    const category = this.extractCategory(title, item.productCategory);
    
    const price = item.sellingPrice?.amount || 0;
    const originalPrice = item.mrp?.amount;
    const discountText = item.discount;
    
    let discount: number | undefined;
    if (discountText) {
      const discountMatch = discountText.match(/(\d+)%/);
      if (discountMatch) {
        discount = parseInt(discountMatch[1]);
      }
    }

    const availability = (item.availability && item.inStock) ? 'in_stock' : 'out_of_stock';
    
    const offers: ComponentOffer[] = [{
      id: `flipkart-${item.productId}`,
      componentId: item.productId,
      retailer: 'Flipkart',
      price: price,
      originalPrice: originalPrice,
      discount: discount,
      availability: this.mapAvailability(availability),
      url: this.generateAffiliateLink(item.productId, item.productUrl),
      lastUpdated: new Date().toISOString(),
      shipping: {
        cost: 40,
        estimatedDays: 3,
        free: price > 500,
      },
    }];

    return {
      id: item.productId,
      name: title,
      brand: brand,
      category: category,
      model: this.extractModel(title),
      description: item.productDescription || title,
      imageUrl: item.imageUrl || item.images?.['400x400'] || item.images?.['200x200'],
      rating: item.productRating ? parseFloat(item.productRating) : undefined,
      reviewCount: item.totalRatingCount,
      availability: this.mapAvailability(availability),
      averagePrice: price,
      priceRange: { min: price, max: originalPrice || price },
      lastUpdated: new Date().toISOString(),
      specifications: item.specifications || this.extractSpecifications(title, item.productDescription || ''),
      offers: offers,
      discount: discount,
      url: this.generateAffiliateLink(item.productId, item.productUrl),
      price: price
    };
  }

  private mapCategoryToFlipkartCategory(category?: string): string | undefined {
    const categoryMap: Record<string, string> = {
      'CPU': 'computers/computer-components/processors',
      'GPU': 'computers/computer-components/graphic-cards',
      'RAM': 'computers/computer-components/ram',
      'Motherboard': 'computers/computer-components/motherboards',
      'Storage': 'computers/storage',
      'PSU': 'computers/computer-components/smps',
      'Case': 'computers/computer-components/computer-cabinets',
      'Cooling': 'computers/computer-components/cpu-coolers',
    };
    return categoryMap[category || ''];
  }

  private extractCategory(title: string, flipkartCategory?: string): string {
    const titleLower = title.toLowerCase();
    const categoryLower = flipkartCategory?.toLowerCase() || '';
    const text = `${titleLower} ${categoryLower}`;

    if (text.includes('processor') || text.includes('cpu') || text.includes('ryzen') || text.includes('intel')) return 'CPU';
    if (text.includes('graphics card') || text.includes('gpu') || text.includes('geforce') || text.includes('radeon')) return 'GPU';
    if (text.includes('memory') || text.includes('ram') || text.includes('ddr')) return 'RAM';
    if (text.includes('motherboard') || text.includes('mobo')) return 'Motherboard';
    if (text.includes('ssd') || text.includes('hdd') || text.includes('storage') || text.includes('nvme')) return 'Storage';
    if (text.includes('power supply') || text.includes('psu') || text.includes('smps')) return 'PSU';
    if (text.includes('cabinet') || text.includes('case')) return 'Case';
    if (text.includes('cooler') || text.includes('cooling') || text.includes('fan')) return 'Cooling';
    return 'Other';
  }

  private extractBrand(title: string): string {
    const commonBrands = [
      'AMD', 'Intel', 'NVIDIA', 'ASUS', 'MSI', 'Gigabyte', 'ASRock', 
      'Corsair', 'G.Skill', 'Kingston', 'Samsung', 'Western Digital', 
      'Seagate', 'Cooler Master', 'Thermaltake', 'NZXT', 'Fractal Design'
    ];

    for (const brand of commonBrands) {
      if (title.toLowerCase().includes(brand.toLowerCase())) {
        return brand;
      }
    }

    return title.split(' ')[0];
  }

  private extractModel(title: string): string {
    const modelMatch = title.match(/([A-Z0-9]+[-\s][A-Z0-9]+)|([A-Z]+\s?\d+[A-Z]*)/i);
    return modelMatch?.[0] || title.split(' ').slice(0, 3).join(' ');
  }

  private mapAvailability(availability: string): 'in_stock' | 'out_of_stock' | 'limited' {
    if (availability === 'in_stock') return 'in_stock';
    if (availability === 'out_of_stock') return 'out_of_stock';
    return 'limited';
  }

  private extractSpecifications(title: string, description: string): Record<string, any> {
    const specs: Record<string, any> = {};
    const text = `${title} ${description}`.toLowerCase();
    
    const ghzMatch = text.match(/(\d+\.?\d*)\s*ghz/i);
    if (ghzMatch) specs.clockSpeed = `${ghzMatch[1]} GHz`;
    
    const memoryMatch = text.match(/(\d+)\s*gb.*?(ddr\d+)/i);
    if (memoryMatch) {
      specs.memory = `${memoryMatch[1]}GB`;
      specs.memoryType = memoryMatch[2].toUpperCase();
    }
    
    const coreMatch = text.match(/(\d+)[-\s]?core/i);
    if (coreMatch) specs.cores = parseInt(coreMatch[1]);
    
    const threadMatch = text.match(/(\d+)[-\s]?thread/i);
    if (threadMatch) specs.threads = parseInt(threadMatch[1]);

    return specs;
  }

}

export const flipkartAPIService = new FlipkartAPIService();
