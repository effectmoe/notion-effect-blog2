# Vercelサーバーレス環境対応 ウォームアップ修正

## 修正内容

### 1. 問題の原因
- Vercelのサーバーレス環境では、レスポンスを返した後に非同期処理を続行できない
- 従来の実装は`processAllPages`を非同期で開始してすぐにレスポンスを返していたため、実際の処理が行われていなかった

### 2. 解決策
- バックグラウンドジョブ方式からステートフルなバッチ処理方式に変更
- 管理画面から定期的にAPIを呼び出してバッチ処理を進める

### 3. 実装の変更点

#### cache-warmup-simple.ts
- `action`パラメータを追加して初期化と処理を分離
- `action`なし: ウォームアップの初期化（ページリスト取得）
- `action: "process"`: バッチ処理の実行
- バッチサイズを3に設定（タイムアウト対策）
- グローバル状態にページIDリストとバッチ番号を保持

#### CacheManagement.tsx
- `startBatchProcessing`関数を追加
- 2秒ごとにバッチ処理APIを呼び出す
- 進捗をリアルタイムで表示
- エラーハンドリングとリトライ機能

## テスト結果

✅ ローカルテストですべて成功
- 12ページを4バッチ（3ページずつ）で処理
- エラー: 0件
- 処理時間: 約70秒

## デプロイ手順

```bash
git add .
git commit -m "Fix cache warmup for Vercel serverless environment

- Change from async background processing to stateful batch processing
- Add action parameter to separate initialization and processing
- Implement batch processing with progress tracking
- Fix timeout issues in serverless environment
- Batch size set to 3 pages to avoid timeouts"

git push origin main
```

## 使用方法

### 管理画面から実行
1. `/admin`にアクセス
2. 「最適化ウォームアップ」をクリック
3. トークンを入力（求められた場合）
4. 自動的にバッチ処理が進行
5. 完了メッセージが表示されるまで待つ

### APIから直接実行
```bash
# 1. 初期化
curl -X POST https://your-domain.vercel.app/api/cache-warmup-simple \
  -H "Authorization: Bearer YOUR_TOKEN"

# 2. バッチ処理（複数回実行が必要）
curl -X POST https://your-domain.vercel.app/api/cache-warmup-simple \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"action": "process"}'

# 3. ステータス確認
curl https://your-domain.vercel.app/api/cache-warmup-simple
```

## 期待される結果

- すべてのページが正常に処理される
- エラーが発生しない
- Vercelのタイムアウトを回避
- 進捗がリアルタイムで確認できる