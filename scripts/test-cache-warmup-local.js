#!/usr/bin/env node

// ローカルでキャッシュウォームアップをテストするスクリプト
// Node.js 18+ has native fetch

const API_URL = process.env.API_URL || 'http://localhost:3000';
const TOKEN = process.env.CACHE_CLEAR_TOKEN || 'test-token';

async function testCacheWarmup() {
  console.log('Testing cache warmup locally...');
  console.log(`API URL: ${API_URL}`);
  console.log(`Token: ${TOKEN ? 'Set' : 'Not set'}`);
  
  try {
    // 1. まずキャッシュをクリア
    console.log('\n1. Clearing cache...');
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
    
    // 2. 少し待つ
    console.log('\n2. Waiting 2 seconds...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // 3. キャッシュウォームアップを実行
    console.log('\n3. Running cache warmup...');
    const warmupResponse = await fetch(`${API_URL}/api/cache-warmup`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${TOKEN}`
      }
    });
    
    const warmupResult = await warmupResponse.json();
    console.log('\nWarmup response:', JSON.stringify(warmupResult, null, 2));
    
    if (!warmupResponse.ok) {
      throw new Error(`Cache warmup failed: ${warmupResult.error}`);
    }
    
    // 結果をサマリー
    console.log('\n=== Summary ===');
    console.log(`Total pages: ${warmupResult.totalPages || warmupResult.warmedUp}`);
    console.log(`Successfully warmed: ${warmupResult.warmedUp}`);
    console.log(`Failed: ${warmupResult.failed}`);
    
    if (warmupResult.pageIds) {
      console.log(`\nFirst few page IDs: ${warmupResult.pageIds.join(', ')}`);
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

// 実行
testCacheWarmup();