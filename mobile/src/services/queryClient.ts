import { QueryClient } from '@tanstack/react-query';

// React Query configuration
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Cache data for 5 minutes by default
      staleTime: 5 * 60 * 1000,
      // Keep data in cache for 10 minutes
      gcTime: 10 * 60 * 1000, // formerly cacheTime
      // Retry failed requests 2 times
      retry: 2,
      // Retry with exponential backoff
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      // Background refetch on window focus
      refetchOnWindowFocus: false,
      // Background refetch on network reconnect
      refetchOnReconnect: true,
      // Background refetch when stale
      refetchOnMount: true,
    },
    mutations: {
      // Retry mutations once
      retry: 1,
    },
  },
});

// Query Keys - Centralized query key management
export const queryKeys = {
  // Component searches
  searchComponents: (query: string, filters?: any) => ['components', 'search', query, filters],
  componentsByCategory: (category: string) => ['components', 'category', category],
  componentById: (id: string) => ['components', 'detail', id],
  componentOffers: (componentId: string) => ['components', componentId, 'offers'],

  // Deals and pricing
  todayDeals: () => ['deals', 'today'],
  trendingComponents: () => ['components', 'trending'],

  // Builds
  builds: () => ['builds'],
  buildById: (id: string) => ['builds', id],
  buildPrice: (components: string[]) => ['builds', 'price', components],
  buildCompatibility: (components: string[]) => ['builds', 'compatibility', components],

  // User data
  priceAlerts: () => ['user', 'priceAlerts'],
  searchHistory: () => ['user', 'searchHistory'],

  // System
  apiHealth: () => ['system', 'health'],
} as const;
