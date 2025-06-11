# Notion ハイブリッド検索実装 完全ガイド

## 概要
このガイドは、Notionデータベースのチェックボックスを使用した検索フィルタリング機能の実装について、すべての手順、注意点、トラブルシューティングを網羅しています。

## 重要な前提条件

### 1. 環境変数（これを間違えると401エラーになります！）
```
NOTION_API_SECRET=secret_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

**注意**: `NOTION_API_KEY` ではありません！必ず `NOTION_API_SECRET` を使用してください。

### 2. データベースID
```
DATABASE_ID=1ceb802cb0c6814ab43eddb38e80f2e0
```

### 3. データベースのプロパティ
- プロパティ名: `Searchable` または `検索対象`
- タイプ: チェックボックス

## 完全な実装手順

### ステップ1: 環境変数の設定

1. **ローカル環境** (`.env.local`)：
```env
NOTION_API_SECRET=secret_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

2. **Vercel環境**：
- Vercel Dashboard > Settings > Environment Variables
- 変数名: `NOTION_API_SECRET`
- 値: あなたのNotion API シークレット

### ステップ2: Official API Checker の実装

`lib/search/official-api-checker.ts`:
```typescript
export async function getSearchablePages(
  databaseId: string = '1ceb802cb0c6814ab43eddb38e80f2e0', 
  propertyName: string = 'Searchable'
): Promise<string[]> {
  const notionApiKey = process.env.NOTION_API_SECRET // 注意: NOTION_API_SECRET を使用
  
  if (!notionApiKey) {
    console.error('NOTION_API_SECRET not found')
    return []
  }

  try {
    const response = await fetch(`https://api.notion.com/v1/databases/${databaseId}/query`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${notionApiKey}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        filter: {
          property: propertyName,
          checkbox: {
            equals: true
          }
        }
      })
    })
    
    if (!response.ok) {
      throw new Error(`Failed to query database: ${response.status}`)
    }
    
    const data = await response.json()
    return data.results.map((page: any) => page.id.replace(/-/g, ''))
  } catch (error) {
    console.error('Error fetching searchable pages:', error)
    return []
  }
}
```

### ステップ3: Search Engine の実装

`lib/search/search-engine.ts`:
```typescript
export class SearchEngine {
  async reindexAll(): Promise<void> {
    await this.indexer.buildFullIndex()
  }
  
  // ... 他のメソッド
}
```

### ステップ4: Hybrid Search API の実装

`pages/api/hybrid-search.ts`:
```typescript
import { NextApiRequest, NextApiResponse } from 'next'
import { SearchEngine } from '@/lib/search/search-engine'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const searchEngine = new SearchEngine()
    
    // GETとPOSTの両方をサポート
    const query = req.method === 'GET' 
      ? req.query.query as string
      : req.body.query
    
    if (!query) {
      return res.status(400).json({ 
        error: 'Query parameter is required' 
      })
    }

    const searchResponse = await searchEngine.search(query)
    
    res.status(200).json({
      success: true,
      query,
      totalResults: searchResponse.total,
      results: searchResponse.results,
      hasMore: searchResponse.hasMore,
      searchTime: searchResponse.searchTime
    })
  } catch (error) {
    console.error('Search error:', error)
    res.status(500).json({ 
      success: false,
      error: error.message
    })
  }
}
```

### ステップ5: フロントエンド実装（Header.tsx）

```typescript
import Link from 'next/link' // 重要: Next.js の Link を使用

const handleSearch = async (e) => {
  e?.preventDefault()
  
  if (!searchQuery || searchQuery.trim().length < 2) {
    return
  }
  
  setIsSearching(true)
  setSearchResults([]) // 重要: 検索前に結果をクリア
  
  try {
    // 重要: hybrid-search エンドポイントを使用（direct-search ではない）
    const response = await fetch('/api/hybrid-search?query=' + encodeURIComponent(searchQuery.trim()), {
      method: 'GET',
      headers: {
        'Cache-Control': 'no-cache' // キャッシュを防ぐ
      }
    })
    
    const results = await response.json()
    const searchResultsArray = Array.isArray(results.results) ? results.results : []
    setSearchResults(searchResultsArray)
  } catch (error) {
    console.error('検索エラー:', error)
    setSearchResults([])
  } finally {
    setIsSearching(false)
  }
}

// 検索結果の表示（重要: Link コンポーネントを使用）
{searchResults.map((result) => (
  <li key={result.id}>
    <Link 
      href={result.url}
      className={styles.searchResultLink}
      onClick={() => {
        setIsSearchVisible(false)
        setSearchQuery('')
        setSearchResults([])
      }}
    >
      {/* target="_blank" を使わない！ */}
      <span>{result.title}</span>
    </Link>
  </li>
))}
```

## よくある問題と解決方法

### 1. 401 Unauthorized エラー
**原因**: 環境変数名が間違っている
**解決方法**: 
- `NOTION_API_KEY` → `NOTION_API_SECRET` に変更
- Vercelの環境変数設定を確認

### 2. 404 Database not found エラー
**原因**: データベースIDが間違っている
**解決方法**: 
- 正しいID: `1ceb802cb0c6814ab43eddb38e80f2e0`
- ハイフンなしの形式を使用

### 3. 検索結果が0件
**原因**: 
- チェックボックスプロパティ名が違う
- APIレスポンスの形式が想定と異なる

**解決方法**:
```typescript
// プロパティ名を確認
const propertyNames = ['Searchable', '検索対象']
for (const name of propertyNames) {
  const results = await getSearchablePages(databaseId, name)
  if (results.length > 0) break
}
```

### 4. 検索結果がNotion.soにリンクされる
**原因**: `<a>` タグを使用している
**解決方法**: Next.js の `Link` コンポーネントを使用

### 5. 古い検索結果が表示される
**原因**: ブラウザまたはAPIのキャッシュ
**解決方法**:
- `Cache-Control: no-cache` ヘッダーを追加
- 検索前に `setSearchResults([])` で結果をクリア

### 6. "無題のページ" が表示される
**原因**: フィルタリングが機能していない
**解決方法**: `search-filter.ts` でシステムページを除外

## テスト手順

### 1. 環境変数の確認
```bash
# テストエンドポイントにアクセス
curl https://your-domain.vercel.app/api/test-database-schema
```

### 2. チェックボックスフィルタリングの確認
```bash
# 検索対象ページの確認
curl https://your-domain.vercel.app/api/test-searchable
```

### 3. ハイブリッド検索の確認
```bash
# 検索APIの直接テスト
curl "https://your-domain.vercel.app/api/hybrid-search?query=カフェ"
```

### 4. UI検索機能の確認
1. サイトにアクセス
2. 右上の検索アイコンをクリック
3. キーワードを入力して検索
4. 結果がサイト内リンクであることを確認

## デバッグ用コンソールログ

ブラウザの開発者ツールで以下を確認：
```javascript
// 期待されるログ
検索リクエスト送信: {query: "カフェ"}
検索結果の詳細: {success: true, totalResults: 2, results: [...]}
検索結果の項目数: 2

// 問題がある場合のログ
// Notion公式APIの直接レスポンスが表示される場合は、
// 間違ったAPIエンドポイントを呼んでいる
{
  "object": "list",
  "results": [],
  "type": "page_or_database"
}
```

## ビルドとデプロイ

### 1. ローカルビルド
```bash
npm run build
```

### 2. デプロイ
```bash
git add -A
git commit -m "実装内容を記述"
git push
```

### 3. キャッシュクリア
デプロイ後、ブラウザで強制リロード（Ctrl+Shift+R）

## まとめ

成功のポイント：
1. **NOTION_API_SECRET** を使用（NOTION_API_KEY ではない）
2. **/api/hybrid-search** エンドポイントを使用
3. **Next.js Link** コンポーネントで内部ナビゲーション
4. 検索前に結果を**クリア**
5. **Cache-Control** ヘッダーでキャッシュを防ぐ

これらの点を守れば、チェックボックスベースの検索フィルタリングが正しく動作します。