import { PCComponent, ComponentOffer } from '../types';
import { earnKaroAPIService } from './earnkaro-api';
import { amazonSearchAPIService } from './amazon-search-api';
import { flipkartAPIService } from './flipkart-api';

export interface AffiliateSearchOptions {
  query: string;
  category?: string;
  priceRange?: { min: number; max: number };
  sortBy?: 'price' | 'rating' | 'discount' | 'reviews' | 'popular';
  limit?: number;
}

class AffiliateService {
  async searchComponents(options: AffiliateSearchOptions): Promise<PCComponent[]> {
    const { query, category, priceRange, sortBy = 'discount', limit = 50 } = options;
    
    console.log(`🔍 Multi-Source Real-Time Search: ${query}`, { category, priceRange });
    
    try {
      // Search multiple sources in parallel for best results
      let allResults: PCComponent[] = [];
      
      // Search both Amazon and Flipkart simultaneously
      const searchPromises = [
        // 1. Search Amazon for real products
        amazonSearchAPIService.searchProducts(query, category)
          .then(results => ({ source: 'Amazon', results: results || [] }))
          .catch(error => {
            console.error('Amazon search error:', error);
            return { source: 'Amazon', results: [] };
          }),
        
        // 2. Search Flipkart for real products  
        flipkartAPIService.searchProducts(query, category, 2)
          .then(results => ({ source: 'Flipkart', results: results || [] }))
          .catch(error => {
            console.error('Flipkart search error:', error);
            return { source: 'Flipkart', results: [] };
          }),
        
        // 3. Search EarnKaro for deals
        earnKaroAPIService.searchDeals(query, category)
          .then(results => ({ source: 'EarnKaro', results: results || [] }))
          .catch(error => {
            console.error('EarnKaro search error:', error);
            return { source: 'EarnKaro', results: [] };
          })
      ];

      console.log('🔍 Searching Amazon, Flipkart, and EarnKaro simultaneously...');
      const searchResults = await Promise.all(searchPromises);
      
      // Combine results from all sources
      searchResults.forEach(({ source, results }) => {
        if (results && results.length > 0) {
          console.log(`📦 ${source} returned ${results.length} products`);
          allResults = [...allResults, ...results];
        } else {
          console.log(`📭 No products from ${source}`);
        }
      });
      
      console.log(`🔄 Combined total: ${allResults.length} products from all sources`);
      
      // 4. Filter out laptops and non-PC components FIRST
      let filteredResults = this.filterPCComponents(allResults, category);
      console.log(`🎯 After PC component filtering: ${filteredResults.length} relevant PC components`);
      
      // 5. Merge and deduplicate similar products
      filteredResults = this.mergeDuplicateProducts(filteredResults);
      console.log(`🔄 After deduplication: ${filteredResults.length} unique products`);
      
      // 6. Apply additional filters
      filteredResults = this.applyFilters(filteredResults, { priceRange });
      
      // 7. Sort results (prioritize discounts for deals)
      filteredResults = this.sortResults(filteredResults, sortBy);
      
      // 8. Limit results
      if (limit > 0) {
        filteredResults = filteredResults.slice(0, limit);
      }
      
      console.log(`✅ Final result: ${filteredResults.length} PC components (Amazon + Flipkart + EarnKaro)`);
      return filteredResults;
      
    } catch (error) {
      console.error('Error getting real-time deals:', error);
      return [];
    }
  }

  async convertLinksToAffiliate(urls: string[]): Promise<{ [key: string]: string }> {
    try {
      // Use EarnKaro for link conversion (works with multiple merchants)
      return await earnKaroAPIService.convertLinks(urls);
    } catch (error) {
      console.error('Error converting affiliate links:', error);
      
      // Return original URLs as fallback
      const result: { [key: string]: string } = {};
      urls.forEach(url => result[url] = url);
      return result;
    }
  }

  async getBestDeals(category?: string, limit: number = 20): Promise<PCComponent[]> {
    const searchOptions: AffiliateSearchOptions = {
      query: category || 'gaming',
      category,
      sortBy: 'popular', // Sort by popularity (rating + reviews) for better products
      limit: limit * 2, // Get more results to filter from
    };
    
    const results = await this.searchComponents(searchOptions);
    
    // Ensure results is always an array
    const safeResults = Array.isArray(results) ? results : [];
    console.log(`🔍 getBestDeals search results: ${safeResults.length} components found`);
    
    // Filter for quality products with good ratings and reviews
    const qualityProducts = safeResults.filter(component => {
      const hasGoodRating = (component.rating || 0) >= 3.5;
      const hasReviews = (component.reviewCount || 0) > 10;
      const bestOffer = this.getBestOffer(component.offers || []);
      const hasDiscount = bestOffer && bestOffer.discount && bestOffer.discount > 5;
      
      // Must have either good rating+reviews OR a good discount
      return (hasGoodRating && hasReviews) || hasDiscount;
    });
    
    console.log(`✅ getBestDeals filtered results: ${qualityProducts.length} quality deals found`);
    
    // Sort by reviews count for final selection and limit
    const finalResults = qualityProducts
      .sort((a, b) => (b.reviewCount || 0) - (a.reviewCount || 0))
      .slice(0, limit);
    
    console.log(`🏆 Final deals (sorted by reviews): ${finalResults.length} products`);
    
    // If no quality products found, return all results sorted by reviews
    return finalResults.length > 0 ? finalResults : safeResults.slice(0, limit);
  }

  private mergeDuplicateProducts(components: PCComponent[]): PCComponent[] {
    const productMap = new Map<string, PCComponent>();
    
    components.forEach(component => {
      const key = this.generateProductKey(component);
      
      if (productMap.has(key)) {
        // Merge offers
        const existing = productMap.get(key)!;
        existing.offers.push(...component.offers);
        
        // Update price range
        const allPrices = existing.offers.map(offer => offer.price);
        existing.priceRange = {
          min: Math.min(...allPrices),
          max: Math.max(...allPrices),
        };
        existing.averagePrice = allPrices.reduce((sum, price) => sum + price, 0) / allPrices.length;
        
        // Use better rating if available
        if (component.rating && (!existing.rating || component.rating > existing.rating)) {
          existing.rating = component.rating;
          existing.reviewCount = component.reviewCount;
        }
        
      } else {
        productMap.set(key, { ...component });
      }
    });
    
    return Array.from(productMap.values());
  }

  private generateProductKey(component: PCComponent): string {
    // Create a unique key based on name and brand
    const normalized = `${component.brand}-${component.name}`.toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .substring(0, 50);
    return normalized;
  }

  // New method to filter out laptops and non-PC components
  private filterPCComponents(components: PCComponent[], category?: string): PCComponent[] {
    return components.filter(component => {
      const name = (component.name || '').toLowerCase();
      const description = (component.description || '').toLowerCase();
      const combinedText = `${name} ${description}`;
      
      // Exclude laptops and complete systems
      const laptopKeywords = [
        'laptop', 'notebook', 'ultrabook', 'macbook', 'thinkpad', 'ideapad', 'inspiron',
        'pavilion', 'envy', 'asus vivobook', 'asus zenbook', 'surface laptop',
        'chromebook', 'gaming laptop', 'business laptop', 'touchscreen laptop',
        'convertible laptop', '2-in-1 laptop', 'laptop computer', 'portable computer'
      ];
      
      // Exclude pre-built computers and systems
      const systemKeywords = [
        'desktop computer', 'pc system', 'complete pc', 'pre-built pc', 'gaming pc',
        'workstation computer', 'all-in-one pc', 'mini pc', 'nuc computer',
        'assembled pc', 'ready pc', 'full system', 'desktop system'
      ];
      
      // Exclude mobile and tablet components
      const mobileKeywords = [
        'tablet', 'ipad', 'android tablet', 'mobile phone', 'smartphone',
        'phone case', 'mobile accessories', 'tablet case', 'mobile charger'
      ];
      
      // Exclude non-PC peripherals and accessories
      const peripheralKeywords = [
        'printer', 'scanner', 'webcam', 'headphones', 'headset', 'speakers',
        'router', 'modem', 'network switch', 'ups battery', 'external hdd',
        'usb hub', 'docking station', 'monitor stand', 'laptop bag'
      ];
      
      // Check if item contains any excluded keywords
      const allExcludedKeywords = [...laptopKeywords, ...systemKeywords, ...mobileKeywords, ...peripheralKeywords];
      const isExcluded = allExcludedKeywords.some(keyword => combinedText.includes(keyword));
      
      if (isExcluded) {
        console.log(`🚫 Filtered out non-PC component: ${component.name}`);
        return false;
      }
      
      // If a specific category is provided, apply category-specific filtering
      if (category) {
        return this.matchesPCCategory(component, category, combinedText);
      }
      
      // For general searches, include PC components
      const pcComponentKeywords = [
        // CPU keywords
        'processor', 'cpu', 'intel', 'amd', 'ryzen', 'core i3', 'core i5', 'core i7', 'core i9',
        // GPU keywords
        'graphics card', 'gpu', 'video card', 'nvidia', 'geforce', 'rtx', 'gtx', 'radeon', 'rx ',
        // RAM keywords
        'ram', 'memory', 'ddr4', 'ddr5', 'dimm', 'sodimm',
        // Motherboard keywords
        'motherboard', 'mainboard', 'mobo', 'socket', 'chipset', 'atx', 'micro atx', 'mini itx',
        // Storage keywords
        'ssd', 'nvme', 'hard drive', 'hdd', 'm.2', 'sata', 'storage drive',
        // PSU keywords
        'power supply', 'psu', 'smps', 'watt', '80+ gold', '80+ bronze', 'modular psu',
        // Case keywords
        'pc case', 'computer case', 'cabinet', 'tower', 'mid tower', 'full tower', 'mini itx case',
        // Cooling keywords
        'cpu cooler', 'cooling fan', 'liquid cooling', 'aio', 'thermal paste', 'heat sink'
      ];
      
      const isPCComponent = pcComponentKeywords.some(keyword => combinedText.includes(keyword));
      
      if (!isPCComponent) {
        console.log(`❓ Questionable PC component: ${component.name}`);
      }
      
      return isPCComponent;
    });
  }
  
  // Helper method to match components to specific PC categories
  private matchesPCCategory(component: PCComponent, category: string, combinedText: string): boolean {
    const categoryKeywords: Record<string, string[]> = {
      'cpu': ['processor', 'cpu', 'intel', 'amd', 'ryzen', 'core i3', 'core i5', 'core i7', 'core i9'],
      'gpu': ['graphics card', 'gpu', 'video card', 'nvidia', 'geforce', 'rtx', 'gtx', 'radeon', 'rx '],
      'ram': ['ram', 'memory', 'ddr4', 'ddr5', 'dimm', 'sodimm'],
      'motherboard': ['motherboard', 'mainboard', 'mobo', 'socket', 'chipset', 'atx', 'micro atx', 'mini itx'],
      'storage': ['ssd', 'nvme', 'hard drive', 'hdd', 'm.2', 'sata', 'storage drive'],
      'psu': ['power supply', 'psu', 'smps', 'watt', '80+ gold', '80+ bronze', 'modular'],
      'case': ['pc case', 'computer case', 'cabinet', 'tower', 'mid tower', 'full tower', 'mini itx case'],
      'cooling': ['cpu cooler', 'cooling fan', 'liquid cooling', 'aio', 'thermal paste', 'heat sink']
    };
    
    const keywords = categoryKeywords[category.toLowerCase()] || [];
    const matches = keywords.some(keyword => combinedText.includes(keyword));
    
    if (!matches) {
      console.log(`🎯 Category mismatch for ${category}: ${component.name}`);
    }
    
    return matches;
  }

  private applyFilters(
    components: PCComponent[], 
    filters: { priceRange?: { min: number; max: number } }
  ): PCComponent[] {
    let filtered = components;
    
    if (filters.priceRange) {
      const { min, max } = filters.priceRange;
      filtered = filtered.filter(component => {
        const bestPrice = this.getBestPrice(component.offers);
        return bestPrice >= min && bestPrice <= max;
      });
    }
    
    return filtered;
  }

  private sortResults(components: PCComponent[], sortBy: string): PCComponent[] {
    return components.sort((a, b) => {
      switch (sortBy) {
        case 'price':
          return this.getBestPrice(a.offers) - this.getBestPrice(b.offers);
        
        case 'rating':
          const ratingA = a.rating || 0;
          const ratingB = b.rating || 0;
          return ratingB - ratingA;
        
        case 'reviews':
          const reviewsA = a.reviewCount || 0;
          const reviewsB = b.reviewCount || 0;
          return reviewsB - reviewsA;
        
        case 'discount':
          const discountA = this.getBestDiscount(a.offers);
          const discountB = this.getBestDiscount(b.offers);
          return discountB - discountA;
          
        case 'popular':
          // Sort by a combination of rating and review count for popularity
          const popularityA = (a.rating || 0) * Math.log10((a.reviewCount || 1) + 1);
          const popularityB = (b.rating || 0) * Math.log10((b.reviewCount || 1) + 1);
          return popularityB - popularityA;
        
        default:
          return 0;
      }
    });
  }

  private getBestPrice(offers: ComponentOffer[]): number {
    if (!offers.length) return Infinity;
    return Math.min(...offers.map(offer => offer.price));
  }

  private getBestOffer(offers: ComponentOffer[]): ComponentOffer | null {
    if (!offers.length) return null;
    return offers.reduce((best, current) => 
      current.price < best.price ? current : best
    );
  }

  private getBestDiscount(offers: ComponentOffer[]): number {
    if (!offers.length) return 0;
    return Math.max(...offers.map(offer => offer.discount || 0));
  }

  // Utility methods for UI components
  getRetailerInfo(retailerName: string) {
    const retailers = {
      'Flipkart': {
        logo: '🛍️',
        color: '#047BD6',
        trustScore: 4.2,
      },
      'Amazon': {
        logo: '📦',
        color: '#FF9900',
        trustScore: 4.5,
      },
      'EarnKaro': {
        logo: '💰',
        color: '#4CAF50',
        trustScore: 4.0,
      },
    };
    
    return retailers[retailerName as keyof typeof retailers] || {
      logo: '🛒',
      color: '#666666',
      trustScore: 3.5,
    };
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(price);
  }

  calculateSavings(originalPrice: number, currentPrice: number): {
    amount: number;
    percentage: number;
  } {
    const amount = originalPrice - currentPrice;
    const percentage = Math.round((amount / originalPrice) * 100);
    return { amount, percentage };
  }
}

export const affiliateService = new AffiliateService();
