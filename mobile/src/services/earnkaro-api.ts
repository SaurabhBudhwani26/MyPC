import { PCComponent, ComponentOffer } from '../types';

// EarnKaro API Configuration
interface EarnKaroAPIConfig {
  apiToken: string;
  apiUrl: string;
}

// EarnKaro API Response Types
interface EarnKaroConvertResponse {
  status: string;
  message: string;
  data: {
    converted_links: Array<{
      original_url: string;
      converted_url: string;
      merchant: string;
      commission_rate?: string;
    }>;
  };
}

interface EarnKaroDealsResponse {
  status: string;
  message: string;
  data: {
    deals: Array<{
      id: string;
      title: string;
      description: string;
      image_url: string;
      original_price: number;
      discounted_price: number;
      discount_percentage: number;
      merchant: string;
      category: string;
      product_url: string;
      affiliate_url: string;
      cashback_rate?: string;
      validity?: string;
    }>;
  };
}

interface EarnKaroProductSearchResponse {
  status: string;
  message: string;
  data?: {
    products: Array<{
      id: string;
      name: string;
      price: number;
      image: string;
      merchant: string;
      affiliate_link: string;
      rating?: number;
      reviews?: number;
    }>;
  };
}

class EarnKaroAPIService {
  private config: EarnKaroAPIConfig;
  private isConfigured: boolean = false;

  constructor() {
    this.config = {
      apiToken: process.env.EXPO_PUBLIC_EARNKARO_API_KEY || '',
      apiUrl: process.env.EXPO_PUBLIC_EARNKARO_API_URL || 'https://ekaro-api.affiliaters.in',
    };

    this.isConfigured = !!this.config.apiToken && this.config.apiToken !== '';

    if (process.env.EXPO_PUBLIC_DEBUG_MODE === 'true') {
      console.log('💰 EarnKaro API Service initialized', {
        configured: this.isConfigured,
        apiUrl: this.config.apiUrl,
        hasApiKey: !!this.config.apiToken,
        apiKeyLength: this.config.apiToken?.length || 0,
      });
    }
  }

  async convertLinks(urls: string[]): Promise<{ [key: string]: string }> {
    if (!this.isConfigured) {
      console.warn('EarnKaro API not configured, returning original URLs');
      const result: { [key: string]: string } = {};
      urls.forEach(url => result[url] = url);
      return result;
    }

    try {
      const dealText = urls.join('\n');
      const response = await this.performConversion(dealText);
      
      const convertedLinks: { [key: string]: string } = {};
      
      if (response.data?.converted_links) {
        response.data.converted_links.forEach(link => {
          convertedLinks[link.original_url] = link.converted_url;
        });
      }
      
      // Fill in any missing conversions with original URLs
      urls.forEach(url => {
        if (!convertedLinks[url]) {
          convertedLinks[url] = url;
        }
      });
      
      return convertedLinks;
    } catch (error) {
      console.error('Error converting links with EarnKaro:', error);
      
      // Return original URLs as fallback
      const result: { [key: string]: string } = {};
      urls.forEach(url => result[url] = url);
      return result;
    }
  }

  async convertSingleLink(url: string): Promise<string> {
    const result = await this.convertLinks([url]);
    return result[url] || url;
  }

  async searchDeals(query: string, category?: string): Promise<PCComponent[]> {
    if (!this.isConfigured) {
      console.log('🎭 EarnKaro API not configured, no deals available');
      return [];
    }

    // Check if using demo/test API key
    if (this.config.apiToken.includes('test_') || this.config.apiToken.includes('demo_')) {
      console.log('📝 Using demo API key, no real deals available');
      console.log('🔑 To use real EarnKaro data, get your API key from: https://www.earnkaro.com/');
      return [];
    }

    try {
      // Test converter endpoint first to verify API connectivity
      console.log('🔍 Testing EarnKaro API connectivity...');
      await this.testAPIConnectivity();
      
      // Try to search for real deals using EarnKaro API
      console.log('🔍 Searching EarnKaro for real deals...');
      const dealsResponse = await this.performDealsSearch(query, category);
      
      if (dealsResponse.status === 'success' && dealsResponse.data?.deals) {
        const pcComponents = dealsResponse.data.deals
          .filter(deal => this.isPCComponent(deal.title, deal.category))
          .map(deal => this.transformEarnKaroDeal(deal));
        
        console.log(`💰 EarnKaro found ${pcComponents.length} PC component deals`);
        return pcComponents;
      } else {
        console.log('📭 No deals found from EarnKaro API');
        return [];
      }
      
    } catch (error) {
      console.error('❌ Error connecting to EarnKaro API:', error);
      
      if (error.message && error.message.includes('401')) {
        console.log('🔑 Invalid API key. Get your real EarnKaro API key from: https://www.earnkaro.com/');
        console.log('📝 Update EXPO_PUBLIC_EARNKARO_API_KEY in your .env file');
      }
      
      console.log('📭 No EarnKaro deals available');
      return [];
    }
  }

  async testAPIConnectivity(): Promise<void> {
    console.log('🌐 Testing EarnKaro API at:', `${this.config.apiUrl}/api/converter/public`);
    
    // Test with a simple Amazon URL conversion
    const testUrl = 'https://www.amazon.in/dp/B08166SLDF';
    
    try {
      const response = await fetch(`${this.config.apiUrl}/api/converter/public`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          deal: testUrl,
          convert_option: 'convert_only',
        }),
      });

      console.log('📊 EarnKaro API Response Status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.log('❌ API Error Response:', errorText);
        throw new Error(`EarnKaro API test failed: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log('✅ EarnKaro API Test Success:', JSON.stringify(result, null, 2));
      
    } catch (error) {
      console.error('🚨 EarnKaro API Test Failed:', error);
      throw error;
    }
  }

  async getTrendingDeals(category?: string): Promise<EarnKaroDealsResponse> {
    const url = new URL(`${this.config.apiUrl}/deals/trending`);
    
    if (category) {
      // Map PC categories to EarnKaro categories
      const earnkaroCategory = this.mapToEarnKaroCategory(category);
      url.searchParams.append('category', earnkaroCategory);
    } else {
      url.searchParams.append('category', 'electronics');
    }
    
    const response = await fetch(url.toString(), {
      headers: {
        'Authorization': `Bearer ${this.config.apiToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`EarnKaro Trending API error: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  }

  private async performConversion(dealText: string): Promise<EarnKaroConvertResponse> {
    const response = await fetch(`${this.config.apiUrl}/api/converter/public`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.apiToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        deal: dealText,
        convert_option: 'convert_only',
      }),
    });

    if (!response.ok) {
      throw new Error(`EarnKaro API error: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  }

  private async performDealsSearch(query: string, category?: string): Promise<EarnKaroDealsResponse> {
    const url = new URL(`${this.config.apiUrl}/deals/search`);
    url.searchParams.append('query', query);
    
    if (category) {
      url.searchParams.append('category', category);
    }
    
    const response = await fetch(url.toString(), {
      headers: {
        'Authorization': `Bearer ${this.config.apiToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`EarnKaro API error: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  }

  private isPCComponent(title: string, category: string): boolean {
    const pcKeywords = [
      'processor', 'cpu', 'graphics card', 'gpu', 'motherboard', 'ram', 'memory',
      'ssd', 'hdd', 'storage', 'power supply', 'psu', 'cabinet', 'case', 'cooler',
      'intel', 'amd', 'nvidia', 'corsair', 'asus', 'msi', 'gigabyte', 'gaming'
    ];
    
    const text = `${title} ${category}`.toLowerCase();
    return pcKeywords.some(keyword => text.includes(keyword));
  }

  private transformEarnKaroDeal(deal: any): PCComponent {
    const category = this.extractCategory(deal.title, deal.category);
    const brand = this.extractBrand(deal.title);
    
    const offers: ComponentOffer[] = [{
      id: `earnkaro-${deal.id}`,
      componentId: deal.id,
      retailer: deal.merchant,
      price: deal.discounted_price,
      originalPrice: deal.original_price,
      discount: deal.discount_percentage,
      availability: 'in_stock',
      url: deal.affiliate_url,
      lastUpdated: new Date().toISOString(),
      shipping: {
        cost: 0,
        estimatedDays: 3,
        free: true,
      },
    }];

    return {
      id: deal.id,
      name: deal.title,
      brand: brand,
      category: category,
      model: this.extractModel(deal.title),
      description: deal.description || deal.title,
      imageUrl: deal.image_url,
      rating: undefined,
      reviewCount: undefined,
      availability: 'in_stock',
      averagePrice: deal.discounted_price,
      priceRange: { 
        min: deal.discounted_price, 
        max: deal.original_price 
      },
      lastUpdated: new Date().toISOString(),
      specifications: this.extractSpecifications(deal.title, deal.description || ''),
      offers: offers,
      discount: deal.discount_percentage,
      url: deal.affiliate_url,
      price: deal.discounted_price
    };
  }

  private extractCategory(title: string, category: string): string {
    const titleLower = title.toLowerCase();
    const categoryLower = category.toLowerCase();
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

  private mapToEarnKaroCategory(category: string): string {
    const categoryMap: { [key: string]: string } = {
      'CPU': 'electronics',
      'GPU': 'electronics', 
      'RAM': 'electronics',
      'Motherboard': 'electronics',
      'Storage': 'electronics',
      'PSU': 'electronics',
      'Case': 'electronics',
      'Cooling': 'electronics',
    };
    
    return categoryMap[category] || 'electronics';
  }

}

export const earnKaroAPIService = new EarnKaroAPIService();
