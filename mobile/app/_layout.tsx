import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { AppProvider } from '../src/context/AppContext';

export default function RootLayout() {
  return (
    <AppProvider>
      <View style={styles.container}>
        <StatusBar style="auto" />
        
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>🖥️ My PC App</Text>
          <Text style={styles.headerSubtitle}>Find the best PC component prices</Text>
        </View>
        
        {/* Router Content */}
        <Stack
          screenOptions={{
            headerShown: false,
          }}
        />
      </View>
    </AppProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  // Header Styles
  header: {
    backgroundColor: '#1e293b',
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
  },
});
