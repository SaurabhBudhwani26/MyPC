import { PCComponent, ComponentOffer } from '../types';
import { earnKaroAPIService } from './earnkaro-api';
import { amazonSearchAPIService } from './amazon-search-api';

export interface AffiliateSearchOptions {
  query: string;
  category?: string;
  priceRange?: { min: number; max: number };
  sortBy?: 'price' | 'rating' | 'discount';
  limit?: number;
}

class AffiliateService {
  async searchComponents(options: AffiliateSearchOptions): Promise<PCComponent[]> {
    const { query, category, priceRange, sortBy = 'discount', limit = 50 } = options;
    
    console.log(`🔍 Multi-Source Real-Time Search: ${query}`, { category, priceRange });
    
    try {
      // Try to get real Amazon data first (best source for real products)
      let allResults: PCComponent[] = [];
      
      // 1. Search Amazon for real products
      console.log('🛒 Searching Amazon for real products...');
      const amazonResults = await amazonSearchAPIService.searchProducts(query, category);
      
      if (amazonResults.length > 0) {
        console.log(`📦 Amazon returned ${amazonResults.length} real products`);
        allResults = [...allResults, ...amazonResults];
      } else {
        console.log('📦 No Amazon products found, trying EarnKaro...');
      }
      
      // 2. Get EarnKaro deals (fallback to enhanced mock data)
      console.log('💰 Getting EarnKaro deals...');
      const earnKaroResults = await earnKaroAPIService.searchDeals(query, category);
      
      if (earnKaroResults.length > 0) {
        console.log(`💰 EarnKaro returned ${earnKaroResults.length} deals`);
        allResults = [...allResults, ...earnKaroResults];
      }
      
      // 3. Merge and deduplicate
      let filteredResults = this.mergeDuplicateProducts(allResults);
      
      // 4. Apply filters
      filteredResults = this.applyFilters(filteredResults, { priceRange });
      
      // 5. Sort results (prioritize discounts for deals)
      filteredResults = this.sortResults(filteredResults, sortBy);
      
      // 6. Limit results
      if (limit > 0) {
        filteredResults = filteredResults.slice(0, limit);
      }
      
      console.log(`✅ Showing ${filteredResults.length} total products (Amazon + EarnKaro)`);
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
      sortBy: 'discount',
      limit,
    };
    
    const results = await this.searchComponents(searchOptions);
    
    console.log(`🔍 getBestDeals search results:`, results.length, 'components found');
    
    // Filter for products with good discounts (>5% to be more inclusive)
    const filteredResults = results.filter(component => {
      const bestOffer = this.getBestOffer(component.offers);
      const hasDiscount = bestOffer && bestOffer.discount && bestOffer.discount > 5;
      console.log(`📊 Component: ${component.name}, Discount: ${bestOffer?.discount}%, Include: ${hasDiscount}`);
      return hasDiscount;
    });
    
    console.log(`✅ getBestDeals filtered results:`, filteredResults.length, 'deals found');
    
    // If no deals with discounts found, return all results (for demo purposes)
    return filteredResults.length > 0 ? filteredResults : results;
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
        
        case 'discount':
          const discountA = this.getBestDiscount(a.offers);
          const discountB = this.getBestDiscount(b.offers);
          return discountB - discountA;
        
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
