import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  Alert
} from 'react-native';
import {
  useDebouncedSearch,
  useComponentsByCategory,
  usePrefetchComponents
} from '../hooks/useComponents';
import { ComponentCard } from './ComponentCard';
import { PCComponent } from '../types';

interface EnhancedSearchProps {
  onResultsChange?: (results: PCComponent[], hasResults: boolean) => void;
}

export function EnhancedSearch({ onResultsChange }: EnhancedSearchProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showResults, setShowResults] = useState(false);

  const { prefetchCategory } = usePrefetchComponents();

  // Debounced search with React Query
  const {
    data: searchResults = [],
    isLoading: isSearching,
    error: searchError,
    isFetching: isSearchFetching
  } = useDebouncedSearch(searchQuery, 500);

  // Category-based search
  const {
    data: categoryResults = [],
    isLoading: isCategoryLoading,
    error: categoryError
  } = useComponentsByCategory(selectedCategory, selectedCategory.length > 0);

  // Determine which results to show
  const currentResults = selectedCategory ? categoryResults : searchResults;
  const isLoading = selectedCategory ? isCategoryLoading : isSearching;
  const isFetching = selectedCategory ? isCategoryLoading : isSearchFetching;
  const error = selectedCategory ? categoryError : searchError;

  // Update parent component when results change
  React.useEffect(() => {
    if (onResultsChange) {
      onResultsChange(currentResults, showResults && currentResults.length > 0);
    }
  }, [currentResults, showResults, onResultsChange]);

  const handleSearch = useCallback(() => {
    if (searchQuery.trim()) {
      setSelectedCategory(''); // Clear category when searching
      setShowResults(true);
    } else {
      Alert.alert('Search', 'Please enter a component name');
    }
  }, [searchQuery]);

  const handleCategoryPress = useCallback((category: string) => {
    setSelectedCategory(category);
    setSearchQuery(''); // Clear search query when browsing by category
    setShowResults(true);

    // Prefetch related categories for better UX
    const relatedCategories = getRelatedCategories(category);
    relatedCategories.forEach(prefetchCategory);
  }, [prefetchCategory]);

  const clearResults = useCallback(() => {
    setShowResults(false);
    setSearchQuery('');
    setSelectedCategory('');
  }, []);

  const handleQueryChange = useCallback((text: string) => {
    setSearchQuery(text);
    if (text.trim().length === 0) {
      setShowResults(false);
    }
  }, []);

  // Show loading for immediate feedback
  const showLoadingSpinner = isLoading && searchQuery.trim().length > 0;
  // Show fetching indicator for background updates
  const showFetchingIndicator = isFetching && !isLoading && currentResults.length > 0;

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Search PC Components</Text>

      {/* Search Input */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search for CPU, GPU, RAM, etc..."
          value={searchQuery}
          onChangeText={handleQueryChange}
          onSubmitEditing={handleSearch}
        />
        <TouchableOpacity
          style={styles.searchButton}
          onPress={handleSearch}
          disabled={showLoadingSpinner}
        >
          {showLoadingSpinner ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <Text style={styles.searchButtonText}>🔍</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Background Fetching Indicator */}
      {showFetchingIndicator && (
        <View style={styles.fetchingIndicator}>
          <ActivityIndicator size="small" color="#3b82f6" />
          <Text style={styles.fetchingText}>Updating results...</Text>
        </View>
      )}

      {/* Error Display */}
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>⚠️ Failed to load results</Text>
          <TouchableOpacity onPress={() => {
            // Retry the current search/category
            if (selectedCategory) {
              setSelectedCategory('');
              setTimeout(() => setSelectedCategory(selectedCategory), 100);
            } else if (searchQuery.trim()) {
              const query = searchQuery;
              setSearchQuery('');
              setTimeout(() => setSearchQuery(query), 100);
            }
          }}>
            <Text style={styles.retryText}>Tap to retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {showResults ? (
        <View style={styles.resultsContainer}>
          <View style={styles.resultsHeader}>
            <Text style={styles.resultsTitle}>
              {currentResults.length} result{currentResults.length !== 1 ? 's' : ''} found
              {selectedCategory && ` in ${selectedCategory}`}
            </Text>
            <TouchableOpacity onPress={clearResults}>
              <Text style={styles.clearResults}>Clear</Text>
            </TouchableOpacity>
          </View>

          {currentResults.length > 0 ? (
            <FlatList
              data={currentResults}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => <ComponentCard component={item} />}
              showsVerticalScrollIndicator={false}
              scrollEnabled={false}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
            />
          ) : isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#3b82f6" />
              <Text style={styles.loadingText}>Searching components...</Text>
            </View>
          ) : (
            <View style={styles.noResults}>
              <Text style={styles.noResultsText}>No components found</Text>
              <Text style={styles.noResultsSubtext}>
                Try different keywords or browse categories below
              </Text>
            </View>
          )}
        </View>
      ) : (
        <View style={styles.categoriesContainer}>
          <Text style={styles.categoriesTitle}>Popular Categories</Text>
          {POPULAR_CATEGORIES.map((category) => (
            <TouchableOpacity
              key={category}
              style={[
                styles.categoryCard,
                selectedCategory === category && styles.categoryCardActive
              ]}
              onPress={() => handleCategoryPress(category)}
            >
              <Text style={[
                styles.categoryText,
                selectedCategory === category && styles.categoryTextActive
              ]}>
                {getCategoryIcon(category)} {category}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

// Constants and helper functions
const POPULAR_CATEGORIES = ['CPU', 'GPU', 'RAM', 'Motherboard', 'Storage'];

function getCategoryIcon(category: string): string {
  const icons: Record<string, string> = {
    CPU: '🔲',
    GPU: '🎮',
    RAM: '💾',
    Motherboard: '🔌',
    Storage: '💿',
  };
  return icons[category] || '🔧';
}

function getRelatedCategories(category: string): string[] {
  const related: Record<string, string[]> = {
    CPU: ['Motherboard', 'RAM'],
    GPU: ['PSU'],
    RAM: ['CPU', 'Motherboard'],
    Motherboard: ['CPU', 'RAM'],
    Storage: ['Motherboard'],
  };
  return related[category] || [];
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 16,
    textAlign: 'center',
  },
  // Search Styles
  searchContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    fontSize: 16,
    marginRight: 8,
  },
  searchButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
  },
  searchButtonText: {
    fontSize: 18,
  },
  // Fetching Indicator
  fetchingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    marginBottom: 8,
  },
  fetchingText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#64748b',
  },
  // Error Styles
  errorContainer: {
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    alignItems: 'center',
  },
  errorText: {
    color: '#dc2626',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  retryText: {
    color: '#2563eb',
    fontSize: 12,
    textDecorationLine: 'underline',
  },
  // Categories Styles
  categoriesContainer: {
    marginTop: 8,
  },
  categoriesTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  categoryCard: {
    backgroundColor: '#ffffff',
    padding: 16,
    marginBottom: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  categoryCardActive: {
    backgroundColor: '#eff6ff',
    borderColor: '#3b82f6',
  },
  categoryText: {
    fontSize: 16,
    color: '#1e293b',
    fontWeight: '500',
  },
  categoryTextActive: {
    color: '#3b82f6',
  },
  // Results Styles
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
    borderBottomColor: '#e2e8f0',
  },
  resultsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  clearResults: {
    fontSize: 14,
    color: '#3b82f6',
    fontWeight: '500',
  },
  separator: {
    height: 8,
  },
  // Loading Styles
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#64748b',
  },
  noResults: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  noResultsText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 8,
  },
  noResultsSubtext: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
});
