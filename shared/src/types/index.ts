// Core PC Part Types
export interface Part {
  id: string;
  name: string;
  brand: string;
  model: string;
  mpn: string; // Manufacturer Part Number
  ean?: string;
  upc?: string;
  category: PartCategory;
  specifications: PartSpecs;
  images: string[];
  description?: string;
}

export type PartCategory = 
  | 'cpu'
  | 'motherboard'
  | 'ram'
  | 'gpu'
  | 'storage'
  | 'psu'
  | 'case'
  | 'cooler'
  | 'monitor'
  | 'keyboard'
  | 'mouse'
  | 'headset'
  | 'webcam';

export interface PartSpecs {
  [key: string]: any;
}

// CPU Specifications
export interface CPUSpecs extends PartSpecs {
  socket: string;
  cores: number;
  threads: number;
  baseClock: string; // e.g., "3.7 GHz"
  boostClock?: string;
  tdp: number; // watts
  architecture: string;
  integratedGraphics?: string;
}

// Motherboard Specifications
export interface MotherboardSpecs extends PartSpecs {
  socket: string;
  chipset: string;
  formFactor: string; // ATX, mATX, ITX
  ramSlots: number;
  maxRamCapacity: number; // GB
  ramType: string; // DDR4, DDR5
  pciSlots: {
    x16: number;
    x8: number;
    x4: number;
    x1: number;
  };
}

// RAM Specifications
export interface RAMSpecs extends PartSpecs {
  capacity: number; // GB
  speed: number; // MHz
  type: string; // DDR4, DDR5
  latency: string; // e.g., "16-18-18-38"
  voltage: number;
  modules: number; // number of sticks in kit
}

// GPU Specifications
export interface GPUSpecs extends PartSpecs {
  chipset: string;
  memory: number; // GB
  memoryType: string; // GDDR6, etc.
  coreClock: number; // MHz
  boostClock?: number; // MHz
  length: number; // mm
  width: number; // mm
  height: number; // mm
  slots: number; // PCIe slots occupied
  tdp: number; // watts
  connectors: string[]; // power connectors needed
}

// Pricing and Store Information
export interface Offer {
  id: string;
  partId: string;
  store: Store;
  price: number;
  currency: string;
  availability: 'in-stock' | 'out-of-stock' | 'limited' | 'pre-order';
  url: string;
  affiliateUrl?: string;
  lastUpdated: Date;
  shipping?: ShippingInfo;
  discount?: DiscountInfo;
}

export interface Store {
  id: string;
  name: string;
  logo?: string;
  baseUrl: string;
  country: string;
  trustRating?: number;
}

export interface ShippingInfo {
  cost: number;
  estimatedDays: number;
  freeShippingThreshold?: number;
}

export interface DiscountInfo {
  originalPrice: number;
  discountPercent: number;
  discountAmount: number;
  promoCode?: string;
  validUntil?: Date;
}

// PC Build Types
export interface PCBuild {
  id: string;
  name: string;
  description?: string;
  purpose: BuildPurpose;
  budget: BudgetRange;
  parts: BuildPart[];
  totalPrice: number;
  compatibility: CompatibilityStatus;
  createdAt: Date;
  updatedAt: Date;
}

export type BuildPurpose = 
  | 'gaming'
  | 'workstation'
  | 'office'
  | 'budget'
  | 'high-end'
  | 'server'
  | 'htpc';

export interface BudgetRange {
  min: number;
  max: number;
  currency: string;
}

export interface BuildPart {
  category: PartCategory;
  part?: Part;
  budget: number;
  isRequired: boolean;
  alternatives?: Part[];
}

export interface CompatibilityStatus {
  isCompatible: boolean;
  warnings: CompatibilityWarning[];
  errors: CompatibilityError[];
}

export interface CompatibilityWarning {
  type: string;
  message: string;
  affectedParts: string[];
}

export interface CompatibilityError {
  type: string;
  message: string;
  affectedParts: string[];
}

// API Response Types
export interface SearchResponse {
  parts: Part[];
  totalCount: number;
  page: number;
  pageSize: number;
  facets: SearchFacets;
}

export interface SearchFacets {
  brands: FacetOption[];
  priceRanges: PriceRange[];
  categories: FacetOption[];
  specifications: { [key: string]: FacetOption[] };
}

export interface FacetOption {
  value: string;
  count: number;
  selected?: boolean;
}

export interface PriceRange {
  min: number;
  max: number;
  count: number;
}

export interface PriceComparisonResponse {
  part: Part;
  offers: Offer[];
  priceHistory?: PriceHistoryPoint[];
  recommendations?: Part[];
}

export interface PriceHistoryPoint {
  date: Date;
  price: number;
  store: string;
}

// User and Preferences
export interface UserPreferences {
  currency: string;
  country: string;
  preferredStores: string[];
  budgetAlerts: boolean;
  priceDropAlerts: boolean;
  wishlist: string[];
}

// API Error Types
export interface APIError {
  code: string;
  message: string;
  details?: any;
}
