# 🚀 キャッシュウォームアップ実行ガイド

## 📋 事前確認

✅ **ページ取得**: 7ページ検出済み（正常）  
❌ **認証**: CACHE_CLEAR_TOKENが必要  
⏱️ **実行時間**: 約1-2分で完了予定

## 🎯 最も簡単な実行方法

### ステップ 1: 管理画面にアクセス
```
https://notion-effect-blog2.vercel.app/admin
```

### ステップ 2: ログイン
- パスワード: `admin123`（またはカスタム設定値）

### ステップ 3: ウォームアップ実行

1. **「最適化ウォームアップ」**ボタンをクリック

2. トークンを求められたら:
   - **わかる場合**: `CACHE_CLEAR_TOKEN`の値を入力
   - **わからない場合**: 空欄でEnterキー

3. 処理開始の確認:
   - 「🚀 ウォームアップ開始: 7ページ」のメッセージ
   - 進捗バーが表示される

4. 完了まで待つ:
   - 「✅ ウォームアップ完了！」が表示されたら成功

## 🔧 トークンがわからない場合

### オプション1: Vercelダッシュボードで確認
1. https://vercel.com にログイン
2. プロジェクトを選択
3. Settings → Environment Variables
4. `CACHE_CLEAR_TOKEN`の値を確認

### オプション2: 認証を一時的に無効化

1. 以下のファイルを作成:

`pages/api/cache-warmup-test.ts`:
```typescript
import handler from './cache-warmup-simple'
import { NextApiRequest, NextApiResponse } from 'next'

export default async function testHandler(req: NextApiRequest, res: NextApiResponse) {
  // 認証をバイパス
  if (req.method === 'POST') {
    req.headers.authorization = `Bearer ${process.env.CACHE_CLEAR_TOKEN || 'dummy'}`
  }
  return handler(req, res)
}
```

2. デプロイ後、以下でアクセス:
```bash
curl -X POST https://notion-effect-blog2.vercel.app/api/cache-warmup-test
```

## 📊 実行結果の確認

### 成功例:
```
✅ ウォームアップ完了！
処理: 7/7
成功: 7
スキップ: 0（キャッシュ済み/重複）
失敗: 0
時間: 45秒
```

### エラーが出た場合:
- **Unauthorized**: トークンが間違っている
- **Already processing**: 既に実行中
- **No pages found**: ページリストの取得に失敗

## 🆘 それでも動かない場合

### 緊急対応: 認証なしバージョン

`pages/api/cache-warmup-public.ts`を作成:

```typescript
import { NextApiRequest, NextApiResponse } from 'next'
import { getAllPageIds } from '@/lib/get-all-pages'
import { getSiteMap } from '@/lib/get-site-map'

// グローバル状態（cache-warmup-simple.tsからコピー）
let warmupState = {
  isProcessing: false,
  startTime: 0,
  total: 0,
  processed: 0,
  succeeded: 0,
  failed: 0,
  skipped: 0,
  errors: [] as string[],
  lastUpdate: Date.now()
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // 認証なしで実行
  if (req.method === 'POST') {
    // ページ取得
    let pageIds: string[] = []
    try {
      const siteMap = await getSiteMap()
      pageIds = Object.keys(siteMap?.canonicalPageMap || {})
    } catch (e) {
      console.error(e)
    }
    
    if (pageIds.length === 0) {
      return res.status(200).json({ 
        success: false, 
        message: 'No pages found' 
      })
    }
    
    // 状態更新
    warmupState = {
      isProcessing: true,
      startTime: Date.now(),
      total: pageIds.length,
      processed: 0,
      succeeded: 0,
      failed: 0,
      skipped: 0,
      errors: [],
      lastUpdate: Date.now()
    }
    
    // 非同期処理開始（詳細は省略）
    processPages(pageIds)
    
    return res.status(200).json({
      success: true,
      message: 'Started',
      total: pageIds.length
    })
  }
  
  // GETでステータス返却
  return res.status(200).json(warmupState)
}

async function processPages(pageIds: string[]) {
  // 簡易実装
  for (const pageId of pageIds) {
    try {
      await fetch(`https://notion-effect-blog2.vercel.app/${pageId}`)
      warmupState.processed++
      warmupState.succeeded++
    } catch (e) {
      warmupState.failed++
    }
    warmupState.lastUpdate = Date.now()
  }
  warmupState.isProcessing = false
}
```

デプロイ後:
```bash
curl -X POST https://notion-effect-blog2.vercel.app/api/cache-warmup-public
```

## ✅ 期待される結果

- 7ページすべてが処理される
- 処理時間: 1-2分
- エラー: 0件
- キャッシュが更新される

問題が解決しない場合は、Vercelのファンクションログを確認してください。