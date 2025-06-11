# ハイブリッド検索機能実装ガイド

## 概要

このドキュメントは、Notion Effect BlogにおけるNotionの公式APIと非公式APIを統合したハイブリッド検索機能の実装について説明します。

## アーキテクチャ

### データソース切り替え方式

検索クエリの内容に応じて、最適なAPIを自動的に選択します：

- **コンテンツ検索**: 非公式API（react-notion-x）を使用
- **メタデータ検索**: 公式APIを使用
- **ハイブリッド検索**: 両APIの結果を統合（重複排除あり）

## 実装されたコンポーネント

### 1. ハイブリッドAPI層 (`lib/search/hybrid-api.ts`)

両APIからデータを取得し、統合する役割を担います。

```typescript
const hybridAPI = new HybridNotionAPI()
const pageData = await hybridAPI.getEnrichedPageData(pageId)
```

### 2. 検索インデックス (`lib/search/indexer.ts`)

ページデータを検索可能な形式でインデックス化します。

```typescript
const indexer = new SearchIndexer()
await indexer.buildFullIndex() // 全ページのインデックス構築
await indexer.updatePageIndex(pageId) // 単一ページの更新
```

### 3. 検索エンジン (`lib/search/search-engine.ts`)

実際の検索処理を行います。クエリ解析、フィルタリング、スコアリングを実装。

```typescript
const searchEngine = new SearchEngine()
const results = await searchEngine.search('React', {
  searchType: 'all',
  filters: { tags: ['React'] }
})
```

### 4. 検索API (`pages/api/search/index.ts`)

フロントエンドから呼び出すAPIエンドポイント。

```bash
POST /api/search
{
  "query": "検索キーワード",
  "options": {
    "searchType": "all",
    "filters": {},
    "limit": 10
  }
}
```

### 5. 検索UI (`components/SearchModal.tsx`)

ユーザーインターフェースコンポーネント。リアルタイム検索、フィルタリング、キーボードナビゲーションを提供。

## セットアップ手順

### 1. 環境変数の設定

`.env.local`に以下の環境変数を追加：

```bash
# 公式API用
NOTION_API_SECRET=your_notion_api_secret

# 非公式API用（オプション）
NOTION_ACTIVE_USER=your_active_user_id
NOTION_TOKEN_V2=your_token_v2

# インデックス再構築用（オプション）
REINDEX_AUTH_TOKEN=your_secure_token
```

### 2. 初回インデックスの構築

```bash
# APIエンドポイントを使用
curl -X POST http://localhost:3000/api/search/reindex \
  -H "Authorization: Bearer your_secure_token" \
  -H "Content-Type: application/json" \
  -d '{"mode": "full"}'
```

または、スクリプトから直接実行：

```typescript
import { SearchIndexer } from '@/lib/search/indexer'

const indexer = new SearchIndexer()
await indexer.buildFullIndex()
```

### 3. 検索モーダルの統合

既存のページに検索モーダルを追加：

```tsx
import { SearchModal } from '@/components/SearchModal'

function MyApp() {
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  
  // Cmd/Ctrl + K でモーダルを開く
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setIsSearchOpen(true)
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])
  
  return (
    <>
      <SearchModal 
        isOpen={isSearchOpen} 
        onClose={() => setIsSearchOpen(false)} 
      />
      {/* 他のコンポーネント */}
    </>
  )
}
```

## 検索機能の使い方

### 基本的な検索

- キーワードを入力して検索
- リアルタイムで結果が表示される
- 矢印キーで結果を選択、Enterで遷移

### 高度な検索

- **タグ検索**: `#React #Next.js`
- **カテゴリ検索**: `category:技術記事`
- **著者検索**: `author:山田太郎`
- **日付範囲**: 検索オプションで指定

### 検索タイプの切り替え

- **すべて**: ハイブリッド検索（デフォルト）
- **コンテンツ**: 本文の全文検索
- **メタデータ**: プロパティ・タグ検索

## パフォーマンス最適化

### 1. インデックスのキャッシュ

- インメモリキャッシュで高速化
- ファイルベースの永続化

### 2. デバウンス処理

- 入力中の過剰なAPI呼び出しを防止
- 300msのデバウンス

### 3. バッチ処理

- インデックス構築時は10ページずつバッチ処理
- 並行処理で高速化

## トラブルシューティング

### インデックスが更新されない

```bash
# インデックスの状態を確認
curl http://localhost:3000/api/search/reindex
```

### 検索結果が表示されない

1. インデックスが構築されているか確認
2. 環境変数が正しく設定されているか確認
3. コンソールでエラーを確認

### パフォーマンスが遅い

1. インデックスのサイズを確認（`data/search-index.json`）
2. 古いエントリをクリーンアップ
3. 検索結果の上限を調整

## 今後の改善案

1. **検索結果のハイライト**: マッチした部分を強調表示
2. **ファセット検索**: カテゴリ別の結果数表示
3. **検索履歴の活用**: パーソナライズされた検索体験
4. **多言語対応**: 日本語の形態素解析を改善
5. **インクリメンタル更新**: Webhookを使った自動更新

## まとめ

このハイブリッド検索実装により、以下が実現されました：

- ✅ 公式APIのメタデータを活用した高度な検索
- ✅ 非公式APIの全文検索機能の維持
- ✅ データソースの自動切り替え
- ✅ 重複のない統合検索結果
- ✅ 高速でレスポンシブな検索体験

検索精度と網羅性が大幅に向上し、ユーザーが求める情報をより確実に見つけられるようになりました。