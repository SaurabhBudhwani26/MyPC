import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

const NativeWindTest: React.FC = () => {
  return (
    <View style={styles.container}>
      {/* Test message */}
      <View style={styles.card}>
        <Text style={styles.title}>
          NativeWind Setup Test ✨
        </Text>
        <Text style={styles.subtitle}>
          Testing modern UI implementation
        </Text>
        
        {/* Test if className works */}
        <View className="bg-blue-500 p-4 rounded-lg mb-4">
          <Text className="text-white text-center font-bold">
            If this has a blue background, NativeWind is working!
          </Text>
        </View>
        
        {/* Fallback styled button */}
        <TouchableOpacity style={styles.button}>
          <Text style={styles.buttonText}>
            Styled Button (Fallback)
          </Text>
        </TouchableOpacity>
      </View>
      
      {/* Feature test cards */}
      <View style={styles.featureContainer}>
        <View style={[styles.featureCard, { backgroundColor: '#22c55e' }]}>
          <Text style={styles.featureText}>Styles</Text>
        </View>
        <View style={[styles.featureCard, { backgroundColor: '#eab308' }]}>
          <Text style={styles.featureText}>Working</Text>
        </View>
        <View style={[styles.featureCard, { backgroundColor: '#ef4444' }]}>
          <Text style={styles.featureText}>Great!</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    padding: 24,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 24,
    padding: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 8,
    marginBottom: 24,
    marginHorizontal: 16,
    width: '100%',
    maxWidth: 400,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1f2937',
    textAlign: 'center',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  button: {
    backgroundColor: '#3b82f6',
    borderRadius: 16,
    paddingHorizontal: 24,
    paddingVertical: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  featureContainer: {
    flexDirection: 'row',
    gap: 16,
    marginHorizontal: 16,
  },
  featureCard: {
    flex: 1,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  featureText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default NativeWindTest;
