#!/usr/bin/env node

/**
 * Test script for duplicate page resolution
 * Run with: node test-duplicate-resolution.js
 */

const BASE_URL = 'http://localhost:3000';
const AUTH_TOKEN = process.env.CACHE_CLEAR_TOKEN || 'test-token';

async function testDuplicateResolution() {
  console.log('=== Duplicate Page Resolution Test ===\n');

  try {
    // Step 1: Get page list using the optimized endpoint
    console.log('1. Testing getAllPageIds function...');
    
    // First, trigger the optimized warmup to see duplicate detection
    const warmupResponse = await fetch(`${BASE_URL}/api/cache-warmup-optimized`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${AUTH_TOKEN}`,
      }
    });

    if (!warmupResponse.ok) {
      const error = await warmupResponse.json();
      
      // If already in progress, that's fine
      if (warmupResponse.status === 409) {
        console.log('   Warmup already in progress, checking status...');
      } else {
        console.error('Failed to start warmup:', error);
        return;
      }
    } else {
      const data = await warmupResponse.json();
      console.log(`   Warmup started successfully`);
      console.log(`   Total unique pages: ${data.total}`);
    }

    // Wait a moment for logs to appear
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Step 2: Check status
    console.log('\n2. Checking warmup status...');
    const statusResponse = await fetch(`${BASE_URL}/api/cache-warmup-status?jobId=current`);
    
    if (statusResponse.ok) {
      const status = await statusResponse.json();
      console.log(`   Progress: ${status.progress}%`);
      console.log(`   Processed: ${status.processed}/${status.total}`);
      console.log(`   Succeeded: ${status.succeeded}`);
      console.log(`   Skipped: ${status.skipped}`);
      console.log(`   Failed: ${status.failed}`);
      
      if (status.errorSummary && Object.keys(status.errorSummary).length > 0) {
        console.log('\n   Error Summary:');
        Object.entries(status.errorSummary).forEach(([type, count]) => {
          console.log(`     ${type}: ${count}`);
        });
      }
      
      if (status.recentErrors && status.recentErrors.length > 0) {
        console.log('\n   Recent Errors:');
        status.recentErrors.forEach(err => {
          console.log(`     ${err.pageId}: ${err.error}`);
        });
      }
    }

    // Step 3: Check debug info
    console.log('\n3. Getting debug information...');
    const debugResponse = await fetch(`${BASE_URL}/api/debug-cache`);
    
    if (debugResponse.ok) {
      const debug = await debugResponse.json();
      console.log(`   Cache entries: ${debug.cache.statistics.totalEntries}`);
      console.log(`   Cache size: ${Math.round(debug.cache.statistics.estimatedSizeKB / 1024)}MB`);
      
      if (debug.jobs.standard.list.length > 0) {
        console.log('\n   Recent Jobs:');
        debug.jobs.standard.list.slice(0, 3).forEach(job => {
          console.log(`     ${job.id}: ${job.status} (${job.processed}/${job.total})`);
        });
      }
    }

    // Step 4: Monitor for duplicates in console output
    console.log('\n4. Monitoring for duplicate warnings...');
    console.log('   Check the server console for messages like:');
    console.log('   [Page List] ⚠️ Duplicate pages found for title "..."');
    console.log('   [Page List] ⚠️ Multiple pages with canonical ID "..."');
    
    // Step 5: Test specific duplicate scenario
    console.log('\n5. Testing duplicate handling...');
    
    // Get the page list to see if duplicates are excluded
    const pagesResponse = await fetch(`${BASE_URL}/api/cache-get-pages`);
    if (pagesResponse.ok) {
      const pagesData = await pagesResponse.json();
      const pageIds = pagesData.pageIds || [];
      
      console.log(`   Total pages from cache-get-pages: ${pageIds.length}`);
      
      // Check for potential duplicates by looking for similar IDs
      const idCounts = {};
      pageIds.forEach(id => {
        const shortId = id.substring(0, 8);
        idCounts[shortId] = (idCounts[shortId] || 0) + 1;
      });
      
      const potentialDuplicates = Object.entries(idCounts)
        .filter(([id, count]) => count > 1);
      
      if (potentialDuplicates.length > 0) {
        console.log('\n   Potential duplicate patterns found:');
        potentialDuplicates.forEach(([pattern, count]) => {
          console.log(`     Pattern ${pattern}...: ${count} occurrences`);
        });
      } else {
        console.log('   No obvious duplicate patterns detected');
      }
    }

    console.log('\n=== Test Complete ===');
    console.log('\nRecommendations:');
    console.log('1. Check server logs for duplicate warnings');
    console.log('2. Verify that duplicate pages are being excluded');
    console.log('3. Monitor processing time improvement');
    console.log('4. Ensure all unique pages are still processed');

  } catch (error) {
    console.error('\nTest failed:', error);
  }
}

// Run the test
console.log('Starting duplicate resolution test...');
console.log(`Using base URL: ${BASE_URL}`);
console.log(`Using auth token: ${AUTH_TOKEN ? 'Set' : 'Not set'}\n`);

testDuplicateResolution().catch(console.error);