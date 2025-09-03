// Debug the exact same API call the frontend is making
require('dotenv').config({ path: '.env.local' });

// Test the affiliate service directly with the same parameters
async function testFrontendAPICall() {
  console.log('🔧 Environment Check:');
  console.log('- RAPIDAPI_KEY exists:', !!process.env.EXPO_PUBLIC_RAPIDAPI_KEY);
  console.log('- DEBUG_MODE:', process.env.EXPO_PUBLIC_DEBUG_MODE);

  // Import the affiliate service
  const { affiliateService } = require('./src/services/affiliate-service');

  console.log('\n🔍 Testing exact frontend API call...\n');

  try {
    // Simulate the exact call from PCBuilderTab for CPU category
    const searchOptions = {
      query: 'processor intel amd ryzen core i3 i5 i7 i9',
      category: 'cpu',
      sortBy: 'popular',
      limit: 60 // page 1 with extra results
    };

    console.log('📤 searchComponents call with options:', searchOptions);
    const results = await affiliateService.searchComponents(searchOptions);

    console.log('\n📊 Final Results:');
    console.log(`- Total results: ${results.length}`);

    if (results.length > 0) {
      // Check source breakdown
      const sourceCounts = {};
      results.forEach(comp => {
        const retailer = comp.offers?.[0]?.retailer || 'Unknown';
        sourceCounts[retailer] = (sourceCounts[retailer] || 0) + 1;
      });

      console.log('🏪 Source breakdown:', sourceCounts);

      console.log('\n📦 First 5 results:');
      results.slice(0, 5).forEach((comp, index) => {
        const offer = comp.offers?.[0];
        console.log(`  ${index + 1}. ${comp.name.substring(0, 50)}...`);
        console.log(`     Retailer: ${offer?.retailer}`);
        console.log(`     Price: ₹${offer?.price}`);
        console.log(`     Brand: ${comp.brand}`);
      });
    } else {
      console.log('❌ No results returned!');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testFrontendAPICall();
