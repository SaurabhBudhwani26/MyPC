import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Image, Linking } from 'react-native';
import { PCComponent } from '../types';
import { useTheme } from '../context/ThemeContext';

interface ComponentCardProps {
  component: PCComponent;
  onPress?: (component: PCComponent) => void;
}

export function ComponentCard({ component, onPress }: ComponentCardProps) {
  const { theme } = useTheme();

  // Safety check for offers array
  if (!component.offers || component.offers.length === 0) {
    console.warn('ComponentCard: No offers available for component:', component.name);
    return null;
  }

  const bestOffer = component.offers.reduce((best, current) =>
    current.price < best.price ? current : best
  );

  const handlePress = async () => {
    if (onPress) {
      onPress(component);
    } else {
      // Navigate to Amazon using affiliate link
      await handleAffiliateNavigation();
    }
  };

  const handleAffiliateNavigation = async () => {
    try {
      console.log('🔗 Opening affiliate link for:', component.name);
      console.log('🌐 URL:', bestOffer.url);

      // Try to open the affiliate URL
      const supported = await Linking.canOpenURL(bestOffer.url);

      if (supported) {
        await Linking.openURL(bestOffer.url);
        console.log('✅ Successfully opened affiliate link');
      } else {
        console.warn('⚠️ Cannot open URL:', bestOffer.url);
        Alert.alert(
          'Cannot Open Link',
          'Unable to open the product link. Please check your internet connection.'
        );
      }
    } catch (error) {
      console.error('❌ Error opening affiliate link:', error);
      Alert.alert(
        'Error',
        'Failed to open product link. Please try again later.'
      );
    }
  };

  const getCategoryEmoji = (category: string) => {
    const emojiMap: { [key: string]: string } = {
      'CPU': '🧠',
      'GPU': '🎮',
      'RAM': '💾',
      'Motherboard': '🔌',
      'Storage': '💽',
      'Other': '🛠️'
    };
    return emojiMap[category] || '🛠️';
  };

  const styles = getStyles(theme);

  return (
    <TouchableOpacity style={styles.card} onPress={handlePress}>
      <View style={styles.header}>
        <View style={styles.imageContainer}>
          {component.imageUrl ? (
            <Image
              source={{ uri: component.imageUrl }}
              style={styles.productImage}
              resizeMode="contain"
              onError={() => console.warn('Failed to load image for:', component.name)}
            />
          ) : (
            <Text style={styles.categoryEmoji}>
              {getCategoryEmoji(component.category)}
            </Text>
          )}
        </View>
        <View style={styles.info}>
          <Text style={styles.name} numberOfLines={2}>{component.name}</Text>
          <Text style={styles.brand}>{component.brand}</Text>
          <View style={styles.ratingContainer}>
            <Text style={styles.rating}>★ {component.rating}</Text>
            <Text style={styles.reviews}>({component.reviewCount})</Text>
          </View>
        </View>
      </View>

      <View style={styles.priceContainer}>
        <Text style={styles.price}>₹{bestOffer.price.toLocaleString()}</Text>
        {bestOffer.originalPrice && (
          <Text style={styles.originalPrice}>₹{bestOffer.originalPrice.toLocaleString()}</Text>
        )}
        {bestOffer.discount && (
          <Text style={styles.discount}>{bestOffer.discount}% OFF</Text>
        )}
      </View>

      <View style={styles.footer}>
        <Text style={styles.store}>{bestOffer.retailer}</Text>
        <Text style={styles.stock}>
          {bestOffer.availability === 'in_stock' ? '✅ In Stock' : '❌ Out of Stock'}
        </Text>
      </View>

      {/* Show multiple stores if available */}
      {component.offers.length > 1 && (
        <Text style={styles.moreStores}>
          +{component.offers.length - 1} more store{component.offers.length > 2 ? 's' : ''}
        </Text>
      )}

      {/* Tap to shop indicator */}
      <View style={styles.shopIndicator}>
        <Text style={styles.shopText}>Tap to shop • Earn rewards</Text>
        <Text style={styles.shopArrow}>→</Text>
      </View>
    </TouchableOpacity>
  );
}

const getStyles = (theme: any) => StyleSheet.create({
  // Modern Card Design
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 0,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 8,
    transform: [{ scale: 1 }],
    marginHorizontal: 2, // Prevent shadow cutoff
  },
  // Modern Header Layout
  header: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  imageContainer: {
    width: 72,
    height: 72,
    backgroundColor: theme.isDark ? 'rgba(255, 255, 255, 0.1)' : '#f8fafc',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    overflow: 'hidden',
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  productImage: {
    width: 68,
    height: 68,
    borderRadius: 14,
  },
  categoryEmoji: {
    fontSize: 28,
  },
  info: {
    flex: 1,
    justifyContent: 'center',
  },
  name: {
    fontSize: 17,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 6,
    letterSpacing: -0.2,
  },
  brand: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: 6,
    fontWeight: '500',
  },
  // Modern Rating Design
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.isDark ? 'rgba(245, 158, 11, 0.2)' : '#fef3c7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  rating: {
    fontSize: 13,
    color: theme.isDark ? '#fbbf24' : '#f59e0b',
    fontWeight: '700',
    marginRight: 4,
  },
  reviews: {
    fontSize: 12,
    color: theme.isDark ? '#d97706' : '#92400e',
    fontWeight: '500',
  },
  // Modern Price Section
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    flexWrap: 'wrap',
    backgroundColor: theme.isDark ? 'rgba(5, 150, 105, 0.2)' : '#f0f9f0',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  price: {
    fontSize: 22,
    fontWeight: '800',
    color: theme.isDark ? '#10b981' : '#059669',
    marginRight: 12,
    letterSpacing: -0.5,
  },
  originalPrice: {
    fontSize: 16,
    color: theme.colors.textMuted,
    textDecorationLine: 'line-through',
    marginRight: 8,
    fontWeight: '500',
  },
  discount: {
    fontSize: 12,
    color: '#ffffff',
    backgroundColor: '#ef4444',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    fontWeight: '700',
    overflow: 'hidden',
  },
  // Modern Footer
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  store: {
    fontSize: 15,
    color: theme.isDark ? '#ffffff' : '#667eea',
    fontWeight: '600',
    backgroundColor: theme.isDark ? 'rgba(255, 255, 255, 0.15)' : '#eff6ff',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  stock: {
    fontSize: 13,
    color: theme.isDark ? '#10b981' : '#059669',
    fontWeight: '600',
  },
  moreStores: {
    fontSize: 12,
    color: theme.isDark ? '#ffffff' : '#667eea',
    textAlign: 'center',
    marginTop: 8,
    fontWeight: '600',
    backgroundColor: theme.isDark ? 'rgba(255, 255, 255, 0.15)' : '#eff6ff',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  // Modern Shop Indicator
  shopIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 16,
    paddingBottom: 16, // Increase bottom padding for better centering
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    backgroundColor: theme.isDark ? 'rgba(255, 255, 255, 0.05)' : '#f8fafc',
    marginHorizontal: -20,
    marginBottom: -20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    minHeight: 52, // Ensure minimum height for proper centering
  },
  shopText: {
    fontSize: 13,
    color: theme.isDark ? '#ffffff' : '#667eea',
    fontWeight: '600',
    marginRight: 8,
    textAlign: 'center',
    textAlignVertical: 'center', // Android specific
    includeFontPadding: false, // Remove extra padding on Android
  },
  shopArrow: {
    fontSize: 16,
    color: theme.isDark ? '#ffffff' : '#667eea',
    fontWeight: 'bold',
    textAlign: 'center',
    textAlignVertical: 'center', // Android specific
    includeFontPadding: false, // Remove extra padding on Android
  },
});
