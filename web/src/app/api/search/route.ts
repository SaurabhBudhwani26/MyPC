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

async function searchAmazon(query: string): Promise<AmazonProduct[]> {
  if (!process.env.RAPIDAPI_KEY) {
    throw new Error('RapidAPI key not configured');
  }

  const url = `https://real-time-amazon-data.p.rapidapi.com/search?query=${encodeURIComponent(query)}&page=1&country=IN`;
  
  console.log('🌐 Making Amazon API request to:', url);

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'X-RapidAPI-Key': process.env.RAPIDAPI_KEY,
      'X-RapidAPI-Host': 'real-time-amazon-data.p.rapidapi.com',
      'Content-Type': 'application/json',
    },
  });

  console.log('📊 Amazon API Response Status:', response.status);

  if (!response.ok) {
    const errorText = await response.text();
    console.log('❌ Amazon API Error Response:', errorText);
    throw new Error(`Amazon Search API error: ${response.status} - ${errorText}`);
  }

  const data: AmazonSearchResponse = await response.json();
  console.log('✅ Amazon API Success:', {
    totalProducts: data.data?.total_products || 0,
    productsReturned: data.data?.products?.length || 0
  });

  return data.data?.products || [];
}

async function testEarnKaroAPI(): Promise<unknown> {
  if (!process.env.EARNKARO_API_KEY || !process.env.EARNKARO_API_URL) {
    throw new Error('EarnKaro API not configured');
  }

  const testUrl = `${process.env.EARNKARO_API_URL}/api/converter/public`;
  
  console.log('🔍 Testing EarnKaro API at:', testUrl);

  const response = await fetch(testUrl, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${process.env.EARNKARO_API_KEY}`,
      'Content-Type': 'application/json',
    },
  });

  console.log('📊 EarnKaro API Response Status:', response.status);

  const data = await response.json();
  console.log('✅ EarnKaro API Response:', data);

  return data;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('query') || 'gaming laptop';
  const testType = searchParams.get('test') || 'all';

  try {
    const results: {
      query: string;
      timestamp: string;
      tests: Record<string, unknown>;
    } = {
      query,
      timestamp: new Date().toISOString(),
      tests: {}
    };

    // Test Amazon API
    if (testType === 'all' || testType === 'amazon') {
      try {
        console.log(`🔍 Testing Amazon search for: "${query}"`);
        const amazonProducts = await searchAmazon(query);
        
        // Filter for PC components
        const pcProducts = amazonProducts.filter(product => {
          const title = product.product_title.toLowerCase();
          const pcKeywords = [
            'processor', 'cpu', 'graphics card', 'gpu', 'motherboard', 'ram', 'memory',
            'ssd', 'hdd', 'storage', 'power supply', 'psu', 'cabinet', 'case', 'cooler',
            'intel', 'amd', 'nvidia', 'corsair', 'asus', 'msi', 'gigabyte', 'gaming',
            'desktop', 'computer', 'pc', 'workstation', 'ryzen', 'geforce', 'radeon', 'laptop'
          ];
          return pcKeywords.some(keyword => title.includes(keyword));
        });

        results.tests.amazon = {
          success: true,
          totalProducts: amazonProducts.length,
          pcProducts: pcProducts.length,
          sampleProducts: pcProducts.slice(0, 3).map(product => ({
            asin: product.asin,
            title: product.product_title,
            price: product.product_price,
            originalPrice: product.product_original_price,
            rating: product.product_star_rating,
            isPrime: product.is_prime,
            isAmazonChoice: product.is_amazon_choice,
            isBestSeller: product.is_best_seller
          }))
        };
      } catch (error) {
        results.tests.amazon = {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    }

    // Test EarnKaro API
    if (testType === 'all' || testType === 'earnkaro') {
      try {
        console.log('💰 Testing EarnKaro API');
        const earnKaroResponse = await testEarnKaroAPI();
        results.tests.earnkaro = {
          success: true,
          response: earnKaroResponse
        };
      } catch (error) {
        results.tests.earnkaro = {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    }

    return NextResponse.json(results);

  } catch (error) {
    console.error('❌ API Test Error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
