// サイドバーのコレクションにスタイルを適用 - 無効化
(function() {
  console.log('サイドバースタイルスクリプトを無効化しました');
  
  // 既に適用されたスタイルをクリア
  function clearAllStyles() {
    const allElements = document.querySelectorAll('*');
    allElements.forEach(el => {
      if (el.style) {
        el.style.border = '';
        el.style.borderRadius = '';
        el.style.padding = '';
        el.style.backgroundColor = '';
        el.style.margin = '';
        el.style.boxShadow = '';
      }
    });
    console.log('すべてのインラインスタイルをクリアしました');
  }
  
  // 実行
  clearAllStyles();
})();