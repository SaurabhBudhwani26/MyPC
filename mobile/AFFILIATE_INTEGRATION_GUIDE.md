# 🔗 Affiliate Integration Guide

## How to Add Affiliate Links to Your Existing App

### 1. Update Your Search Screen

```tsx
// In your existing search screen (e.g., SearchScreen.tsx)
import { ProductListExample } from '../components/ProductListExample';

export const SearchScreen = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  return (
    <View style={styles.container}>
      <SearchInput 
        value={searchQuery}
        onChangeText={setSearchQuery}
        onSubmit={() => {/* trigger search */}}
      />
      
      <CategorySelector
        selected={selectedCategory}
        onSelect={setSelectedCategory}
      />
      
      {/* Replace your existing product list with this */}
      <ProductListExample
        searchQuery={searchQuery}
        category={selectedCategory}
      />
    </View>
  );
};
```

### 2. Add to Component Categories Screen

```tsx
// In components/ComponentCategoriesScreen.tsx
import { affiliateService } from '../services/affiliate-service';

export const ComponentCategoriesScreen = () => {
  const handleCategoryPress = (category: string) => {
    // Navigate to search with pre-filled category
    navigation.navigate('Search', { 
      category, 
      searchQuery: category.toLowerCase() 
    });
  };

  // Get best deals for each category
  const [bestDeals, setBestDeals] = useState({});

  useEffect(() => {
    loadBestDeals();
  }, []);

  const loadBestDeals = async () => {
    const categories = ['CPU', 'GPU', 'RAM', 'Storage'];
    const deals = {};
    
    for (const category of categories) {
      const categoryDeals = await affiliateService.getBestDeals(category, 3);
      deals[category] = categoryDeals;
    }
    
    setBestDeals(deals);
  };

  return (
    <ScrollView>
      {categories.map(category => (
        <CategoryCard 
          key={category}
          name={category}
          bestDeals={bestDeals[category] || []}
          onPress={() => handleCategoryPress(category)}
        />
      ))}
    </ScrollView>
  );
};
```

### 3. Update Component Detail Screen

```tsx
// In components/ComponentDetailScreen.tsx
import { affiliateService } from '../services/affiliate-service';

export const ComponentDetailScreen = ({ route }) => {
  const { componentId } = route.params;
  const [component, setComponent] = useState(null);
  const [convertingLinks, setConvertingLinks] = useState(false);

  const handleBuyNowPress = async (offer) => {
    if (offer.url.includes('earnkaro.com') || offer.url.includes('affiliate')) {
      // Already affiliate link
      Linking.openURL(offer.url);
      return;
    }

    setConvertingLinks(true);
    try {
      const affiliateLinks = await affiliateService.convertLinksToAffiliate([offer.url]);
      const convertedUrl = affiliateLinks[offer.url];
      
      // Update the offer URL
      updateOfferUrl(offer.id, convertedUrl);
      
      // Open affiliate link
      Linking.openURL(convertedUrl);
    } catch (error) {
      console.error('Link conversion failed:', error);
      Linking.openURL(offer.url); // Fallback
    } finally {
      setConvertingLinks(false);
    }
  };

  return (
    <ScrollView>
      <ComponentHeader component={component} />
      <ComponentSpecs component={component} />
      
      <View style={styles.offersSection}>
        <Text style={styles.sectionTitle}>Best Offers</Text>
        {component?.offers.map(offer => (
          <OfferCard
            key={offer.id}
            offer={offer}
            onBuyPress={() => handleBuyNowPress(offer)}
            loading={convertingLinks}
          />
        ))}
      </View>
    </ScrollView>
  );
};
```

### 4. Environment Variables Setup

```bash
# Make sure your .env file has:
EARNKARO_API_KEY=your_actual_api_key_here
EARNKARO_API_URL=https://ekaro-api.affiliaters.in/api
EXPO_PUBLIC_DEBUG_MODE=true
```

### 5. Add Revenue Tracking (Optional)

```tsx
// Create src/services/analytics.ts
export const trackAffiliateClick = (productId: string, retailer: string, price: number) => {
  // Track when users click affiliate links
  console.log('Affiliate click:', { productId, retailer, price });
  
  // Add your analytics service here (Firebase, Mixpanel, etc.)
  // analytics.track('affiliate_click', { productId, retailer, price });
};

// Use in ProductListExample:
const handleProductPress = async (product: PCComponent) => {
  const bestOffer = product.offers[0];
  trackAffiliateClick(product.id, bestOffer.retailer, bestOffer.price);
  
  // ... rest of conversion logic
};
```

## 🎯 Key Benefits of This Approach:

### ✅ **Automatic Conversion**
- Regular Amazon/Flipkart URLs → Affiliate URLs
- No manual work needed
- Works with any product URL

### ✅ **Smart Caching**
- Converts once, reuses affiliate URL
- No repeated API calls for same product
- Better performance

### ✅ **Multiple Revenue Streams**
- EarnKaro: Works with 1000+ merchants
- Direct Flipkart: Higher commission rates
- Amazon: Through EarnKaro affiliate network

### ✅ **Fallback Protection**
- If conversion fails → Opens original URL
- User experience never breaks
- You still provide value

## 🚀 How to Test:

1. **Add real EarnKaro API key** to `.env`
2. **Run the app** and search for products
3. **Tap on any product** - watch for "Converting..." indicator  
4. **Check console logs** to see URL conversion
5. **Verify affiliate links** open correctly

## 💰 Revenue Optimization Tips:

1. **Track Click-Through Rates**: Monitor which products get most clicks
2. **A/B Test UI**: Try different layouts for better conversion
3. **Add Cashback Badges**: Show users they'll earn money back
4. **Price Alerts**: Notify users of price drops
5. **Comparison Views**: Show multiple retailers side-by-side

This setup gives you a complete affiliate monetization system that works seamlessly with your existing PC component app!
