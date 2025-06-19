# Notion→React リアルタイム更新システム実装ガイド

## 概要
このガイドでは、NotionのデータをReactアプリケーションにリアルタイムで反映させるシステムの実装について説明します。

## システムアーキテクチャ

```
[Notion] → Webhook → [API] → WebSocket → [React App]
           ↓                    ↓
     キャッシュ無効化      リアルタイム更新
```

## 実装されたコンポーネント

### 1. Webhookエンドポイント
- **ファイル**: `/pages/api/webhook/notion-update.ts`
- **機能**:
  - Notion Webhookからのイベントを受信
  - 署名検証によるセキュリティ確保
  - イベントタイプに応じたキャッシュ無効化
  - WebSocket経由でクライアントへ通知

### 2. キャッシュ管理システム
- **ファイル**: `/lib/cache.ts`
- **特徴**:
  - マルチレイヤーキャッシュ（メモリ + Redis）
  - パターンベースの無効化
  - 統計情報の取得
  - 自動フォールバック

### 3. WebSocketサーバー
- **ファイル**: `/lib/websocket.ts`
- **機能**:
  - リアルタイム通信の確立
  - ルームベースの購読管理
  - 自動再接続

### 4. クライアントフック
- **ファイル**: `/hooks/useRealtimeUpdates.ts`
- **機能**:
  - WebSocket接続の管理
  - 自動ページリロード
  - キャッシュクリア機能

### 5. 管理UI
- **ファイル**: `/components/CacheManagement.tsx`
- **機能**:
  - キャッシュ統計の表示
  - 手動キャッシュクリア
  - WebSocket接続状態の監視

## セットアップ手順

### 1. 環境変数の設定

```env
# Notion Webhook署名検証用シークレット
NOTION_WEBHOOK_SECRET=your-webhook-secret

# キャッシュクリアAPI用トークン
CACHE_CLEAR_TOKEN=your-cache-clear-token

# ISR再検証用シークレット
REVALIDATE_SECRET=your-revalidate-secret

# サイトURL（WebSocket接続用）
NEXT_PUBLIC_SITE_URL=https://your-site.com

# Redis接続（オプション）
REDIS_URL=redis://your-redis-url
```

### 2. Notion Webhook設定

1. Notion Integrationの作成:
   - https://www.notion.so/my-integrations にアクセス
   - 新しいIntegrationを作成
   - Webhookを有効化

2. Webhook URLの設定:
   ```
   https://your-site.com/api/webhook/notion-update
   ```

3. 監視するイベントの選択:
   - `page.created`
   - `page.updated`
   - `page.deleted`
   - `database.updated`
   - `block.updated`

### 3. 管理画面へのアクセス

管理コンポーネントをページに追加:

```tsx
import { CacheManagement } from '@/components/CacheManagement';

export default function AdminPage() {
  return (
    <div>
      <h1>管理画面</h1>
      <CacheManagement />
    </div>
  );
}
```

### 4. リアルタイム更新の有効化

ページでリアルタイム更新を有効にする:

```tsx
import { useRealtimeUpdates } from '@/hooks/useRealtimeUpdates';

export default function Page({ pageId }) {
  const { isConnected, lastUpdate } = useRealtimeUpdates({
    pageId,
    autoRefresh: true,
  });

  return (
    <div>
      {isConnected && <span>リアルタイム更新: 有効</span>}
      {/* ページコンテンツ */}
    </div>
  );
}
```

## API使用方法

### 手動キャッシュクリア

```bash
# すべてのキャッシュをクリア
curl -X POST https://your-site.com/api/cache-clear \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"type": "all"}'

# Notionキャッシュのみクリア
curl -X POST https://your-site.com/api/cache-clear \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"type": "notion"}'

# パターン指定でクリア
curl -X POST https://your-site.com/api/cache-clear \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"type": "pattern", "pattern": "notion:page:*"}'
```

### キャッシュ統計の取得

```bash
curl https://your-site.com/api/cache-status
```

## キャッシュ戦略

### 1. 静的アセット
- **期間**: 1年
- **タイプ**: immutable
- **対象**: 画像、フォント、ビルドされたJS/CSS

### 2. Notion APIレスポンス
- **期間**: 5分
- **SWR**: 1時間
- **タイプ**: ETag付き

### 3. 検索結果
- **期間**: 1分
- **SWR**: 5分

### 4. リアルタイムデータ
- **期間**: キャッシュなし
- **タイプ**: private

## トラブルシューティング

### WebSocket接続が確立できない場合
1. `NEXT_PUBLIC_SITE_URL`が正しく設定されているか確認
2. CORSの設定を確認
3. ファイアウォール/プロキシの設定を確認

### キャッシュがクリアされない場合
1. 認証トークンが正しいか確認
2. Redisが接続されているか確認（使用している場合）
3. ブラウザのService Workerを手動でクリア

### Webhookが動作しない場合
1. `NOTION_WEBHOOK_SECRET`が正しく設定されているか確認
2. Webhookの署名検証をログで確認
3. NotionのWebhook設定を再確認

## パフォーマンス最適化

### 1. バッチ処理
複数のページを同時に再検証する場合は、バッチ処理を使用:

```typescript
import { revalidatePages } from '@/lib/revalidate';

const urls = ['/page1', '/page2', '/page3'];
const results = await revalidatePages(urls);
```

### 2. デバウンス
頻繁な更新を防ぐため、デバウンスを実装:

```typescript
const debouncedUpdate = debounce((data) => {
  // 更新処理
}, 1000);
```

### 3. 選択的更新
必要なデータのみを更新:

```typescript
if (event.type === 'block.updated' && isMinorChange(event.data)) {
  // キャッシュクリアをスキップ
  return;
}
```

## セキュリティ考慮事項

1. **Webhook署名検証**: 必ず実装し、シークレットは安全に管理
2. **認証トークン**: 環境変数で管理し、定期的に更新
3. **レート制限**: DoS攻撃を防ぐため、APIにレート制限を実装
4. **入力検証**: すべての入力データを検証

## 今後の拡張案

1. **GraphQL Subscriptions**: より細かい更新制御
2. **プッシュ通知**: ブラウザ通知の実装
3. **差分更新**: 変更箇所のみの更新
4. **オフライン対応**: Service Workerでのオフライン対応
5. **分析ダッシュボード**: 更新頻度やキャッシュヒット率の可視化

## まとめ

このシステムにより、Notionの更新がほぼリアルタイムでReactアプリケーションに反映されます。WebSocketによる双方向通信とマルチレイヤーキャッシュシステムにより、高速かつ効率的な更新が可能になります。