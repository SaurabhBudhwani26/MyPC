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
import { PCComponent } from './src/types/index';
import { apiService } from './src/services/api';
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
  
  // Pagination state for search
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMoreResults, setHasMoreResults] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [currentSearchQuery, setCurrentSearchQuery] = useState('');
  const [currentSearchCategory, setCurrentSearchCategory] = useState<string | undefined>(undefined);

  // Store all results for client-side pagination
  const [allSearchResults, setAllSearchResults] = useState<PCComponent[]>([]);
  const [totalResultsLoaded, setTotalResultsLoaded] = useState(false);

  // New paginated search function
  const performPaginatedSearch = async (query: string, category: string | undefined, page: number) => {
    try {
      console.log(`🔍 Searching page ${page} for: "${query}"`);
      
      // For page 1, fetch fresh data from APIs
      if (page === 1) {
        console.log('🆕 Fetching fresh data from APIs...');
        
        // Import API services
        const { amazonSearchAPIService } = await import('./src/services/amazon-search-api');
        const { flipkartAPIService } = await import('./src/services/flipkart-api');
        
        // Search both APIs once
        const [amazonResults, flipkartResults] = await Promise.all([
          amazonSearchAPIService.searchProducts(query, category, 1), // 1 page only
          flipkartAPIService.searchProducts(query, category, 1) // 1 page only
        ]);
        
        const allResults = [...(amazonResults || []), ...(flipkartResults || [])];
        console.log(`📦 Total results fetched: ${allResults.length}`);
        
        // Store all results for client-side pagination
        setAllSearchResults(allResults);
        setTotalResultsLoaded(true);
        
        // Return first page
        const pageSize = 8; // Smaller page size for better UX
        const pageResults = allResults.slice(0, pageSize);
        const hasMore = allResults.length > pageSize;
        
        return { results: pageResults, hasMore, totalResults: allResults.length };
      } else {
        // For subsequent pages, use stored results (client-side pagination)
        console.log(`📜 Loading page ${page} from cached results...`);
        
        const pageSize = 8;
        const startIndex = (page - 1) * pageSize;
        const endIndex = startIndex + pageSize;
        const pageResults = allSearchResults.slice(startIndex, endIndex);
        const hasMore = endIndex < allSearchResults.length;
        
        return { results: pageResults, hasMore, totalResults: allSearchResults.length };
      }
    } catch (error) {
      console.error('Error in paginated search:', error);
      return { results: [], hasMore: false, totalResults: 0 };
    }
  };

  const handleSearch = async () => {
    if (searchQuery.trim()) {
      setCurrentSearchQuery(searchQuery);
      setCurrentSearchCategory(undefined);
      setCurrentPage(1);
      setLoadingMore(false);
      
      const { results, hasMore } = await performPaginatedSearch(searchQuery, undefined, 1);
      setSearchResults(results);
      setHasMoreResults(hasMore);
      setShowResults(true);
    } else {
      Alert.alert('Search', 'Please enter a component name');
    }
  };

  const handleCategoryPress = async (category: string) => {
    setCurrentSearchQuery('');
    setCurrentSearchCategory(category);
    setCurrentPage(1);
    setLoadingMore(false);
    
    const { results, hasMore } = await performPaginatedSearch(category, category, 1);
    setSearchResults(results);
    setHasMoreResults(hasMore);
    setShowResults(true);
    setSearchQuery(''); // Clear search query when browsing by category
  };

  // Load more results when user scrolls to bottom
  const loadMoreResults = async () => {
    if (loadingMore || !hasMoreResults) return;
    
    setLoadingMore(true);
    const nextPage = currentPage + 1;
    const query = currentSearchQuery || currentSearchCategory || '';
    
    console.log(`📜 Loading more results - page ${nextPage}`);
    
    const { results, hasMore } = await performPaginatedSearch(query, currentSearchCategory, nextPage);
    
    setSearchResults(prevResults => [...prevResults, ...results]);
    setCurrentPage(nextPage);
    setHasMoreResults(hasMore);
    setLoadingMore(false);
  };

  // Render footer for infinite scroll
  const renderSearchFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={styles.loadMoreContainer}>
        <ActivityIndicator size="small" color={theme.colors.primary} />
        <Text style={styles.loadMoreText}>Loading more results...</Text>
      </View>
    );
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
              onEndReached={loadMoreResults}
              onEndReachedThreshold={0.1}
              ListFooterComponent={renderSearchFooter}
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

  // Function to load simple deals - 15 Amazon + 15 Flipkart with EarnKaro affiliate links
  const loadAffiliateDeals = async (isBackgroundLoad = false) => {
    if (isBackgroundLoad) {
      console.log('🚀 Background preloading deals on app startup...');
    } else {
      console.log('🎯 Loading simple deals (15 Amazon + 15 Flipkart)...');
    }
    
    setLoadingDeals(true);
    try {
      // Import simple deals service
      const { simpleDealsService } = await import('./src/services/simple-deals-service');

      // Get 30 deals (15 Amazon + 15 Flipkart) with affiliate links
      const dealsComponents = await simpleDealsService.getTodaysDeals();
      console.log(`📦 Received ${dealsComponents?.length || 0} deals with affiliate links`);

      if (Array.isArray(dealsComponents) && dealsComponents.length > 0) {
        setAffiliateDeals(dealsComponents);
        if (isBackgroundLoad) {
          console.log(`⚡ BACKGROUND: Pre-loaded ${dealsComponents.length} deals ready for Deals tab`);
        } else {
          console.log(`✅ Successfully loaded ${dealsComponents.length} deals (Amazon + Flipkart)`);
        }
      } else {
        console.log('⚠️ No deals received from simple deals service');
        setAffiliateDeals([]);
      }
    } catch (error) {
      if (isBackgroundLoad) {
        console.error('❌ Background deals preload failed (will retry when user opens Deals tab):', error);
        // Don't show error to user for background load failures
      } else {
        console.error('❌ Error loading simple deals:', error);
      }
      setAffiliateDeals([]);
    } finally {
      setLoadingDeals(false);
    }
  };

  // 🚀 OPTIMIZATION: Preload deals in background when app starts
  useEffect(() => {
    let isCancelled = false;

    // Start loading deals in background immediately when app starts
    console.log('🚀 App started - preloading deals in background for instant access...');
    
    // Small delay to let the app render first, then load deals in background
    const preloadTimer = setTimeout(() => {
      if (!isCancelled && affiliateDeals.length === 0 && !loadingDeals) {
        loadAffiliateDeals(true).catch(error => {
          if (!isCancelled) {
            console.error('❌ Background preload error (will retry on demand):', error);
          }
        });
      }
    }, 1000); // 1 second delay to let app render smoothly first

    return () => {
      isCancelled = true;
      clearTimeout(preloadTimer);
    };
  }, []); // Run only once when app starts

  // Fallback: Load deals if not already loaded when user opens Deals tab
  useEffect(() => {
    let isCancelled = false;

    if (activeTab === 'deals' && affiliateDeals.length === 0 && !loadingDeals) {
      console.log('🎯 Deals tab opened but no deals loaded - loading now...');
      loadAffiliateDeals(false).catch(error => {
        if (!isCancelled) {
          console.error('❌ Error in deals fallback loading:', error);
        }
      });
    }

    // Cleanup function to prevent state updates on unmounted component
    return () => {
      isCancelled = true;
    };
  }, [activeTab, affiliateDeals.length, loadingDeals]);

  const renderDealsTab = () => {
    // For loading state, use ScrollView
    if (loadingDeals) {
      return (
        <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>MyPC</Text>
          </View>

          <View style={styles.tabContent}>
            <Text style={styles.sectionTitle}>Today's Best Deals 💰</Text>
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#3b82f6" />
              <Text style={styles.loadingText}>🚀 Loading amazing deals...</Text>
              <Text style={styles.loadingSubtext}>Finding best prices from Amazon & Flipkart</Text>
            </View>
          </View>
          {/* Extra bottom spacing */}
          <View style={{ height: 80 }} />
        </ScrollView>
      );
    }

    // For empty state, use ScrollView
    if (affiliateDeals.length === 0) {
      return (
        <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>MyPC</Text>
          </View>

          <View style={styles.tabContent}>
            <Text style={styles.sectionTitle}>Today's Best Deals 💰</Text>
            <View style={styles.dealCard}>
              <Text style={styles.dealTitle}>🚀 Preparing Deals...</Text>
              <Text style={styles.dealDiscount}>Loading 15 Amazon + 15 Flipkart deals with affiliate links</Text>
              <TouchableOpacity onPress={() => loadAffiliateDeals(false)} style={styles.retryButton}>
                <Text style={styles.retryButtonText}>🔄 Load Now</Text>
              </TouchableOpacity>
            </View>
          </View>
          {/* Extra bottom spacing */}
          <View style={{ height: 80 }} />
        </ScrollView>
      );
    }

    // For deals list, use FlatList directly (enables pull-to-refresh)
    return (
      <View style={styles.container}>
        <FlatList
          data={affiliateDeals}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          refreshing={loadingDeals}
          onRefresh={() => loadAffiliateDeals(false)} // Manual refresh
          ListHeaderComponent={
            <>
              {/* Header */}
              <View style={styles.header}>
                <Text style={styles.headerTitle}>MyPC</Text>
              </View>

              <View style={styles.tabContent}>
                <Text style={styles.sectionTitle}>Today's Best Deals 💰</Text>
                
                {/* Success indicator for preloaded deals */}
                <View style={styles.dealsReadyBanner}>
                  <Text style={styles.dealsReadyText}>⚡ {affiliateDeals.length} deals ready! Pull to refresh for latest.</Text>
                </View>
              </View>
            </>
          }
          renderItem={({ item }) => (
            <View style={{ paddingHorizontal: 24 }}>
              <ComponentCard component={item} />
            </View>
          )}
          contentContainerStyle={{ paddingBottom: 100 }} // Extra padding for bottom nav
        />
      </View>
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
  loadingSubtext: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginTop: 8,
    textAlign: 'center',
  },
  // Deals Ready Banner Styles
  dealsReadyBanner: {
    backgroundColor: theme.isDark ? 'rgba(34, 197, 94, 0.2)' : '#f0fdf4',
    borderWidth: 1,
    borderColor: theme.isDark ? '#22c55e' : '#16a34a',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    alignItems: 'center',
  },
  dealsReadyText: {
    fontSize: 14,
    color: theme.isDark ? '#22c55e' : '#15803d',
    fontWeight: '600',
    textAlign: 'center',
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
  // Infinite scroll loading styles
  loadMoreContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    marginTop: 16,
  },
  loadMoreText: {
    fontSize: 14,
    color: theme.colors.textMuted,
    marginTop: 8,
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
