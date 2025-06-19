#!/usr/bin/env node

/**
 * Test script to verify cache warmup functionality
 * This tests the fix for the "0 pages" issue after cache clear
 */

const https = require('https');
const http = require('http');

// Configuration
const API_BASE = process.env.API_BASE || 'http://localhost:3000';
const AUTH_TOKEN = process.env.CACHE_CLEAR_TOKEN || 'your-secret-token';

// Helper function to make HTTP requests
function makeRequest(url, method = 'GET', data = null) {
  const parsedUrl = new URL(url);
  const isHttps = parsedUrl.protocol === 'https:';
  const httpModule = isHttps ? https : http;

  const options = {
    hostname: parsedUrl.hostname,
    port: parsedUrl.port || (isHttps ? 443 : 80),
    path: parsedUrl.pathname + parsedUrl.search,
    method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${AUTH_TOKEN}`
    }
  };

  return new Promise((resolve, reject) => {
    const req = httpModule.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            data: JSON.parse(body)
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            data: body
          });
        }
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function runTest() {
  console.log('=== Cache Warmup Test ===\n');
  console.log(`API Base: ${API_BASE}`);
  console.log(`Auth Token: ${AUTH_TOKEN ? 'Set' : 'Not set'}\n`);

  try {
    // Step 1: Clear all caches
    console.log('1. Clearing all caches...');
    const clearResult = await makeRequest(
      `${API_BASE}/api/cache-clear`,
      'POST',
      { type: 'all' }
    );
    console.log(`   Status: ${clearResult.status}`);
    console.log(`   Result:`, clearResult.data);
    console.log('');

    // Wait a moment for cache to clear
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Step 2: Warm up cache
    console.log('2. Warming up cache...');
    const warmupResult = await makeRequest(
      `${API_BASE}/api/cache-warmup`,
      'POST'
    );
    console.log(`   Status: ${warmupResult.status}`);
    console.log(`   Result:`, warmupResult.data);
    console.log('');

    // Step 3: Analyze results
    console.log('3. Test Results:');
    if (warmupResult.status === 200 && warmupResult.data.success) {
      const { warmedUp, failed, totalPages, pageIds, failedDetails } = warmupResult.data;
      
      console.log(`   ✓ Cache warmup successful`);
      console.log(`   - Total pages: ${totalPages}`);
      console.log(`   - Successfully warmed: ${warmedUp}`);
      console.log(`   - Failed: ${failed}`);
      
      if (warmedUp > 0) {
        console.log(`   ✓ PASS: Cache warmup returned ${warmedUp} pages (not 0)`);
        console.log(`   - Sample page IDs:`, pageIds);
      } else {
        console.log(`   ✗ FAIL: Cache warmup returned 0 pages`);
      }
      
      if (failed > 0 && failedDetails) {
        console.log(`   - Failed pages:`, failedDetails);
      }
    } else {
      console.log(`   ✗ FAIL: Cache warmup failed`);
      console.log(`   - Error:`, warmupResult.data);
    }

  } catch (error) {
    console.error('Test failed with error:', error);
    process.exit(1);
  }
}

// Run the test
runTest().then(() => {
  console.log('\n=== Test Complete ===');
}).catch(error => {
  console.error('Unexpected error:', error);
  process.exit(1);
});