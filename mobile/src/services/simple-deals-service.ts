import { PCComponent, ComponentOffer } from '../types';
import { amazonSearchAPIService } from './amazon-search-api';
import { flipkartAPIService } from './flipkart-api';
import { earnKaroAPIService } from './earnkaro-api';

/**
 * Simple Deals Service
 * Gets 15 deals from Amazon + 15 deals from Flipkart
 * Converts to EarnKaro affiliate links for monetization
 */
class SimpleDealsService {
  
  /**
   * Get today's best deals - 15 from Amazon + 15 from Flipkart
   * Simple, fast, and reliable
   */
  async getTodaysDeals(): Promise<PCComponent[]> {
    console.log('🎯 SimpleDealsService: Getting 15 Amazon + 15 Flipkart deals...');
    
    try {
      const deals: PCComponent[] = [];
      
      // Step 1: Get 15 deals from Amazon
      console.log('🛍️ Fetching 15 Amazon deals...');
      const amazonDeals = await this.getAmazonDeals(15);
      deals.push(...amazonDeals);
      console.log(`✅ Got ${amazonDeals.length} Amazon deals`);
      
      // Step 2: Get 15 deals from Flipkart
      console.log('🏬 Fetching 15 Flipkart deals...');
      const flipkartDeals = await this.getFlipkartDeals(15);
      deals.push(...flipkartDeals);
      console.log(`✅ Got ${flipkartDeals.length} Flipkart deals`);
      
      // Step 3: Return deals immediately - affiliate links generated on-demand when user clicks
      console.log(`🎉 Final result: ${deals.length} total deals (affiliate links generated on click)`);
      return deals;
      
    } catch (error) {
      console.error('❌ SimpleDealsService error:', error);
      return this.getFallbackDeals();
    }
  }
  
  /**
   * Get 15 gaming/tech deals from Amazon (1 page = ~16 products)
   */
  private async getAmazonDeals(limit: number): Promise<PCComponent[]> {
    try {
      // Search for popular tech/gaming products (1 page only - has ~16 products)
      const results = await amazonSearchAPIService.searchProducts('gaming components RTX RAM SSD', 'electronics', 1);
      
      if (!results || results.length === 0) {
        console.log('⚠️ No Amazon results, trying alternative search...');
        // Try different search terms (1 page only)
        const altResults = await amazonSearchAPIService.searchProducts('computer parts', 'electronics', 1);
        return altResults ? altResults.slice(0, limit) : [];
      }
      
      console.log(`📦 Amazon returned ${results.length} products from 1 page`);
      
      // Filter and sort by discount/rating, take top 15
      const qualityDeals = results
        .filter(product => {
          const offer = product.offers?.[0];
          return offer && (offer.discount > 5 || (product.rating || 0) >= 4.0);
        })
        .sort((a, b) => {
          // Sort by discount first, then by rating
          const aDiscount = a.offers?.[0]?.discount || 0;
          const bDiscount = b.offers?.[0]?.discount || 0;
          if (bDiscount !== aDiscount) return bDiscount - aDiscount;
          return (b.rating || 0) - (a.rating || 0);
        })
        .slice(0, limit);
      
      console.log(`✅ Selected top ${qualityDeals.length} Amazon deals`);
      return qualityDeals;
      
    } catch (error) {
      console.error('❌ Error getting Amazon deals:', error);
      return [];
    }
  }
  
  /**
   * Get 15 gaming/tech deals from Flipkart (1 page = ~16 products)
   */
  private async getFlipkartDeals(limit: number): Promise<PCComponent[]> {
    try {
      // Search for popular tech/gaming products (1 page only - has ~16 products)
      const results = await flipkartAPIService.searchProducts('gaming components graphics cards', 'electronics', 1);
      
      if (!results || results.length === 0) {
        console.log('⚠️ No Flipkart results, trying alternative search...');
        // Try different search terms (1 page only)
        const altResults = await flipkartAPIService.searchProducts('computer accessories', 'electronics', 1);
        return altResults ? altResults.slice(0, limit) : [];
      }
      
      console.log(`📦 Flipkart returned ${results.length} products from 1 page`);
      
      // Filter and sort by discount/rating, take top 15
      const qualityDeals = results
        .filter(product => {
          const offer = product.offers?.[0];
          return offer && (offer.discount > 5 || (product.rating || 0) >= 4.0);
        })
        .sort((a, b) => {
          // Sort by discount first, then by rating
          const aDiscount = a.offers?.[0]?.discount || 0;
          const bDiscount = b.offers?.[0]?.discount || 0;
          if (bDiscount !== aDiscount) return bDiscount - aDiscount;
          return (b.rating || 0) - (a.rating || 0);
        })
        .slice(0, limit);
      
      console.log(`✅ Selected top ${qualityDeals.length} Flipkart deals`);
      return qualityDeals;
      
    } catch (error) {
      console.error('❌ Error getting Flipkart deals:', error);
      return [];
    }
  }
  
  /**
   * Convert product URLs to EarnKaro affiliate links for monetization (REMOVED FOR PERFORMANCE)
   * This method is now unused - affiliate links are generated on-demand when user clicks
   */
  private async addAffiliateLinks(deals: PCComponent[]): Promise<PCComponent[]> {
    console.log('🚀 Skipping bulk affiliate conversion for faster loading');
    console.log('💰 Affiliate links will be generated when user clicks "Buy Now"');
    return deals;
  }
  
  /**
   * Fallback deals if APIs fail
   */
  private getFallbackDeals(): PCComponent[] {
    console.log('🚑 Using fallback deals...');
    
    return [
      {
        id: 'fallback-1',
        name: 'Gaming Components - Check Back Soon!',
        category: 'Electronics',
        brand: 'Various',
        model: 'Mixed',
        description: 'We are loading fresh deals from Amazon and Flipkart. Please refresh in a moment!',
        imageUrl: 'https://via.placeholder.com/200x200?text=Loading+Deals',
        averagePrice: 0,
        priceRange: { min: 0, max: 0 },
        rating: 4.0,
        reviewCount: 100,
        availability: 'in_stock',
        lastUpdated: new Date().toISOString(),
        offers: [{
          id: 'fallback-offer-1',
          retailer: 'Loading...',
          price: 0,
          url: '#',
          availability: 'in_stock',
          lastUpdated: new Date().toISOString()
        }]
      }
    ];
  }
  
  /**
   * Generate affiliate link on-demand when user clicks product
   */
  async generateAffiliateLink(originalUrl: string): Promise<string> {
    try {
      console.log('💰 Generating affiliate link for:', originalUrl);
      const affiliateLinks = await earnKaroAPIService.convertLinks([originalUrl]);
      const affiliateUrl = affiliateLinks[originalUrl] || originalUrl;
      console.log('✅ Generated affiliate link successfully');
      return affiliateUrl;
    } catch (error) {
      console.error('❌ Error generating affiliate link:', error);
      return originalUrl; // Fallback to original URL
    }
  }
}

// Export singleton instance
export const simpleDealsService = new SimpleDealsService();
