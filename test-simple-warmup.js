#!/usr/bin/env node

/**
 * Test script for simple cache warmup
 * Run with: node test-simple-warmup.js
 */

const BASE_URL = 'http://localhost:3000';
const AUTH_TOKEN = process.env.CACHE_CLEAR_TOKEN || 'test-token';

async function testSimpleWarmup() {
  console.log('=== Simple Cache Warmup Test ===\n');

  try {
    // Step 1: Clear cache first
    console.log('1. Clearing cache...');
    const clearResponse = await fetch(`${BASE_URL}/api/cache-clear`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${AUTH_TOKEN}`,
      },
      body: JSON.stringify({ type: 'all' }),
    });

    if (clearResponse.ok) {
      console.log('   Cache cleared successfully\n');
    } else {
      console.log('   Warning: Could not clear cache\n');
    }

    // Step 2: Start simple warmup
    console.log('2. Starting simple warmup...');
    const warmupResponse = await fetch(`${BASE_URL}/api/cache-warmup-simple`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${AUTH_TOKEN}`,
      }
    });

    if (!warmupResponse.ok) {
      const error = await warmupResponse.json();
      console.error('Failed to start warmup:', error);
      return;
    }

    const warmupData = await warmupResponse.json();
    console.log(`   Warmup started: ${warmupData.message}`);
    console.log(`   Total pages: ${warmupData.total}\n`);

    // Step 3: Monitor progress
    console.log('3. Monitoring progress...\n');
    
    let lastProgress = -1;
    let isComplete = false;
    
    while (!isComplete) {
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
      
      // Get status
      const statusResponse = await fetch(`${BASE_URL}/api/cache-warmup-simple`, {
        method: 'GET'
      });
      
      if (!statusResponse.ok) {
        console.error('Failed to get status');
        break;
      }
      
      const status = await statusResponse.json();
      
      // Only log if progress changed
      if (status.progress !== lastProgress) {
        lastProgress = status.progress;
        
        const progressBar = '='.repeat(Math.floor(status.progress / 2)) + 
                           '-'.repeat(50 - Math.floor(status.progress / 2));
        
        console.log(`   [${progressBar}] ${status.progress}%`);
        console.log(`   Processed: ${status.processed}/${status.total}`);
        console.log(`   Success: ${status.succeeded} | Skipped: ${status.skipped} | Failed: ${status.failed}`);
        console.log(`   Elapsed: ${status.elapsed} seconds`);
        console.log('');
      }
      
      // Check if complete
      if (!status.isProcessing && status.processed > 0) {
        isComplete = true;
        
        console.log('\n=== Warmup Complete ===');
        console.log(`Total Pages: ${status.total}`);
        console.log(`Processed: ${status.processed}`);
        console.log(`Success: ${status.succeeded}`);
        console.log(`Skipped: ${status.skipped} (cached/duplicate)`);
        console.log(`Failed: ${status.failed}`);
        console.log(`Total Time: ${status.elapsed} seconds`);
        
        if (status.errors && status.errors.length > 0) {
          console.log('\nRecent Errors:');
          status.errors.forEach(err => {
            console.log(`  - ${err}`);
          });
        }
        
        // Calculate stats
        const successRate = status.processed > 0 
          ? Math.round((status.succeeded / status.processed) * 100) 
          : 0;
        const throughput = status.elapsed > 0 
          ? (status.processed / status.elapsed).toFixed(1) 
          : 0;
        
        console.log('\nPerformance:');
        console.log(`  Success Rate: ${successRate}%`);
        console.log(`  Throughput: ${throughput} pages/sec`);
      }
      
      // Timeout after 10 minutes
      if (status.elapsed > 600) {
        console.log('\n⏰ Timeout: Process taking too long');
        break;
      }
    }
    
  } catch (error) {
    console.error('\nTest failed:', error);
  }
}

// Run the test
console.log('Starting simple warmup test...');
console.log(`Using base URL: ${BASE_URL}`);
console.log(`Using auth token: ${AUTH_TOKEN ? 'Set' : 'Not set'}\n`);

testSimpleWarmup().catch(console.error);