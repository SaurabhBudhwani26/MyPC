import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService } from '../services/api';
import { queryKeys } from '../services/queryClient';
import { PCComponent, ComponentOffer, PriceAlert } from '../types';

// Component Search Hook
export function useSearchComponents(query: string, enabled: boolean = true) {
  return useQuery({
    queryKey: queryKeys.searchComponents(query),
    queryFn: () => apiService.searchComponents(query),
    enabled: enabled && query.trim().length > 0,
    staleTime: 2 * 60 * 1000, // Search results stale after 2 minutes
    gcTime: 5 * 60 * 1000, // Cache for 5 minutes
  });
}

// Category Components Hook
export function useComponentsByCategory(category: string, enabled: boolean = true) {
  return useQuery({
    queryKey: queryKeys.componentsByCategory(category),
    queryFn: () => apiService.getComponentsByCategory(category),
    enabled: enabled && category.trim().length > 0,
    staleTime: 5 * 60 * 1000, // Category data stale after 5 minutes
  });
}

// Component Details Hook
export function useComponentById(componentId: string, enabled: boolean = true) {
  return useQuery({
    queryKey: queryKeys.componentById(componentId),
    queryFn: () => apiService.getComponentById(componentId),
    enabled: enabled && componentId.trim().length > 0,
    staleTime: 10 * 60 * 1000, // Component details stale after 10 minutes
  });
}

// Component Offers Hook
export function useComponentOffers(componentId: string, enabled: boolean = true) {
  return useQuery({
    queryKey: queryKeys.componentOffers(componentId),
    queryFn: () => apiService.getComponentOffers(componentId),
    enabled: enabled && componentId.trim().length > 0,
    staleTime: 1 * 60 * 1000, // Offers stale after 1 minute (prices change frequently)
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes for price updates
  });
}

// Today's Deals Hook
export function useTodayDeals() {
  return useQuery({
    queryKey: queryKeys.todayDeals(),
    queryFn: () => apiService.getTodayDeals(),
    staleTime: 10 * 60 * 1000, // Deals stale after 10 minutes
    refetchInterval: 15 * 60 * 1000, // Refetch every 15 minutes
  });
}

// API Health Check Hook
export function useApiHealth() {
  return useQuery({
    queryKey: queryKeys.apiHealth(),
    queryFn: () => apiService.checkApiHealth(),
    staleTime: 30 * 1000, // Health status stale after 30 seconds
    refetchInterval: 60 * 1000, // Check health every minute
    retry: 1, // Only retry once for health checks
  });
}

// Price Alert Creation Mutation
export function useCreatePriceAlert() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ componentId, targetPrice }: { componentId: string; targetPrice: number }) =>
      apiService.createPriceAlert(componentId, targetPrice),
    onSuccess: () => {
      // Invalidate price alerts to refetch the list
      queryClient.invalidateQueries({ queryKey: queryKeys.priceAlerts() });
    },
    onError: (error) => {
      console.error('Failed to create price alert:', error);
    },
  });
}

// Search with debouncing and caching optimization
export function useDebouncedSearch(query: string, delay: number = 500) {
  const [debouncedQuery, setDebouncedQuery] = useState(query);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, delay);

    return () => clearTimeout(timer);
  }, [query, delay]);

  return useSearchComponents(debouncedQuery, debouncedQuery.trim().length > 2);
}

// Prefetch utility hooks
export function usePrefetchComponents() {
  const queryClient = useQueryClient();

  const prefetchCategory = (category: string) => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.componentsByCategory(category),
      queryFn: () => apiService.getComponentsByCategory(category),
      staleTime: 5 * 60 * 1000,
    });
  };

  const prefetchComponentDetails = (componentId: string) => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.componentById(componentId),
      queryFn: () => apiService.getComponentById(componentId),
      staleTime: 10 * 60 * 1000,
    });
  };

  return { prefetchCategory, prefetchComponentDetails };
}

// Background sync hook for keeping data fresh
export function useBackgroundSync() {
  const queryClient = useQueryClient();

  const syncAll = () => {
    // Invalidate all component-related queries to trigger background refetch
    queryClient.invalidateQueries({ queryKey: ['components'] });
    queryClient.invalidateQueries({ queryKey: ['deals'] });
  };

  const syncDeals = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.todayDeals() });
  };

  return { syncAll, syncDeals };
}
