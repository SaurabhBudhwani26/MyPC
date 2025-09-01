import { Part, PCBuild, CompatibilityError, CompatibilityWarning, CPUSpecs, MotherboardSpecs, GPUSpecs } from '../types';

// Price formatting utilities
export const formatPrice = (price: number, currency: string = 'INR'): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
  }).format(price);
};

export const calculateDiscount = (originalPrice: number, discountedPrice: number): number => {
  return Math.round(((originalPrice - discountedPrice) / originalPrice) * 100);
};

// Part matching utilities
export const normalizePartName = (name: string): string => {
  return name
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
};

export const extractMPN = (part: Part): string => {
  return part.mpn || part.model || '';
};

export const fuzzyMatchParts = (part1: Part, part2: Part): number => {
  const name1 = normalizePartName(part1.name);
  const name2 = normalizePartName(part2.name);
  
  // Simple Levenshtein distance based matching
  const distance = levenshteinDistance(name1, name2);
  const maxLength = Math.max(name1.length, name2.length);
  
  return maxLength > 0 ? (maxLength - distance) / maxLength : 0;
};

const levenshteinDistance = (str1: string, str2: string): number => {
  const matrix = Array.from({ length: str2.length + 1 }, (_, i) => [i]);
  
  for (let j = 1; j <= str1.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      const cost = str1[j - 1] === str2[i - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }
  
  return matrix[str2.length][str1.length];
};

// Compatibility checking utilities
export const checkCPUMotherboardCompatibility = (
  cpu: Part & { specifications: CPUSpecs },
  motherboard: Part & { specifications: MotherboardSpecs }
): { compatible: boolean; errors: CompatibilityError[]; warnings: CompatibilityWarning[] } => {
  const errors: CompatibilityError[] = [];
  const warnings: CompatibilityWarning[] = [];
  
  // Check socket compatibility
  if (cpu.specifications.socket !== motherboard.specifications.socket) {
    errors.push({
      type: 'socket_mismatch',
      message: `CPU socket ${cpu.specifications.socket} is not compatible with motherboard socket ${motherboard.specifications.socket}`,
      affectedParts: [cpu.id, motherboard.id]
    });
  }
  
  return {
    compatible: errors.length === 0,
    errors,
    warnings
  };
};

export const checkRAMMotherboardCompatibility = (
  ram: Part,
  motherboard: Part & { specifications: MotherboardSpecs }
): { compatible: boolean; errors: CompatibilityError[]; warnings: CompatibilityWarning[] } => {
  const errors: CompatibilityError[] = [];
  const warnings: CompatibilityWarning[] = [];
  
  // Add RAM compatibility checks here
  // This is a simplified example
  
  return {
    compatible: errors.length === 0,
    errors,
    warnings
  };
};

export const calculatePSURequirement = (build: PCBuild): number => {
  let totalTDP = 0;
  
  build.parts.forEach(buildPart => {
    if (buildPart.part) {
      const specs = buildPart.part.specifications;
      if ('tdp' in specs && typeof specs.tdp === 'number') {
        totalTDP += specs.tdp;
      }
    }
  });
  
  // Rule of thumb: TDP * 1.5 for safety margin
  return Math.ceil(totalTDP * 1.5);
};

// Search and filtering utilities
export const filterPartsByBrand = (parts: Part[], brands: string[]): Part[] => {
  return parts.filter(part => brands.includes(part.brand));
};

export const filterPartsByPriceRange = (parts: Part[], offers: { [partId: string]: number }, min: number, max: number): Part[] => {
  return parts.filter(part => {
    const price = offers[part.id];
    return price && price >= min && price <= max;
  });
};

export const sortPartsByPrice = (parts: Part[], offers: { [partId: string]: number }, ascending: boolean = true): Part[] => {
  return [...parts].sort((a, b) => {
    const priceA = offers[a.id] || Infinity;
    const priceB = offers[b.id] || Infinity;
    return ascending ? priceA - priceB : priceB - priceA;
  });
};

// URL and affiliate utilities
export const generateAffiliateUrl = (originalUrl: string, affiliateId: string, platform: 'amazon' | 'flipkart'): string => {
  const url = new URL(originalUrl);
  
  switch (platform) {
    case 'amazon':
      url.searchParams.set('tag', affiliateId);
      break;
    case 'flipkart':
      url.searchParams.set('affid', affiliateId);
      break;
  }
  
  return url.toString();
};

// Date utilities
export const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }).format(date);
};

export const isRecentUpdate = (date: Date, hoursThreshold: number = 24): boolean => {
  const now = new Date();
  const diffHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
  return diffHours <= hoursThreshold;
};
