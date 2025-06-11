// キャッシュ監視スクリプト
// ブラウザのコンソールに貼り付けて使用

(function() {
  let lastStatus = null;
  
  async function checkCacheStatus() {
    try {
      const response = await fetch('/api/cache-status');
      const data = await response.json();
      
      if (data.success) {
        const cache = data.cache;
        console.group('🔍 Cache Status');
        console.log(`📊 Hit Rate: ${cache.hitRate || '0%'}`);
        console.log(`✅ Hits: ${cache.hits || 0}`);
        console.log(`❌ Misses: ${cache.misses || 0}`);
        console.log(`📦 Total Items: ${cache.totalItems || 0}`);
        console.log(`💾 Total Size: ${cache.totalSize || '0 KB'}`);
        
        if (lastStatus && cache.hits > lastStatus.hits) {
          console.log(`🎯 New cache hits: +${cache.hits - lastStatus.hits}`);
        }
        
        console.groupEnd();
        lastStatus = cache;
      }
    } catch (error) {
      console.error('Failed to fetch cache status:', error);
    }
  }
  
  // 初回実行
  checkCacheStatus();
  
  // 定期的に監視（5秒ごと）
  const interval = setInterval(checkCacheStatus, 5000);
  
  // 停止関数を提供
  window.stopCacheMonitor = () => {
    clearInterval(interval);
    console.log('Cache monitor stopped');
  };
  
  console.log('Cache monitor started. Run window.stopCacheMonitor() to stop.');
})();