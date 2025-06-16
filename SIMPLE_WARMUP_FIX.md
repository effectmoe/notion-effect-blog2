# ウォームアップステータスAPI修正実装

## 解決した問題

### 1. 404エラーの解消
- **問題**: `GET /api/cache-warmup-status?jobId=optimized 404 (Not Found)`
- **原因**: jobIdの管理が複雑で、固定値"optimized"が使われていた
- **解決**: jobIdを使わないシンプルな実装に変更

### 2. Redisエラーの解消
- **問題**: `[Redis] Connection error: getaddrinfo ENOTFOUND`
- **原因**: Redis接続が継続的に失敗
- **解決**: Redis依存を完全に削除、メモリキャッシュのみ使用

### 3. 処理の安定化
- **問題**: 複数のAPIエンドポイントで混乱
- **解決**: シンプルな単一APIに統一

## 実装内容

### 1. シンプルウォームアップAPI (`cache-warmup-simple.ts`)
```typescript
// 単一のAPIで開始とステータス取得を処理
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    // ウォームアップ開始
    return startWarmup(req, res);
  } else if (req.method === 'GET') {
    // ステータス取得
    return getStatus(req, res);
  }
}
```

特徴：
- グローバルな状態管理（jobId不要）
- POSTで開始、GETでステータス確認
- 既に処理中の場合は現在の状態を返す

### 2. メモリキャッシュ実装 (`cache-simple.ts`)
```typescript
// Redis不要のシンプルなキャッシュ
const cache = new Map<string, {
  data: any;
  timestamp: number;
  ttl: number;
}>();
```

特徴：
- Map使用の純粋なメモリキャッシュ
- 自動的な古いエントリの削除（500エントリ制限）
- TTLベースの有効期限管理

### 3. 管理画面の更新
- `handleOptimizedWarmup`関数を更新
- シンプルなポーリング処理を実装
- エラーハンドリングの改善

## 使用方法

### 管理画面から
1. キャッシュ管理画面を開く
2. 「最適化ウォームアップ」ボタンをクリック
3. リアルタイムで進捗を確認

### APIから
```bash
# ウォームアップ開始
curl -X POST http://localhost:3000/api/cache-warmup-simple \
  -H "Authorization: Bearer YOUR_TOKEN"

# ステータス確認
curl http://localhost:3000/api/cache-warmup-simple
```

### テストスクリプト
```bash
node test-simple-warmup.js
```

## 期待される改善

1. **404エラー解消**: 正しいエンドポイントで安定動作
2. **Redisエラー解消**: Redis依存を完全に排除
3. **処理時間**: 2-3分で全ページ処理完了
4. **シンプルな実装**: 理解しやすく保守しやすい

## 技術詳細

### 処理フロー
1. POST /api/cache-warmup-simple でウォームアップ開始
2. 重複除外されたページリストを取得（get-all-pages.ts）
3. 5ページずつバッチ処理
4. GET /api/cache-warmup-simple でステータス確認
5. 1秒ごとにポーリングで進捗更新

### エラーハンドリング
- タイムアウト: 15秒で個別ページ処理を中断
- 重複エラー: スキップとして処理継続
- 最大10個のエラーを保持（メモリ節約）

### パフォーマンス
- 並列度: 5ページ同時処理
- 待機時間: バッチ間1秒
- メモリ制限: キャッシュ500エントリ

## トラブルシューティング

### Q: まだRedisエラーが出る
A: 環境変数を確認：
```bash
USE_REDIS=false
DISABLE_REDIS=true
```

### Q: 処理が遅い
A: バッチサイズを調整：
```javascript
const BATCH_SIZE = 10; // デフォルト: 5
```

### Q: メモリ使用量が多い
A: キャッシュ制限を調整：
```javascript
if (cache.size > 300) { // デフォルト: 500
```