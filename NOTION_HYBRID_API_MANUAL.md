# Notion Hybrid API 実装完全マニュアル

## 📚 目次

1. [概要](#概要)
2. [システム構造](#システム構造)
3. [実装詳細](#実装詳細)
4. [トラブルシューティング](#トラブルシューティング)
5. [パフォーマンス最適化](#パフォーマンス最適化)
6. [メンテナンスガイド](#メンテナンスガイド)

---

## 1. 概要

### 1.1 背景と課題

**問題**: Notionのデータベースで「数式（Formula）」プロパティが表示されない
- react-notion-x（非公式API）は数式プロパティをサポートしていない
- Notion公式APIは数式プロパティをサポートしているが、完全な移行は困難

**解決策**: ハイブリッドAPI方式
- 基本的なページ表示：react-notion-x（非公式API）
- 数式プロパティ：Notion公式API
- 両者を組み合わせて使用

### 1.2 システムの特徴

- ✅ 既存のreact-notion-xの機能を維持
- ✅ 数式プロパティ（最終更新日など）を表示
- ✅ 日本時間（JST）での日付表示
- ✅ キャッシュによる高速化
- ✅ エラーハンドリング

---

## 2. システム構造

### 2.1 アーキテクチャ図

```
┌─────────────────┐     ┌─────────────────┐
│   ブラウザ      │     │   Notion DB     │
│  (React App)    │     │                 │
└────────┬────────┘     └─────┬───────────┘
         │                    │
         │                    ├─── 非公式API
         ▼                    │    (react-notion-x)
┌─────────────────┐           │
│  Next.js App    │◀──────────┤
│                 │           │
│ ┌─────────────┐ │           └─── 公式API
│ │Hybrid API   │ │               (@notionhq/client)
│ │(統合レイヤー)│ │
│ └─────────────┘ │
│                 │
│ ┌─────────────┐ │
│ │Cache Manager│ │
│ │(キャッシュ) │ │
│ └─────────────┘ │
└─────────────────┘
```

### 2.2 主要コンポーネント

1. **notion-api-hybrid.ts** - API統合レイヤー
2. **inject-formula-simple.js** - DOM操作スクリプト
3. **cache-utils.ts** - キャッシュ管理
4. **test-formula.ts** - APIエンドポイント

### 2.3 データフロー

```
1. ページ読み込み
   ↓
2. react-notion-xでページ全体を取得
   ↓
3. 数式プロパティの空要素を検出
   ↓
4. 公式APIで数式値を取得
   ↓
5. DOMに値を挿入
   ↓
6. キャッシュに保存
```

---

## 3. 実装詳細

### 3.1 Notion Hybrid API (`lib/notion-api-hybrid.ts`)

#### 目的
非公式APIと公式APIを統合し、それぞれの長所を活かす

#### 実装のポイント

```typescript
export class NotionHybridAPI {
  private unofficialClient: NotionAPI  // react-notion-x
  private officialClient: any          // @notionhq/client
  
  constructor() {
    // 非公式APIクライアント（常に初期化）
    this.unofficialClient = new NotionAPI({
      apiBaseUrl: process.env.NOTION_API_BASE_URL,
      authToken: process.env.NOTION_API_SECRET,
      userTimeZone: 'Asia/Tokyo'  // 重要：日本時間設定
    })

    // 公式APIクライアント（トークンがある場合のみ）
    if (process.env.NOTION_API_SECRET && Client) {
      this.officialClient = new Client({
        auth: process.env.NOTION_API_SECRET,
        timeZone: 'Asia/Tokyo'  // 重要：日本時間設定
      })
    }
  }
}
```

#### 数式プロパティ取得メソッド

```typescript
async getFormulaPropertyValue(pageId: string, propertyName: string): Promise<string | null> {
  // 1. キャッシュチェック
  const cached = cacheManager.get<string>(cacheKey)
  if (cached) return cached

  // 2. 公式APIでページ情報取得
  const page = await this.officialClient.pages.retrieve({ page_id: pageId })
  
  // 3. 最終更新日の特別処理（JSTタイムゾーン変換）
  if (propertyName === '最終更新日') {
    // last_edited_timeから直接取得してJST変換
    const date = new Date(property.last_edited_time)
    const formatter = new Intl.DateTimeFormat('ja-JP', {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      timeZone: 'Asia/Tokyo'  // 重要：JST指定
    })
    // フォーマットして返す
  }
  
  // 4. キャッシュに保存
  cacheManager.set(cacheKey, result, CacheTTL.LONG)
}
```

### 3.2 DOM操作スクリプト (`public/inject-formula-simple.js`)

#### 目的
react-notion-xが生成した空の数式要素に値を挿入

#### 実装のポイント

```javascript
async function fillFormulas() {
  // 1. 空の数式要素を検出
  const elements = document.querySelectorAll('.notion-property-formula')
  
  // 2. recordMapからページ情報を取得
  const recordMap = window.__NEXT_DATA__.props.pageProps.recordMap
  
  // 3. タイトルでページIDを特定
  function findPageByTitle(title) {
    for (const [blockId, blockData] of Object.entries(recordMap.block)) {
      if (blockTitle === title) return blockId
    }
  }
  
  // 4. APIで数式値を取得して挿入
  const response = await fetch(`/api/test-formula?pageId=${pageId}`)
  formulaEl.textContent = data.formulaValue
}
```

#### なぜDOM操作が必要？
- react-notion-xは数式の「枠」は作るが「値」は入れない
- Reactのハイドレーションエラーを避けるため、クライアント側で挿入

### 3.3 キャッシュシステム (`lib/cache-utils.ts`)

#### 目的
APIリクエストを削減し、パフォーマンスを向上

#### キャッシュの種類と有効期限

```typescript
export const CacheTTL = {
  SHORT: 5 * 60 * 1000,      // 5分（頻繁に変わるデータ）
  MEDIUM: 30 * 60 * 1000,     // 30分（ページデータ）
  LONG: 60 * 60 * 1000,       // 1時間（数式プロパティ）
  VERY_LONG: 24 * 60 * 60 * 1000  // 24時間（画像URL）
}
```

#### キャッシュキーの設計

```typescript
export const CacheKeys = {
  formula: (pageId, propertyName) => `formula:${pageId}:${propertyName}`,
  page: (pageId) => `page:${pageId}`,
  image: (url) => `image:${url}`,
  recordMap: (pageId) => `record-map:${pageId}`
}
```

### 3.4 環境変数の設定

**.env.local**
```bash
# Notion API認証トークン（公式API用）
NOTION_API_SECRET=secret_xxxxxxxxxxxx

# NotionデータベースID
NOTION_ROOT_PAGE_ID=xxxxxxxxxxxx

# タイムゾーン設定（省略可、デフォルト：Asia/Tokyo）
TZ=Asia/Tokyo
```

---

## 4. トラブルシューティング

### 4.1 よくある問題と解決策

#### 問題1: 数式が表示されない

**症状**: ページに数式プロパティが空白のまま

**確認事項**:
1. ブラウザのコンソールでエラーを確認
2. `/api/test-formula`のレスポンスを確認
3. DOM要素の存在を確認

**解決策**:
```javascript
// コンソールで手動実行
window.fillFormulas && window.fillFormulas()
```

#### 問題2: タイムゾーンが間違っている

**症状**: 日付が1日ずれている

**原因**: UTCとJSTの時差（9時間）

**解決策**:
- Intl.DateTimeFormatで`timeZone: 'Asia/Tokyo'`を指定
- Notion側の数式でタイムゾーン調整

#### 問題3: React Hydration Error

**症状**: 
```
Error: Hydration failed because the initial UI does not match what was rendered on the server.
```

**原因**: サーバーとクライアントでHTMLが異なる

**解決策**:
- DOM操作を遅延実行（setTimeout）
- クライアント側のみで処理

#### 問題4: キャッシュが効かない

**症状**: 毎回APIリクエストが発生

**確認方法**:
```bash
curl http://localhost:3000/api/cache-status
```

**解決策**:
- グローバルインスタンスの確認
- キャッシュキーの一致を確認

### 4.2 デバッグ方法

#### APIレスポンスの確認

```bash
# 数式プロパティの取得テスト
curl "http://localhost:3000/api/test-formula?pageId=YOUR_PAGE_ID" | jq

# キャッシュ状態の確認
curl "http://localhost:3000/api/cache-status" | jq
```

#### ブラウザでのデバッグ

```javascript
// recordMapの確認
console.log(window.__NEXT_DATA__.props.pageProps.recordMap)

// 数式要素の確認
document.querySelectorAll('.notion-property-formula')

// 手動で数式を取得
fetch('/api/test-formula?pageId=xxx').then(r => r.json()).then(console.log)
```

---

## 5. パフォーマンス最適化

### 5.1 キャッシュ戦略

```
┌─────────────┐
│ 初回アクセス │
└──────┬──────┘
       ▼
  APIリクエスト ──→ キャッシュ保存
       ▼
┌─────────────┐
│ 2回目以降   │
└──────┬──────┘
       ▼
  キャッシュから取得（高速）
```

### 5.2 最適化のポイント

1. **適切なTTL設定**
   - 更新頻度に応じて調整
   - 数式：1時間（あまり変わらない）
   - 画像：24時間（ほぼ変わらない）

2. **バッチ処理**
   - 複数の数式を一度に取得
   - Promise.allで並列処理

3. **遅延読み込み**
   - スクロールに応じて読み込み
   - IntersectionObserver活用

### 5.3 パフォーマンス測定

```javascript
// キャッシュヒット率の確認
const stats = await fetch('/api/cache-status').then(r => r.json())
console.log(`Hit Rate: ${stats.cache.hitRate}`)

// 読み込み時間の測定
performance.mark('start')
await fillFormulas()
performance.mark('end')
performance.measure('formula-load', 'start', 'end')
```

---

## 6. メンテナンスガイド

### 6.1 定期メンテナンス

#### 週次
- キャッシュヒット率の確認
- エラーログの確認
- パフォーマンス指標の確認

#### 月次
- Notion APIの更新確認
- 依存パッケージの更新
- セキュリティ監査

### 6.2 アップデート手順

1. **テスト環境で検証**
   ```bash
   npm run dev
   # /api/test-formulaで動作確認
   ```

2. **キャッシュクリア**
   ```bash
   curl -X POST http://localhost:3000/api/cache-clear
   ```

3. **デプロイ**
   ```bash
   npm run build
   npm start
   ```

### 6.3 監視項目

| 項目 | 正常値 | 警告値 | アクション |
|------|--------|--------|------------|
| キャッシュヒット率 | >70% | <50% | TTL調整 |
| API応答時間 | <500ms | >1000ms | 最適化検討 |
| エラー率 | <1% | >5% | ログ確認 |

### 6.4 拡張ポイント

**将来的な改善案**:
1. WebSocketでリアルタイム更新
2. Service Workerでオフライン対応
3. GraphQL統合
4. 他のプロパティタイプ対応（リレーション、ロールアップ）

---

## 付録A: よく使うコマンド集

```bash
# 開発サーバー起動
npm run dev

# ビルド
npm run build

# 本番サーバー起動
npm start

# キャッシュ状態確認
curl http://localhost:3000/api/cache-status | jq

# キャッシュクリア
curl -X POST http://localhost:3000/api/cache-clear

# 数式テスト
curl "http://localhost:3000/api/test-formula?pageId=YOUR_PAGE_ID" | jq

# デバッグページ
open http://localhost:3000/cache-debug
```

## 付録B: エラーメッセージ一覧

| エラー | 意味 | 対処法 |
|--------|------|--------|
| `skipping missing collection view` | データベースビューが見つからない | 権限確認、キャッシュで軽減 |
| `Hydration failed` | サーバー/クライアント不一致 | DOM操作を遅延実行 |
| `NOTION_API_SECRET not found` | 環境変数未設定 | .env.local確認 |
| `Failed to fetch formula property` | API取得エラー | ページID、プロパティ名確認 |

---

このマニュアルは定期的に更新してください。質問があれば、チームリーダーまたは技術サポートまでお問い合わせください。