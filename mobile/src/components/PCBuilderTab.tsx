import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Alert, ActivityIndicator, Image, Modal, TextInput, Linking, Platform } from 'react-native';
import { PCComponent } from '../types/index';
import { API_CONFIG } from '../config/api';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { authenticatedApi } from '../services/authenticated-api';
import { apiService } from '../services/api';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';

interface LocalPCBuild {
  id: string;
  name: string;
  description?: string;
  components: {
    cpu?: PCComponent;
    gpu?: PCComponent;
    ram?: PCComponent;
    motherboard?: PCComponent;
    storage?: PCComponent;
    psu?: PCComponent;
    case?: PCComponent;
    cooling?: PCComponent;
  };
  totalPrice: number;
  originalTotalPrice: number;
  totalDiscount: number;
  compatibility: {
    issues: string[];
    isCompatible: boolean;
    warnings: string[];
    errors: string[];
  };
  created: string;
  updated: string;
}

interface PCBuilderTabProps {
  onAuthRequired?: () => void;
}

// Provide a safe empty build to avoid null/undefined access
const emptyBuild: LocalPCBuild = {
  id: '',
  name: '',
  description: '',
  components: {},
  totalPrice: 0,
  originalTotalPrice: 0,
  totalDiscount: 0,
  compatibility: {
    isCompatible: true,
    warnings: [],
    errors: [],
    issues: []
  },
  created: new Date(0).toISOString(),
  updated: new Date(0).toISOString(),
};

// Normalize any incoming build object to the LocalPCBuild shape
const normalizeBuild = (b: any): LocalPCBuild => ({
  id: b?.id ?? b?._id ?? '',
  name: b?.name ?? '',
  description: b?.description ?? '',
  components: b?.components ?? {},
  totalPrice: b?.totalPrice ?? 0,
  originalTotalPrice: b?.originalTotalPrice ?? 0,
  totalDiscount: b?.totalDiscount ?? 0,
  compatibility: {
    isCompatible: b?.compatibility?.isCompatible ?? true,
    warnings: b?.compatibility?.warnings ?? [],
    errors: b?.compatibility?.errors || b?.compatibility?.issues || [],
    issues: []
  },
  created: b?.createdAt ?? b?.created ?? new Date().toISOString(),
  updated: b?.updatedAt ?? b?.lastModified ?? b?.updated ?? new Date().toISOString(),
});

const componentCategories = [
  { key: 'cpu', label: 'Processor (CPU)', icon: '🧠', required: true },
  { key: 'gpu', label: 'Graphics Card (GPU)', icon: '🎮', required: false },
  { key: 'ram', label: 'Memory (RAM)', icon: '💾', required: true },
  { key: 'motherboard', label: 'Motherboard', icon: '🔌', required: true },
  { key: 'storage', label: 'Storage', icon: '💽', required: true },
  { key: 'psu', label: 'Power Supply', icon: '🔋', required: false },
  { key: 'case', label: 'PC Cabinet', icon: '📦', required: false },
  { key: 'cooling', label: 'Cooling', icon: '❄️', required: false },
];

export function PCBuilderTab(props: PCBuilderTabProps = {}) {
  const { onAuthRequired } = props;
  
  const { theme } = useTheme();
  const { getAccessToken, isAuthenticated, isLoading: authLoading } = useAuth();
  
  const [currentBuild, setCurrentBuild] = useState<LocalPCBuild>(emptyBuild);
  const [isLoading, setIsLoading] = useState(false);
  const [showComponentSelector, setShowComponentSelector] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [availableComponents, setAvailableComponents] = useState<PCComponent[]>([]);
  const [allComponents, setAllComponents] = useState<PCComponent[]>([]);
  const [loadingComponents, setLoadingComponents] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMoreComponents, setHasMoreComponents] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [totalComponents, setTotalComponents] = useState(0);
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);
  
  const COMPONENTS_PER_PAGE = 20;
  const SEARCH_DEBOUNCE_DELAY = 2000; // 2 seconds

  // Setup authentication and create new build when authentication is ready
  useEffect(() => {
    // Setup the token getter for authenticated API
    authenticatedApi.setTokenGetter(getAccessToken);
    
    // Only create build when auth loading is complete
    if (!authLoading) {
      createNewBuild();
    }
  }, [getAccessToken, authLoading]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
    };
  }, [searchTimeout]);

  const createNewBuild = async () => {
    setIsLoading(true);
    try {
      console.log('🏗️ Starting PC build creation...');
      console.log('🔐 Authentication status:', isAuthenticated);
      
      // Check if user is authenticated - redirect to sign in if not
if (!isAuthenticated) {
        console.log('❌ User not authenticated - redirecting to sign in');
        onAuthRequired?.();
        // Keep an empty build to render safely
        setCurrentBuild(emptyBuild);
        return;
      }

      // Test token retrieval
      console.log('🔑 Testing token retrieval...');
      const token = await getAccessToken();
      console.log('🔑 Token available:', token ? `${token.substring(0, 20)}...` : 'null');

if (!token) {
        console.log('❌ No access token available - redirecting to sign in');
        onAuthRequired?.();
        setCurrentBuild(emptyBuild);
        return;
      }

      // Create new build via authenticated API
      console.log('🚀 Creating PC build via API...');
      const result = await authenticatedApi.createPCBuild({
        name: 'My PC Build',
        description: 'Custom PC configuration'
      });

      console.log('📝 API result:', { success: result.success, message: result.message });

if (result.success && result.build) {
        const normalized = normalizeBuild(result.build);
        setCurrentBuild(normalized);
        console.log('✅ PC build created successfully:', normalized.id);
      } else {
        console.log('❌ API call failed:', result.message);
        throw new Error(result.message || 'Failed to create build');
      }
    } catch (error) {
      console.error('❌ Error creating PC build:', error);
      if (API_CONFIG.ENABLE_MOCK_DATA) {
        console.log('🎭 Falling back to mock data...');
        // Create a mock build when API is not available
        setCurrentBuild({
          id: 'mock-build-1',
          name: 'My PC Build',
          description: 'Custom PC configuration',
          components: {},
          totalPrice: 0,
          originalTotalPrice: 0,
          totalDiscount: 0,
          compatibility: {
            isCompatible: true,
            warnings: [],
            errors: [],
            issues: []
          },
          created: new Date().toISOString(),
          updated: new Date().toISOString()
        });
        console.log('✅ Mock PC build created');
      } else {
        Alert.alert('Error', typeof error === 'string' ? error : 'Failed to create new PC build. Please check your connection.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const selectComponent = async (category: string) => {
    setSelectedCategory(category);
    setLoadingComponents(true);
    setShowComponentSelector(true);
    
    // Reset pagination state
    setCurrentPage(1);
    setHasMoreComponents(true);
    setTotalComponents(0);
    setSearchQuery(''); // Reset search when opening modal

    try {
      // Use paginated API for initial load
      const result = await apiService.searchComponentsPaginated(
        category.toLowerCase() === 'cpu' ? 'processor intel amd ryzen core i3 i5 i7 i9' :
        category.toLowerCase() === 'gpu' ? 'graphics card rtx gtx radeon nvidia amd' :
        category.toLowerCase() === 'ram' ? 'memory ram ddr4 ddr5 corsair gskill crucial' :
        category.toLowerCase() === 'motherboard' ? 'motherboard mainboard asus msi gigabyte asrock' :
        category.toLowerCase() === 'storage' ? 'ssd nvme hard drive storage samsung wd seagate' :
        category.toLowerCase() === 'psu' ? 'power supply psu smps corsair seasonic evga' :
        category.toLowerCase() === 'case' ? 'pc cabinet case tower mid tower full tower' :
        category.toLowerCase() === 'cooling' ? 'cpu cooler fan liquid cooling aio corsair noctua' :
        category,
        1, // page 1
        { category: category }
      );
      
      setAvailableComponents(result.components);
      setAllComponents(result.components); // Store for local search fallback
      setTotalComponents(result.totalComponents);
      setHasMoreComponents(result.hasMore);
      
      console.log(`📦 Loaded ${result.components.length} components from page 1, total: ${result.totalComponents}, hasMore: ${result.hasMore}`);
    } catch (error) {
      console.error('❌ Error fetching components:', error);
      Alert.alert('Error', 'Failed to load components');
      setAvailableComponents([]);
      setAllComponents([]);
      setHasMoreComponents(false);
    } finally {
      setLoadingComponents(false);
    }
  };

  const addComponentToBuild = async (component: PCComponent) => {
    if (!currentBuild) return;

    console.log('🔧 Adding component to build:', {
      buildId: currentBuild.id,
      selectedCategory,
      componentName: component.name
    });

    try {
      // Simplify the component data for API validation
      const componentData = {
        id: component.id || `comp-${Date.now()}`,
        name: component.name || 'Unknown Component',
        category: selectedCategory,
        brand: component.brand || 'Unknown',
        price: component.offers?.[0]?.price || 0,
        imageUrl: component.imageUrl || '',
        url: component.offers?.[0]?.url || ''
      };
      
      console.log('📦 Component data being sent:', componentData);
      
      const payload = {
        category: selectedCategory,
        componentId: componentData.id,
        component: componentData
      };
      
      console.log('📤 API payload:', payload);
      
      const result = await authenticatedApi.addComponentToBuild(currentBuild.id, payload);
      
      console.log('📥 API result:', result);

      if (result.success && result.build) {
        console.log('✅ Component added successfully, updating UI...');
        setCurrentBuild(normalizeBuild(result.build));
        setShowComponentSelector(false);
      } else {
        console.error('❌ API returned error:', result.message);
        throw new Error(result.message || 'Failed to add component');
      }
    } catch (error) {
      console.error('❌ Error adding component:', error);
      Alert.alert('Error', `Failed to add component to build: ${error.message || 'Unknown error'}`);
    }
  };

  const removeComponentFromBuild = async (category: string) => {
    if (!currentBuild) return;

    try {
      const result = await authenticatedApi.removeComponentFromBuild(currentBuild.id, category);

      if (result.success && result.build) {
        setCurrentBuild(normalizeBuild(result.build));
      } else {
        throw new Error(result.message || 'Failed to remove component');
      }
    } catch (error) {
      console.error('❌ Error removing component:', error);
      Alert.alert('Error', 'Failed to remove component from build');
    }
  };

  // Enhanced search functionality with relevance scoring
  const calculateRelevanceScore = (component: PCComponent, query: string): number => {
    const searchTerm = query.toLowerCase().trim();
    const componentName = (component.name || '').toLowerCase();
    const componentBrand = (component.brand || '').toLowerCase();
    const componentModel = (component.model || '').toLowerCase();
    const componentDescription = (component.description || '').toLowerCase();
    
    let score = 0;
    
    // ULTRA HIGH PRIORITY: Exact full matches (e.g., "ryzen 5 7600x" matches "AMD Ryzen 5 7600X")
    if (componentName === searchTerm) score += 1000;
    if (componentModel === searchTerm) score += 950;
    if (componentBrand === searchTerm) score += 900;
    
    // ULTRA HIGH PRIORITY: Specific model + memory/storage pattern matching
    // For queries like "5060 ti 16gb", "4070 12gb", "1tb ssd", "32gb ddr5"
    const specificPatterns = [
      // GPU with memory (e.g., "4070 12gb", "5060 ti 16gb")
      { pattern: /(\d{4})\s*(ti|super)?\s*(\d+gb)/gi, boost: 1200 },
      { pattern: /(rtx|gtx)\s*(\d{4})\s*(ti|super)?\s*(\d+gb)/gi, boost: 1100 },
      { pattern: /(rx)\s*(\d{4})\s*(xt)?\s*(\d+gb)/gi, boost: 1100 },
      
      // RAM with capacity and type (e.g., "32gb ddr5", "16gb ddr4")
      { pattern: /(\d+gb)\s*(ddr[45])/gi, boost: 1000 },
      { pattern: /(\d+gb)\s*(ram|memory)/gi, boost: 800 },
      
      // Storage with capacity (e.g., "1tb ssd", "500gb nvme")
      { pattern: /(\d+)(tb|gb)\s*(ssd|nvme|hdd)/gi, boost: 900 },
      
      // CPU with specific model (e.g., "i7 12700k", "ryzen 7 5800x")
      { pattern: /(i[3579])\s*(\d{4,5}[a-z]*)/gi, boost: 1000 },
      { pattern: /ryzen\s*([3579])\s*(\d{4}[a-z]*)/gi, boost: 1000 }
    ];
    
    specificPatterns.forEach(({ pattern, boost }) => {
      const searchMatches = searchTerm.match(pattern);
      const componentMatches = componentName.match(pattern) || componentDescription.match(pattern);
      
      if (searchMatches && componentMatches) {
        // Both search and component have the specific pattern - huge boost
        score += boost;
      } else if (searchMatches) {
        // Search has specific pattern, check if component contains the parts
        searchMatches.forEach(match => {
          const matchParts = match.split(/\s+/);
          let partMatches = 0;
          matchParts.forEach(part => {
            if (componentName.includes(part) || componentDescription.includes(part)) {
              partMatches++;
            }
          });
          
          if (partMatches === matchParts.length) {
            score += boost * 0.8; // Slightly lower boost if parts are scattered
          } else if (partMatches > matchParts.length / 2) {
            score += boost * 0.6; // Moderate boost for partial matches
          }
        });
      }
    });
    
    // VERY HIGH PRIORITY: Exact model number matches (e.g., "7600x" in "Ryzen 5 7600X")
    const modelNumberRegex = /\b(\d+[a-z]*x?)\b/gi;
    const searchModelNumbers = (searchTerm.match(modelNumberRegex) || []).map(m => m.toLowerCase());
    const componentModelNumbers = (componentName.match(modelNumberRegex) || []).map(m => m.toLowerCase());
    
    searchModelNumbers.forEach(searchModel => {
      componentModelNumbers.forEach(componentModelNum => {
        if (componentModelNum === searchModel) {
          score += 800; // Exact model number match gets massive boost
        } else if (componentModelNum.includes(searchModel) || searchModel.includes(componentModelNum)) {
          score += 400; // Partial model number match
        }
      });
    });
    
    // HIGH PRIORITY: Enhanced GPU pattern matching with memory specs
    const gpuPatterns = [
      // NVIDIA patterns with memory
      { pattern: /rtx\s*(\d{4})\s*(ti|super)?\s*(?:(\d+)gb)?/gi, boost: 750 },
      { pattern: /gtx\s*(\d{4})\s*(ti|super)?\s*(?:(\d+)gb)?/gi, boost: 700 },
      { pattern: /(\d{4})\s*(ti|super)/gi, boost: 650 }, // Just model + ti/super
      
      // AMD patterns with memory
      { pattern: /rx\s*(\d{4})\s*(xt)?\s*(?:(\d+)gb)?/gi, boost: 750 },
      { pattern: /radeon\s*rx\s*(\d{4})/gi, boost: 700 },
      
      // Memory-specific patterns
      { pattern: /(\d+)gb\s*(vram|memory)/gi, boost: 600 },
      { pattern: /(\d+)gb(?!.*ddr)/gi, boost: 400 } // GB without DDR (likely GPU memory)
    ];
    
    // HIGH PRIORITY: CPU-specific pattern matching for "Ryzen 5 7600X" style queries
    const cpuPatterns = [
      // AMD CPU patterns
      { pattern: /ryzen\s+([359])\s+(\d+[a-z]*x?)/gi, boost: 700 },
      { pattern: /ryzen\s+(\d+[a-z]*x?)/gi, boost: 650 },
      // Intel CPU patterns
      { pattern: /core\s+i([3579])\s*-?\s*(\d+[a-z]*)/gi, boost: 700 },
      { pattern: /i([3579])\s*-?\s*(\d+[a-z]*)/gi, boost: 650 }
    ];
    
    // Apply GPU patterns
    gpuPatterns.forEach(({ pattern, boost }) => {
      const searchMatches = searchTerm.match(pattern);
      if (searchMatches) {
        searchMatches.forEach(match => {
          if (componentName.includes(match.replace(/\s+/g, '\\s*')) || 
              componentDescription.includes(match.replace(/\s+/g, '\\s*'))) {
            score += boost;
          }
        });
      }
    });
    
    // Apply CPU patterns
    cpuPatterns.forEach(({ pattern, boost }) => {
      const searchMatches = searchTerm.match(pattern);
      if (searchMatches) {
        searchMatches.forEach(match => {
          if (componentName.includes(match.replace(/\s+/g, '\\s*'))) {
            score += boost;
          }
        });
      }
    });
    
    // VERY HIGH PRIORITY: Memory/Storage capacity matching
    const capacityPatterns = [
      // RAM capacity patterns
      { pattern: /(\d+)gb\s*(ddr[45]|ram|memory)/gi, boost: 800 },
      { pattern: /(\d+)gb(?=.*ram|.*memory|.*ddr)/gi, boost: 700 },
      
      // Storage capacity patterns  
      { pattern: /(\d+)(tb|gb)\s*(ssd|nvme|hdd)/gi, boost: 800 },
      { pattern: /(\d+)(tb|gb)(?=.*storage|.*drive)/gi, boost: 600 },
      
      // Speed patterns for RAM
      { pattern: /(\d{4})mhz/gi, boost: 500 },
      { pattern: /(\d{4})\s*(?:mhz)?\s*ddr/gi, boost: 550 }
    ];
    
    capacityPatterns.forEach(({ pattern, boost }) => {
      const searchMatches = searchTerm.match(pattern);
      const componentMatches = (componentName + ' ' + componentDescription).match(pattern);
      
      if (searchMatches && componentMatches) {
        searchMatches.forEach(searchMatch => {
          componentMatches.forEach(componentMatch => {
            if (searchMatch.toLowerCase() === componentMatch.toLowerCase()) {
              score += boost; // Exact capacity match
            } else {
              // Extract numbers for comparison
              const searchNum = parseInt(searchMatch.match(/\d+/)?.[0] || '0');
              const componentNum = parseInt(componentMatch.match(/\d+/)?.[0] || '0');
              
              if (searchNum === componentNum) {
                score += boost * 0.8; // Same number, different format
              }
            }
          });
        });
      }
    });
    
    // HIGH PRIORITY: Complete phrase matching (e.g., "ryzen 5" in search matches "Ryzen 5" in name)
    const searchWords = searchTerm.split(/\s+/);
    if (searchWords.length >= 2) {
      const phrases = [];
      for (let i = 0; i < searchWords.length - 1; i++) {
        phrases.push(searchWords.slice(i, i + 2).join(' '));
        if (i < searchWords.length - 2) {
          phrases.push(searchWords.slice(i, i + 3).join(' '));
        }
      }
      
      phrases.forEach(phrase => {
        if (componentName.includes(phrase)) {
          score += 500; // Multi-word phrase match
        }
      });
    }
    
    // MEDIUM-HIGH PRIORITY: Start-of-word matches
    if (componentName.startsWith(searchTerm)) score += 300;
    if (componentBrand.startsWith(searchTerm)) score += 250;
    if (componentModel.startsWith(searchTerm)) score += 200;
    
    // MEDIUM PRIORITY: Word boundary matches
    const wordBoundaryRegex = new RegExp(`\\b${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'i');
    if (wordBoundaryRegex.test(componentName)) score += 150;
    if (wordBoundaryRegex.test(componentBrand)) score += 125;
    if (wordBoundaryRegex.test(componentModel)) score += 100;
    if (wordBoundaryRegex.test(componentDescription)) score += 75;
    
    // MEDIUM PRIORITY: Individual word matching with position weighting
    searchWords.forEach((word, index) => {
      const positionBoost = Math.max(10 - index * 2, 1); // Earlier words get more weight
      if (componentName.includes(word)) score += 50 * positionBoost;
      if (componentBrand.includes(word)) score += 40 * positionBoost;
      if (componentModel.includes(word)) score += 30 * positionBoost;
      if (componentDescription.includes(word)) score += 20 * positionBoost;
    });
    
    // LOW PRIORITY: Substring matches
    if (componentName.includes(searchTerm)) score += 25;
    if (componentBrand.includes(searchTerm)) score += 20;
    if (componentModel.includes(searchTerm)) score += 15;
    if (componentDescription.includes(searchTerm)) score += 10;
    
    // Brand and series recognition boosts
    const brandBoosts = {
      // CPU brands and series - higher boosts for popular ones
      'amd': 30, 'intel': 30, 'ryzen': 25, 'core': 25, 
      'i3': 20, 'i5': 25, 'i7': 30, 'i9': 35,
      // GPU brands and series  
      'nvidia': 25, 'rtx': 30, 'gtx': 25, 'radeon': 20, 'rx': 25, 'geforce': 20,
      // Memory brands
      'corsair': 15, 'gskill': 15, 'kingston': 12, 'crucial': 12, 'ddr4': 10, 'ddr5': 15,
      // Storage brands
      'samsung': 15, 'wd': 12, 'seagate': 10, 'ssd': 10, 'nvme': 15,
      // PSU brands
      'seasonic': 12, 'evga': 10, 'coolermaster': 10,
      // Case brands
      'nzxt': 10, 'fractal': 8, 'lianli': 8
    };
    
    Object.entries(brandBoosts).forEach(([term, boost]) => {
      if (searchTerm.includes(term) && (componentName.includes(term) || componentBrand.includes(term))) {
        score += boost;
      }
    });
    
    // Special boosts for performance indicators
    if (searchTerm.includes('gaming') && (componentName.includes('gaming') || componentBrand.includes('gaming'))) {
      score += 50;
    }
    
    // Price range relevance
    const price = component.offers?.[0]?.price || 0;
    if (searchTerm.includes('budget') && price < 15000) score += 25;
    if (searchTerm.includes('mid') && price >= 15000 && price <= 50000) score += 20;
    if (searchTerm.includes('high') && price > 50000) score += 25;
    
    return score;
  };
  
  const performAdvancedLocalSearch = (components: PCComponent[], query: string): PCComponent[] => {
    const searchTerms = query.toLowerCase().trim().split(/\s+/).filter(term => term.length > 0);
    
    if (searchTerms.length === 0) return components;
    
    // Search for multiple terms
    
    // Score each component based on relevance
    const scoredComponents = components.map(component => {
      let totalScore = 0;
      const componentText = `${component.name} ${component.brand} ${component.model} ${component.description}`.toLowerCase();
      
      // First, give the full query a chance to match as a phrase
      const fullQueryScore = calculateRelevanceScore(component, query);
      totalScore += fullQueryScore;
      
      // Then calculate score for each individual search term
      let individualTermsScore = 0;
      searchTerms.forEach(term => {
        individualTermsScore += calculateRelevanceScore(component, term);
      });
      
      // Use the higher of full query or individual terms (but don't double count)
      totalScore = Math.max(fullQueryScore, individualTermsScore);
      
      // MASSIVE bonus for matching ALL terms in a multi-term query
      if (searchTerms.length > 1) {
        const matchingTerms = searchTerms.filter(term => {
          return componentText.includes(term);
        });
        
        if (matchingTerms.length === searchTerms.length) {
          // All terms match - huge bonus
          totalScore += 500;
        } else if (matchingTerms.length > 1) {
          // Some terms match
          const partialBonus = matchingTerms.length * 50;
          totalScore += partialBonus;
        }
        
        // Extra bonus for consecutive word matches (e.g., "ryzen 5" appearing together)
        const consecutiveMatches = findConsecutiveMatches(componentText, searchTerms);
        if (consecutiveMatches > 0) {
          const consecutiveBonus = consecutiveMatches * 200;
          totalScore += consecutiveBonus;
        }
      }
      
      return { component, score: totalScore };
    });
    
    // Filter out components with score 0 and sort by relevance
    const sortedResults = scoredComponents
      .filter(item => item.score > 0)
      .sort((a, b) => {
        // Primary sort: by relevance score (descending)
        if (b.score !== a.score) return b.score - a.score;
        
        // Secondary sort: by price (ascending for budget-conscious users)
        const priceA = a.component.offers?.[0]?.price || 0;
        const priceB = b.component.offers?.[0]?.price || 0;
        if (priceA !== priceB) return priceA - priceB;
        
        // Tertiary sort: by name (alphabetical)
        return (a.component.name || '').localeCompare(b.component.name || '');
      });
    
    // Sort by relevance
    
    return sortedResults.map(item => item.component);
  };
  
  // Helper function to find consecutive word matches
  const findConsecutiveMatches = (text: string, searchTerms: string[]): number => {
    let consecutiveCount = 0;
    
    // Check for each possible consecutive pair/trio of search terms
    for (let i = 0; i < searchTerms.length - 1; i++) {
      const phrase2 = searchTerms.slice(i, i + 2).join('\\s+');
      const regex2 = new RegExp(phrase2, 'i');
      if (regex2.test(text)) {
        consecutiveCount++;
      }
      
      // Check for 3-word consecutive matches
      if (i < searchTerms.length - 2) {
        const phrase3 = searchTerms.slice(i, i + 3).join('\\s+');
        const regex3 = new RegExp(phrase3, 'i');
        if (regex3.test(text)) {
          consecutiveCount += 2; // 3-word matches get extra weight
        }
      }
    }
    
    return consecutiveCount;
  };

  const handleSearchComponent = async (query: string) => {
    if (!query.trim()) {
      // Reset to paginated view of all components
      const initialComponents = allComponents.slice(0, COMPONENTS_PER_PAGE);
      setAvailableComponents(initialComponents);
      setCurrentPage(1);
      setHasMoreComponents(allComponents.length > COMPONENTS_PER_PAGE);
      setTotalComponents(allComponents.length);
      return;
    }

    setIsSearching(true);
    // Hide all products while search is in progress
    setAvailableComponents([]);
    // Reset pagination for search results
    setCurrentPage(1);
    
    try {
      // Fetch all 3 pages from Amazon API before showing any results
      let allApiComponents: PCComponent[] = [];
      
      console.log('🔄 Fetching 3 pages of results before prioritization...');
      
      for (let page = 1; page <= 3; page++) {
        try {
          console.log(`📄 Fetching page ${page}/3...`);
          const pageResult = await apiService.searchComponentsPaginated(query, page, {
            category: selectedCategory || undefined,
          });
          
          if (pageResult.components && pageResult.components.length > 0) {
            allApiComponents = [...allApiComponents, ...pageResult.components];
            console.log(`✅ Page ${page}: Added ${pageResult.components.length} components (total: ${allApiComponents.length})`);
          }
          
          // If this page has no more results, stop fetching
          if (!pageResult.hasMore) {
            console.log(`🏁 No more results after page ${page}, stopping fetch`);
            break;
          }
        } catch (pageError) {
          console.error(`❌ Error fetching page ${page}:`, pageError);
          // Continue to next page even if one fails
        }
      }
      
      console.log('🎯 All pages fetched, starting prioritization...');
      
      let searchResults: PCComponent[] = [];
      
      if (allApiComponents.length > 0) {
        // Apply local relevance scoring to all API results from all pages
        searchResults = performAdvancedLocalSearch(allApiComponents, query);
      } else {
        // Fallback to enhanced local search
        searchResults = performAdvancedLocalSearch(allComponents, query);
      }
      
      console.log('✨ Prioritization complete! Showing results...');
      
      // Only show results after ALL pages are fetched and prioritization is complete
      const paginatedResults = searchResults.slice(0, COMPONENTS_PER_PAGE);
      setTotalComponents(searchResults.length);
      setHasMoreComponents(searchResults.length > COMPONENTS_PER_PAGE);
      
      // Store full search results for pagination
      setAllComponents(searchResults);
      
      // Set results only after everything is processed
      setAvailableComponents(paginatedResults);
      
      console.log(`🏆 Search completed: fetched ${allApiComponents.length} components from 3 pages, prioritized to ${searchResults.length} results, showing first ${paginatedResults.length}`);
    } catch (error) {
      console.error('❌ Error searching components:', error);
      // Enhanced fallback search with relevance scoring
      const localResults = performAdvancedLocalSearch(allComponents, query);
      const paginatedResults = localResults.slice(0, COMPONENTS_PER_PAGE);
      setTotalComponents(localResults.length);
      setHasMoreComponents(localResults.length > COMPONENTS_PER_PAGE);
      setAllComponents(localResults);
      
      // Set results only after everything is processed
      setAvailableComponents(paginatedResults);
    } finally {
      setIsSearching(false);
    }
  };
  
  const loadMoreComponents = async () => {
    if (isLoadingMore || !hasMoreComponents) return;
    
    setIsLoadingMore(true);
    console.log(`📄 Loading more components... Current page: ${currentPage}`);
    
    try {
      const nextPage = currentPage + 1;
      
      // If we're in search mode, use local pagination from cached results
      if (searchQuery.trim()) {
        const startIndex = currentPage * COMPONENTS_PER_PAGE;
        const endIndex = startIndex + COMPONENTS_PER_PAGE;
        const nextBatch = allComponents.slice(startIndex, endIndex);
        
        if (nextBatch.length > 0) {
          setAvailableComponents(prev => [...prev, ...nextBatch]);
          setCurrentPage(nextPage);
          setHasMoreComponents(endIndex < allComponents.length);
          console.log(`✅ Search pagination: Loaded ${nextBatch.length} more from cache`);
        } else {
          setHasMoreComponents(false);
        }
      } else {
        // Use server-side pagination for category browsing
        const searchTerm = selectedCategory.toLowerCase() === 'cpu' ? 'processor intel amd ryzen core i3 i5 i7 i9' :
          selectedCategory.toLowerCase() === 'gpu' ? 'graphics card rtx gtx radeon nvidia amd' :
          selectedCategory.toLowerCase() === 'ram' ? 'memory ram ddr4 ddr5 corsair gskill crucial' :
          selectedCategory.toLowerCase() === 'motherboard' ? 'motherboard mainboard asus msi gigabyte asrock' :
          selectedCategory.toLowerCase() === 'storage' ? 'ssd nvme hard drive storage samsung wd seagate' :
          selectedCategory.toLowerCase() === 'psu' ? 'power supply psu smps corsair seasonic evga' :
          selectedCategory.toLowerCase() === 'case' ? 'pc cabinet case tower mid tower full tower' :
          selectedCategory.toLowerCase() === 'cooling' ? 'cpu cooler fan liquid cooling aio corsair noctua' :
          selectedCategory;
          
        const result = await apiService.searchComponentsPaginated(
          searchTerm,
          nextPage,
          { category: selectedCategory }
        );
        
        if (result.components.length > 0) {
          setAvailableComponents(prev => [...prev, ...result.components]);
          setCurrentPage(nextPage);
          setHasMoreComponents(result.hasMore);
          
          // Update allComponents for potential search later
          setAllComponents(prev => [...prev, ...result.components]);
          
          console.log(`✅ Server pagination: Loaded ${result.components.length} more from page ${nextPage}`);
        } else {
          setHasMoreComponents(false);
          console.log('📄 No more components from server');
        }
      }
    } catch (error) {
      console.error('❌ Error loading more components:', error);
      setHasMoreComponents(false);
    } finally {
      setIsLoadingMore(false);
    }
  };

  const getSearchPlaceholder = (category: string) => {
    switch (category) {
      case 'cpu':
        return 'Search: Intel i7, Ryzen 5, budget, gaming, 8-core...';
      case 'gpu':
        return 'Search: RTX 4060, RX 6600, gaming, budget, 8GB...';
      case 'ram':
        return 'Search: 16GB, DDR4, Corsair, 3200MHz, gaming...';
      case 'motherboard':
        return 'Search: ASUS B450, MSI, ATX, WiFi, RGB...';
      case 'storage':
        return 'Search: 1TB SSD, NVMe, Samsung, fast, budget...';
      case 'psu':
        return 'Search: 650W, modular, 80+ Gold, Corsair...';
      case 'case':
        return 'Search: Mid Tower, ATX, RGB, airflow, Cooler Master...';
      case 'cooling':
        return 'Search: CPU cooler, AIO, 240mm, quiet, RGB...';
      default:
        return 'Search by brand, model, specs, or features...';
    }
  };
  
  // Add search suggestions based on category
  const getSearchSuggestions = (category: string): string[] => {
    const suggestions: Record<string, string[]> = {
      cpu: ['Intel i5', 'Intel i7', 'Ryzen 5', 'Ryzen 7', 'gaming', 'budget', '8-core', '6-core'],
      gpu: ['RTX 4060', 'RTX 4070', 'RX 6600', 'RX 6700', 'gaming', 'budget', '8GB VRAM', '12GB VRAM'],
      ram: ['16GB', '32GB', 'DDR4', 'DDR5', '3200MHz', '3600MHz', 'RGB', 'low profile'],
      motherboard: ['ATX', 'Micro ATX', 'WiFi', 'Bluetooth', 'RGB', 'overclocking', 'B450', 'B550'],
      storage: ['1TB', '500GB', '2TB', 'NVMe', 'M.2', 'fast', 'gaming', 'budget SSD'],
      psu: ['650W', '750W', 'modular', '80+ Gold', '80+ Bronze', 'quiet', 'RGB'],
      case: ['Mid Tower', 'Full Tower', 'Mini ITX', 'RGB', 'tempered glass', 'airflow'],
      cooling: ['CPU cooler', 'AIO', '240mm', '280mm', 'RGB', 'quiet', 'low profile']
    };
    
    return suggestions[category] || [];
  };

  // Check if sharing is available
  const isSharingAvailable = async () => {
    try {
      return await Sharing.isAvailableAsync();
    } catch (error) {
      console.log('Sharing availability check failed:', error);
      return false;
    }
  };

  // Generate affiliate links for components with PDF-safe encoding
  const generateAffiliateLinksForComponents = async (components: any) => {
    const componentsWithAffiliateLinks = {};
    
    console.log('📄 Starting affiliate link generation for PDF...');
    
    for (const [key, component] of Object.entries(components)) {
      if (component && typeof component === 'object') {
        const comp = component as PCComponent;
        const componentUrl = comp?.url || comp?.offers?.[0]?.url;
        
        if (componentUrl) {
          try {
            console.log(`💰 Generating affiliate link for ${key}:`, componentUrl);
            const affiliateUrl = await apiService.generateAffiliateLink(componentUrl);
            
            // Clean and encode the affiliate URL for PDF compatibility
            const pdfSafeUrl = encodeURI(affiliateUrl).replace(/'/g, '%27').replace(/"/g, '%22');
            
            console.log(`✅ Generated PDF-safe affiliate link for ${key}:`, pdfSafeUrl.substring(0, 100) + '...');
            
            componentsWithAffiliateLinks[key] = {
              ...comp,
              affiliateUrl: pdfSafeUrl,
              originalUrl: componentUrl // Keep original for fallback
            };
          } catch (error) {
            console.error(`❌ Failed to generate affiliate link for ${key}:`, error);
            // Use original URL as fallback
            componentsWithAffiliateLinks[key] = {
              ...comp,
              affiliateUrl: componentUrl,
              originalUrl: componentUrl
            };
          }
        } else {
          console.warn(`⚠️ No URL found for component ${key}`);
          componentsWithAffiliateLinks[key] = comp;
        }
      }
    }
    
    console.log('✅ Completed affiliate link generation for PDF');
    return componentsWithAffiliateLinks;
  };

  // Generate HTML content for PDF
  const generatePDFHTML = (build: LocalPCBuild, componentsWithLinks: any) => {
    const currentDate = new Date().toLocaleDateString();
    const buildName = build.name || 'My PC Build';
    
    let componentsHTML = '';
    
    componentCategories.forEach(category => {
      const component = componentsWithLinks[category.key];
      if (component) {
        const price = component.price || component.offers?.[0]?.price || 0;
        const discount = component.discount || component.offers?.[0]?.discount || 0;
        const affiliateUrl = component.affiliateUrl || component.url || component.offers?.[0]?.url || '#';
        
        componentsHTML += `
          <tr>
            <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">
              <div style="display: flex; align-items: center;">
                <span style="font-size: 18px; margin-right: 8px;">${category.icon}</span>
                <strong>${category.label}</strong>
              </div>
            </td>
            <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">
              <div>
                <div style="font-weight: 600; margin-bottom: 4px;">${component.name || 'Unknown Product'}</div>
                <div style="font-size: 12px; color: #6b7280;">${component.brand || 'Unknown Brand'}</div>
                ${discount > 0 ? `<div style="font-size: 12px; color: #dc2626; font-weight: 600;">${discount}% OFF</div>` : ''}
              </div>
            </td>
            <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">
              <div style="font-weight: bold; color: #059669;">₹${price.toLocaleString()}</div>
            </td>
            <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">
              <a href="${affiliateUrl}" 
                 target="_blank" 
                 rel="noopener noreferrer"
                 style="color: #ffffff; background-color: #059669; padding: 8px 16px; border-radius: 6px; text-decoration: none; font-size: 12px; font-weight: 600; display: inline-block;">
                🛒 Buy Now
              </a>
            </td>
          </tr>
        `;
      } else {
        componentsHTML += `
          <tr>
            <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">
              <div style="display: flex; align-items: center;">
                <span style="font-size: 18px; margin-right: 8px;">${category.icon}</span>
                <strong>${category.label}</strong>
              </div>
            </td>
            <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; color: #9ca3af;">Not selected</td>
            <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right; color: #9ca3af;">-</td>
            <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center; color: #9ca3af;">-</td>
          </tr>
        `;
      }
    });

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>${buildName} - PC Build Report</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            margin: 0;
            padding: 20px;
            background: white;
            line-height: 1.5;
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #3b82f6;
            padding-bottom: 20px;
          }
          .build-title {
            font-size: 28px;
            font-weight: bold;
            color: #1f2937;
            margin-bottom: 8px;
          }
          .build-subtitle {
            font-size: 16px;
            color: #6b7280;
            margin-bottom: 4px;
          }
          .build-date {
            font-size: 14px;
            color: #9ca3af;
          }
          .components-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            border-radius: 8px;
            overflow: hidden;
          }
          .table-header {
            background: #f3f4f6;
            font-weight: 600;
            color: #374151;
          }
          .summary {
            background: #f9fafb;
            padding: 20px;
            border-radius: 8px;
            border: 1px solid #e5e7eb;
          }
          .summary-title {
            font-size: 20px;
            font-weight: bold;
            color: #1f2937;
            margin-bottom: 16px;
            text-align: center;
          }
          .summary-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;
          }
          .summary-label {
            color: #6b7280;
          }
          .summary-value {
            font-weight: 600;
          }
          .total-price {
            font-size: 18px;
            color: #059669;
            font-weight: bold;
          }
          .original-price {
            text-decoration: line-through;
            color: #9ca3af;
          }
          .discount-amount {
            color: #dc2626;
            font-weight: 600;
          }
          .compatibility {
            margin-top: 20px;
            padding: 16px;
            border-radius: 6px;
            ${build.compatibility?.isCompatible ? 'background: #dcfce7; border: 1px solid #16a34a;' : 'background: #fef2f2; border: 1px solid #dc2626;'}
          }
          .compatibility-title {
            font-weight: 600;
            margin-bottom: 8px;
            ${build.compatibility?.isCompatible ? 'color: #15803d;' : 'color: #dc2626;'}
          }
          .warning {
            color: #d97706;
            font-size: 12px;
            margin-bottom: 4px;
          }
          .error {
            color: #dc2626;
            font-size: 12px;
            margin-bottom: 4px;
          }
          .footer {
            margin-top: 40px;
            text-align: center;
            font-size: 12px;
            color: #9ca3af;
            border-top: 1px solid #e5e7eb;
            padding-top: 20px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="build-title">${buildName}</div>
          <div class="build-subtitle">PC Build Configuration Report</div>
          <div class="build-date">Generated on ${currentDate}</div>
        </div>
        
        <table class="components-table">
          <thead>
            <tr class="table-header">
              <th style="padding: 16px; text-align: left;">Component</th>
              <th style="padding: 16px; text-align: left;">Product Details</th>
              <th style="padding: 16px; text-align: right;">Price</th>
              <th style="padding: 16px; text-align: center;">Purchase Link</th>
            </tr>
          </thead>
          <tbody>
            ${componentsHTML}
          </tbody>
        </table>
        
        <div class="summary">
          <div class="summary-title">Build Summary</div>
          
          <div class="summary-row">
            <span class="summary-label">Total Price:</span>
            <span class="summary-value total-price">₹${build.totalPrice.toLocaleString()}</span>
          </div>
          
          ${build.totalDiscount > 0 ? `
            <div class="summary-row">
              <span class="summary-label">Original Price:</span>
              <span class="summary-value original-price">₹${build.originalTotalPrice.toLocaleString()}</span>
            </div>
            <div class="summary-row">
              <span class="summary-label">You Save:</span>
              <span class="summary-value discount-amount">₹${(build.originalTotalPrice - build.totalPrice).toLocaleString()} (${build.totalDiscount}%)</span>
            </div>
          ` : ''}
          
          <div class="compatibility">
            <div class="compatibility-title">
              ${build.compatibility?.isCompatible ? '✅ Compatible Build' : '⚠️ Compatibility Issues'}
            </div>
            ${build.compatibility?.warnings?.map(warning => `<div class="warning">• ${warning}</div>`).join('') || ''}
            ${(build.compatibility?.errors || build.compatibility?.issues || []).map(error => `<div class="error">• ${error}</div>`).join('') || ''}
          </div>
        </div>
        
        <div class="footer">
          <p>This PC build report was generated by MyPC App</p>
          <p>All prices are in Indian Rupees (₹) and may vary based on availability and current market rates</p>
          <p>Click on the purchase links to buy components through our affiliate partners</p>
        </div>
      </body>
      </html>
    `;
    
    return html;
  };

  // Download PDF function using Expo Print and Sharing
  const downloadBuildPDF = async () => {
    try {
      // Check if build has any components
      const hasComponents = Object.keys(currentBuild.components || {}).some(
        key => currentBuild.components[key as keyof typeof currentBuild.components]
      );
      
      if (!hasComponents) {
        Alert.alert('Empty Build', 'Please add some components to your build before downloading the PDF.');
        return;
      }

      // Check if sharing is available
      const sharingAvailable = await isSharingAvailable();
      if (!sharingAvailable) {
        Alert.alert('Sharing Unavailable', 'PDF sharing is not available on this device.');
        return;
      }

      Alert.alert(
        'Generating PDF',
        'Please wait while we generate your PC build report...',
        [{ text: 'OK' }]
      );

      console.log('📄 Starting PDF generation...');

      // Generate affiliate links for all components
      console.log('📄 Generating affiliate links for PDF...');
      const componentsWithLinks = await generateAffiliateLinksForComponents(currentBuild.components || {});

      // Generate HTML content
      const htmlContent = generatePDFHTML(currentBuild, componentsWithLinks);

      console.log('📄 Creating PDF with Expo Print...');
      
      // Generate PDF using Expo Print
      const { uri } = await Print.printToFileAsync({
        html: htmlContent,
        base64: false,
      });
      
      if (uri) {
        console.log('✅ PDF generated successfully:', uri);
        
        // Create a more user-friendly filename
        const fileName = `${currentBuild.name.replace(/[^a-zA-Z0-9]/g, '_')}_Build_${Date.now()}.pdf`;
        const newUri = `${FileSystem.documentDirectory}${fileName}`;
        
        try {
          // Move the file to a more accessible location with a better name
          await FileSystem.moveAsync({
            from: uri,
            to: newUri
          });
          
          console.log('📄 File moved to:', newUri);
          
          // Share the PDF
          await Sharing.shareAsync(newUri, {
            mimeType: 'application/pdf',
            dialogTitle: `${currentBuild.name} - PC Build Report`,
          });
          
          Alert.alert(
            'PDF Generated!',
            'Your PC build report has been generated and is ready to share.',
            [{ text: 'Great!' }]
          );
        } catch (shareError) {
          console.error('❌ Error sharing PDF:', shareError);
          // If sharing fails, still show success message
          Alert.alert(
            'PDF Generated!',
            'Your PC build report has been generated successfully.',
            [{ text: 'OK' }]
          );
        }
      } else {
        throw new Error('Failed to generate PDF file');
      }
    } catch (error) {
      console.error('❌ Error generating PDF:', error);
      Alert.alert(
        'PDF Generation Failed',
        `Sorry, we couldn't generate the PDF. Error: ${error.message || 'Unknown error'}`,
        [{ text: 'OK' }]
      );
    }
  };

const renderComponentSlot = (category: any) => {
    // currentBuild is always defined; ensure components is an object
    const componentsMap = currentBuild.components || {} as LocalPCBuild['components'];
    const component = componentsMap[category.key as keyof typeof componentsMap];
    
    // Handle both backend structure (direct price) and frontend structure (offers array)
    const componentPrice = component?.price || component?.offers?.[0]?.price || 0;
    const componentUrl = component?.url || component?.offers?.[0]?.url || component?.offers?.[0]?.affiliateUrl;
    const componentDiscount = component?.discount || component?.offers?.[0]?.discount || 0;

    return (
      <View key={category.key} style={styles.componentSlot}>
        <View style={styles.componentHeader}>
          <Text style={styles.componentIcon}>{category.icon}</Text>
          <View style={styles.componentInfo}>
            <Text style={styles.componentLabel}>{category.label}</Text>
            {category.required && <Text style={styles.requiredLabel}>Required</Text>}
          </View>
        </View>

        {component ? (
          <View style={styles.selectedComponentContainer}>
            <TouchableOpacity 
              style={styles.selectedComponent}
              onPress={() => Alert.alert(
                component.name || 'Selected Component',
                `Price: ₹${componentPrice ? componentPrice.toLocaleString() : '0'}\n\nWhat would you like to do?`,
                [
                  { text: 'Buy Now', onPress: async () => {
                    if (componentUrl) {
                      try {
                        console.log('💰 Generating affiliate link for purchase...');
                        const affiliateUrl = await apiService.generateAffiliateLink(componentUrl);
                        await Linking.openURL(affiliateUrl);
                      } catch (err) {
                        console.error('Failed to open affiliate URL:', err);
                        Alert.alert('Error', 'Could not open product link');
                      }
                    } else {
                      Alert.alert('Error', 'Product link not available');
                    }
                  }},
                  { text: 'Change', onPress: () => selectComponent(category.key) },
                  { text: 'Cancel', style: 'cancel' }
                ]
              )}
            >
              <Image source={{ uri: component.imageUrl }} style={styles.componentImage} />
              <View style={styles.componentDetails}>
                <Text style={styles.componentName} numberOfLines={2}>{component.name || 'Unknown Product'}</Text>
                <Text style={styles.componentPrice}>₹{componentPrice ? componentPrice.toLocaleString() : '0'}</Text>
                {componentDiscount > 0 && (
                  <Text style={styles.componentDiscount}>{componentDiscount}% OFF</Text>
                )}
                <TouchableOpacity 
                  style={styles.buyNowButton}
                  onPress={async (e) => {
                    e.stopPropagation();
                    if (componentUrl) {
                      try {
                        console.log('💰 Generating affiliate link for direct purchase...');
                        const affiliateUrl = await apiService.generateAffiliateLink(componentUrl);
                        await Linking.openURL(affiliateUrl);
                      } catch (err) {
                        console.error('Failed to open affiliate URL:', err);
                        Alert.alert('Error', 'Could not open product link');
                      }
                    } else {
                      Alert.alert('Error', 'Product link not available');
                    }
                  }}
                >
                  <Text style={styles.buyNowText}>🛒 Buy Now</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.deleteButton}
              onPress={() => removeComponentFromBuild(category.key)}
            >
              <Text style={styles.deleteIcon}>×</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity 
            style={styles.emptySlot}
            onPress={() => selectComponent(category.key)}
          >
            <Text style={styles.emptySlotText}>+ Select {category.label}</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

const renderBuildSummary = () => {
    return (
      <View style={styles.buildSummary}>
        <Text style={styles.summaryTitle}>Build Summary</Text>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Total Price:</Text>
          <Text style={styles.summaryPrice}>₹{currentBuild.totalPrice.toLocaleString()}</Text>
        </View>
        {currentBuild.totalDiscount > 0 && (
          <>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Original Price:</Text>
              <Text style={styles.summaryOriginalPrice}>₹{currentBuild.originalTotalPrice.toLocaleString()}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>You Save:</Text>
              <Text style={styles.summaryDiscount}>₹{(currentBuild.originalTotalPrice - currentBuild.totalPrice).toLocaleString()} ({currentBuild.totalDiscount}%)</Text>
            </View>
          </>
        )}

        {/* Compatibility Status */}
        <View style={styles.compatibilitySection}>
          <Text style={styles.compatibilityTitle}>
            {currentBuild.compatibility?.isCompatible ? '✅ Compatible' : '⚠️ Check Compatibility'}
          </Text>
          {currentBuild.compatibility?.warnings?.map((warning, index) => (
            <Text key={index} style={styles.warningText}>• {warning}</Text>
          )) || null}
          {(currentBuild.compatibility?.errors || currentBuild.compatibility?.issues || []).map((error, index) => (
            <Text key={index} style={styles.errorText}>• {error}</Text>
          ))}
        </View>
        
        {/* Download PDF Button */}
        <TouchableOpacity 
          style={styles.downloadButton}
          onPress={downloadBuildPDF}
        >
          <Text style={styles.downloadButtonText}>📄 Download PC Build PDF</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderComponentSelector = () => (
    <Modal
      visible={showComponentSelector}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Select {selectedCategory.toUpperCase()}</Text>
          <TouchableOpacity onPress={() => setShowComponentSelector(false)}>
            <Text style={styles.closeButton}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* Search Input */}
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder={getSearchPlaceholder(selectedCategory)}
            value={searchQuery}
            onChangeText={(text) => {
              setSearchQuery(text);
              
              // Clear existing timeout
              if (searchTimeout) {
                clearTimeout(searchTimeout);
              }
              
              // Set new timeout for debounced search
              const timeout = setTimeout(() => {
                handleSearchComponent(text);
              }, SEARCH_DEBOUNCE_DELAY);
              
              setSearchTimeout(timeout);
            }}
            returnKeyType="search"
            onSubmitEditing={() => {
              // Clear timeout and search immediately on enter
              if (searchTimeout) {
                clearTimeout(searchTimeout);
                setSearchTimeout(null);
              }
              handleSearchComponent(searchQuery);
            }}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {isSearching && (
            <ActivityIndicator 
              size="small" 
              color="#3b82f6" 
              style={styles.searchSpinner} 
            />
          )}
          {searchQuery.length > 0 && (
            <TouchableOpacity 
              onPress={() => {
                setSearchQuery('');
                setAvailableComponents(allComponents);
              }}
              style={styles.clearSearch}
            >
              <Text style={styles.clearSearchText}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Search Suggestions */}
        {searchQuery.length === 0 && (
          <View style={styles.suggestionsContainer}>
            <Text style={styles.suggestionsTitle}>Quick Search:</Text>
            <View style={styles.suggestionsRow}>
              {getSearchSuggestions(selectedCategory).slice(0, 6).map((suggestion, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.suggestionChip}
                  onPress={() => {
                    setSearchQuery(suggestion);
                    handleSearchComponent(suggestion);
                  }}
                >
                  <Text style={styles.suggestionText}>{suggestion}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Results Info */}
        {searchQuery.length > 0 && (
          <View style={styles.resultsInfo}>
            <Text style={styles.searchHint}>Searching: &quot;{searchQuery}&quot;</Text>
          </View>
        )}

        {loadingComponents ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#3b82f6" />
            <Text style={styles.loadingText}>Loading components...</Text>
          </View>
        ) : isSearching ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#3b82f6" />
            <Text style={styles.loadingText}>🔍 Searching your components...</Text>
            <Text style={styles.searchingSubtext}>Fetching and prioritizing results</Text>
          </View>
        ) : availableComponents.length > 0 ? (
          <FlatList
            data={availableComponents}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity 
                style={styles.componentOption}
                onPress={() => addComponentToBuild(item)}
                onLongPress={async () => {
                  // Long press to buy directly with affiliate link
                  const componentUrl = item?.url || item?.offers?.[0]?.url;
                  if (componentUrl) {
                    try {
                      console.log('💰 Long press - generating affiliate link...');
                      const affiliateUrl = await apiService.generateAffiliateLink(componentUrl);
                      await Linking.openURL(affiliateUrl);
                    } catch (err) {
                      console.error('Failed to open affiliate URL:', err);
                    }
                  }
                }}
              >
                <Image source={{ uri: item.imageUrl }} style={styles.optionImage} />
                <View style={styles.optionDetails}>
                  <Text style={styles.optionName} numberOfLines={2}>{item.name || 'Unknown Product'}</Text>
                  <View style={styles.priceRow}>
                    <Text style={styles.optionPrice}>₹{item.offers?.[0]?.price ? item.offers[0].price.toLocaleString() : '0'}</Text>
                    <View style={styles.retailerBadge}>
                      <Text style={styles.retailerText}>{item.offers?.[0]?.retailer || 'Unknown'}</Text>
                    </View>
                  </View>
                  <View style={styles.optionMeta}>
                    {item.rating && (
                      <Text style={styles.optionRating}>⭐ {item.rating}/5</Text>
                    )}
                    <Text style={styles.optionBrand}>{item.brand || 'Unknown Brand'}</Text>
                  </View>
                  {item.offers?.[0]?.badges && item.offers[0].badges.length > 0 && (
                    <View style={styles.badgeContainer}>
                      {item.offers[0].badges.slice(0, 2).map((badge, index) => (
                        <Text key={index} style={styles.componentBadge}>{badge}</Text>
                      ))}
                    </View>
                  )}
                </View>
                {item.offers?.[0]?.discount && item.offers[0].discount > 0 && (
                  <View style={styles.discountBadge}>
                    <Text style={styles.discountText}>{item.offers[0].discount}% OFF</Text>
                  </View>
                )}
              </TouchableOpacity>
            )}
            showsVerticalScrollIndicator={false}
            onEndReached={loadMoreComponents}
            onEndReachedThreshold={0.3}
            ListFooterComponent={() => {
              if (isLoadingMore) {
                return (
                  <View style={styles.loadingMoreContainer}>
                    <ActivityIndicator size="small" color="#3b82f6" />
                    <Text style={styles.loadingMoreText}>Loading more...</Text>
                  </View>
                );
              }
              if (!hasMoreComponents && totalComponents > COMPONENTS_PER_PAGE) {
                return (
                  <View style={styles.endOfListContainer}>
                    <Text style={styles.endOfListText}>• End of results •</Text>
                  </View>
                );
              }
              return null;
            }}
          />
        ) : (
          <View style={styles.noResultsContainer}>
            <Text style={styles.noResultsTitle}>🔍 No components found</Text>
            <Text style={styles.noResultsText}>
              {searchQuery.length > 0 
                ? `No results for &quot;${searchQuery}&quot;. Try different keywords.`
                : 'No components available in this category.'}
            </Text>
            {searchQuery.length > 0 && (
              <TouchableOpacity 
                style={styles.clearSearchButton}
                onPress={() => {
                  setSearchQuery('');
                  setAvailableComponents(allComponents);
                }}
              >
                <Text style={styles.clearSearchButtonText}>Clear Search</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    </Modal>
  );

  const styles = getStyles(theme);

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Setting up your PC builder...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.topPadding} />
      <FlatList
        data={componentCategories}
        keyExtractor={(item) => item.key}
        renderItem={({ item }) => renderComponentSlot(item)}
        showsVerticalScrollIndicator={false}
        ListFooterComponent={renderBuildSummary}
        contentContainerStyle={styles.listContainer}
      />

      {renderComponentSelector()}
    </View>
  );
}

const getStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  topPadding: {
    height: 20, // Add padding at the top to prevent overlap with header
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 100, // Extra padding at bottom for navigation
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text,
    textAlign: 'left',
    marginBottom: 4,
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  subtitle: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: 'left',
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  componentSlot: {
    backgroundColor: theme.colors.surface,
    marginBottom: 12,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  componentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  componentIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  componentInfo: {
    flex: 1,
  },
  componentLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
  },
  requiredLabel: {
    fontSize: 12,
    color: theme.colors.error,
    fontWeight: '500',
  },
  selectedComponentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectedComponent: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceVariant,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.success,
    flex: 1,
    marginRight: 8,
  },
  componentImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
  },
  componentDetails: {
    flex: 1,
  },
  componentName: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 4,
  },
  componentPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.success,
  },
  componentDiscount: {
    fontSize: 12,
    color: theme.colors.error,
    fontWeight: '600',
    marginBottom: 8,
  },
  buyNowButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginTop: 4,
    alignSelf: 'flex-start',
  },
  buyNowText: {
    fontSize: 12,
    color: '#ffffff',
    fontWeight: '600',
  },
  deleteButton: {
    backgroundColor: theme.isDark ? theme.colors.surface : '#fef2f2',
    borderWidth: 1,
    borderColor: theme.colors.error,
    borderRadius: 8,
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
    width: 36,
    height: 36,
  },
  deleteIcon: {
    fontSize: 18,
    color: theme.colors.error,
    fontWeight: 'bold',
    textAlign: 'center',
    textAlignVertical: 'center',
    lineHeight: 18,
  },
  emptySlot: {
    backgroundColor: theme.colors.surfaceVariant,
    padding: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: theme.colors.border,
    borderStyle: 'dashed',
    alignItems: 'center',
  },
  emptySlotText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    fontWeight: '500',
  },
  buildSummary: {
    backgroundColor: theme.colors.surface,
    marginTop: 12,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: theme.colors.border,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 16,
    textAlign: 'center',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  summaryPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.success,
  },
  summaryOriginalPrice: {
    fontSize: 14,
    color: theme.colors.textMuted,
    textDecorationLine: 'line-through',
  },
  summaryDiscount: {
    fontSize: 14,
    color: theme.colors.error,
    fontWeight: '600',
  },
  compatibilitySection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  compatibilityTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 8,
  },
  warningText: {
    fontSize: 12,
    color: theme.colors.warning,
    marginBottom: 4,
  },
  errorText: {
    fontSize: 12,
    color: theme.colors.error,
    marginBottom: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    marginTop: 12,
  },
  searchingSubtext: {
    fontSize: 12,
    color: theme.colors.textMuted,
    marginTop: 4,
    textAlign: 'center',
  },
  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  closeButton: {
    fontSize: 18,
    color: theme.colors.textSecondary,
    padding: 4,
  },
  componentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    margin: 8,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  optionImage: {
    width: 50,
    height: 50,
    borderRadius: 6,
    marginRight: 12,
  },
  optionDetails: {
    flex: 1,
  },
  optionName: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 4,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  optionPrice: {
    fontSize: 14,
    fontWeight: 'bold',
    color: theme.colors.success,
  },
  retailerBadge: {
    backgroundColor: theme.isDark ? theme.colors.surfaceVariant : '#e5f3ff',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.isDark ? theme.colors.border : '#3b82f6',
  },
  retailerText: {
    fontSize: 10,
    fontWeight: '600',
    color: theme.isDark ? '#ffffff' : '#3b82f6',
  },
  optionRating: {
    fontSize: 12,
    color: theme.colors.textMuted,
  },
  optionMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  optionBrand: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    fontWeight: '500',
  },
  badgeContainer: {
    flexDirection: 'row',
    marginTop: 4,
  },
  componentBadge: {
    fontSize: 10,
    color: theme.isDark ? '#ffffff' : theme.colors.primary,
    backgroundColor: theme.isDark ? theme.colors.surfaceVariant : '#eff6ff',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 4,
  },
  discountBadge: {
    backgroundColor: theme.colors.error,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  discountText: {
    fontSize: 10,
    color: '#ffffff',
    fontWeight: 'bold',
  },
  // Search Styles
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    marginHorizontal: 16,
    marginVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 14,
    color: theme.colors.text,
  },
  searchSpinner: {
    marginLeft: 8,
  },
  clearSearch: {
    padding: 8,
    marginLeft: 4,
  },
  clearSearchText: {
    fontSize: 16,
    color: theme.colors.textMuted,
  },
  resultsInfo: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  resultsCount: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    fontWeight: '500',
  },
  searchHint: {
    fontSize: 12,
    color: theme.isDark ? '#ffffff' : theme.colors.primary,
    marginTop: 2,
  },
  noResultsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  noResultsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.textMuted,
    marginBottom: 8,
  },
  noResultsText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
  },
  clearSearchButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  clearSearchButtonText: {
    fontSize: 14,
    color: '#ffffff',
    fontWeight: '600',
  },
  // Search Suggestions Styles
  suggestionsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  suggestionsTitle: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    fontWeight: '600',
    marginBottom: 8,
  },
  suggestionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  suggestionChip: {
    backgroundColor: theme.isDark ? theme.colors.surfaceVariant : '#f3f4f6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: 6,
  },
  suggestionText: {
    fontSize: 12,
    color: theme.isDark ? '#ffffff' : theme.colors.primary,
    fontWeight: '500',
  },
  // Infinite Scroll Styles
  loadingMoreContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    marginHorizontal: 16,
  },
  loadingMoreText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginLeft: 8,
  },
  endOfListContainer: {
    alignItems: 'center',
    paddingVertical: 16,
    marginHorizontal: 16,
  },
  endOfListText: {
    fontSize: 12,
    color: theme.colors.textMuted,
    fontStyle: 'italic',
  },
  // Download PDF Button Styles
  downloadButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 16,
    alignItems: 'center',
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  downloadButtonText: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '600',
  },
});
