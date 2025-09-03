import { NextRequest, NextResponse } from 'next/server';

interface AmazonProduct {
  asin: string;
  product_title: string;
  product_price: string;
  product_original_price?: string;
  product_url: string;
  product_photo: string;
  product_star_rating?: string;
  product_num_ratings?: number;
  currency?: string;
  is_best_seller?: boolean;
  is_amazon_choice?: boolean;
  is_prime?: boolean;
  sales_volume?: string;
  delivery?: string;
  product_num_offers?: number;
}

interface AmazonSearchResponse {
  status: string;
  request_id: string;
  parameters: {
    query: string;
    page: number;
    country: string;
  };
  data: {
    products: AmazonProduct[];
    country: string;
    total_products: number;
    domain: string;
  };
}

interface PCComponent {
  id: string;
  name: string;
  brand: string;
  category: string;
  model: string;
  description: string;
  imageUrl: string;
  rating?: number;
  reviewCount?: number;
  availability: string;
  averagePrice: number;
  priceRange: { min: number; max: number };
  lastUpdated: string;
  specifications: Record<string, string | number | boolean>;
  offers: ComponentOffer[];
}

interface ComponentOffer {
  id: string;
  componentId: string;
  retailer: string;
  price: number;
  originalPrice: number;
  discount: number;
  availability: string;
  url: string;
  lastUpdated: string;
  shipping: {
    cost: number;
    estimatedDays: number;
    free: boolean;
  };
  badges: string[];
}

async function searchAmazonProducts(query: string, category?: string): Promise<PCComponent[]> {
  if (!process.env.RAPIDAPI_KEY) {
    throw new Error('RapidAPI key not configured');
  }

  const searchQuery = category ? `${query} ${category}` : query;
  const url = `https://real-time-amazon-data.p.rapidapi.com/search?query=${encodeURIComponent(searchQuery)}&page=1&country=IN`;
  
  console.log('🔍 Backend Amazon search:', { query, category, searchQuery });
  console.log('🌐 Backend API request to:', url);

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'X-RapidAPI-Key': process.env.RAPIDAPI_KEY,
      'X-RapidAPI-Host': 'real-time-amazon-data.p.rapidapi.com',
      'Content-Type': 'application/json',
    },
  });

  console.log('📊 Backend API Response Status:', response.status);

  if (!response.ok) {
    const errorText = await response.text();
    console.log('❌ Backend API Error:', errorText);
    throw new Error(`Amazon Search API error: ${response.status} - ${errorText}`);
  }

  const data: AmazonSearchResponse = await response.json();
  console.log('✅ Backend API Success:', {
    totalProducts: data.data?.total_products || 0,
    productsReturned: data.data?.products?.length || 0
  });

  if (!data.data?.products) {
    return [];
  }

  // Filter for PC components
  const pcProducts = data.data.products.filter(product => 
    isPCComponent(product.product_title, category)
  );

  console.log(`🖥️ Backend filtered to ${pcProducts.length} PC components`);

  // Transform to PCComponent format
  const components = pcProducts.map(product => 
    transformAmazonProduct(product)
  );

  return components;
}

function isPCComponent(title: string, category?: string): boolean {
  const titleLower = title.toLowerCase();
  
  // If category is specified, use more specific filtering
  if (category) {
    const categoryLower = category.toLowerCase();
    if (categoryLower === 'cpu' || categoryLower === 'processor') {
      return titleLower.includes('processor') || titleLower.includes('cpu') || 
             titleLower.includes('ryzen') || titleLower.includes('intel');
    }
    if (categoryLower === 'gpu' || categoryLower === 'graphics') {
      return titleLower.includes('graphics card') || titleLower.includes('gpu') || 
             titleLower.includes('geforce') || titleLower.includes('radeon');
    }
    if (categoryLower === 'ram' || categoryLower === 'memory') {
      return titleLower.includes('memory') || titleLower.includes('ram') || 
             titleLower.includes('ddr');
    }
    if (categoryLower === 'motherboard') {
      return titleLower.includes('motherboard') || titleLower.includes('mobo');
    }
    if (categoryLower === 'storage') {
      return titleLower.includes('ssd') || titleLower.includes('hdd') || 
             titleLower.includes('storage') || titleLower.includes('nvme');
    }
    if (categoryLower === 'psu' || categoryLower === 'power') {
      return titleLower.includes('power supply') || titleLower.includes('psu') || 
             titleLower.includes('smps');
    }
    if (categoryLower === 'case' || categoryLower === 'cabinet') {
      return titleLower.includes('cabinet') || titleLower.includes('case');
    }
  }

  // General PC component keywords
  const pcKeywords = [
    'processor', 'cpu', 'graphics card', 'gpu', 'motherboard', 'ram', 'memory',
    'ssd', 'hdd', 'storage', 'power supply', 'psu', 'cabinet', 'case', 'cooler',
    'intel', 'amd', 'nvidia', 'corsair', 'asus', 'msi', 'gigabyte', 'gaming',
    'desktop', 'computer', 'pc', 'workstation', 'ryzen', 'geforce', 'radeon'
  ];
  
  return pcKeywords.some(keyword => titleLower.includes(keyword));
}

function transformAmazonProduct(product: AmazonProduct): PCComponent {
  const price = parsePrice(product.product_price);
  const originalPrice = parsePrice(product.product_original_price) || price;
  const discount = originalPrice > price ? Math.round(((originalPrice - price) / originalPrice) * 100) : 0;
  
  const category = extractCategory(product.product_title);
  const brand = extractBrand(product.product_title);

  const offers: ComponentOffer[] = [{
    id: `amazon-${product.asin}`,
    componentId: product.asin,
    retailer: 'Amazon',
    price: price,
    originalPrice: originalPrice,
    discount: discount,
    availability: 'in_stock',
    url: product.product_url,
    lastUpdated: new Date().toISOString(),
    shipping: {
      cost: product.is_prime ? 0 : 50,
      estimatedDays: product.is_prime ? 1 : 3,
      free: !!product.is_prime,
    },
    badges: getBadges(product),
  }];

  return {
    id: product.asin,
    name: product.product_title,
    brand: brand,
    category: category,
    model: extractModel(product.product_title),
    description: product.product_title,
    imageUrl: product.product_photo,
    rating: product.product_star_rating ? parseFloat(product.product_star_rating) : undefined,
    reviewCount: product.product_num_ratings || undefined,
    availability: 'in_stock',
    averagePrice: price,
    priceRange: { min: price, max: originalPrice },
    lastUpdated: new Date().toISOString(),
    specifications: extractSpecifications(product.product_title),
    offers: offers,
  };
}

function parsePrice(priceString?: string): number {
  if (!priceString) return 0;
  
  // Remove currency symbols and commas, extract number
  const cleanPrice = priceString.replace(/[₹$,]/g, '').replace(/[^\d.]/g, '');
  return parseFloat(cleanPrice) || 0;
}

function extractCategory(title: string): string {
  const titleLower = title.toLowerCase();

  if (titleLower.includes('processor') || titleLower.includes('cpu') || titleLower.includes('ryzen') || titleLower.includes('intel')) return 'CPU';
  if (titleLower.includes('graphics card') || titleLower.includes('gpu') || titleLower.includes('geforce') || titleLower.includes('radeon')) return 'GPU';
  if (titleLower.includes('memory') || titleLower.includes('ram') || titleLower.includes('ddr')) return 'RAM';
  if (titleLower.includes('motherboard') || titleLower.includes('mobo')) return 'Motherboard';
  if (titleLower.includes('ssd') || titleLower.includes('hdd') || titleLower.includes('storage') || titleLower.includes('nvme')) return 'Storage';
  if (titleLower.includes('power supply') || titleLower.includes('psu') || titleLower.includes('smps')) return 'PSU';
  if (titleLower.includes('cabinet') || titleLower.includes('case')) return 'Case';
  if (titleLower.includes('cooler') || titleLower.includes('cooling') || titleLower.includes('fan')) return 'Cooling';
  return 'Other';
}

function extractBrand(title: string): string {
  const commonBrands = [
    'AMD', 'Intel', 'NVIDIA', 'ASUS', 'MSI', 'Gigabyte', 'ASRock',
    'Corsair', 'G.Skill', 'Kingston', 'Samsung', 'Western Digital',
    'Seagate', 'Cooler Master', 'Thermaltake', 'NZXT', 'Fractal Design'
  ];

  for (const brand of commonBrands) {
    if (title.toLowerCase().includes(brand.toLowerCase())) {
      return brand;
    }
  }

  return title.split(' ')[0];
}

function extractModel(title: string): string {
  const modelMatch = title.match(/([A-Z0-9]+[-\s][A-Z0-9]+)|([A-Z]+\s?\d+[A-Z]*)/i);
  return modelMatch?.[0] || title.split(' ').slice(0, 3).join(' ');
}

function extractSpecifications(title: string): Record<string, string | number | boolean> {
  const specs: Record<string, string | number | boolean> = {};
  const titleLower = title.toLowerCase();
  
  const ghzMatch = titleLower.match(/(\d+\.?\d*)\s*ghz/i);
  if (ghzMatch) specs.clockSpeed = `${ghzMatch[1]} GHz`;
  
  const memoryMatch = titleLower.match(/(\d+)\s*gb.*?(ddr\d+)/i);
  if (memoryMatch) {
    specs.memory = `${memoryMatch[1]}GB`;
    specs.memoryType = memoryMatch[2].toUpperCase();
  }
  
  const coreMatch = titleLower.match(/(\d+)[-\s]?core/i);
  if (coreMatch) specs.cores = parseInt(coreMatch[1]);

  return specs;
}

function getBadges(product: AmazonProduct): string[] {
  const badges: string[] = [];
  
  if (product.is_best_seller) badges.push('Best Seller');
  if (product.is_amazon_choice) badges.push("Amazon's Choice");
  if (product.is_prime) badges.push('Prime');
  
  return badges;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('query') || '';
  const category = searchParams.get('category') || undefined;

  if (!query) {
    return NextResponse.json(
      { error: 'Query parameter is required' },
      { status: 400 }
    );
  }

  try {
    const components = await searchAmazonProducts(query, category);

    return NextResponse.json({
      success: true,
      query,
      category,
      total: components.length,
      components,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Backend search error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
