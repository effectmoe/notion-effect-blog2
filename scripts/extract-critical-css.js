const { PurgeCSS } = require('purgecss');
const fs = require('fs').promises;
const path = require('path');
const { minify } = require('csso');

// Critical CSSの抽出設定
const CRITICAL_SELECTORS = [
  // レイアウト関連
  'html', 'body', 'main', 'header', 'nav',
  '#__next',
  
  // Notionの基本要素
  '.notion', '.notion-page', '.notion-viewport',
  '.notion-frame', '.notion-scroller',
  '.notion-page-content', '.notion-page-content-inner',
  '.notion-page-cover', '.notion-page-icon',
  '.notion-title', '.notion-h1', '.notion-h2', '.notion-h3',
  '.notion-text', '.notion-blank',
  
  // ヘッダー・ナビゲーション
  'header', 'nav', '.header', '.navigation',
  '.menu', '.menu-item',
  
  // フォント関連
  '@font-face',
  '[class*="font-"]',
  
  // 初期表示に必要なユーティリティ
  '.container', '.wrapper',
  '[class*="flex"]', '[class*="grid"]',
  '[class*="block"]', '[class*="inline"]',
  '[class*="hidden"]', '[class*="visible"]',
  
  // ダークモード
  '.dark', '[data-theme="dark"]',
  
  // アニメーション無効化（初期表示時）
  '.no-transitions *'
];

async function extractCriticalCSS() {
  try {
    console.log('🎨 Extracting critical CSS...');
    
    // CSSファイルを読み込む
    const cssDir = path.join(process.cwd(), '.next/static/css');
    const cssFiles = await fs.readdir(cssDir);
    
    let allCSS = '';
    for (const file of cssFiles) {
      if (file.endsWith('.css')) {
        const content = await fs.readFile(path.join(cssDir, file), 'utf8');
        allCSS += content + '\n';
      }
    }
    
    // スタイルディレクトリのCSSも含める
    const stylesDir = path.join(process.cwd(), 'styles');
    const styleFiles = await fs.readdir(stylesDir);
    
    for (const file of styleFiles) {
      if (file.endsWith('.css')) {
        const content = await fs.readFile(path.join(stylesDir, file), 'utf8');
        allCSS += content + '\n';
      }
    }
    
    // Critical CSSを抽出
    const criticalCSS = extractCriticalRules(allCSS);
    
    // 最小化
    const minified = minify(criticalCSS).css;
    
    // ファイルに保存
    const outputPath = path.join(process.cwd(), 'public/critical.css');
    await fs.writeFile(outputPath, minified);
    
    // インライン用のJSファイルも生成
    const inlineScript = `
      // Critical CSS Inline Script
      (function() {
        var style = document.createElement('style');
        style.textContent = ${JSON.stringify(minified)};
        style.id = 'critical-css';
        document.head.insertBefore(style, document.head.firstChild);
        
        // 残りのCSSを非同期で読み込む
        var links = document.querySelectorAll('link[rel="stylesheet"]');
        links.forEach(function(link) {
          link.media = 'print';
          link.onload = function() { this.media = 'all'; };
        });
      })();
    `;
    
    await fs.writeFile(
      path.join(process.cwd(), 'public/critical-css-inline.js'),
      inlineScript
    );
    
    console.log(`✅ Critical CSS extracted: ${(minified.length / 1024).toFixed(2)}KB`);
    
    // 統計情報
    console.log('📊 CSS Statistics:');
    console.log(`  - Original CSS: ${(allCSS.length / 1024).toFixed(2)}KB`);
    console.log(`  - Critical CSS: ${(minified.length / 1024).toFixed(2)}KB`);
    console.log(`  - Reduction: ${((1 - minified.length / allCSS.length) * 100).toFixed(1)}%`);
    
  } catch (error) {
    console.error('❌ Error extracting critical CSS:', error);
    process.exit(1);
  }
}

function extractCriticalRules(css) {
  const lines = css.split('\n');
  const criticalRules = [];
  let inRule = false;
  let currentRule = '';
  let braceCount = 0;
  
  for (const line of lines) {
    // ルールの開始を検出
    if (!inRule && shouldIncludeRule(line)) {
      inRule = true;
      currentRule = line;
      braceCount = (line.match(/{/g) || []).length - (line.match(/}/g) || []).length;
    } else if (inRule) {
      currentRule += '\n' + line;
      braceCount += (line.match(/{/g) || []).length - (line.match(/}/g) || []).length;
      
      // ルールの終了を検出
      if (braceCount === 0) {
        criticalRules.push(currentRule);
        inRule = false;
        currentRule = '';
      }
    }
  }
  
  return criticalRules.join('\n');
}

function shouldIncludeRule(line) {
  const trimmed = line.trim();
  
  // 空行やコメントはスキップ
  if (!trimmed || trimmed.startsWith('/*')) return false;
  
  // Critical selectorsに含まれるかチェック
  return CRITICAL_SELECTORS.some(selector => {
    if (selector.startsWith('@')) {
      // @ルール（@font-faceなど）
      return trimmed.startsWith(selector);
    } else if (selector.includes('*')) {
      // ワイルドカードセレクタ
      const regex = new RegExp(selector.replace('*', '.*'));
      return regex.test(trimmed);
    } else {
      // 通常のセレクタ
      return trimmed.includes(selector);
    }
  });
}

// スクリプトとして実行された場合
if (require.main === module) {
  extractCriticalCSS();
}

module.exports = { extractCriticalCSS };