import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  StyleSheet,
  ActivityIndicator,
  Linking,
  Alert,
} from 'react-native';
import { PCComponent } from '../types';
import { affiliateService } from '../services/affiliate-service';

interface ProductListExampleProps {
  searchQuery?: string;
  category?: string;
}

export const ProductListExample: React.FC<ProductListExampleProps> = ({
  searchQuery = 'RTX 4060',
  category = 'GPU'
}) => {
  const [products, setProducts] = useState<PCComponent[]>([]);
  const [loading, setLoading] = useState(false);
  const [convertingLinks, setConvertingLinks] = useState<Set<string>>(new Set());

  useEffect(() => {
    searchProducts();
  }, [searchQuery, category]);

  const searchProducts = async () => {
    setLoading(true);
    try {
      // This searches across Flipkart, Amazon (via EarnKaro), and other platforms
      const results = await affiliateService.searchComponents({
        query: searchQuery,
        category,
        sortBy: 'price',
        limit: 20,
      });

      setProducts(results);
      console.log(`Found ${results.length} products`);
    } catch (error) {
      console.error('Search failed:', error);
      Alert.alert('Error', 'Failed to search products. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleProductPress = async (product: PCComponent) => {
    // Find the best offer (lowest price)
    const bestOffer = product.offers.reduce((best, current) =>
      current.price < best.price ? current : best
    );

    // Check if this is already an affiliate link
    if (bestOffer.url.includes('earnkaro.com') ||
        bestOffer.url.includes('affid=') ||
        bestOffer.url.includes('affiliate')) {
      // Already an affiliate link, open directly
      openLink(bestOffer.url, product.name);
      return;
    }

    // Convert regular link to affiliate link
    await convertAndOpenLink(bestOffer.url, product);
  };

  const convertAndOpenLink = async (originalUrl: string, product: PCComponent) => {
    setConvertingLinks(prev => new Set(prev).add(product.id));

    try {
      // Convert the link using EarnKaro
      const affiliateLink = await affiliateService.convertLinksToAffiliate([originalUrl]);
      const convertedUrl = affiliateLink[originalUrl];

      if (convertedUrl && convertedUrl !== originalUrl) {
        console.log(`✅ Converted: ${originalUrl} → ${convertedUrl}`);

        // Update the product's offer with the affiliate link
        updateProductOfferUrl(product.id, originalUrl, convertedUrl);

        // Open the affiliate link
        openLink(convertedUrl, product.name);
      } else {
        // Conversion failed, open original link
        console.warn('⚠️ Link conversion failed, opening original');
        openLink(originalUrl, product.name);
      }
    } catch (error) {
      console.error('Link conversion error:', error);
      openLink(originalUrl, product.name);
    } finally {
      setConvertingLinks(prev => {
        const newSet = new Set(prev);
        newSet.delete(product.id);
        return newSet;
      });
    }
  };

  const updateProductOfferUrl = (productId: string, originalUrl: string, affiliateUrl: string) => {
    setProducts(prevProducts =>
      prevProducts.map(product => {
        if (product.id === productId) {
          return {
            ...product,
            offers: product.offers.map(offer =>
              offer.url === originalUrl ? { ...offer, url: affiliateUrl } : offer
            )
          };
        }
        return product;
      })
    );
  };

  const openLink = async (url: string, productName: string) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Error', `Cannot open link for ${productName}`);
      }
    } catch (error) {
      console.error('Failed to open link:', error);
      Alert.alert('Error', 'Failed to open product link');
    }
  };

  const renderProduct = ({ item: product }: { item: PCComponent }) => {
    const bestOffer = product.offers.reduce((best, current) =>
      current.price < best.price ? current : best
    );

    const isConverting = convertingLinks.has(product.id);
    const retailerInfo = affiliateService.getRetailerInfo(bestOffer.retailer);

    // Check if it's already an affiliate link
    const isAffiliateLink = bestOffer.url.includes('earnkaro.com') ||
                           bestOffer.url.includes('affid=') ||
                           bestOffer.url.includes('affiliate');

    return (
      <TouchableOpacity
        style={styles.productCard}
        onPress={() => handleProductPress(product)}
        disabled={isConverting}
      >
        <Image
          source={{ uri: product.imageUrl || 'https://via.placeholder.com/150' }}
          style={styles.productImage}
          resizeMode="contain"
        />

        <View style={styles.productInfo}>
          <Text style={styles.productName} numberOfLines={2}>
            {product.name}
          </Text>

          <Text style={styles.productBrand}>
            {product.brand} • {product.category}
          </Text>

          <View style={styles.priceContainer}>
            <Text style={styles.currentPrice}>
              {affiliateService.formatPrice(bestOffer.price)}
            </Text>

            {bestOffer.originalPrice && bestOffer.originalPrice > bestOffer.price && (
              <>
                <Text style={styles.originalPrice}>
                  {affiliateService.formatPrice(bestOffer.originalPrice)}
                </Text>
                <Text style={styles.discount}>
                  {bestOffer.discount}% OFF
                </Text>
              </>
            )}
          </View>

          <View style={styles.retailerContainer}>
            <Text style={styles.retailerEmoji}>{retailerInfo.logo}</Text>
            <Text style={styles.retailerName}>{bestOffer.retailer}</Text>

            {isAffiliateLink && (
              <View style={styles.affiliateBadge}>
                <Text style={styles.affiliateText}>💰 Affiliate</Text>
              </View>
            )}

            {isConverting && (
              <View style={styles.convertingContainer}>
                <ActivityIndicator size="small" color="#4CAF50" />
                <Text style={styles.convertingText}>Converting...</Text>
              </View>
            )}
          </View>

          {product.rating && (
            <View style={styles.ratingContainer}>
              <Text style={styles.rating}>⭐ {product.rating.toFixed(1)}</Text>
              {product.reviewCount && (
                <Text style={styles.reviewCount}>
                  ({product.reviewCount} reviews)
                </Text>
              )}
            </View>
          )}

          {bestOffer.cashback && (
            <Text style={styles.cashback}>
              💰 {bestOffer.cashback} Cashback
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Searching products...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>
          {category} Products - "{searchQuery}"
        </Text>
        <Text style={styles.resultCount}>
          {products.length} results found
        </Text>
      </View>

      <FlatList
        data={products}
        renderItem={renderProduct}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
        refreshing={loading}
        onRefresh={searchProducts}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  header: {
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  resultCount: {
    fontSize: 14,
    color: '#666',
  },
  listContainer: {
    padding: 16,
  },
  productCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  productImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  productInfo: {
    flex: 1,
    marginLeft: 12,
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    color: '#333',
  },
  productBrand: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    flexWrap: 'wrap',
  },
  currentPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2196F3',
    marginRight: 8,
  },
  originalPrice: {
    fontSize: 14,
    color: '#999',
    textDecorationLine: 'line-through',
    marginRight: 8,
  },
  discount: {
    fontSize: 12,
    color: 'white',
    backgroundColor: '#4CAF50',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    overflow: 'hidden',
  },
  retailerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    flexWrap: 'wrap',
  },
  retailerEmoji: {
    fontSize: 16,
    marginRight: 4,
  },
  retailerName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginRight: 8,
  },
  affiliateBadge: {
    backgroundColor: '#E8F5E8',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginRight: 8,
  },
  affiliateText: {
    fontSize: 10,
    color: '#4CAF50',
    fontWeight: '500',
  },
  convertingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  convertingText: {
    fontSize: 12,
    color: '#4CAF50',
    marginLeft: 4,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  rating: {
    fontSize: 12,
    color: '#FF9800',
    marginRight: 4,
  },
  reviewCount: {
    fontSize: 12,
    color: '#666',
  },
  cashback: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '500',
  },
});
