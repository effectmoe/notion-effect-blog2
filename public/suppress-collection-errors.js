// Collection view エラーをログレベルで抑制
(function() {
  // console.errorをオーバーライド - 特定のメッセージのみ
  const originalError = console.error;
  
  console.error = function() {
    const args = Array.from(arguments);
    const message = args[0]?.toString() || '';
    
    // "skipping missing collection view"エラーのみを無視
    // 他のエラーは表示する
    if (message.includes('skipping missing collection view')) {
      // エラーをwarningレベルに下げる
      console.warn('Collection view not available for this block');
      return;
    }
    
    originalError.apply(console, args);
  };
})();