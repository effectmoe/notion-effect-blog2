# Notion Collection (Database) 表示問題の修正ガイド

## 問題の概要
Notionデータベース（コレクション）が表示されない問題が発生していました。主な原因は：
1. コレクションデータがAPIから正しく取得されていない
2. block.collection_idとrecordMap内のコレクションIDが一致しない

## 実装した修正

### 1. NotionAPICollectionFix クラス
`lib/notion-api-collection-fix.ts`に新しいAPIクラスを作成：

```typescript
export class NotionAPICollectionFix extends NotionAPI {
  async getPage(pageId: string, options): Promise<ExtendedRecordMap> {
    // 1. 通常の方法でページを取得
    const recordMap = await super.getPage(pageId, options)
    
    // 2. コレクションビューブロックを検索
    // 3. コレクションデータがない場合は個別に取得
    // 4. syncRecordValuesを使用してデータを補完
  }
}
```

### 2. SafeCollectionViewBlock の改善
`components/SafeCollectionViewBlock.tsx`：
- useNotionContextからもデータを取得
- 複数のデータソースを検索
- 開発環境でのデバッグビュー追加

### 3. DebugCollectionView コンポーネント
`components/DebugCollectionView.tsx`：
- ブロック情報の詳細表示
- 利用可能なコレクションの一覧
- データ構造の可視化

## テスト方法

### 1. APIエンドポイントでテスト
```bash
# ページIDを指定してテスト
curl http://localhost:3001/api/test-collection?pageId=YOUR_PAGE_ID
```

### 2. ブラウザでの確認
1. データベースを含むページにアクセス
2. 開発者ツールのコンソールを開く
3. 以下のログを確認：
   - `[NotionAPICollectionFix] Fetching page:`
   - `[NotionAPICollectionFix] Found collection block:`
   - `[SafeCollectionViewBlock] Attempting to find collection data:`

## トラブルシューティング

### データベースが表示されない場合

1. **Notion側の設定確認**
   - データベースがインテグレーションと共有されているか
   - インテグレーションに適切な権限があるか

2. **環境変数の確認**
   ```bash
   NOTION_API_SECRET=ntn_xxxxxxxxxxxxx  # 正しいトークン
   NOTION_API_BASE_URL=https://www.notion.so/api/v3
   ```

3. **デバッグモードの有効化**
   開発環境では自動的にDebugCollectionViewが表示されます

### よくあるエラーと対処法

1. **"Missing collection data"**
   - 原因：コレクションIDが一致しない
   - 対処：NotionAPICollectionFixが自動的に修正を試みます

2. **"Cannot read property 'collection' of undefined"**
   - 原因：recordMapが正しく取得されていない
   - 対処：APIトークンと権限を確認

3. **タイムアウトエラー**
   - 原因：大きなデータベースの取得に時間がかかる
   - 対処：chunkLimitを調整

## 今後の改善点

1. **キャッシュの実装**
   - コレクションデータをキャッシュして高速化

2. **エラーハンドリングの強化**
   - より詳細なエラーメッセージ
   - ユーザーフレンドリーなフォールバック

3. **パフォーマンスの最適化**
   - 必要なデータのみを取得
   - 並列処理の活用