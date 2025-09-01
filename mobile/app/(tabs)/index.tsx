import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Alert, 
  TextInput, 
  ActivityIndicator, 
  FlatList 
} from 'react-native';
import { ComponentCard } from '../../src/components/ComponentCard';
import { useAppContext } from '../../src/context/AppContext';
import { PCComponent } from '../../src/types';

export default function SearchScreen() {
  const {
    searchQuery,
    isLoading,
    setSearchQuery,
    searchComponents,
    getComponentsByCategory,
  } = useAppContext();
  
  const [searchResults, setSearchResults] = useState<PCComponent[]>([]);
  const [showResults, setShowResults] = useState(false);

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

  const clearResults = () => {
    setShowResults(false);
    setSearchResults([]);
    setSearchQuery('');
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
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
              <TouchableOpacity onPress={clearResults}>
                <Text style={styles.clearResults}>Clear</Text>
              </TouchableOpacity>
            </View>
            
            {searchResults.length > 0 ? (
              <FlatList
                data={searchResults}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => <ComponentCard component={item} />}
                showsVerticalScrollIndicator={false}
                scrollEnabled={false}
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
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  content: {
    padding: 20,
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
    marginBottom: 24,
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
  categoryText: {
    fontSize: 16,
    color: '#1e293b',
    fontWeight: '500',
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
