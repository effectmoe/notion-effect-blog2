#!/usr/bin/env node

/**
 * Test script to verify cache clearing functionality
 * Run with: node scripts/test-cache-clear.js
 */

const https = require('https');
const http = require('http');

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
const CACHE_CLEAR_TOKEN = process.env.CACHE_CLEAR_TOKEN || '';

console.log('🔍 Cache Clear Test Script');
console.log('========================');
console.log(`Site URL: ${SITE_URL}`);
console.log(`Token configured: ${CACHE_CLEAR_TOKEN ? 'Yes' : 'No'}`);
console.log('');

async function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const client = urlObj.protocol === 'https:' ? https : http;
    
    const req = client.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({ status: res.statusCode, data: json, headers: res.headers });
        } catch (e) {
          resolve({ status: res.statusCode, data, headers: res.headers });
        }
      });
    });
    
    req.on('error', reject);
    
    if (options.body) {
      req.write(options.body);
    }
    
    req.end();
  });
}

async function testCacheClear() {
  console.log('1️⃣  Testing cache status endpoint...');
  try {
    const statusRes = await makeRequest(`${SITE_URL}/api/cache-status`);
    console.log(`   Status: ${statusRes.status}`);
    if (statusRes.status === 200) {
      console.log('   Memory cache size:', statusRes.data.memory?.size || 0);
      console.log('   Redis connected:', statusRes.data.redis?.connected || false);
      console.log('   Redis keys:', statusRes.data.redis?.keyCount || 0);
    }
  } catch (error) {
    console.error('   ❌ Failed:', error.message);
  }
  
  console.log('\n2️⃣  Testing cache clear endpoint...');
  try {
    const clearRes = await makeRequest(`${SITE_URL}/api/cache-clear`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${CACHE_CLEAR_TOKEN}`
      },
      body: JSON.stringify({ type: 'all' })
    });
    
    console.log(`   Status: ${clearRes.status}`);
    if (clearRes.status === 200) {
      console.log('   Success:', clearRes.data.message);
      if (clearRes.data.stats) {
        console.log('   Memory cleared:', 
          clearRes.data.stats.before.memory.size - clearRes.data.stats.after.memory.size);
        console.log('   Redis cleared:', 
          clearRes.data.stats.before.redis.keyCount - clearRes.data.stats.after.redis.keyCount);
      }
    } else {
      console.log('   ❌ Error:', clearRes.data.error);
    }
  } catch (error) {
    console.error('   ❌ Failed:', error.message);
  }
  
  console.log('\n3️⃣  Checking cache status after clear...');
  // Wait a bit for cache to settle
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  try {
    const statusRes = await makeRequest(`${SITE_URL}/api/cache-status`);
    if (statusRes.status === 200) {
      console.log('   Memory cache size:', statusRes.data.memory?.size || 0);
      console.log('   Redis keys:', statusRes.data.redis?.keyCount || 0);
    }
  } catch (error) {
    console.error('   ❌ Failed:', error.message);
  }
  
  console.log('\n4️⃣  Testing page request (to see if cache is repopulated)...');
  try {
    // Request a page to see if it gets cached
    const pageRes = await makeRequest(`${SITE_URL}/`);
    console.log(`   Homepage status: ${pageRes.status}`);
    console.log('   Cache headers:', pageRes.headers['cache-control'] || 'none');
    console.log('   x-cache:', pageRes.headers['x-cache'] || 'none');
  } catch (error) {
    console.error('   ❌ Failed:', error.message);
  }
  
  console.log('\n5️⃣  Final cache status check...');
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  try {
    const statusRes = await makeRequest(`${SITE_URL}/api/cache-status`);
    if (statusRes.status === 200) {
      console.log('   Memory cache size:', statusRes.data.memory?.size || 0);
      console.log('   Redis keys:', statusRes.data.redis?.keyCount || 0);
    }
  } catch (error) {
    console.error('   ❌ Failed:', error.message);
  }
  
  console.log('\n✅ Test complete!');
  console.log('\n📝 Notes:');
  console.log('- If cache size returns to non-zero after clearing, pages are being immediately re-cached');
  console.log('- Next.js ISR (revalidate: 10) means pages are statically cached for 10 seconds');
  console.log('- Service Worker caches must be cleared from the browser');
  console.log('- Check browser console logs for detailed debugging info');
}

// Run the test
testCacheClear().catch(console.error);