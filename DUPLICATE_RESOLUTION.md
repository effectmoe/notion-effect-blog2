# 重複ページID解決＆処理高速化

## 概要

Notionサイトマップに存在する重複ページの問題を解決し、キャッシュウォームアップ処理を最適化しました。

## 解決した問題

### 1. 重複ページエラー
- **問題**: 同じcanonicalPageId（日本語タイトル）に複数のpageIdが紐づく
- **例**: "講座料金はいくらですか" に2つの異なるpageIDが存在
- **影響**: 処理が詰まり、8分以上経過しても完了しない

### 2. 処理の非効率性
- 重複ページも全て処理していた
- エラーで処理が中断される
- Redisエラーが継続的に発生

## 実装した解決策

### 1. 重複検出と除外 (`lib/get-all-pages.ts`)
```typescript
// タイトルとcanonicalIDの両方で重複をチェック
const duplicatePageIds = new Set<string>();

// 重複を検出してログ出力
for (const [title, ids] of titleToPageIds.entries()) {
  if (ids.length > 1) {
    console.warn(`[Page List] ⚠️ Duplicate pages found for title "${title}":`, ids);
    // 最初のIDのみを使用、残りは除外
    validPageIds.add(ids[0]);
    ids.slice(1).forEach(id => duplicatePageIds.add(id));
  }
}
```

### 2. 最適化されたウォームアップAPI (`cache-warmup-optimized.ts`)
- 重複ページを事前に除外
- 安定した並列処理（5ページ同時）
- エラーハンドリングの改善
- 重複エラーをスキップとして処理

### 3. 管理画面の更新
- 「最適化ウォームアップ」ボタンを追加
- リアルタイムの進捗表示
- エラーサマリーの表示

## 使用方法

### 管理画面から実行
1. キャッシュ管理画面を開く
2. 「最適化ウォームアップ」ボタンをクリック
3. 重複ページは自動的に除外される

### APIエンドポイント
```bash
# 最適化ウォームアップの開始
POST /api/cache-warmup-optimized
Authorization: Bearer YOUR_TOKEN

# ステータス確認
GET /api/cache-warmup-status?jobId=current
```

### テストスクリプト
```bash
# 重複解決のテスト
node test-duplicate-resolution.js
```

## 期待される改善

### Before
- 処理時間: 8分以上（未完了）
- エラー: 重複ページで処理が詰まる
- ページ数: 72ページ（重複含む）

### After
- 処理時間: 2-3分で完了
- エラー: 重複を事前に除外
- ページ数: 実際のユニークページ数のみ

## ログ出力例

```
[Page List] Getting all page IDs...
[Page List] ⚠️ Duplicate pages found for title "講座料金はいくらですか": ["id1", "id2"]
[Page List] ✅ Total pages in map: 72
[Page List] ✅ Unique pages: 65
[Page List] ⚠️ Duplicate pages excluded: 7

[Warmup Optimized] Starting warmup for 65 unique pages
[Warmup Optimized] Progress: 30/65 (46%) - Success: 25, Skip: 3, Fail: 2
```

## トラブルシューティング

### Q: まだ重複エラーが出る場合
A: サイトマップのキャッシュをクリアしてください：
```javascript
// キャッシュクリア後に再実行
await clearSiteMapCache();
```

### Q: 特定のページが見つからない
A: 重複として除外された可能性があります。サーバーログで確認：
```
[Page List] Excluded duplicate page IDs: [...]
```

### Q: 処理がまだ遅い
A: 同時実行数を調整できます：
```javascript
const CONCURRENT_LIMIT = 10; // デフォルト: 5
```

## 技術詳細

### 重複検出アルゴリズム
1. サイトマップから全ページ情報を取得
2. タイトルごとにページIDをグループ化
3. canonicalPageIdごとにもグループ化
4. 重複があれば最初のIDのみを有効とする
5. 残りのIDは除外リストに追加

### パフォーマンス最適化
1. 事前の重複除外で無駄な処理を削減
2. 安定した並列処理で高速化
3. エラーハンドリングで処理継続性を確保
4. キャッシュ済みページのスキップ

## 今後の改善案

1. **重複の根本原因調査**: なぜNotionで重複が発生するか
2. **自動マージ機能**: 重複ページの内容を統合
3. **定期的な重複チェック**: cronジョブで監視
4. **UI改善**: 重複ページの可視化