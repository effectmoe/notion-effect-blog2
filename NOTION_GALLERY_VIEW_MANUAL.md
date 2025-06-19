# Notionギャラリービュー完全マニュアル

## 目次
1. [概要](#概要)
2. [HTML/DOM構造の詳細](#htmldom構造の詳細)
3. [スタイリングの仕組み](#スタイリングの仕組み)
4. [構造の限界と制約](#構造の限界と制約)
5. [カスタマイズ方法](#カスタマイズ方法)
6. [トラブルシューティング](#トラブルシューティング)
7. [実装例とコード](#実装例とコード)
8. [ベストプラクティス](#ベストプラクティス)

## 概要

NotionのギャラリービューをNext.js/react-notion-xで表示する際の完全ガイドです。このマニュアルでは、都道府県リストのカスタマイズ事例を通じて、ギャラリービューの構造と制限、そして効果的なカスタマイズ方法を解説します。

## HTML/DOM構造の詳細

### 基本構造

```html
<article class="notion-page-content-inner">
  <h3 class="notion-h notion-h2">公認インストラクターを探す</h3>
  <div class="notion-text">お近くの地域のインストラクターをご紹介します。</div>
  
  <div class="notion-collection notion-block-[id]">
    <details class="notion-collection-group">
      <summary>▼ 北海道</summary>
      
      <div class="notion-gallery">
        <div class="notion-gallery-view">
          <div class="notion-gallery-grid notion-gallery-grid-size-medium">
            
            <!-- カード要素 -->
            <div class="notion-collection-card notion-collection-card-size-medium">
              <div class="notion-collection-card-body">
                <div class="notion-collection-card-property">
                  <span class="notion-property notion-property-title">
                    <span class="notion-page-link">
                      <span class="notion-page-title">
                        <span class="notion-page-title-text">北海道</span>
                      </span>
                    </span>
                  </span>
                </div>
              </div>
            </div>
            
            <!-- 他のカード... -->
          </div>
        </div>
      </div>
    </details>
    
    <!-- 他の地域グループ... -->
  </div>
</article>
```

### 重要な要素の説明

1. **article.notion-page-content-inner**
   - ページコンテンツ全体のコンテナ
   - セクション識別の起点として使用

2. **details.notion-collection-group**
   - 折りたたみ可能な地域グループ
   - `<summary>`要素が地域名を含む

3. **div.notion-gallery-grid**
   - カードのグリッドレイアウトコンテナ
   - `gap`プロパティで間隔を制御

4. **div.notion-collection-card**
   - 個別のカード要素
   - クリック可能な要素（role="link"属性を持つ場合あり）
   - `<a>`タグではなく、JavaScriptでクリックイベントを処理

## スタイリングの仕組み

### CSSの優先順位問題

Notionのスタイルは以下の優先順位で適用されます：

1. インラインスタイル（最優先）
2. !important付きのスタイルシート
3. 通常のスタイルシート
4. デフォルトのNotionスタイル

### 効果的なスタイル適用方法

```javascript
// 1. setPropertyメソッドを使用（最も確実）
element.style.setProperty('property-name', 'value', 'important');

// 2. スタイルシートとインラインスタイルの併用
const styleSheet = document.createElement('style');
styleSheet.textContent = `
  .notion-gallery-grid {
    gap: 8px !important;
  }
`;
document.head.appendChild(styleSheet);

// 3. 要素とその子要素への再帰的適用
card.querySelectorAll('*').forEach(el => {
  el.style.setProperty('font-family', 'Gothic-Font', 'important');
});
```

## 構造の限界と制約

### 1. 動的レンダリング
- Notionコンテンツは非同期で読み込まれる
- DOMの変更を監視する必要がある
- タイミングによってスタイルが適用されない場合がある

### 2. クラス名の不安定性
- Notionのクラス名は変更される可能性がある
- バージョンアップで構造が変わる可能性
- 複数のセレクタを用意して冗長性を持たせる

### 3. スタイルの上書き制限
- 一部のスタイルは!importantでも上書きできない
- React/Next.jsの再レンダリングでスタイルがリセットされる場合がある

### 4. イベントハンドラの制限
- カード要素は`<a>`タグではないため、通常のリンク動作をしない
- クリックイベントを手動で設定する必要がある

## カスタマイズ方法

### 基本的なカスタマイズ手順

1. **ターゲット要素の特定**
```javascript
// 見出しから対象セクションを特定
const heading = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'))
  .find(h => h.textContent.includes('公認インストラクター'));

// 親要素を取得
const article = heading?.closest('article');
```

2. **スタイルの適用**
```javascript
function applyStyles() {
  // グリッド間隔
  document.querySelectorAll('.notion-gallery-grid').forEach(grid => {
    grid.style.setProperty('gap', '8px', 'important');
  });

  // フォント変更
  document.querySelectorAll('.notion-collection-card').forEach(card => {
    card.style.setProperty('font-family', 'Gothic-Font', 'important');
  });
}
```

3. **動的更新への対応**
```javascript
// MutationObserverで監視
const observer = new MutationObserver(() => {
  applyStyles();
});

observer.observe(document.body, {
  childList: true,
  subtree: true
});
```

### 高度なカスタマイズ

#### 条件付きスタイリング
```javascript
// 特定の地域のみスタイルを変更
summaries.forEach(summary => {
  const text = summary.textContent || '';
  if (text.includes('北海道')) {
    summary.style.backgroundColor = '#e3f2fd';
  }
});
```

#### レスポンシブ対応
```css
@media (max-width: 768px) {
  .notion-gallery-grid {
    grid-template-columns: repeat(2, 1fr) !important;
    gap: 4px !important;
  }
}
```

## トラブルシューティング

### 問題1: スタイルが適用されない

**症状**: CSSを設定してもデザインが変わらない

**原因と対策**:
1. **タイミングの問題**
   ```javascript
   // 複数のタイミングで実行
   setTimeout(applyStyles, 1000);
   setTimeout(applyStyles, 2000);
   setTimeout(applyStyles, 3000);
   ```

2. **セレクタの問題**
   ```javascript
   // 複数のセレクタパターンを試す
   const selectors = [
     '.notion-collection-card',
     '[class*="notion-collection-card"]',
     'div[role="link"]'
   ];
   ```

3. **優先順位の問題**
   ```javascript
   // !importantとsetPropertyを併用
   element.style.setProperty('property', 'value', 'important');
   ```

### 問題2: レイアウトが崩れる

**症状**: カスタマイズ後にレイアウトが崩れる

**対策**:
```javascript
// 親要素のスタイルも確認
const parent = element.parentElement;
const computedStyle = getComputedStyle(parent);
console.log('Parent display:', computedStyle.display);
console.log('Parent grid-template:', computedStyle.gridTemplateColumns);
```

### 問題3: クリックが効かない

**症状**: カスタマイズ後にカードがクリックできない

**対策**:
```javascript
// pointer-eventsを確認
element.style.pointerEvents = 'auto';

// z-indexを調整
element.style.position = 'relative';
element.style.zIndex = '1';
```

## 実装例とコード

### 完全な実装例

```javascript
(function() {
  'use strict';

  // スタイルシートを追加
  const styleSheet = document.createElement('style');
  styleSheet.textContent = `
    /* グリッドのカスタマイズ */
    .notion-gallery-grid {
      gap: 8px !important;
      row-gap: 8px !important;
    }
    
    /* カードのカスタマイズ */
    .notion-collection-card,
    .notion-collection-card * {
      font-family: "Hiragino Kaku Gothic ProN", sans-serif !important;
    }
    
    /* ホバー効果 */
    .notion-collection-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
      transition: all 0.2s ease;
    }
  `;
  document.head.appendChild(styleSheet);

  function applyStyles() {
    // 1. グリッド間隔
    document.querySelectorAll('.notion-gallery-grid').forEach(grid => {
      grid.style.setProperty('gap', '8px', 'important');
    });

    // 2. フォント変更
    document.querySelectorAll('.notion-collection-card').forEach(card => {
      card.style.setProperty('font-family', '"Hiragino Kaku Gothic ProN"', 'important');
      
      // 子要素にも適用
      card.querySelectorAll('*').forEach(el => {
        el.style.setProperty('font-family', 'inherit', 'important');
      });
    });

    // 3. 地域タイトルのカスタマイズ
    document.querySelectorAll('details > summary').forEach(summary => {
      const regions = ['北海道', '東北', '関東', '中部', '近畿', '中国', '四国', '九州'];
      if (regions.some(region => summary.textContent.includes(region))) {
        summary.style.setProperty('font-size', '1.5em', 'important');
        summary.style.setProperty('font-weight', 'bold', 'important');
        summary.style.setProperty('padding', '16px 0', 'important');
      }
    });

    console.log('[Gallery Customizer] Styles applied');
  }

  // 初期実行
  applyStyles();

  // 遅延実行
  [1000, 2000, 3000].forEach(delay => {
    setTimeout(applyStyles, delay);
  });

  // 動的変更の監視
  const observer = new MutationObserver(applyStyles);
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });

})();
```

## ベストプラクティス

### 1. パフォーマンスの最適化

```javascript
// デバウンス処理でパフォーマンスを改善
let debounceTimer;
const observer = new MutationObserver(() => {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(applyStyles, 100);
});
```

### 2. エラーハンドリング

```javascript
function safeApplyStyles() {
  try {
    applyStyles();
  } catch (error) {
    console.error('[Gallery Customizer] Error:', error);
  }
}
```

### 3. 開発時のデバッグ

```javascript
// デバッグモード
const DEBUG = true;

function log(...args) {
  if (DEBUG) {
    console.log('[Gallery Customizer]', ...args);
  }
}
```

### 4. 将来の変更に備える

```javascript
// 複数のセレクタパターンをサポート
const SELECTORS = {
  grid: ['.notion-gallery-grid', '[class*="gallery-grid"]'],
  card: ['.notion-collection-card', '[class*="collection-card"]'],
  summary: ['details > summary', '.notion-collection-group > summary']
};

function findElements(selectorArray) {
  for (const selector of selectorArray) {
    const elements = document.querySelectorAll(selector);
    if (elements.length > 0) return elements;
  }
  return [];
}
```

### 5. ドキュメント化

```javascript
/**
 * ギャラリービューのカスタマイズ
 * @param {Object} options - カスタマイズオプション
 * @param {string} options.gap - グリッドの間隔
 * @param {string} options.fontFamily - フォントファミリー
 * @param {number} options.regionFontSize - 地域名のフォントサイズ倍率
 */
function customizeGallery(options = {}) {
  const defaults = {
    gap: '8px',
    fontFamily: '"Hiragino Kaku Gothic ProN"',
    regionFontSize: 1.5
  };
  
  const config = { ...defaults, ...options };
  // 実装...
}
```

## まとめ

Notionギャラリービューのカスタマイズは、以下の点を理解することが重要です：

1. **DOM構造の理解** - 正確なセレクタの使用
2. **タイミング制御** - 非同期レンダリングへの対応
3. **スタイル優先順位** - !importantとsetPropertyの活用
4. **動的監視** - MutationObserverによる変更検知
5. **エラー処理** - 予期しない変更への対応

これらの知識を活用することで、Notionコンテンツを効果的にカスタマイズできます。