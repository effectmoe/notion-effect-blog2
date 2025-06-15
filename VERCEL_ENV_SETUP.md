# Vercel環境変数設定ガイド

## 必要な環境変数

Vercelダッシュボードで以下の環境変数を設定してください。

### 1. Notion関連
- `NOTION_API_SECRET`: 既存（変更不要）
- `NOTION_PAGE_ID`: 既存（変更不要）

### 2. Webhook・認証関連
```
NOTION_WEBHOOK_SECRET=<ランダムな文字列を生成>
CACHE_CLEAR_TOKEN=<ランダムな文字列を生成>
REVALIDATE_SECRET=<ランダムな文字列を生成>
NEXT_PUBLIC_ADMIN_PASSWORD=<管理画面用パスワード>
```

### 3. サイトURL
```
NEXT_PUBLIC_SITE_URL=https://notion-effect-blog2.vercel.app
```

### 4. Redis（既存の設定を使用）
- `REDIS_HOST`: 既存
- `REDIS_PORT`: 既存
- `REDIS_PASSWORD`: 既存
- `REDIS_URL`: `redis://:${REDIS_PASSWORD}@${REDIS_HOST}:${REDIS_PORT}`

## 設定手順

1. Vercelダッシュボードにアクセス
2. プロジェクト設定 → Environment Variables
3. 上記の環境変数を追加
4. 各環境（Production, Preview, Development）にチェック
5. Save

## シークレット生成方法

### Node.jsで生成
```javascript
console.log(require('crypto').randomBytes(32).toString('hex'))
```

### OpenSSLで生成
```bash
openssl rand -hex 32
```

### オンラインジェネレーター
https://generate-secret.now.sh/32

## 設定後の確認

1. 環境変数が正しく設定されたか確認：
   ```bash
   curl https://notion-effect-blog2.vercel.app/api/check-env
   ```

2. キャッシュクリアのテスト：
   ```bash
   curl -X POST https://notion-effect-blog2.vercel.app/api/cache-clear \
     -H "Authorization: Bearer YOUR_CACHE_CLEAR_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"type": "all"}'
   ```

3. 管理画面へのアクセス：
   https://notion-effect-blog2.vercel.app/admin

## Notion Webhook設定

1. [Notion Integrations](https://www.notion.so/my-integrations)にアクセス
2. 新しいIntegrationを作成または既存のものを使用
3. Capabilities → Webhooksを有効化
4. Webhook URL: `https://notion-effect-blog2.vercel.app/api/webhook/notion-update`
5. Secret: `NOTION_WEBHOOK_SECRET`と同じ値を設定
6. 監視するイベントを選択：
   - Page created
   - Page updated
   - Page deleted
   - Database updated
   - Block updated

## トラブルシューティング

### 環境変数が反映されない
- Vercelの再デプロイが必要な場合があります
- Settings → Git → Redeploy

### WebSocketが接続できない
- `NEXT_PUBLIC_SITE_URL`が正しく設定されているか確認
- HTTPSが有効になっているか確認

### Webhookが動作しない
- Notion IntegrationのWebhook設定を確認
- シークレットが一致しているか確認
- `/api/webhook/notion-update`のログを確認