# ウォームアップ修正ガイド

## 現在の状況

1. **ページ取得**: ✅ 成功（7ページ検出）
2. **認証エラー**: ❌ CACHE_CLEAR_TOKENが必要
3. **環境変数表示**: ⚠️ "NOT SET"と表示されるが実際は動作

## 解決方法

### 方法1: 管理画面から実行（最も簡単）

1. https://notion-effect-blog2.vercel.app/admin にアクセス
2. パスワードを入力してログイン（デフォルト: `admin123`）
3. 「最適化ウォームアップ」ボタンをクリック
4. **トークンを求められたら**:
   - Vercelで設定した `CACHE_CLEAR_TOKEN` の値を入力
   - または空欄のままEnterを押す（トークンが設定されていない場合）
5. 進捗バーが表示され、処理が進むことを確認

### 方法2: 環境変数を公開設定にする（開発用）

`vercel.json`に以下を追加：

```json
{
  "build": {
    "env": {
      "NEXT_PUBLIC_CACHE_CLEAR_TOKEN": "@cache-clear-token"
    }
  }
}
```

その後：
```bash
vercel env add NEXT_PUBLIC_CACHE_CLEAR_TOKEN
# CACHE_CLEAR_TOKENと同じ値を入力
```

### 方法3: APIで直接実行（トークンがわかる場合）

1. https://notion-effect-blog2.vercel.app/admin にアクセス
2. パスワードを入力してログイン
3. 「ページリストをテスト」ボタンをクリック
   - 7ページが表示されることを確認
4. 「最適化ウォームアップ」または「キャッシュウォームアップ」ボタンをクリック
5. 進捗を確認

### 方法3: 認証を一時的に無効化（開発用）

`pages/api/cache-warmup-simple.ts`を修正：

```typescript
// 認証チェック部分を修正
const authHeader = req.headers.authorization;
const expectedToken = process.env.CACHE_CLEAR_TOKEN;

// 開発環境では認証をスキップ
if (process.env.NODE_ENV !== 'development' && expectedToken && authHeader !== `Bearer ${expectedToken}`) {
  return res.status(401).json({ error: 'Unauthorized' });
}
```

## 確認手順

### 1. 管理画面でのテスト（最も簡単）

```
1. /adminにアクセス
2. ログイン
3. 「ページリストをテスト」→ 7ページ確認
4. 「最適化ウォームアップ」クリック
5. 進捗バーが動くことを確認
```

### 2. APIでの確認（トークンがある場合）

```bash
# トークンを使用してウォームアップ開始
TOKEN="your-cache-clear-token"
curl -X POST https://notion-effect-blog2.vercel.app/api/cache-warmup-simple \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN"

# ステータス確認（認証不要）
curl https://notion-effect-blog2.vercel.app/api/cache-warmup-simple
```

### 3. Vercelログの確認

```bash
# Vercelのファンクションログを確認
vercel logs --follow
```

## トラブルシューティング

### Q: 管理画面のパスワードがわからない

環境変数 `NEXT_PUBLIC_ADMIN_PASSWORD` を確認：
```bash
vercel env ls | grep ADMIN_PASSWORD
```

デフォルトは `admin123` です。

### Q: ウォームアップが開始しない

1. ブラウザの開発者ツール（F12）を開く
2. Networkタブを確認
3. エラーレスポンスを確認
4. Consoleタブでエラーを確認

### Q: ページが0件になる

これは現在発生していません（7ページ検出済み）。
もし発生した場合は、`/api/test-page-list`で診断してください。

## 次のステップ

1. 管理画面からウォームアップを実行
2. 成功したら定期的に実行するように設定
3. 必要に応じてcronジョブを設定：

```bash
# Vercel cronジョブ設定（vercel.json）
{
  "crons": [{
    "path": "/api/cache-warmup-simple",
    "schedule": "0 */6 * * *"  // 6時間ごと
  }]
}
```

ただし、cronジョブにも認証トークンが必要なので、
内部用のエンドポイントを作成することを推奨します。