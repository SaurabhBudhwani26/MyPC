import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Linking } from 'react-native';
import { useAppContext } from '../../src/context/AppContext';
import { ComponentOffer } from '../../src/types';

export default function DealsScreen() {
  const { getTodayDeals, isLoading } = useAppContext();
  const [deals, setDeals] = useState<ComponentOffer[]>([]);

  useEffect(() => {
    loadDeals();
  }, []);

  const loadDeals = async () => {
    try {
      const todayDeals = await getTodayDeals();
      setDeals(todayDeals);
    } catch (error) {
      console.error('Error loading deals:', error);
    }
  };

  const handleDealPress = (url: string) => {
    Linking.openURL(url);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(price);
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Loading today's deals...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.sectionTitle}>Today's Best Deals</Text>
        
        {deals.length > 0 ? (
          deals.map((deal) => (
            <TouchableOpacity 
              key={deal.id} 
              style={styles.dealCard}
              onPress={() => handleDealPress(deal.url)}
            >
              <View style={styles.dealHeader}>
                <Text style={styles.dealTitle}>RTX 4060 Ti - {formatPrice(deal.price)}</Text>
                <Text style={styles.dealStore}>{deal.retailer}</Text>
              </View>
              <View style={styles.dealPricing}>
                {deal.originalPrice && (
                  <Text style={styles.originalPrice}>{formatPrice(deal.originalPrice)}</Text>
                )}
                <Text style={styles.dealDiscount}>{deal.discount}% OFF</Text>
              </View>
              {deal.shipping && deal.shipping.free && (
                <Text style={styles.freeShipping}>🚚 Free Shipping</Text>
              )}
            </TouchableOpacity>
          ))
        ) : (
          <View style={styles.noDeals}>
            <Text style={styles.noDealsText}>No deals available right now</Text>
            <Text style={styles.noDealsSubtext}>Check back later for the latest offers!</Text>
          </View>
        )}

        {/* Static deals for demonstration */}
        <TouchableOpacity style={styles.dealCard}>
          <View style={styles.dealHeader}>
            <Text style={styles.dealTitle}>AMD Ryzen 5 7600 - ₹19,999</Text>
            <Text style={styles.dealStore}>Amazon</Text>
          </View>
          <View style={styles.dealPricing}>
            <Text style={styles.originalPrice}>₹22,999</Text>
            <Text style={styles.dealDiscount}>13% OFF</Text>
          </View>
          <Text style={styles.freeShipping}>🚚 Free Shipping</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.dealCard}>
          <View style={styles.dealHeader}>
            <Text style={styles.dealTitle}>Corsair Vengeance LPX 16GB - ₹4,799</Text>
            <Text style={styles.dealStore}>Flipkart</Text>
          </View>
          <View style={styles.dealPricing}>
            <Text style={styles.originalPrice}>₹5,999</Text>
            <Text style={styles.dealDiscount}>20% OFF</Text>
          </View>
          <Text style={styles.limitedTime}>⏰ Limited Time Offer</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#64748b',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 16,
    textAlign: 'center',
  },
  dealCard: {
    backgroundColor: '#ffffff',
    padding: 16,
    marginBottom: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderLeftWidth: 4,
    borderLeftColor: '#10b981',
  },
  dealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  dealTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
    flex: 1,
  },
  dealStore: {
    fontSize: 12,
    color: '#64748b',
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  dealPricing: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  originalPrice: {
    fontSize: 14,
    color: '#94a3b8',
    textDecorationLine: 'line-through',
    marginRight: 8,
  },
  dealDiscount: {
    fontSize: 12,
    color: '#10b981',
    fontWeight: '600',
    backgroundColor: '#dcfce7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  freeShipping: {
    fontSize: 12,
    color: '#3b82f6',
    fontWeight: '500',
  },
  limitedTime: {
    fontSize: 12,
    color: '#f59e0b',
    fontWeight: '500',
  },
  noDeals: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  noDealsText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 8,
  },
  noDealsSubtext: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
  },
});
