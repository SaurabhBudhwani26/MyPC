// PC Component Types
export interface ComponentOffer {
  badges?: string[];
  affiliateUrl?: string;
  id: string;
  componentId: string;
  componentName?: string;
  componentImage?: string;
  retailer: 'Amazon' | 'Flipkart' | 'Newegg' | 'MDComputers' | string;
  price: number;
  originalPrice?: number;
  discount?: number;
  availability: 'in_stock' | 'out_of_stock' | 'limited';
  url: string;
  rating?: number;
  reviews?: number;
  lastUpdated: string;
  validUntil?: string;
  shipping?: {
    cost: number;
    estimatedDays: number;
    free: boolean;
  };
}

export interface PCComponent {
  discount?: number;
  url?: string;
  price?: number;
  id: string;
  name: string;
  brand: string;
  category: string;
  model: string;
  description?: string;
  imageUrl?: string;
  specifications?: Record<string, any>;
  offers: ComponentOffer[];
  averagePrice?: number;
  priceRange?: {
    min: number;
    max: number;
  };
  rating?: number;
  reviewCount?: number;
  availability: 'in_stock' | 'out_of_stock' | 'limited';
  lastUpdated: string;
}

export type ComponentCategory =
  | 'CPU'
  | 'GPU'
  | 'RAM'
  | 'Motherboard'
  | 'Storage'
  | 'PSU'
  | 'Case'
  | 'Cooling';

// Build component reference for simpler storage
export interface BuildComponent {
  componentId: string;
  quantity: number;
  selectedOfferId: string;
}

export interface PCBuild {
  id: string;
  name: string;
  description: string;
  totalPrice: number;
  components: BuildComponent[];
  isPublic: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

// Legacy PCBuild structure for future compatibility
export interface DetailedPCBuild {
  id: string;
  name: string;
  description: string;
  category: 'Gaming' | 'Workstation' | 'Budget' | 'Enthusiast';
  components: {
    cpu?: PCComponent;
    gpu?: PCComponent;
    ram?: PCComponent;
    motherboard?: PCComponent;
    storage?: PCComponent[];
    psu?: PCComponent;
    case?: PCComponent;
    cooling?: PCComponent;
  };
  totalPrice: number;
  compatibility: {
    isCompatible: boolean;
    warnings: string[];
  };
}

export interface SearchFilters {
  category?: ComponentCategory;
  brand?: string[];
  priceRange?: {
    min: number;
    max: number;
  };
  sortBy?: 'price' | 'rating' | 'popularity';
  sortOrder?: 'asc' | 'desc';
}

export interface PriceAlert {
  id: string;
  componentId: string;
  targetPrice: number;
  currentPrice?: number;
  isActive: boolean;
  notificationSent: boolean;
  createdAt: string;
  updatedAt: string;
}
