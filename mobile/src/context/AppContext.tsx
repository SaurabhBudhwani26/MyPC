import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { PCComponent, PCBuild, BuildComponent, ComponentOffer } from '../types';
import { apiService } from '../services/api';

// Mock data moved here
const mockComponents: PCComponent[] = [
  {
    id: '1',
    name: 'Intel Core i7-13700K',
    category: 'CPU',
    brand: 'Intel',
    model: 'Core i7-13700K',
    description: '16-Core, 24-Thread Desktop Processor',
    rating: 4.8,
    reviewCount: 1240,
    availability: 'in_stock',
    averagePrice: 34499,
    priceRange: { min: 32999, max: 36999 },
    lastUpdated: new Date().toISOString(),
    specifications: {
      cores: 16,
      threads: 24,
      baseClock: '3.4 GHz',
      boostClock: '5.4 GHz',
      socket: 'LGA1700',
      tdp: '125W'
    },
    offers: [
      {
        id: '1',
        componentId: '1',
        retailer: 'Amazon',
        price: 32999,
        originalPrice: 36999,
        discount: 11,
        availability: 'in_stock',
        url: 'https://amazon.in',
        lastUpdated: new Date().toISOString(),
        affiliateUrl: '',
        badges: []
      },
      {
        id: '2',
        componentId: '1',
        retailer: 'Flipkart',
        price: 33499,
        originalPrice: 37499,
        discount: 11,
        availability: 'in_stock',
        url: 'https://flipkart.com',
        lastUpdated: new Date().toISOString(),
        affiliateUrl: '',
        badges: []
      },
    ],
    discount: 0,
    url: '',
    price: 0
  },
  {
    id: '2',
    name: 'NVIDIA GeForce RTX 4060 Ti',
    category: 'GPU',
    brand: 'NVIDIA',
    model: 'RTX 4060 Ti',
    description: '8GB GDDR6 Graphics Card',
    rating: 4.6,
    reviewCount: 892,
    availability: 'in_stock',
    averagePrice: 37999,
    priceRange: { min: 35999, max: 42999 },
    lastUpdated: new Date().toISOString(),
    specifications: {
      memory: '8GB GDDR6',
      memoryBus: '128-bit',
      baseClock: '2310 MHz',
      boostClock: '2535 MHz',
      cuda: 4352
    },
    offers: [
      {
        id: '3',
        componentId: '2',
        retailer: 'Amazon',
        price: 35999,
        originalPrice: 42999,
        discount: 16,
        availability: 'in_stock',
        url: 'https://amazon.in',
        lastUpdated: new Date().toISOString(),
        affiliateUrl: '',
        badges: []
      },
    ],
    discount: 0,
    url: '',
    price: 0
  },
  {
    id: '3',
    name: 'Corsair Vengeance LPX 16GB DDR4',
    category: 'RAM',
    brand: 'Corsair',
    model: 'Vengeance LPX 16GB',
    description: '16GB (2x8GB) DDR4-3200 Memory Kit',
    rating: 4.7,
    reviewCount: 2156,
    availability: 'in_stock',
    averagePrice: 5499,
    priceRange: { min: 4999, max: 5999 },
    lastUpdated: new Date().toISOString(),
    specifications: {
      capacity: '16GB (2x8GB)',
      speed: 'DDR4-3200',
      cas: 'CL16',
      voltage: '1.35V'
    },
    offers: [
      {
        id: '5',
        componentId: '3',
        retailer: 'Amazon',
        price: 4999,
        originalPrice: 5999,
        discount: 17,
        availability: 'in_stock',
        url: 'https://amazon.in',
        lastUpdated: new Date().toISOString(),
        affiliateUrl: '',
        badges: []
      },
    ],
    discount: 0,
    url: '',
    price: 0
  },
  {
    id: '4',
    name: 'ASUS ROG Strix B550-F Gaming',
    category: 'Motherboard',
    brand: 'ASUS',
    model: 'ROG Strix B550-F',
    description: 'AMD B550 ATX Gaming Motherboard',
    rating: 4.5,
    reviewCount: 743,
    availability: 'in_stock',
    averagePrice: 19999,
    priceRange: { min: 18999, max: 21999 },
    lastUpdated: new Date().toISOString(),
    specifications: {
      chipset: 'AMD B550',
      socket: 'AM4',
      formFactor: 'ATX',
      memorySlots: 4,
      pciSlots: '2x PCIe 4.0 x16'
    },
    offers: [
      {
        id: '7',
        componentId: '4',
        retailer: 'Amazon',
        price: 18999,
        originalPrice: 21999,
        discount: 14,
        availability: 'in_stock',
        url: 'https://amazon.in',
        lastUpdated: new Date().toISOString(),
        affiliateUrl: '',
        badges: []
      },
    ],
    discount: 0,
    url: '',
    price: 0
  },
  {
    id: '5',
    name: 'Samsung 980 PRO NVMe SSD 1TB',
    category: 'Storage',
    brand: 'Samsung',
    model: '980 PRO 1TB',
    description: '1TB PCIe Gen4 NVMe M.2 SSD',
    rating: 4.9,
    reviewCount: 1654,
    availability: 'in_stock',
    averagePrice: 10999,
    priceRange: { min: 9999, max: 12999 },
    lastUpdated: new Date().toISOString(),
    specifications: {
      capacity: '1TB',
      interface: 'PCIe Gen4 x4',
      formFactor: 'M.2 2280',
      readSpeed: '7,000 MB/s',
      writeSpeed: '5,000 MB/s'
    },
    offers: [
      {
        id: '8',
        componentId: '5',
        retailer: 'Amazon',
        price: 9999,
        originalPrice: 12999,
        discount: 23,
        availability: 'in_stock',
        url: 'https://amazon.in',
        lastUpdated: new Date().toISOString(),
        affiliateUrl: '',
        badges: []
      },
    ],
    discount: 0,
    url: '',
    price: 0
  },
];

interface AppContextType {
  // State
  searchQuery: string;
  isLoading: boolean;
  activeTab: 'search' | 'builds' | 'deals' | 'profile';
  apiOnline: boolean;

  // Actions
  setSearchQuery: (query: string) => void;
  setActiveTab: (tab: 'search' | 'builds' | 'deals' | 'profile') => void;
  searchComponents: (query: string) => Promise<PCComponent[]>;
  getComponentsByCategory: (category: string) => Promise<PCComponent[]>;
  getTodayDeals: () => Promise<ComponentOffer[]>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

interface AppProviderProps {
  children: ReactNode;
}

// Internal AppProvider for legacy compatibility
function InternalAppProvider({ children }: AppProviderProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'search' | 'builds' | 'deals' | 'profile'>('search');
  const [apiOnline, setApiOnline] = useState(false);

  // Check API health on mount
  useEffect(() => {
    checkApiStatus();
  }, []);

  const checkApiStatus = async () => {
    try {
      const isOnline = await apiService.checkApiHealth();
      setApiOnline(isOnline);
    } catch (error) {
      setApiOnline(false);
    }
  };

  const searchComponents = async (query: string): Promise<PCComponent[]> => {
    setIsLoading(true);

    try {
      const components = await apiService.searchComponents(query);
      setIsLoading(false);
      return components;
    } catch (error) {
      console.error('Error searching components:', error);
      setIsLoading(false);
      return [];
    }
  };

  const getComponentsByCategory = async (category: string): Promise<PCComponent[]> => {
    setIsLoading(true);

    try {
      const components = await apiService.getComponentsByCategory(category);
      setIsLoading(false);
      return components;
    } catch (error) {
      console.error('Error fetching components by category:', error);
      setIsLoading(false);
      return [];
    }
  };

  const getTodayDeals = async (): Promise<ComponentOffer[]> => {
    setIsLoading(true);

    try {
      const deals = await apiService.getTodayDeals();
      setIsLoading(false);
      return deals;
    } catch (error) {
      console.error('Error fetching today\'s deals:', error);
      setIsLoading(false);
      return [];
    }
  };

  const value: AppContextType = {
    // State
    searchQuery,
    isLoading,
    activeTab,
    apiOnline,

    // Actions
    setSearchQuery,
    setActiveTab,
    searchComponents,
    getComponentsByCategory,
    getTodayDeals,
  };

  return React.createElement(AppContext.Provider, { value }, children);
}

// Main AppProvider (temporarily simplified)
export function AppProvider({ children }: AppProviderProps) {
  return <InternalAppProvider>{children}</InternalAppProvider>;
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}
