import { PCComponent, ComponentOffer } from '../types';

// Flipkart RapidAPI Configuration
interface FlipkartAPIConfig {
  apiKey: string;
  apiHost: string;
  baseUrl: string;
}

// Flipkart RapidAPI Response Types
interface FlipkartProductResponse {
  pid: string;
  itemId: string;
  listingId: string;
  brand: string;
  title: string;
  keySpecs: string[];
  availability: string;
  url: string;
  mrp: number;
  price: number;
  rating: {
    average: number;
    count: number;
    reviewCount: number;
    breakup: number[];
  };
  images: string[];
}

interface FlipkartSearchResponse {
  success: boolean;
  data: {
    products: FlipkartProductResponse[];
    total: number;
    currentPage: number;
    hasNextPage: boolean;
    query: string;
    sortBy: string;
  };
}

class FlipkartAPIService {
  private config: FlipkartAPIConfig;
  private isConfigured: boolean = false;

  constructor() {
    this.config = {
      apiKey: process.env.EXPO_PUBLIC_RAPIDAPI_KEY || '',
      apiHost: 'real-time-flipkart-data2.p.rapidapi.com',
      baseUrl: 'https://real-time-flipkart-data2.p.rapidapi.com',
    };

    this.isConfigured = !!this.config.apiKey && this.config.apiKey !== '';

    if (process.env.EXPO_PUBLIC_DEBUG_MODE === 'true') {
      console.log('🛒 Flipkart Real-Time API Service initialized', {
        configured: this.isConfigured,
        apiHost: this.config.apiHost,
        hasApiKey: !!this.config.apiKey,
        apiKeyLength: this.config.apiKey?.length || 0,
      });
    }
  }

  async searchProducts(query: string, category?: string, pages: number = 1): Promise<PCComponent[]> {
    if (!this.isConfigured) {
      console.log('🛒 Flipkart API not configured, skipping');
      return [];
    }

    try {
      console.log(`🔍 Searching Flipkart for: "${query}" (single page request)`);

      // Single API call for speed
      const searchUrl = new URL(`${this.config.baseUrl}/product-search`);
      searchUrl.searchParams.append('q', query);
      searchUrl.searchParams.append('page', '1');

      if (category) {
        searchUrl.searchParams.append('category', this.mapToFlipkartCategory(category));
      }

      console.log(`🌐 Making request to: ${searchUrl.toString()}`);

      const response = await fetch(searchUrl.toString(), {
        method: 'GET',
        headers: {
          'X-RapidAPI-Host': this.config.apiHost,
          'X-RapidAPI-Key': this.config.apiKey,
        },
      });

      console.log(`📊 API Response Status: ${response.status}`);

      if (!response.ok) {
        const errorText = await response.text();
        console.log(`❌ API Error Response:`, errorText);
        return [];
      }

      const data: FlipkartSearchResponse = await response.json();
      console.log(`📦 Raw API Response:`, {
        success: data.success,
        total_products: data.data?.total || 0,
        products_returned: data.data?.products?.length || 0
      });

      if (!data.success || !data.data?.products) {
        console.log(`📝 No products found from Flipkart`);
        return [];
      }

      // Filter for PC components and convert to our format
      const pcComponents = data.data.products
        .filter(product => this.isPCComponent(product.title))
        .map(product => this.transformFlipkartProduct(product));

      console.log(`✨ Final Flipkart result: ${pcComponents.length} PC components`);
      return pcComponents;

    } catch (error) {
      console.error('❌ Error searching Flipkart:', error);
      return [];
    }
  }

  async getProductDetails(productId: string, pincode: string = '400001'): Promise<PCComponent | null> {
    if (!this.isConfigured) {
      console.log('🛒 Flipkart API not configured');
      return null;
    }

    try {
      const detailsUrl = new URL(`${this.config.baseUrl}/product-details`);
      detailsUrl.searchParams.append('pid', productId);
      detailsUrl.searchParams.append('pincode', pincode);

      const response = await fetch(detailsUrl.toString(), {
        method: 'GET',
        headers: {
          'X-RapidAPI-Host': this.config.apiHost,
          'X-RapidAPI-Key': this.config.apiKey,
        },
      });

      if (!response.ok) {
        throw new Error(`Flipkart Product Details API error: ${response.status}`);
      }

      const product: FlipkartProductResponse = await response.json();

      if (this.isPCComponent(product.title)) {
        return this.transformFlipkartProduct(product);
      }

      return null;
    } catch (error) {
      console.error('Error getting Flipkart product details:', error);
      return null;
    }
  }

  private transformFlipkartProduct(product: FlipkartProductResponse): PCComponent {
    const price = product.price;
    const originalPrice = product.mrp;
    const discount = originalPrice > 0 ? Math.round(((originalPrice - price) / originalPrice) * 100) : 0;

    const offers: ComponentOffer[] = [{
      id: `flipkart-${product.pid}`,
      componentId: product.pid,
      retailer: 'Flipkart',
      price: price,
      originalPrice: originalPrice,
      discount: discount,
      availability: product.availability === 'IN_STOCK' ? 'in_stock' : 'limited_stock',
      url: product.url,
      lastUpdated: new Date().toISOString(),
      shipping: {
        cost: 0,
        estimatedDays: 3,
        free: true,
      },
      seller: 'Flipkart',
    }];

    const category = this.extractCategory(product.title);
    const brand = this.extractBrand(product.title, product.brand);

    return {
      id: product.pid,
      name: product.title,
      brand: brand,
      category: category,
      model: this.extractModel(product.title),
      description: product.keySpecs?.join(', ') || product.title,
      imageUrl: product.images?.[0] || '',
      rating: product.rating?.average || undefined,
      reviewCount: product.rating?.reviewCount || 0,
      availability: product.availability === 'IN_STOCK' ? 'in_stock' : 'limited_stock',
      averagePrice: price,
      priceRange: { min: price, max: originalPrice },
      lastUpdated: new Date().toISOString(),
      specifications: this.extractSpecifications(product.title, product.keySpecs?.join(' ') || ''),
      offers: offers,
      discount: discount,
      url: product.url,
      price: price
    };
  }

  private isPCComponent(title: string): boolean {
    const pcKeywords = [
      'processor', 'cpu', 'graphics card', 'gpu', 'motherboard', 'ram', 'memory',
      'ssd', 'hdd', 'storage', 'power supply', 'psu', 'cabinet', 'case', 'cooler',
      'intel', 'amd', 'nvidia', 'corsair', 'asus', 'msi', 'gigabyte', 'gaming',
      'ryzen', 'core', 'geforce', 'radeon', 'ddr4', 'ddr5', 'nvme', 'sata',
      'atx', 'micro atx', 'mini itx', 'water cooling', 'air cooling', 'thermal paste'
    ];

    const titleLower = title.toLowerCase();
    return pcKeywords.some(keyword => titleLower.includes(keyword));
  }

  private mapToFlipkartCategory(category: string): string {
    const categoryMap: { [key: string]: string } = {
      'CPU': 'computers',
      'GPU': 'computers',
      'RAM': 'computers',
      'Motherboard': 'computers',
      'Storage': 'computers',
      'PSU': 'computers',
      'Case': 'computers',
      'Cooling': 'computers',
    };

    return categoryMap[category] || 'computers';
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

  private parsePrice(priceString: string): number {
    // Remove currency symbols and commas, extract number
    const cleanPrice = priceString.replace(/[₹,\s]/g, '');
    const price = parseFloat(cleanPrice);
    return isNaN(price) ? 0 : price;
  }

  private parseDiscount(discountString: string): number {
    // Extract percentage from strings like "25% off", "₹5,000 off", etc.
    const percentMatch = discountString.match(/(\d+)%/);
    if (percentMatch) {
      return parseInt(percentMatch[1]);
    }

    // For absolute discounts, we'll calculate percentage later if original price is available
    return 0;
  }

  private extractBrand(title: string, brandField?: string): string {
    // Use the brand field if available
    if (brandField && brandField.trim()) {
      return brandField.trim();
    }

    // Extract from title
    const commonBrands = [
      'AMD', 'Intel', 'NVIDIA', 'ASUS', 'MSI', 'Gigabyte', 'ASRock',
      'Corsair', 'G.Skill', 'Kingston', 'Samsung', 'Western Digital', 'WD',
      'Seagate', 'Cooler Master', 'Thermaltake', 'NZXT', 'Fractal Design',
      'Antec', 'be quiet!', 'Seasonic', 'EVGA', 'Zotac', 'Sapphire', 'XFX'
    ];

    for (const brand of commonBrands) {
      if (title.toLowerCase().includes(brand.toLowerCase())) {
        return brand;
      }
    }

    // Fallback to first word
    return title.split(' ')[0];
  }

  private extractSpecifications(title: string, description: string): Record<string, any> {
    const specs: Record<string, any> = {};
    const text = `${title} ${description}`.toLowerCase();

    // Extract common specs
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

    const storageMatch = text.match(/(\d+)\s*(gb|tb)\s*(ssd|hdd|nvme)/i);
    if (storageMatch) {
      specs.capacity = `${storageMatch[1]}${storageMatch[2].toUpperCase()}`;
      specs.type = storageMatch[3].toUpperCase();
    }

    return specs;
  }

}

export const flipkartAPIService = new FlipkartAPIService();
