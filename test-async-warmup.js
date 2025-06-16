#!/usr/bin/env node

/**
 * Test script for async cache warmup
 * Run with: node test-async-warmup.js
 */

const BASE_URL = 'http://localhost:3000';
const AUTH_TOKEN = process.env.CACHE_CLEAR_TOKEN || 'test-token';

async function testAsyncWarmup() {
  console.log('=== Async Cache Warmup Test ===\n');

  try {
    // Step 1: Get page list
    console.log('1. Getting page list...');
    const pagesResponse = await fetch(`${BASE_URL}/api/cache-get-pages`);
    
    if (!pagesResponse.ok) {
      console.error('Failed to get pages:', pagesResponse.status);
      return;
    }
    
    const pagesData = await pagesResponse.json();
    const pageIds = pagesData.pageIds || [];
    console.log(`   Found ${pageIds.length} pages\n`);

    // Step 2: Clear cache
    console.log('2. Clearing cache...');
    const clearResponse = await fetch(`${BASE_URL}/api/cache-clear`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${AUTH_TOKEN}`,
      },
      body: JSON.stringify({ type: 'all' }),
    });

    if (!clearResponse.ok) {
      console.error('Failed to clear cache:', clearResponse.status);
      return;
    }

    const clearData = await clearResponse.json();
    console.log('   Cache cleared successfully\n');

    // Step 3: Start fast async warmup job
    console.log('3. Starting FAST async warmup job...');
    const warmupResponse = await fetch(`${BASE_URL}/api/cache-warmup-fast`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${AUTH_TOKEN}`,
      },
      body: JSON.stringify({ pageIds }),
    });

    if (!warmupResponse.ok) {
      const errorData = await warmupResponse.json();
      console.error('Failed to start warmup:', errorData.error);
      return;
    }

    const warmupData = await warmupResponse.json();
    console.log(`   Job started with ID: ${warmupData.jobId}`);
    console.log(`   Status URL: ${warmupData.statusUrl}\n`);

    // Step 4: Poll for job status
    console.log('4. Monitoring job progress...\n');
    
    let lastProgress = -1;
    let consecutiveErrors = 0;
    const maxErrors = 5;
    
    while (true) {
      try {
        const statusResponse = await fetch(`${BASE_URL}${warmupData.statusUrl}`);
        
        if (!statusResponse.ok) {
          consecutiveErrors++;
          if (consecutiveErrors >= maxErrors) {
            console.error('Too many status check errors, aborting');
            break;
          }
          console.error('Status check failed:', statusResponse.status);
          await new Promise(resolve => setTimeout(resolve, 2000));
          continue;
        }
        
        consecutiveErrors = 0;
        const status = await statusResponse.json();
        
        // Only log if progress changed
        if (status.progress !== lastProgress) {
          lastProgress = status.progress;
          
          const progressBar = '='.repeat(Math.floor(status.progress / 2)) + 
                             '-'.repeat(50 - Math.floor(status.progress / 2));
          
          console.log(`   [${progressBar}] ${status.progress}%`);
          console.log(`   Status: ${status.status}`);
          console.log(`   Processed: ${status.processed}/${status.total} pages`);
          console.log(`   Success: ${status.succeeded} | Failed: ${status.failed}${status.skipped ? ` | Skipped: ${status.skipped}` : ''}`);
          if (status.successRate !== undefined) {
            console.log(`   Success Rate: ${status.successRate}%`);
          }
          if (status.currentBatch && status.totalBatches) {
            console.log(`   Batch: ${status.currentBatch}/${status.totalBatches}`);
          }
          
          if (status.elapsedSeconds && status.estimatedSecondsRemaining) {
            console.log(`   Time: ${Math.floor(status.elapsedSeconds / 60)}m ${status.elapsedSeconds % 60}s elapsed, ~${Math.ceil(status.estimatedSecondsRemaining / 60)}m remaining`);
          }
          
          if (status.errorSummary && Object.keys(status.errorSummary).length > 0) {
            console.log(`   Errors: ${JSON.stringify(status.errorSummary)}`);
          }
          
          console.log('');
        }
        
        // Check if job is complete
        if (status.isComplete) {
          console.log('\n=== Job Complete ===');
          console.log(`Final Status: ${status.status}`);
          console.log(`Total Pages: ${status.total}`);
          console.log(`Processed: ${status.processed}`);
          console.log(`Success: ${status.succeeded}`);
          if (status.skipped) {
            console.log(`Skipped (cached): ${status.skipped}`);
          }
          console.log(`Failed: ${status.failed}`);
          
          const duration = status.elapsedSeconds;
          console.log(`Total Time: ${Math.floor(duration / 60)}m ${duration % 60}s`);
          
          if (status.errors && status.errors.length > 0) {
            console.log('\nRecent Errors:');
            status.errors.slice(0, 5).forEach(err => {
              console.log(`  - ${err.pageId}: ${err.error}`);
            });
          }
          
          break;
        }
        
        // Wait before next check
        await new Promise(resolve => setTimeout(resolve, 2000));
        
      } catch (error) {
        console.error('Error during monitoring:', error.message);
        consecutiveErrors++;
        if (consecutiveErrors >= maxErrors) {
          console.error('Too many errors, aborting monitoring');
          break;
        }
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

// Run the test
console.log('Starting async warmup test...');
console.log(`Using base URL: ${BASE_URL}`);
console.log(`Using auth token: ${AUTH_TOKEN ? 'Set' : 'Not set'}\n`);

testAsyncWarmup().catch(console.error);