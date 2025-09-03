import { PCComponent, ComponentOffer } from '../types';
import { earnKaroAPIService } from './earnkaro-api';

// Amazon Product Search API Configuration
interface AmazonSearchConfig {
  apiKey: string;
  apiHost: string;
}

// Amazon API Response Types
interface AmazonProduct {
  asin: string;
  product_title: string;
  product_price: string;
  product_original_price?: string;
  product_url: string;
  product_photo: string;
  product_star_rating?: string;
  product_num_ratings?: number;
  currency?: string;
  is_best_seller?: boolean;
  is_amazon_choice?: boolean;
  is_prime?: boolean;
  sales_volume?: string;
  delivery?: string;
  product_num_offers?: number;
}

interface AmazonSearchResponse {
  status: string;
  request_id: string;
  parameters: {
    query: string;
    page: number;
    country: string;
  };
  data: {
    products: AmazonProduct[];
    country: string;
    total_products: number;
    domain: string;
  };
}

class AmazonSearchAPIService {
  private config: AmazonSearchConfig;
  private isConfigured: boolean = false;
  private quotaExceeded: boolean = false;
  private lastQuotaCheck: number = 0;
  private readonly QUOTA_RESET_TIME = 24 * 60 * 60 * 1000; // 24 hours

  constructor() {
    this.config = {
      apiKey: process.env.EXPO_PUBLIC_RAPIDAPI_KEY || '',
      apiHost: 'real-time-amazon-data.p.rapidapi.com',
    };

    this.isConfigured = !!this.config.apiKey && this.config.apiKey !== '';

    if (process.env.EXPO_PUBLIC_DEBUG_MODE === 'true') {
      console.log('🛍️ Amazon Search API Service initialized', {
        configured: this.isConfigured,
        hasApiKey: !!this.config.apiKey,
        apiKeyLength: this.config.apiKey?.length || 0,
        apiHost: this.config.apiHost,
      });
    }
  }

  async searchProducts(query: string, category?: string, maxPages: number = 3): Promise<PCComponent[]> {
    if (!this.isConfigured) {
      console.log('🛒 Amazon Search API not configured, skipping');
      return [];
    }

    // Check if quota was exceeded recently
    if (this.quotaExceeded) {
      const timeSinceQuotaCheck = Date.now() - this.lastQuotaCheck;
      if (timeSinceQuotaCheck < this.QUOTA_RESET_TIME) {
        console.log('⏳ Amazon API quota exceeded, skipping until reset');
        return [];
      } else {
        // Reset quota flag after 24 hours
        this.quotaExceeded = false;
        console.log('🔄 Resetting Amazon API quota flag');
      }
    }

    // Check if using demo/test API key
    if (this.config.apiKey.includes('test_') || this.config.apiKey.includes('demo_')) {
      console.log('📝 Using demo RapidAPI key, please get real key from rapidapi.com');
      return [];
    }

    try {
      console.log(`🔍 Searching Amazon for: "${query}" (fetching ${maxPages} pages)`);

      let allComponents: PCComponent[] = [];
      let totalProducts = 0;

      // Fetch multiple pages to get more results
      for (let page = 1; page <= maxPages; page++) {
        console.log(`📄 Fetching page ${page} of ${maxPages}...`);

        try {
          const response = await this.performSearch(query, page);

          if (!response.data?.products || response.data.products.length === 0) {
            console.log(`⚠️ No products found on page ${page}, stopping`);
            break;
          }

          console.log(`✅ Page ${page}: Found ${response.data.products.length} products from Amazon`);
          totalProducts = response.data.total_products || 0;

          // Filter for PC components
          const pcProducts = response.data.products.filter(product =>
            this.isPCComponent(product.product_title)
          );

          console.log(`🖥️ Page ${page}: Filtered to ${pcProducts.length} PC components`);

          if (pcProducts.length === 0) {
            console.log(`⚠️ No PC components found on page ${page}, continuing to next page...`);
            continue;
          }

          // Convert Amazon URLs to affiliate links for this batch
          const productUrls = pcProducts.map(product => product.product_url);
          console.log(`🔄 Page ${page}: Converting ${productUrls.length} URLs to affiliate links...`);

          const affiliateLinks = await earnKaroAPIService.convertLinks(productUrls);

          // Transform to PCComponent format
          const components = pcProducts.map(product =>
            this.transformAmazonProduct(product, affiliateLinks[product.product_url])
          );

          allComponents = [...allComponents, ...components];
          console.log(`📦 Page ${page}: Added ${components.length} components. Total: ${allComponents.length}`);

          // Small delay between requests to be respectful to the API
          if (page < maxPages) {
            await new Promise(resolve => setTimeout(resolve, 500));
          }

        } catch (pageError) {
          console.error(`❌ Error fetching page ${page}:`, pageError);

          // If we get a rate limit error, stop fetching more pages
          if (pageError.message && pageError.message.includes('429')) {
            console.log('💸 Hit rate limit, stopping pagination');
            this.quotaExceeded = true;
            this.lastQuotaCheck = Date.now();
            break;
          }

          // For other errors, continue to next page
          continue;
        }
      }

      console.log(`✨ Final result: ${allComponents.length} total PC components from ${maxPages} pages (${totalProducts} total products available)`);
      return allComponents;

    } catch (error) {
      console.error('❌ Error searching Amazon products:', error);

      // Check if this is a quota exceeded error
      if (error.message && error.message.includes('429')) {
        console.log('💸 Amazon API monthly quota exceeded, marking as unavailable');
        this.quotaExceeded = true;
        this.lastQuotaCheck = Date.now();
      }

      return [];
    }
  }

  // New method for paginated search (used by infinite scroll)
  async searchProductsPaginated(query: string, page: number = 1, category?: string): Promise<{
    components: PCComponent[];
    totalProducts: number;
    hasMore: boolean;
    currentPage: number;
  }> {
    if (!this.isConfigured) {
      console.log('🛒 Amazon Search API not configured, skipping');
      return { components: [], totalProducts: 0, hasMore: false, currentPage: 0 };
    }

    // Check if quota was exceeded recently
    if (this.quotaExceeded) {
      const timeSinceQuotaCheck = Date.now() - this.lastQuotaCheck;
      if (timeSinceQuotaCheck < this.QUOTA_RESET_TIME) {
        console.log('⏳ Amazon API quota exceeded, skipping until reset');
        return { components: [], totalProducts: 0, hasMore: false, currentPage: 0 };
      } else {
        this.quotaExceeded = false;
      }
    }

    try {
      console.log(`🔍 Paginated search: "${query}" - Page ${page}`);

      const response = await this.performSearch(query, page);

      if (!response.data?.products) {
        return { components: [], totalProducts: 0, hasMore: false, currentPage: page };
      }

      console.log(`✅ Page ${page}: Found ${response.data.products.length} products from Amazon`);

      // Filter for PC components
      const pcProducts = response.data.products.filter(product =>
        this.isPCComponent(product.product_title)
      );

      // Convert to affiliate links
      const productUrls = pcProducts.map(product => product.product_url);
      const affiliateLinks = await earnKaroAPIService.convertLinks(productUrls);

      // Transform to PCComponent format
      const components = pcProducts.map(product =>
        this.transformAmazonProduct(product, affiliateLinks[product.product_url])
      );

      const totalProducts = response.data.total_products || 0;
      const totalPages = Math.ceil(totalProducts / 16); // Amazon returns ~16 per page
      const hasMore = page < totalPages && page < 20; // Limit to 20 pages max

      console.log(`📦 Page ${page}: ${components.length} PC components, ${totalProducts} total products, hasMore: ${hasMore}`);

      return {
        components,
        totalProducts,
        hasMore,
        currentPage: page
      };

    } catch (error) {
      console.error(`❌ Error in paginated search (page ${page}):`, error);

      if (error.message && error.message.includes('429')) {
        this.quotaExceeded = true;
        this.lastQuotaCheck = Date.now();
      }

      return { components: [], totalProducts: 0, hasMore: false, currentPage: page };
    }
  }

  private async performSearch(query: string, page: number = 1): Promise<AmazonSearchResponse> {
    // Using Amazon Products API - a working RapidAPI service
    const url = `https://${this.config.apiHost}/search?query=${encodeURIComponent(query)}&page=${page}&country=IN`;

    console.log('🌐 Making request to:', url);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': this.config.apiKey,
        'X-RapidAPI-Host': this.config.apiHost,
        'Content-Type': 'application/json',
      },
    });

    console.log('📊 API Response Status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.log('❌ API Error Response:', errorText);
      throw new Error(`Amazon Search API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('📦 Raw API Response:', JSON.stringify(data, null, 2));

    return data;
  }

  private isPCComponent(title: string): boolean {
    const pcKeywords = [
      'processor', 'cpu', 'graphics card', 'gpu', 'motherboard', 'ram', 'memory',
      'ssd', 'hdd', 'storage', 'power supply', 'psu', 'cabinet', 'case', 'cooler',
      'intel', 'amd', 'nvidia', 'corsair', 'asus', 'msi', 'gigabyte', 'gaming',
      'desktop', 'computer', 'pc', 'workstation', 'ryzen', 'geforce', 'radeon'
    ];

    const titleLower = title.toLowerCase();
    return pcKeywords.some(keyword => titleLower.includes(keyword));
  }

  private transformAmazonProduct(product: AmazonProduct, affiliateUrl: string): PCComponent {
    const price = this.parsePrice(product.product_price);
    const originalPrice = this.parsePrice(product.product_original_price) || price;
    const discount = originalPrice > price ? Math.round(((originalPrice - price) / originalPrice) * 100) : 0;

    const category = this.extractCategory(product.product_title);
    const brand = this.extractBrand(product.product_title);

    const offers: ComponentOffer[] = [{
      id: `amazon-${product.asin}`,
      componentId: product.asin,
      retailer: 'Amazon',
      price: price,
      originalPrice: originalPrice,
      discount: discount,
      availability: 'in_stock',
      url: affiliateUrl || product.product_url,
      lastUpdated: new Date().toISOString(),
      shipping: {
        cost: product.is_prime ? 0 : 50,
        estimatedDays: product.is_prime ? 1 : 3,
        free: !!product.is_prime,
      },
      badges: this.getBadges(product),
    }];

    return {
      id: product.asin,
      name: product.product_title,
      brand: brand,
      category: category,
      model: this.extractModel(product.product_title),
      description: product.product_title,
      imageUrl: product.product_photo,
      rating: product.product_star_rating ? parseFloat(product.product_star_rating) : undefined,
      reviewCount: product.product_num_ratings || undefined,
      availability: 'in_stock',
      averagePrice: price,
      priceRange: { min: price, max: originalPrice },
      lastUpdated: new Date().toISOString(),
      specifications: this.extractSpecifications(product.product_title),
      offers: offers,
      discount: discount,
      url: affiliateUrl,
      price: price

    };
  }

  private parsePrice(priceString?: string): number {
    if (!priceString) return 0;

    // Remove currency symbols and commas, extract number
    const cleanPrice = priceString.replace(/[₹$,]/g, '').replace(/[^\d.]/g, '');
    return parseFloat(cleanPrice) || 0;
  }

  private extractCategory(title: string): string {
    const titleLower = title.toLowerCase();

    if (titleLower.includes('processor') || titleLower.includes('cpu') || titleLower.includes('ryzen') || titleLower.includes('intel')) return 'CPU';
    if (titleLower.includes('graphics card') || titleLower.includes('gpu') || titleLower.includes('geforce') || titleLower.includes('radeon')) return 'GPU';
    if (titleLower.includes('memory') || titleLower.includes('ram') || titleLower.includes('ddr')) return 'RAM';
    if (titleLower.includes('motherboard') || titleLower.includes('mobo')) return 'Motherboard';
    if (titleLower.includes('ssd') || titleLower.includes('hdd') || titleLower.includes('storage') || titleLower.includes('nvme')) return 'Storage';
    if (titleLower.includes('power supply') || titleLower.includes('psu') || titleLower.includes('smps')) return 'PSU';
    if (titleLower.includes('cabinet') || titleLower.includes('case')) return 'Case';
    if (titleLower.includes('cooler') || titleLower.includes('cooling') || titleLower.includes('fan')) return 'Cooling';
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

  private extractSpecifications(title: string): Record<string, any> {
    const specs: Record<string, any> = {};
    const titleLower = title.toLowerCase();

    const ghzMatch = titleLower.match(/(\d+\.?\d*)\s*ghz/i);
    if (ghzMatch) specs.clockSpeed = `${ghzMatch[1]} GHz`;

    const memoryMatch = titleLower.match(/(\d+)\s*gb.*?(ddr\d+)/i);
    if (memoryMatch) {
      specs.memory = `${memoryMatch[1]}GB`;
      specs.memoryType = memoryMatch[2].toUpperCase();
    }

    const coreMatch = titleLower.match(/(\d+)[-\s]?core/i);
    if (coreMatch) specs.cores = parseInt(coreMatch[1]);

    return specs;
  }

  private getBadges(product: AmazonProduct): string[] {
    const badges: string[] = [];

    if (product.is_best_seller) badges.push('Best Seller');
    if (product.is_amazon_choice) badges.push("Amazon's Choice");
    if (product.is_prime) badges.push('Prime');

    return badges;
  }
}

export const amazonSearchAPIService = new AmazonSearchAPIService();
