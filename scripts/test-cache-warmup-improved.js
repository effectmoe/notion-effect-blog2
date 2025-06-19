#!/usr/bin/env node

// Improved cache warmup test that gets page list before clearing cache
const API_URL = process.env.API_URL || 'http://localhost:3000';
const TOKEN = process.env.CACHE_CLEAR_TOKEN || 'test-token';

async function testImprovedCacheWarmup() {
  console.log('Testing improved cache warmup...');
  console.log(`API URL: ${API_URL}`);
  console.log(`Token: ${TOKEN ? 'Set' : 'Not set'}`);
  
  try {
    // 1. First get the list of pages while cache is populated
    console.log('\n1. Getting current page list...');
    const pagesResponse = await fetch(`${API_URL}/api/cache-get-pages`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${TOKEN}`
      }
    });
    
    if (!pagesResponse.ok) {
      const error = await pagesResponse.text();
      throw new Error(`Failed to get pages: ${error}`);
    }
    
    const pagesResult = await pagesResponse.json();
    console.log('Pages response:', pagesResult);
    
    const pageIds = pagesResult.pageIds || [];
    console.log(`Found ${pageIds.length} important pages to warm up`);
    
    // 2. Clear the cache
    console.log('\n2. Clearing cache...');
    const clearResponse = await fetch(`${API_URL}/api/cache-clear`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TOKEN}`
      },
      body: JSON.stringify({ type: 'all' })
    });
    
    const clearResult = await clearResponse.json();
    console.log('Clear response:', clearResult);
    
    if (!clearResponse.ok) {
      throw new Error(`Cache clear failed: ${clearResult.error}`);
    }
    
    // 3. Wait a moment
    console.log('\n3. Waiting 2 seconds...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // 4. Warm up cache with specific pages
    console.log('\n4. Running cache warmup with specific pages...');
    const warmupResponse = await fetch(`${API_URL}/api/cache-warmup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TOKEN}`
      },
      body: JSON.stringify({ 
        skipSiteMap: true,  // Skip trying to get site map after cache clear
        pageIds: pageIds    // Provide specific page IDs to warm up
      })
    });
    
    const warmupResult = await warmupResponse.json();
    console.log('\nWarmup response:', JSON.stringify(warmupResult, null, 2));
    
    if (!warmupResponse.ok) {
      throw new Error(`Cache warmup failed: ${warmupResult.error}`);
    }
    
    // 5. Summary
    console.log('\n=== Summary ===');
    console.log(`Pages identified before cache clear: ${pageIds.length}`);
    console.log(`Successfully warmed: ${warmupResult.warmedUp}`);
    console.log(`Failed: ${warmupResult.failed}`);
    
    if (warmupResult.pageIds) {
      console.log(`\nFirst few warmed page IDs: ${warmupResult.pageIds.slice(0, 3).join(', ')}`);
    }
    
    if (warmupResult.failedDetails && warmupResult.failedDetails.length > 0) {
      console.log('\nFailed pages:');
      warmupResult.failedDetails.forEach(detail => {
        console.log(`- ${detail.pageId}: ${detail.reason}`);
      });
    }
    
  } catch (error) {
    console.error('\nError:', error.message);
    process.exit(1);
  }
}

// Run the test
testImprovedCacheWarmup();