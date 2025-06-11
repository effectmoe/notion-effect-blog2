# データベース表示問題の調査手順

**最終更新: 2025/6/12**

## 問題の概要
最近の変更後、Notionデータベースが表示されなくなった。

## 調査結果

### 最近の変更点
1. **CustomPageLink**コンポーネントを使用するように変更
   - `WorkingPageLink`から`CustomPageLink`に戻された
   - `CustomPageLink`は`<div>`を返すため、Collectionコンポーネントとの互換性に問題がある可能性

2. **新しいコンポーネントの追加**
   - `StructuredData`コンポーネント
   - `AutoBreadcrumb`コンポーネント
   - これらがレンダリングに影響を与えている可能性

### 問題の特定方法

#### 1. ブラウザコンソールでエラーを確認
```javascript
// ブラウザのコンソールで以下を実行
console.log(window.recordMap);
console.log(window.block);

// Collectionビューがあるか確認
Object.values(window.recordMap.block).filter(b => b.value.type === 'collection_view');
```

#### 2. 一時的な修正方法

**方法A: CustomPageLinkを無効化**
```tsx
// components/NotionPage.tsx の components 定義部分を修正
const components = React.useMemo<Partial<NotionComponents>>(
  () => ({
    // ... 他のコンポーネント
    // PageLink: CustomPageLink as any, // この行をコメントアウト
    // ... 他のコンポーネント
  }),
  [recordMap]
)
```

**方法B: デフォルトのPageLinkを使用**
```tsx
// components/NotionPage.tsx
import { components as defaultComponents } from 'react-notion-x'

const components = React.useMemo<Partial<NotionComponents>>(
  () => ({
    // ... 他のコンポーネント
    PageLink: defaultComponents.PageLink, // デフォルトを明示的に使用
    // ... 他のコンポーネント
  }),
  [recordMap]
)
```

#### 3. デバッグ用のコンポーネントを追加
データベースの存在を確認するため、以下のコンポーネントを一時的に追加：

```tsx
// NotionPage.tsx内に追加
{config.isDev && (
  <div style={{ background: '#ffe0e0', padding: '10px', margin: '10px' }}>
    <h3>Collection Views in RecordMap:</h3>
    <pre>
      {JSON.stringify(
        Object.entries(recordMap.block || {})
          .filter(([_, b]) => b.value?.type === 'collection_view')
          .map(([id, b]) => ({
            id,
            type: b.value.type,
            collection_id: b.value.collection_id
          })),
        null,
        2
      )}
    </pre>
  </div>
)}
```

#### 4. Collection コンポーネントの読み込み確認
```tsx
// Collectionコンポーネントの定義を修正してログを追加
const Collection = dynamic(() =>
  import('react-notion-x/build/third-party/collection').then(
    (m) => {
      console.log('Collection component loaded:', m.Collection);
      return m.Collection;
    }
  ),
  {
    ssr: false
  }
)
```

## 実施済みの変更

### 1. CustomPageLinkを無効化済み
- `components/NotionPage.tsx`で`PageLink: CustomPageLink`をコメントアウト
- これによりデフォルトのPageLinkコンポーネントが使用される

### 2. AutoBreadcrumbを一時的に無効化済み
- パンくずリストコンポーネントをコメントアウト

### 3. デバッグ情報を追加済み
- Collection Viewのデバッグ情報を表示するコードを追加
- Collectionコンポーネントのローディング表示を追加

## 推奨される修正手順

### ステップ1: ブラウザでデバッグ情報を確認

1. **開発サーバーを再起動**
   ```bash
   npm run dev
   ```

2. **ブラウザでページを開く**
   - データベースがあるはずのページにアクセス
   - 開発者ツールのコンソールを開く

3. **デバッグスクリプトを実行**
   ```javascript
   // コンソールに以下を貼り付けて実行
   fetch('/debug-database.js').then(r => r.text()).then(eval)
   ```

4. **デバッグ情報の確認**
   - Collection Viewsの数
   - Collectionsの存在
   - Collection queryの結果
   - エラーメッセージ

### ステップ2: サーバーログの確認

```bash
# Next.jsのログを確認
npm run dev 2>&1 | grep -E "(Collection|collection|database|Database)"
```

### ステップ3: 原因の特定

**ケース1: Collectionsが空の場合**
- NotionAPIがコレクションデータを取得できていない
- 環境変数`NOTION_API_SECRET`の確認が必要

**ケース2: Collection Viewsは存在するがレンダリングされない場合**
- Collectionコンポーネントの読み込みに問題がある
- または、CSSで非表示になっている可能性

**ケース3: "Loading database view..."が表示され続ける場合**
- Collectionコンポーネントの動的インポートに問題がある

### ステップ4: 段階的な修正

1. **環境変数の確認**
   ```bash
   cat .env | grep NOTION
   ```

2. **キャッシュのクリア**
   ```bash
   rm -rf .next
   npm run dev
   ```

3. **CustomPageLinkの修正**
   - CollectionView内でのみデフォルトのリンクを使用するように修正

4. **最終的な解決策**
   - 問題が解決しない場合は、以前のコミットに戻すことを検討
   ```bash
   git checkout 0e91c2e -- components/NotionPage.tsx
   ```