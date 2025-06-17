// Collection view エラーを抑制
(function() {
  // console.errorをオーバーライド
  const originalError = console.error;
  const originalWarn = console.warn;
  const originalLog = console.log;
  
  console.error = function() {
    const args = Array.from(arguments);
    const message = args[0]?.toString() || '';
    
    // "skipping missing collection view"エラーを無視
    if (message.includes('skipping missing collection view')) {
      return;
    }
    
    originalError.apply(console, args);
  };
  
  console.warn = function() {
    const args = Array.from(arguments);
    const message = args[0]?.toString() || '';
    
    // collection関連の警告を無視
    if (message.includes('skipping missing collection view') ||
        message.includes('collection view')) {
      return;
    }
    
    originalWarn.apply(console, args);
  };
  
  console.log = function() {
    const args = Array.from(arguments);
    const message = args[0]?.toString() || '';
    
    // collection関連のログを無視
    if (message.includes('skipping missing collection view')) {
      return;
    }
    
    originalLog.apply(console, args);
  };
})();