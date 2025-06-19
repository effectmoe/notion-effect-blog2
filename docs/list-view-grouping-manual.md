# Notion リストビューグループ化完全マニュアル

## 概要

このマニュアルは、react-notion-xを使用したNext.jsアプリケーションでNotionデータベースのリストビューをグループ化表示する方法について説明します。react-notion-xはデフォルトではグループ化されたリストビューをサポートしていないため、カスタム実装が必要です。

## 1. 基本構造と仕組み

### 1.1 データ構造

グループ化されたリストビューを実装するには、以下の3つの主要なデータ構造が必要です：

```typescript
// 1. collection_view内のformat.collection_group_by
{
  format: {
    collection_group_by: 'property_id', // グループ化に使用するプロパティID
    collection_groups: [
      {
        property: 'property_id',
        hidden: false,
        value: {
          type: 'select', // または 'multi_select'
          value: 'グループ名'
        }
      }
    ]
  }
}

// 2. collection_view内のquery2.group_by
{
  query2: {
    group_by: {
      property: 'property_id',
      type: 'select', // または 'multi_select'
      value: {
        type: 'select',
        value: 'property_name'
      }
    }
  }
}

// 3. collection_query内のグループ別results
{
  'results:select:グループ名': {
    type: 'results',
    blockIds: ['block-id-1', 'block-id-2'],
    total: 2
  }
}
```

### 1.2 プロパティIDの特殊性

Notionのプロパティは内部的に暗号化されたIDを使用します：
- `oa:|` - カテゴリプロパティの例
- `xaH>` - Tagsプロパティの例
- `title` - タイトルは常に'title'

## 2. 実装手順

### 2.1 新規データベースのグループ化設定

#### Step 1: データベース情報の特定

```javascript
// ブラウザコンソールで実行
// 1. データベースのブロックIDを特定
const dbBlock = document.querySelector('.notion-collection-view')
console.log('Block ID:', dbBlock?.className.match(/notion-block-(\w+)/)?.[1])

// 2. コレクションIDを特定
const collectionId = Object.entries(window.recordMap.block)
  .find(([id, data]) => data.value?.type === 'collection_view')?.[1]?.value?.collection_id
console.log('Collection ID:', collectionId)

// 3. ビューIDを特定
const viewId = Object.keys(window.recordMap.collection_view || {})[0]
console.log('View ID:', viewId)

// 4. プロパティIDの確認
const props = Object.values(window.recordMap.block)
  .find(b => b.value?.parent_id === collectionId)?.value?.properties
console.log('Properties:', Object.keys(props || {}))
```

#### Step 2: notion-enhanced-fetch.tsの設定

`/lib/notion-enhanced-fetch.ts`に新しいデータベースを追加：

```typescript
const groupedDatabases = [
  // 既存のデータベース...
  {
    blockId: '新しいブロックID',
    collectionId: '新しいコレクションID',
    name: 'データベース名',
    groupByProperty: 'プロパティID', // 例: 'abc|'
    groupByType: 'select' // または 'multi_select'
  }
]
```

#### Step 3: グループの定義

同じファイル内で、実際のグループ値を定義：

```typescript
if (groupedDb.name === '新しいデータベース名') {
  (view as any).format.collection_groups = [
    { property: 'プロパティID', hidden: false, value: { type: 'select', value: 'グループ1' }},
    { property: 'プロパティID', hidden: false, value: { type: 'select', value: 'グループ2' }},
    // 他のグループ...
  ]
}
```

#### Step 4: notion.tsでのcollection_query生成

`/lib/notion.ts`にcollection_queryデータの生成を追加：

```typescript
// 新しいデータベースの処理
const newDbViewId = 'ビューID'
const newDbCollectionId = 'コレクションID'

if (recordMap.collection_view[newDbViewId]) {
  if (!recordMap.collection_query) recordMap.collection_query = {}
  if (!recordMap.collection_query[newDbCollectionId]) recordMap.collection_query[newDbCollectionId] = {}
  
  recordMap.collection_query[newDbCollectionId][newDbViewId] = {
    'results:select:グループ1': {
      type: 'results',
      blockIds: [],
      total: 0
    },
    // 他のグループ...
  }
  
  // アイテムの振り分け
  Object.entries(recordMap.block).forEach(([blockId, blockData]) => {
    const block = blockData?.value
    if ((block as any)?.parent_id === newDbCollectionId && (block as any)?.parent_table === 'collection') {
      const propValue = (block as any)?.properties?.['プロパティID']?.[0]?.[0] || 'uncategorized'
      const groupKey = `results:select:${propValue}`
      
      if (recordMap.collection_query[newDbCollectionId][newDbViewId][groupKey]) {
        recordMap.collection_query[newDbCollectionId][newDbViewId][groupKey].blockIds.push(blockId)
        recordMap.collection_query[newDbCollectionId][newDbViewId][groupKey].total++
      }
    }
  })
}
```

### 2.2 multi_selectプロパティの場合の特殊処理

multi_selectプロパティ（タグなど）の場合は、データ構造が異なります：

```typescript
// プロパティ値の取得
const tags = (block as any)?.properties?.['xaH>'] // Tagsプロパティの例
let tagValue = 'uncategorized'

if (tags && tags[0] && tags[0][0]) {
  tagValue = tags[0][0]
}

// グループキーの生成
const groupKey = `results:multi_select:${tagValue}`
```

## 3. トラブルシューティング

### 3.1 グループが表示されない

**原因と対処法：**

1. **ブロックIDが間違っている**
   ```javascript
   // 正しいIDを確認
   console.log('All block IDs:', Object.keys(window.recordMap.block))
   ```

2. **collection_viewデータが不足**
   ```javascript
   // format.collection_group_byが設定されているか確認
   const view = window.recordMap.collection_view['view-id']?.value
   console.log('Group by:', view?.format?.collection_group_by)
   ```

3. **collection_queryデータが不足**
   ```javascript
   // collection_queryの存在確認
   console.log('Collection query:', window.recordMap.collection_query)
   ```

### 3.2 グループは表示されるがアイテムが表示されない

**原因と対処法：**

1. **プロパティIDが間違っている**
   ```javascript
   // 実際のプロパティIDを確認
   const item = Object.values(window.recordMap.block)
     .find(b => b.value?.parent_id === 'collection-id')
   console.log('Properties:', Object.keys(item?.value?.properties || {}))
   ```

2. **プロパティ値の取得方法が間違っている**
   - selectプロパティ: `properties['prop-id'][0][0]`
   - multi_selectプロパティ: `properties['prop-id'][0][0]`（最初のタグ）
   - 完全な値を取得する場合は配列全体を確認

3. **グループ名が実際の値と一致していない**
   ```javascript
   // 実際の値を確認
   const values = new Set()
   Object.values(window.recordMap.block).forEach(b => {
     if (b.value?.parent_id === 'collection-id') {
       const val = b.value.properties?.['prop-id']?.[0]?.[0]
       if (val) values.add(val)
     }
   })
   console.log('Unique values:', Array.from(values))
   ```

### 3.3 パフォーマンスの問題

大量のアイテムがある場合：

1. **collection_queryデータを事前に生成**
2. **必要なグループのみ表示**
3. **遅延読み込みの実装を検討**

## 4. デバッグ用スクリプト

### 4.1 グループ化診断スクリプト

```javascript
// グループ化の状態を診断
function diagnoseGrouping(collectionId) {
  const blocks = Object.entries(window.recordMap.block)
    .filter(([id, data]) => data.value?.parent_id === collectionId)
  
  console.log(`Total items: ${blocks.length}`)
  
  // プロパティの分析
  const propAnalysis = {}
  blocks.forEach(([id, data]) => {
    Object.entries(data.value.properties || {}).forEach(([propId, propData]) => {
      if (!propAnalysis[propId]) {
        propAnalysis[propId] = {
          id: propId,
          values: new Set(),
          count: 0
        }
      }
      propAnalysis[propId].count++
      if (propData[0] && propData[0][0]) {
        propAnalysis[propId].values.add(propData[0][0])
      }
    })
  })
  
  console.log('Property analysis:', propAnalysis)
  
  // グループ化候補のプロパティ
  Object.entries(propAnalysis).forEach(([propId, data]) => {
    if (data.values.size > 1 && data.values.size < blocks.length / 2) {
      console.log(`Good grouping candidate: ${propId} with ${data.values.size} unique values`)
    }
  })
}

// 使用例
diagnoseGrouping('216b802c-b0c6-81c0-a940-000b2f6a23b3')
```

### 4.2 collection_query検証スクリプト

```javascript
// collection_queryの整合性を確認
function validateCollectionQuery(collectionId, viewId) {
  const query = window.recordMap.collection_query?.[collectionId]?.[viewId]
  if (!query) {
    console.error('No collection_query found')
    return
  }
  
  let totalInGroups = 0
  Object.entries(query).forEach(([key, data]) => {
    if (key.startsWith('results:')) {
      console.log(`${key}: ${data.blockIds?.length || 0} items`)
      totalInGroups += data.blockIds?.length || 0
    }
  })
  
  const actualTotal = Object.values(window.recordMap.block)
    .filter(b => b.value?.parent_id === collectionId).length
  
  console.log(`Total in groups: ${totalInGroups}`)
  console.log(`Actual total: ${actualTotal}`)
  console.log(`Match: ${totalInGroups === actualTotal ? 'YES' : 'NO'}`)
}
```

## 5. 注意事項

### 5.1 制限事項

1. **react-notion-xの制限**
   - グループ化はboard/kanbanビューでのみ公式サポート
   - リストビューのグループ化は非公式実装

2. **パフォーマンス**
   - 大量のアイテムがある場合、初回読み込みが遅い
   - グループ数が多いと描画が重くなる

3. **メンテナンス**
   - Notionの仕様変更により動作しなくなる可能性
   - プロパティIDは変更される可能性がある

### 5.2 ベストプラクティス

1. **プロパティIDの管理**
   - 環境変数や設定ファイルで管理
   - 定期的に確認と更新

2. **エラーハンドリング**
   - collection_queryが存在しない場合のフォールバック
   - プロパティが見つからない場合の処理

3. **キャッシュ戦略**
   - グループ化データは頻繁に変更されないため積極的にキャッシュ
   - 必要に応じて手動でキャッシュクリア

## 6. 今回の修正の詳細

### 6.1 問題の経緯

1. **初期状態**: FAQマスターとカフェキネシコンテンツ２のグループ化が表示されない
2. **原因**: 
   - 間違ったブロックIDを使用
   - collection_queryデータが生成されていない
   - プロパティIDの誤り

### 6.2 修正内容

1. **ブロックIDの修正**
   - FAQマスター: `215b802c-b0c6-804a-8858-d72d4df6f128`
   - カフェキネシコンテンツ２: `216b802c-b0c6-808f-ac1d-dbf03d973fec`

2. **プロパティIDの特定**
   - FAQマスター: `oa:|`（カテゴリ）
   - カフェキネシコンテンツ２: `xaH>`（Tags）

3. **実際のグループ値への更新**
   - 静的に定義していたグループを実際のデータに合わせて修正

### 6.3 最終的な実装

3つのファイルで協調して動作：
1. `notion-enhanced-fetch.ts`: グループ化設定の追加
2. `notion.ts`: collection_queryデータの生成
3. `hybrid-collection-handler.ts`: 公式APIとの連携（オプション）

これにより、グループ化されたリストビューが正しく表示されるようになりました。