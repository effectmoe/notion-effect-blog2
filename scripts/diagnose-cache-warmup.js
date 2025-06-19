#!/usr/bin/env node

// Diagnostic script to understand cache warmup issues
const API_URL = process.env.API_URL || 'http://localhost:3000';
const TOKEN = process.env.CACHE_CLEAR_TOKEN || 'test-token';

async function diagnose() {
  console.log('=== Cache Warmup Diagnostic ===\n');
  
  try {
    // 1. Check current site map status
    console.log('1. Checking current site map (before cache clear)...');
    try {
      const pagesResp = await fetch(`${API_URL}/api/cache-get-pages`, {
        headers: { 'Authorization': `Bearer ${TOKEN}` }
      });
      
      if (pagesResp.ok) {
        const pages = await pagesResp.json();
        console.log(`   ✓ Site map has ${pages.totalPages} total pages`);
        console.log(`   ✓ Can warm up ${pages.importantPages} important pages`);
        if (pages.pageIds && pages.pageIds.length > 0) {
          console.log(`   ✓ First 3 page IDs: ${pages.pageIds.slice(0, 3).join(', ')}`);
        }
      } else {
        console.log('   ✗ Failed to get pages:', await pagesResp.text());
      }
    } catch (e) {
      console.log('   ✗ Error getting pages:', e.message);
    }
    
    // 2. Test warmup BEFORE cache clear
    console.log('\n2. Testing warmup BEFORE cache clear...');
    try {
      const warmupResp = await fetch(`${API_URL}/api/cache-warmup`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${TOKEN}` }
      });
      
      if (warmupResp.ok) {
        const result = await warmupResp.json();
        console.log(`   ✓ Warmed up ${result.warmedUp} pages successfully`);
        console.log(`   ✓ Failed: ${result.failed} pages`);
      } else {
        console.log('   ✗ Warmup failed:', await warmupResp.text());
      }
    } catch (e) {
      console.log('   ✗ Error during warmup:', e.message);
    }
    
    // 3. Clear cache
    console.log('\n3. Clearing all caches...');
    try {
      const clearResp = await fetch(`${API_URL}/api/cache-clear`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${TOKEN}`
        },
        body: JSON.stringify({ type: 'all' })
      });
      
      if (clearResp.ok) {
        const result = await clearResp.json();
        console.log('   ✓ Cache cleared successfully');
        if (result.stats) {
          console.log(`   ✓ Cleared ${result.stats.before.memory.size - result.stats.after.memory.size} items from memory`);
          console.log(`   ✓ Cleared ${result.stats.before.redis.keyCount - result.stats.after.redis.keyCount} keys from Redis`);
        }
      } else {
        console.log('   ✗ Clear failed:', await clearResp.text());
      }
    } catch (e) {
      console.log('   ✗ Error clearing cache:', e.message);
    }
    
    // 4. Wait a bit
    console.log('\n4. Waiting 3 seconds...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // 5. Test warmup AFTER cache clear (without specific pages)
    console.log('\n5. Testing warmup AFTER cache clear (default behavior)...');
    try {
      const warmupResp = await fetch(`${API_URL}/api/cache-warmup`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${TOKEN}` }
      });
      
      if (warmupResp.ok) {
        const result = await warmupResp.json();
        console.log(`   ${result.warmedUp > 5 ? '✓' : '✗'} Warmed up ${result.warmedUp} pages`);
        console.log(`   - Failed: ${result.failed} pages`);
        if (result.warmedUp <= 5) {
          console.log('   ⚠️  This is the issue: Only warming up few pages after cache clear!');
        }
      } else {
        console.log('   ✗ Warmup failed:', await warmupResp.text());
      }
    } catch (e) {
      console.log('   ✗ Error during warmup:', e.message);
    }
    
    // 6. Get page list and warm up with specific IDs
    console.log('\n6. Testing improved warmup with specific page IDs...');
    try {
      // First get pages
      const pagesResp = await fetch(`${API_URL}/api/cache-get-pages`, {
        headers: { 'Authorization': `Bearer ${TOKEN}` }
      });
      
      if (pagesResp.ok) {
        const pages = await pagesResp.json();
        const pageIds = pages.pageIds || [];
        
        console.log(`   ✓ Retrieved ${pageIds.length} page IDs to warm up`);
        
        // Warm up with specific pages
        const warmupResp = await fetch(`${API_URL}/api/cache-warmup`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${TOKEN}`
          },
          body: JSON.stringify({
            skipSiteMap: true,
            pageIds: pageIds
          })
        });
        
        if (warmupResp.ok) {
          const result = await warmupResp.json();
          console.log(`   ${result.warmedUp > 5 ? '✓' : '✗'} Warmed up ${result.warmedUp} pages with specific IDs`);
          console.log(`   - Failed: ${result.failed} pages`);
          if (result.warmedUp > 5) {
            console.log('   ✓ This is the solution: Provide specific page IDs after cache clear!');
          }
        }
      }
    } catch (e) {
      console.log('   ✗ Error during improved warmup:', e.message);
    }
    
    console.log('\n=== Diagnostic Complete ===');
    
  } catch (error) {
    console.error('\nDiagnostic error:', error);
  }
}

// Run diagnostic
diagnose();