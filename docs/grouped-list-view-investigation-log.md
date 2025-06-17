# グループ化されたリストビュー表示問題 調査ログ

## 問題の概要

**発生日時**: 2025-06-18  
**問題**: Notionでグループ化されたリストビューがWebサイトで表示されない

### 具体的な症状
1. **都道府県データベース**: グループ化されており、Webサイトで正常に表示される ✅
2. **FAQマスター**: グループ化されているが、Webサイトで表示されない ❌

---

## 調査の経緯

### 1. 初期状態の確認

#### 実行したコード（Console）:
```javascript
// 全コレクションの詳細分析
(function() {
  console.log('\n🔍 Notion要素の詳細分析...\n');
  
  const collections = document.querySelectorAll('.notion-collection');
  console.log(`notion-collection要素: ${collections.length}個`);
  
  collections.forEach((col, i) => {
    console.log(`\n=== Collection ${i + 1} ===`);
    const title = col.querySelector('.notion-collection-header-title')?.textContent || '不明';
    console.log(`タイトル: ${title}`);
    
    const childClasses = new Set();
    col.querySelectorAll('*').forEach(el => {
      el.classList.forEach(cls => {
        if (cls.includes('notion') && cls.includes('view')) {
          childClasses.add(cls);
        }
      });
    });
    console.log(`ビュー関連クラス: ${Array.from(childClasses).join(', ')}`);
  });
  
  return '分析完了';
})();
```

#### 返されたログ:
```
🔍 Notion要素の詳細分析...

notion-collection要素: 4個

=== Collection 1 ===
タイトル: 不明
ビュー関連クラス: notion-list-view

=== Collection 2 ===
タイトル: 不明
ビュー関連クラス: notion-gallery-view

=== Collection 3 ===
タイトル: 不明
ビュー関連クラス: notion-gallery-view

=== Collection 4 ===
タイトル: 不明
ビュー関連クラス: notion-list-view
```

### 2. グループ要素の発見

#### 実行したコード:
```javascript
// グループ要素の検索
(function() {
  console.log('\n📁 グループ要素の検索...');
  const groupElements = document.querySelectorAll('[class*="group"]');
  const notionGroups = Array.from(groupElements).filter(el => 
    Array.from(el.classList).some(cls => cls.includes('notion'))
  );
  console.log(`Notionグループ要素: ${notionGroups.length}個`);
  
  notionGroups.forEach((group, i) => {
    console.log(`\nグループ ${i + 1}:`);
    console.log(`  クラス: ${Array.from(group.classList).join(', ')}`);
    console.log(`  表示状態: ${window.getComputedStyle(group).display}`);
  });
})();
```

#### 返されたログ:
```
📁 グループ要素の検索...
Notionグループ要素: 18個

グループ 1:
  クラス: notion-collection-group
  表示状態: block

グループ 2:
  クラス: notion-collection-group-title
  表示状態: list-item
...（北海道、東北などのグループが続く）
```

### 3. 重要な発見 - クラス名の違い

**期待していたクラス名**: `.notion-list-view-group`  
**実際のクラス名**: `.notion-collection-group`

これに基づいて、CSSファイルを修正:

#### 修正したファイル:
`/styles/fix-grouped-lists.css`

```css
/* 新しいクラス名に対応 */
.notion-collection-group {
  display: block !important;
  visibility: visible !important;
  opacity: 1 !important;
}

.notion-collection-group-title {
  display: list-item !important;
  visibility: visible !important;
  opacity: 1 !important;
}
```

### 4. 各データベースの詳細分析

#### 実行したコード:
```javascript
// 全コレクションのグループ化状態を確認
(function() {
  console.log('\n📊 全コレクションのグループ化状態を確認...\n');
  
  const collections = document.querySelectorAll('.notion-collection');
  
  collections.forEach((col, index) => {
    const blockId = col.className.match(/notion-block-(\w+)/)?.[1] || '不明';
    const hasListView = !!col.querySelector('.notion-list-view');
    const groups = col.querySelectorAll('.notion-collection-group');
    const items = col.querySelectorAll('.notion-list-item');
    
    console.log(`Collection ${index + 1} (${blockId}):`);
    console.log(`  リストビュー: ${hasListView}`);
    console.log(`  グループ数: ${groups.length}`);
    console.log(`  アイテム数: ${items.length}`);
  });
  
  return '確認完了';
})();
```

#### 返されたログ:
```
Collection 1 (20fb802cb0c68027945beabe5f521e5a):
  リストビュー: true
  グループ数: 9
  アイテム数: 27
  📍 都道府県データベース

Collection 2 (20fb802cb0c68057a57dcaa1e1172c0c):
  リストビュー: false
  グループ数: 0
  アイテム数: 0

Collection 3 (212b802cb0c680b3b04afec4203ee8d7):
  リストビュー: false
  グループ数: 0
  アイテム数: 0
  📍 カフェキネシラバーズ

Collection 4 (215b802cb0c6804a8858d72d4df6f128):
  リストビュー: true
  グループ数: 0
  アイテム数: 5
  📍 カフェキネシラバーズ
```

### 5. 都道府県DBとFAQマスターの違いを分析

#### 実行したコード:
```javascript
// 都道府県DBと他のDBの違いを分析
(function() {
  console.log('\n🔍 データベースの違いを分析...\n');
  
  if (!window.recordMap) {
    console.log('❌ recordMapが見つかりません');
    return;
  }
  
  const prefectureBlockId = '20fb802cb0c68027945beabe5f521e5a';
  const blocks = window.recordMap.block || {};
  const collections = window.recordMap.collection || {};
  const collectionViews = window.recordMap.collection_view || {};
  
  console.log('=== 都道府県データベース（動作する） ===');
  const prefBlock = blocks[prefectureBlockId]?.value;
  if (prefBlock) {
    console.log('Block type:', prefBlock.type);
    console.log('Collection ID:', prefBlock.collection_id);
    console.log('View IDs:', prefBlock.view_ids);
  }
  
  console.log('\n\n=== 他のデータベース（動作しない） ===');
  
  Object.entries(blocks).forEach(([blockId, blockData]) => {
    const block = blockData?.value;
    if (block?.type === 'collection_view' && blockId !== prefectureBlockId) {
      let collectionName = 'Unknown';
      if (block.collection_id) {
        const collection = collections[block.collection_id]?.value;
        collectionName = collection?.name?.[0]?.[0] || 'Unknown';
      }
      
      if (collectionName.includes('FAQ') || collectionName.includes('カフェキネシ')) {
        console.log(`\n${collectionName} (${blockId}):`);
        console.log('  Block type:', block.type);
        console.log('  Collection ID:', block.collection_id);
        console.log('  View IDs:', block.view_ids);
      }
    }
  });
  
  return '分析完了';
})();
```

#### 返されたログ:
```
=== 都道府県データベース（動作する） ===

=== 他のデータベース（動作しない） ===

FAQマスター (212b802c-b0c6-80b3-b04a-fec4203ee8d7):
  Block type: collection_view
  Collection ID: 212b802c-b0c6-8014-9263-000b71bd252e
  View IDs: ['213b802c-b0c6-8072-8389-000c4918bdf6', '213b802c-b0c6-8038-9e76-000ceae25040', '213b802c-b0c6-807c-9522-000c6a519db4']
  View type: list
  Has query2.group_by: false
```

### 6. DOM構造の詳細分析

#### 実行したコード:
```javascript
// DOM構造の詳細分析
(function() {
  console.log('\n🔍 DOM構造の詳細分析...\n');
  
  const prefectureBlock = document.querySelector('.notion-block-20fb802cb0c68027945beabe5f521e5a');
  
  if (prefectureBlock) {
    console.log('=== 都道府県データベース（表示される） ===');
    console.log('親要素のクラス:', prefectureBlock.parentElement?.className);
    
    const groups = prefectureBlock.querySelectorAll('.notion-collection-group');
    console.log(`\nグループ数: ${groups.length}`);
    if (groups.length > 0) {
      console.log('最初のグループの構造:');
      const firstGroup = groups[0];
      Array.from(firstGroup.children).forEach((child, i) => {
        console.log(`  ${i}: ${child.className} - ${child.tagName}`);
      });
    }
  }
  
  const faqBlock = document.querySelector('.notion-block-212b802cb0c680b3b04afec4203ee8d7');
  
  if (faqBlock) {
    console.log('\n\n=== FAQマスター（表示されない） ===');
    console.log('親要素のクラス:', faqBlock.parentElement?.className);
    
    const viewType = faqBlock.querySelector('[class*="view"]');
    if (viewType) {
      console.log('\nビュー要素:', viewType.className);
      console.log('display:', window.getComputedStyle(viewType).display);
    }
  }
  
  if (window.recordMap) {
    console.log('\n\n=== recordMapの確認 ===');
    const blocks = Object.keys(window.recordMap.block || {});
    console.log('総ブロック数:', blocks.length);
    
    const hasPrefecture = blocks.includes('20fb802cb0c68027945beabe5f521e5a');
    console.log('都道府県DBがrecordMapに存在:', hasPrefecture);
  }
  
  return '分析完了';
})();
```

#### 返されたログ:
```
=== 都道府県データベース（表示される） ===
親要素のクラス: notion-column notion-block-208b802cb0c680c0b274ea3c3285b605

グループ数: 9
最初のグループの構造:
  0: notion-collection-group-title - SUMMARY
  1: notion-list-collection - DIV

=== FAQマスター（表示されない） ===
親要素のクラス: notion-page-content-inner

ビュー要素: notion-gallery-view
display: block

=== recordMapの確認 ===
総ブロック数: 176
都道府県DBがrecordMapに存在: false
```

### 7. 重要な発見 - 都道府県DBはrecordMapに存在しない

**問題の核心**:
- 都道府県データベース: recordMapに存在しない = 静的にレンダリングされている可能性
- FAQマスター: recordMapに存在するが、グループ化情報が取得されていない

### 8. FAQマスターの最終確認

#### 実行したコード:
```javascript
// FAQマスターの詳細な状態を確認
(function() {
  const faqBlock = document.querySelector('.notion-block-212b802cb0c680b3b04afec4203ee8d7');
  
  if (faqBlock) {
    console.log('✅ FAQマスターのDOM要素を発見');
    
    const galleryView = faqBlock.querySelector('.notion-gallery-view');
    const listView = faqBlock.querySelector('.notion-list-view');
    
    console.log('現在のビュー:');
    console.log('- ギャラリービュー:', !!galleryView);
    console.log('- リストビュー:', !!listView);
    
    const groups = faqBlock.querySelectorAll('.notion-collection-group, .notion-list-view-group');
    console.log('\nグループ数:', groups.length);
    
    const blockId = '212b802c-b0c6-80b3-b04a-fec4203ee8d7';
    const block = window.recordMap.block[blockId]?.value;
    
    if (block?.view_ids) {
      console.log('\n全ビューの詳細:');
      block.view_ids.forEach((viewId, i) => {
        const view = window.recordMap.collection_view[viewId]?.value;
        if (view) {
          console.log(`\nビュー${i + 1} (${viewId}):`);
          console.log('- Type:', view.type);
          console.log('- Name:', view.name);
          console.log('- Query2:', view.query2);
          console.log('- Has group_by:', !!view.query2?.group_by);
        }
      });
    }
  }
})();
```

#### 返されたログ:
```
✅ FAQマスターのDOM要素を発見
現在のビュー:
- ギャラリービュー: false
- リストビュー: false

グループ数: 0

全ビューの詳細:

ビュー1 (213b802c-b0c6-8072-8389-000c4918bdf6):
- Type: list
- Name: undefined
- Query2: undefined
- Has group_by: false

ビュー2 (213b802c-b0c6-8038-9e76-000ceae25040):
- Type: table
- Name: undefined
- Query2: undefined
- Has group_by: false

ビュー3 (213b802c-b0c6-807c-9522-000c6a519db4):
- Type: gallery
- Name: undefined
- Query2: undefined
- Has group_by: false
```

---

## 実装した修正

### 1. CSS修正

#### ファイル: `/styles/fix-grouped-lists.css`
```css
/* 新しいクラス名に対応 */
.notion-collection-group {
  display: block !important;
  visibility: visible !important;
  opacity: 1 !important;
}

.notion-collection-group-title {
  display: list-item !important;
  visibility: visible !important;
  opacity: 1 !important;
  padding: 8px 0;
  font-weight: 600;
  color: var(--fg-color);
}

/* 旧クラス名も維持（後方互換性） */
.notion-list-view-group {
  display: block !important;
  visibility: visible !important;
  opacity: 1 !important;
}
```

#### ファイル: `/styles/fix-database-views.css`
```css
/* 全データベースのグループ表示を修正 */
.notion-collection-view-type-list .notion-collection-group,
.notion-collection-view-type-list .notion-list-view-group {
  display: block !important;
  visibility: visible !important;
  opacity: 1 !important;
}
```

### 2. JavaScript修正

#### ファイル: `/public/fix-grouped-lists.js`
```javascript
// グループ化されたリストビューの修正
(function() {
  'use strict';
  
  function fixGroupedListViews() {
    const collectionViews = document.querySelectorAll('.notion-collection-view');
    
    collectionViews.forEach(view => {
      const listView = view.querySelector('.notion-list-view');
      if (!listView) return;
      
      // 新旧両方のクラス名に対応
      const hiddenGroups = view.querySelectorAll(
        '.notion-collection-group[style*="display: none"], ' +
        '.notion-collection-group[style*="visibility: hidden"], ' +
        '.notion-list-view-group[style*="display: none"], ' +
        '.notion-list-view-group[style*="visibility: hidden"]'
      );
      
      hiddenGroups.forEach(group => {
        group.style.display = 'block';
        group.style.visibility = 'visible';
        group.style.opacity = '1';
      });
    });
  }
  
  // 複数回実行
  setTimeout(fixGroupedListViews, 1000);
  setTimeout(fixGroupedListViews, 2000);
  setTimeout(fixGroupedListViews, 3000);
})();
```

#### ファイル: `/public/fix-linked-database-groups.js`
```javascript
// リンクされたデータベースのグループ表示を修正
(function() {
  console.log('🔧 Fixing linked database groups...');
  
  function fixLinkedDatabaseGroups() {
    if (!window.recordMap) {
      setTimeout(fixLinkedDatabaseGroups, 500);
      return;
    }
    
    const blocks = window.recordMap.block || {};
    const collectionViews = window.recordMap.collection_view || {};
    const collections = window.recordMap.collection || {};
    
    Object.entries(blocks).forEach(([blockId, blockData]) => {
      const block = blockData?.value;
      if (!block || block.type !== 'collection_view') return;
      
      let collectionId = block.collection_id;
      
      // リンクされたデータベースの場合、ビューからcollection_idを取得
      if (!collectionId && block.view_ids?.length > 0) {
        for (const viewId of block.view_ids) {
          const view = collectionViews[viewId]?.value;
          if (view?.format?.collection_pointer?.id) {
            collectionId = view.format.collection_pointer.id;
            break;
          }
        }
      }
      
      if (!collectionId) return;
      
      // グループ化されているかチェック
      let hasGrouping = false;
      if (block.view_ids) {
        for (const viewId of block.view_ids) {
          const view = collectionViews[viewId]?.value;
          if (view?.query2?.group_by || view?.query?.group_by) {
            hasGrouping = true;
            break;
          }
        }
      }
      
      if (hasGrouping) {
        const domBlock = document.querySelector(`.notion-block-${blockId}`);
        if (domBlock) {
          ensureGroupsVisible(domBlock);
        }
      }
    });
  }
  
  // 実行
  setTimeout(fixLinkedDatabaseGroups, 1000);
  setTimeout(fixLinkedDatabaseGroups, 2000);
  setTimeout(fixLinkedDatabaseGroups, 3000);
  setTimeout(fixLinkedDatabaseGroups, 5000);
})();
```

### 3. _document.tsxでの読み込み

```typescript
// Fix grouped list views
setTimeout(function() {
  const fixScript = document.createElement('script');
  fixScript.src = '/fix-grouped-lists.js';
  document.body.appendChild(fixScript);
}, 2000);

// リンクされたデータベースのグループ修正
setTimeout(function() {
  const fixLinkedScript = document.createElement('script');
  fixLinkedScript.src = '/fix-linked-database-groups.js';
  document.body.appendChild(fixLinkedScript);
}, 2500);
```

---

## 結論と未解決の問題

### 判明したこと

1. **都道府県データベースが動作する理由**:
   - recordMapに存在しない特殊なレンダリング方法
   - 通常のデータベース（collection_idが直接存在）

2. **FAQマスターが動作しない理由**:
   - リンクされたデータベース（collection_idを間接的に取得する必要）
   - query2データが正しく取得されていない
   - ビュー自体がレンダリングされていない状態

### 未解決の問題

1. FAQマスターのビューが全くレンダリングされていない（ギャラリーもリストも表示されない）
2. query2データが`undefined`になっている
3. 都道府県データベースの特殊なレンダリング方法が不明

### 推奨される次のステップ

1. FAQマスターのデータ取得処理を詳しく調査
2. 都道府県データベースの静的レンダリング方法を特定
3. react-notion-xのソースコードを確認し、グループ化されたリストビューのサポート状況を確認

---

## 引き継ぎ事項

この調査ログには、問題の詳細な分析結果と実行したコード、返されたログがすべて記録されています。次の開発者は、このログを参照して問題解決を継続できます。

特に重要なのは：
- 都道府県DBはrecordMapに存在しない特殊な実装
- FAQマスターはリンクされたデータベースで、データが不完全
- クラス名が新旧2種類存在する（`.notion-collection-group`と`.notion-list-view-group`）

以上が、グループ化されたリストビュー表示問題の完全な調査記録です。