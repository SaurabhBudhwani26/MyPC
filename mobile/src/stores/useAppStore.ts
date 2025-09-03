import { create } from 'zustand';
import { PCComponent, PCBuild, BuildComponent } from '../types';

// Mock data for testing
const mockComponents: PCComponent[] = [
  {
    id: '1',
    name: 'Intel Core i7-13700K',
    category: 'CPU',
    brand: 'Intel',
    model: 'Core i7-13700K',
    avgRating: 4.8,
    totalReviews: 1240,
    offers: [
      {
        id: '1',
        store: 'Amazon',
        price: 32999,
        originalPrice: 36999,
        discount: 11,
        inStock: true,
        url: 'https://amazon.in',
        lastUpdated: new Date().toISOString(),
      },
      {
        id: '2',
        store: 'Flipkart',
        price: 33499,
        originalPrice: 37499,
        discount: 11,
        inStock: true,
        url: 'https://flipkart.com',
        lastUpdated: new Date().toISOString(),
      },
    ],
  },
  {
    id: '2',
    name: 'NVIDIA GeForce RTX 4060 Ti',
    category: 'GPU',
    brand: 'NVIDIA',
    model: 'RTX 4060 Ti',
    avgRating: 4.6,
    totalReviews: 892,
    offers: [
      {
        id: '3',
        store: 'Amazon',
        price: 35999,
        originalPrice: 42999,
        discount: 16,
        inStock: true,
        url: 'https://amazon.in',
        lastUpdated: new Date().toISOString(),
      },
      {
        id: '4',
        store: 'Newegg',
        price: 36499,
        inStock: false,
        url: 'https://newegg.com',
        lastUpdated: new Date().toISOString(),
      } as any,
    ],
  },
  {
    id: '3',
    name: 'Corsair Vengeance LPX 16GB DDR4',
    category: 'RAM',
    brand: 'Corsair',
    model: 'Vengeance LPX 16GB',
    avgRating: 4.7,
    totalReviews: 2156,
    offers: [
      {
        id: '5',
        store: 'Amazon',
        price: 4999,
        originalPrice: 5999,
        discount: 17,
        inStock: true,
        url: 'https://amazon.in',
        lastUpdated: new Date().toISOString(),
      },
      {
        id: '6',
        store: 'Flipkart',
        price: 5199,
        inStock: true,
        url: 'https://flipkart.com',
        lastUpdated: new Date().toISOString(),
      },
    ],
  },
  {
    id: '4',
    name: 'ASUS ROG Strix B550-F Gaming',
    category: 'Motherboard',
    brand: 'ASUS',
    model: 'ROG Strix B550-F',
    avgRating: 4.5,
    totalReviews: 743,
    offers: [
      {
        id: '7',
        store: 'Amazon',
        price: 18999,
        originalPrice: 21999,
        discount: 14,
        inStock: true,
        url: 'https://amazon.in',
        lastUpdated: new Date().toISOString(),
      },
    ],
  },
  {
    id: '5',
    name: 'Samsung 980 PRO NVMe SSD 1TB',
    category: 'Storage',
    brand: 'Samsung',
    model: '980 PRO 1TB',
    avgRating: 4.9,
    totalReviews: 1654,
    offers: [
      {
        id: '8',
        store: 'Amazon',
        price: 9999,
        originalPrice: 12999,
        discount: 23,
        inStock: true,
        url: 'https://amazon.in',
        lastUpdated: new Date().toISOString(),
      },
      {
        id: '9',
        store: 'Flipkart',
        price: 10299,
        inStock: true,
        url: 'https://flipkart.com',
        lastUpdated: new Date().toISOString(),
      },
    ],
  },
];

const mockBuilds: PCBuild[] = [
  {
    id: '1',
    name: 'High-End Gaming Build',
    description: 'Perfect for 4K gaming and content creation',
    totalPrice: 150000,
    components: [
      { componentId: '1', quantity: 1, selectedOfferId: '1' },
      { componentId: '2', quantity: 1, selectedOfferId: '3' },
      { componentId: '3', quantity: 2, selectedOfferId: '5' },
      { componentId: '4', quantity: 1, selectedOfferId: '7' },
      { componentId: '5', quantity: 1, selectedOfferId: '8' },
    ],
    isPublic: true,
    createdBy: 'user123',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '2',
    name: 'Budget Gaming Build',
    description: 'Great performance for 1080p gaming',
    totalPrice: 65000,
    components: [
      { componentId: '3', quantity: 1, selectedOfferId: '5' },
      { componentId: '4', quantity: 1, selectedOfferId: '7' },
    ],
    isPublic: true,
    createdBy: 'user456',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

interface AppState {
  // Component data
  components: PCComponent[];
  builds: PCBuild[];

  // Search and filter state
  searchQuery: string;
  selectedCategory: string | null;
  isLoading: boolean;

  // UI state
  activeTab: 'search' | 'builds' | 'deals' | 'profile';

  // Actions
  setSearchQuery: (query: string) => void;
  setSelectedCategory: (category: string | null) => void;
  setActiveTab: (tab: 'search' | 'builds' | 'deals' | 'profile') => void;
  searchComponents: (query: string) => Promise<PCComponent[]>;
  getComponentsByCategory: (category: string) => Promise<PCComponent[]>;
  getDealsOfTheDay: () => Promise<PCComponent[]>;
  getAllBuilds: () => Promise<PCBuild[]>;
  getComponentById: (id: string) => PCComponent | undefined;
}

export const useAppStore = create<AppState>((set, get) => ({
  // Initial state
  components: mockComponents,
  builds: mockBuilds,
  searchQuery: '',
  selectedCategory: null,
  isLoading: false,
  activeTab: 'search',

  // Actions
  setSearchQuery: (query: string) => set({ searchQuery: query }),

  setSelectedCategory: (category: string | null) => set({ selectedCategory: category }),

  setActiveTab: (tab: 'search' | 'builds' | 'deals' | 'profile') => set({ activeTab: tab }),

  searchComponents: async (query: string) => {
    set({ isLoading: true });

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));

    const { components } = get();
    const filteredComponents = components.filter(component =>
      component.name.toLowerCase().includes(query.toLowerCase()) ||
      component.brand.toLowerCase().includes(query.toLowerCase()) ||
      component.category.toLowerCase().includes(query.toLowerCase())
    );

    set({ isLoading: false });
    return filteredComponents;
  },

  getComponentsByCategory: async (category: string) => {
    set({ isLoading: true });

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));

    const { components } = get();
    const filteredComponents = components.filter(component =>
      component.category.toLowerCase() === category.toLowerCase()
    );

    set({ isLoading: false });
    return filteredComponents;
  },

  getDealsOfTheDay: async () => {
    set({ isLoading: true });

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 400));

    const { components } = get();
    // Return components with good discounts (>= 15%)
    const dealsComponents = components.filter(component =>
      component.offers.some(offer => offer.discount && offer.discount >= 15)
    );

    set({ isLoading: false });
    return dealsComponents;
  },

  getAllBuilds: async () => {
    set({ isLoading: true });

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 350));

    const { builds } = get();

    set({ isLoading: false });
    return builds;
  },

  getComponentById: (id: string) => {
    const { components } = get();
    return components.find(component => component.id === id);
  },
}));
