import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Text, View, StyleSheet, TouchableOpacity, Alert, TextInput, ActivityIndicator, FlatList, Pressable, ScrollView } from 'react-native';
import { ComponentCard } from './src/components/ComponentCard';
import { PCBuilderTab } from './src/components/PCBuilderTab';
import { ProfileTab } from './src/components/ProfileTab';
import { SignInScreen } from './src/screens/SignInScreen';
import { SignUpScreen } from './src/screens/SignUpScreen';
import { AppProvider, useAppContext } from './src/context/AppContext';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { PCComponent } from './src/types';
type TabType = 'builds' | 'deals' | 'profile';
type AuthScreenType = 'signin' | 'signup';

// Authenticated App Wrapper
function AuthenticatedApp() {
  const { theme } = useTheme();
  const { isAuthenticated, isLoading } = useAuth();
  const [authScreen, setAuthScreen] = useState<AuthScreenType>('signin');
  const [showAuth, setShowAuth] = useState(false);

  const handleAuthRequired = () => {
    setShowAuth(true);
    setAuthScreen('signin');
  };

  const handleSignInSuccess = () => {
    setShowAuth(false);
  };

  const handleSignUpSuccess = () => {
    setShowAuth(false);
  };

  const handleNavigateToSignUp = () => {
    setAuthScreen('signup');
  };

  const handleNavigateToSignIn = () => {
    setAuthScreen('signin');
  };

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.background }}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={{ color: theme.colors.text, marginTop: 12 }}>Loading...</Text>
      </View>
    );
  }

  // Show authentication screens if user needs to authenticate
  if (!isAuthenticated || showAuth) {
    return authScreen === 'signin' ? (
      <SignInScreen 
        onNavigateToSignUp={handleNavigateToSignUp}
        onSignInSuccess={handleSignInSuccess}
      />
    ) : (
      <SignUpScreen 
        onNavigateToSignIn={handleNavigateToSignIn}
        onSignUpSuccess={handleSignUpSuccess}
      />
    );
  }

  // Show main app if authenticated
  return (
    <AppProvider>
      <MainApp onAuthRequired={handleAuthRequired} />
    </AppProvider>
  );
}

// Main App Component with authentication callback
function MainApp({ onAuthRequired }: { onAuthRequired: () => void }) {
  const { theme } = useTheme();
  const {
    activeTab,
    searchQuery,
    isLoading,
    setActiveTab,
    setSearchQuery,
    searchComponents,
    getComponentsByCategory,
  } = useAppContext();
  
  const [searchResults, setSearchResults] = useState<PCComponent[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [affiliateDeals, setAffiliateDeals] = useState<PCComponent[]>([]);
  const [loadingDeals, setLoadingDeals] = useState(false);

  const handleSearch = async () => {
    if (searchQuery.trim()) {
      const results = await searchComponents(searchQuery);
      setSearchResults(results);
      setShowResults(true);
    } else {
      Alert.alert('Search', 'Please enter a component name');
    }
  };

  const handleCategoryPress = async (category: string) => {
    const results = await getComponentsByCategory(category);
    setSearchResults(results);
    setShowResults(true);
    setSearchQuery(''); // Clear search query when browsing by category
  };

  const handleTabPress = (tab: TabType) => {
    setActiveTab(tab);
    setShowResults(false); // Reset search results when switching tabs
    setSearchResults([]);
  };

  const renderSearchTab = () => (
    <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>MyPC</Text>
      </View>
      
      <View style={styles.tabContent}>
        <Text style={styles.sectionTitle}>Search PC Components</Text>
      
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search for CPU, GPU, RAM, etc..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={handleSearch}
        />
        <TouchableOpacity style={styles.searchButton} onPress={handleSearch} disabled={isLoading}>
          {isLoading ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <Text style={styles.searchButtonText}>🔍</Text>
          )}
        </TouchableOpacity>
      </View>
      
      {showResults ? (
        <View style={styles.resultsContainer}>
          <View style={styles.resultsHeader}>
            <Text style={styles.resultsTitle}>
              {searchResults.length} result{searchResults.length !== 1 ? 's' : ''} found
            </Text>
            <TouchableOpacity onPress={() => { setShowResults(false); setSearchResults([]); }}>
              <Text style={styles.clearResults}>Clear</Text>
            </TouchableOpacity>
          </View>
          
          {searchResults.length > 0 ? (
            <FlatList
              data={searchResults}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => <ComponentCard component={item} />}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 80 }}
            />
          ) : (
            <View style={styles.noResults}>
              <Text style={styles.noResultsText}>No components found</Text>
              <Text style={styles.noResultsSubtext}>Try different keywords or browse categories below</Text>
            </View>
          )}
        </View>
      ) : (
        <View style={styles.categoriesContainer}>
          <Text style={styles.categoriesTitle}>Popular Categories</Text>
          {['CPU', 'GPU', 'RAM', 'Motherboard', 'Storage'].map((category) => (
            <TouchableOpacity 
              key={category} 
              style={styles.categoryCard}
              onPress={() => handleCategoryPress(category)}
            >
              <Text style={styles.categoryText}>{category}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
      </View>
      {/* Extra bottom spacing */}
      <View style={{ height: 80 }} />
    </ScrollView>
  );

  const renderBuilderTab = () => (
    <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>MyPC</Text>
      </View>
      
      <PCBuilderTab onAuthRequired={() => {}} />
      {/* Extra bottom spacing */}
      <View style={{ height: 110 }} />
    </ScrollView>
  );

  // Function to load affiliate deals (moved outside render function)
  const loadAffiliateDeals = async () => {
    console.log('🔄 Starting to load affiliate deals...');
    setLoadingDeals(true);
    try {
      // Import affiliate service dynamically to avoid import issues
      const { affiliateService } = await import('./src/services/affiliate-service');
      console.log('✅ Affiliate service imported successfully');
      
      const deals = await affiliateService.getBestDeals(undefined, 10);
      console.log('📦 Received deals:', deals?.length || 0, 'items');
      console.log('🎯 First deal:', deals?.[0]?.name || 'No deals found');
      
      setAffiliateDeals(deals || []);
    } catch (error) {
      console.error('❌ Error loading affiliate deals:', error);
    } finally {
      setLoadingDeals(false);
      console.log('✅ Loading deals completed');
    }
  };

  // Load deals when tab is first viewed
  useEffect(() => {
    if (activeTab === 'deals' && affiliateDeals.length === 0) {
      loadAffiliateDeals();
    }
  }, [activeTab]);

  const renderDealsTab = () => {

    return (
      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>MyPC</Text>
        </View>
        
        <View style={styles.tabContent}>
          <Text style={styles.sectionTitle}>Today's Best Deals 💰</Text>
        
        {loadingDeals ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#3b82f6" />
            <Text style={styles.loadingText}>Finding best deals...</Text>
          </View>
        ) : affiliateDeals.length > 0 ? (
          <FlatList
            data={affiliateDeals}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <ComponentCard component={item} />}
            showsVerticalScrollIndicator={false}
            refreshing={loadingDeals}
            onRefresh={loadAffiliateDeals}
            contentContainerStyle={{ paddingBottom: 80 }}
          />
        ) : (
          <View style={styles.dealCard}>
            <Text style={styles.dealTitle}>🔄 Loading Real Deals...</Text>
            <Text style={styles.dealDiscount}>Coming from Flipkart & Amazon</Text>
            <TouchableOpacity onPress={loadAffiliateDeals} style={styles.retryButton}>
              <Text style={styles.retryButtonText}>🔄 Retry</Text>
            </TouchableOpacity>
          </View>
        )}
        </View>
        {/* Extra bottom spacing */}
        <View style={{ height: 80 }} />
      </ScrollView>
    );
  };

  const renderProfileTab = () => (
    <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>MyPC</Text>
      </View>
      
      <ProfileTab />
      {/* Extra bottom spacing */}
      <View style={{ height: 80 }} />
    </ScrollView>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'builds': return renderBuilderTab();
      case 'deals': return renderDealsTab();
      case 'profile': return renderProfileTab();
      default: return renderBuilderTab();
    }
  };

  const styles = getStyles(theme);

  return (
    <View style={styles.container}>
      <StatusBar style={theme.isDark ? 'light' : 'dark'} />
      
      {/* Scrollable Content with Header */}
      <View style={styles.content}>
        {renderContent()}
      </View>
      
      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        {[
          { key: 'builds' as TabType, label: 'PC Builder', icon: '🛠️' },
          { key: 'deals' as TabType, label: 'Deals', icon: '💰' },
          { key: 'profile' as TabType, label: 'Profile', icon: '👤' },
        ].map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[
              styles.navItem,
              activeTab === tab.key && styles.navItemActive
            ]}
            onPress={() => handleTabPress(tab.key)}
          >
            <Text style={[
              styles.navIcon,
              { color: activeTab === tab.key ? '#ffffff' : theme.colors.textMuted }
            ]}>{tab.icon}</Text>
            <Text style={[
              styles.navLabel,
              { 
                color: activeTab === tab.key ? '#ffffff' : theme.colors.textMuted,
                fontWeight: activeTab === tab.key ? '600' : 'normal'
              }
            ]}>{tab.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const getStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  // Header Styles - Compact Design (Now Scrollable) - Matches Tab Color
  header: {
    backgroundColor: theme.colors.primary,
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 24,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    marginBottom: 0,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'center',
    fontFamily: 'system-ui',
    letterSpacing: -0.3,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.85)',
    textAlign: 'center',
    fontWeight: '500',
    letterSpacing: 0.3,
  },
  // Content Styles
  content: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
    paddingBottom: 80, // Proper space for floating navigation (navbar height + margins + safe area)
  },
  tabContent: {
    padding: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 16,
    textAlign: 'center',
  },
  // Search Styles - Modern Glass Effect
  searchContainer: {
    flexDirection: 'row',
    marginBottom: 32,
    alignItems: 'center',
    gap: 12,
  },
  searchInput: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 20,
    borderWidth: 0,
    fontSize: 16,
    color: theme.colors.text,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  searchButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 20,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  searchButtonText: {
    fontSize: 20,
  },
  // Categories Styles - Modern Cards
  categoriesContainer: {
    marginTop: 16,
  },
  categoriesTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 20,
    textAlign: 'center',
  },
  categoryCard: {
    backgroundColor: theme.colors.surface,
    padding: 20,
    marginBottom: 12,
    borderRadius: 16,
    borderWidth: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 6,
    transform: [{ scale: 1 }],
  },
  categoryText: {
    fontSize: 17,
    color: theme.colors.text,
    fontWeight: '600',
    textAlign: 'center',
  },
  // Build Styles
  buildCard: {
    backgroundColor: theme.colors.surface,
    padding: 16,
    marginBottom: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  buildTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 4,
  },
  buildDesc: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  // Deal Styles
  dealCard: {
    backgroundColor: theme.colors.surface,
    padding: 16,
    marginBottom: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.success,
  },
  dealTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 4,
  },
  dealDiscount: {
    fontSize: 12,
    color: theme.colors.success,
    fontWeight: '600',
    marginBottom: 4,
  },
  dealStore: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  // Profile Styles
  profileText: {
    fontSize: 16,
    color: theme.colors.text,
    marginBottom: 8,
    paddingLeft: 4,
  },
  // Bottom Navigation Styles - Modern Glassmorphism (Lowered)
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: theme.isDark ? 'rgba(30, 30, 30, 0.95)' : 'rgba(255, 255, 255, 0.95)',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderTopWidth: 0,
    marginHorizontal: 16,
    marginBottom: 16, // Reduced from 32 to 16 for lower position
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 16,
  },
  navItemActive: {
    backgroundColor: theme.colors.primary,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    transform: [{ translateY: -2 }],
  },
  navIcon: {
    fontSize: 22,
    marginBottom: 4,
  },
  navIconActive: {
    fontSize: 22,
  },
  navLabel: {
    fontSize: 11,
    textAlign: 'center',
    fontWeight: '500',
  },
  navLabelActive: {
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
    color: '#ffffff',
  },
  // Search Results Styles
  resultsContainer: {
    flex: 1,
    marginTop: 8,
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  resultsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
  },
  clearResults: {
    fontSize: 14,
    color: theme.isDark ? '#ffffff' : theme.colors.primary,
    fontWeight: '500',
  },
  noResults: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  noResultsText: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.textMuted,
    marginBottom: 8,
  },
  noResultsSubtext: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  // Modern Loading Styles
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    backgroundColor: theme.colors.surface,
    borderRadius: 20,
    marginHorizontal: 20,
    marginVertical: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  loadingText: {
    fontSize: 18,
    color: theme.colors.primary,
    marginTop: 16,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  // Retry Button Styles
  retryButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
  },
});

// Main App Component with Context Provider
function AppWithProviders() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AuthenticatedApp />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default AppWithProviders;
