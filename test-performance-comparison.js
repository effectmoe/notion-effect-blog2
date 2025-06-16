#!/usr/bin/env node

/**
 * Performance comparison between standard and fast cache warmup
 * Run with: node test-performance-comparison.js
 */

const BASE_URL = 'http://localhost:3000';
const AUTH_TOKEN = process.env.CACHE_CLEAR_TOKEN || 'test-token';

async function runPerformanceTest() {
  console.log('=== Cache Warmup Performance Test ===\n');

  try {
    // Step 1: Get debug info
    console.log('1. Getting initial cache state...');
    const debugBefore = await fetch(`${BASE_URL}/api/debug-cache`);
    const debugDataBefore = await debugBefore.json();
    
    console.log(`   Cache entries: ${debugDataBefore.cache.statistics.totalEntries}`);
    console.log(`   Cache size: ${Math.round(debugDataBefore.cache.statistics.estimatedSizeKB / 1024)}MB\n`);

    // Step 2: Get page list
    console.log('2. Getting page list...');
    const pagesResponse = await fetch(`${BASE_URL}/api/cache-get-pages`);
    const pagesData = await pagesResponse.json();
    const pageIds = pagesData.pageIds || [];
    console.log(`   Found ${pageIds.length} pages\n`);

    // Step 3: Run fast warmup
    console.log('3. Running FAST warmup test...');
    const startTimeFast = Date.now();
    
    const fastResponse = await fetch(`${BASE_URL}/api/cache-warmup-fast`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${AUTH_TOKEN}`,
      },
      body: JSON.stringify({ pageIds }),
    });

    if (!fastResponse.ok) {
      console.error('Fast warmup failed to start');
      return;
    }

    const fastData = await fastResponse.json();
    console.log(`   Job started: ${fastData.jobId}`);

    // Monitor fast warmup
    let fastComplete = false;
    let fastResult = null;
    
    while (!fastComplete) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const statusResponse = await fetch(`${BASE_URL}/api/cache-warmup-status?jobId=${fastData.jobId}`);
      if (statusResponse.ok) {
        const status = await statusResponse.json();
        
        // Show progress
        process.stdout.write(`\r   Progress: ${status.progress}% (${status.processed}/${status.total})`);
        
        if (status.isComplete) {
          fastComplete = true;
          fastResult = status;
          console.log(''); // New line
        }
      }
    }

    const fastDuration = (Date.now() - startTimeFast) / 1000;

    // Step 4: Show results
    console.log('\n=== Performance Results ===\n');
    
    console.log('FAST Warmup Results:');
    console.log(`  Total time: ${fastDuration.toFixed(1)}s`);
    console.log(`  Pages processed: ${fastResult.processed}`);
    console.log(`  Pages succeeded: ${fastResult.succeeded}`);
    console.log(`  Pages skipped (cached): ${fastResult.skipped || 0}`);
    console.log(`  Pages failed: ${fastResult.failed}`);
    console.log(`  Throughput: ${(fastResult.processed / fastDuration).toFixed(1)} pages/sec`);
    
    // Step 5: Get final debug info
    const debugAfter = await fetch(`${BASE_URL}/api/debug-cache`);
    const debugDataAfter = await debugAfter.json();
    
    console.log('\nCache Statistics After:');
    console.log(`  Cache entries: ${debugDataAfter.cache.statistics.totalEntries}`);
    console.log(`  Cache size: ${Math.round(debugDataAfter.cache.statistics.estimatedSizeKB / 1024)}MB`);
    
    if (debugDataAfter.performance) {
      console.log('\nAverage Performance (Recent Jobs):');
      console.log(`  Average duration: ${debugDataAfter.performance.averageDuration.toFixed(1)}s`);
      console.log(`  Average throughput: ${debugDataAfter.performance.averageThroughput.toFixed(1)} pages/sec`);
    }

    // Show recommendations
    if (debugDataAfter.recommendations && debugDataAfter.recommendations.length > 0) {
      console.log('\nRecommendations:');
      debugDataAfter.recommendations.forEach(rec => {
        console.log(`  [${rec.type.toUpperCase()}] ${rec.message}`);
        if (rec.metric) {
          console.log(`    Metric: ${rec.metric}`);
        }
      });
    }

    // Performance comparison with theoretical standard warmup
    console.log('\n=== Performance Comparison ===');
    console.log('Fast Warmup (Actual):');
    console.log(`  Duration: ${fastDuration.toFixed(1)}s`);
    console.log(`  Throughput: ${(fastResult.processed / fastDuration).toFixed(1)} pages/sec`);
    
    console.log('\nStandard Warmup (Estimated):');
    const estimatedStandardTime = (pageIds.length / 5) * 10 + ((pageIds.length / 5) - 1) * 5;
    console.log(`  Duration: ${estimatedStandardTime.toFixed(1)}s`);
    console.log(`  Throughput: ${(pageIds.length / estimatedStandardTime).toFixed(1)} pages/sec`);
    
    const improvement = ((estimatedStandardTime - fastDuration) / estimatedStandardTime) * 100;
    console.log(`\nImprovement: ${improvement.toFixed(0)}% faster`);

  } catch (error) {
    console.error('\nTest failed:', error);
  }
}

// Run the test
console.log('Starting performance comparison test...');
console.log(`Using base URL: ${BASE_URL}`);
console.log(`Using auth token: ${AUTH_TOKEN ? 'Set' : 'Not set'}\n`);

runPerformanceTest().catch(console.error);