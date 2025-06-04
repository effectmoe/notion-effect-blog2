# Notion ハイブリッドAPI統合 - セットアップガイド

## 概要

このプロジェクトでは、Notion公式APIと非公式API（react-notion-x）を組み合わせたハイブリッドシステムを実装しています。これにより、数式プロパティなどの公式API限定機能を利用しながら、react-notion-xの高速なページレンダリングを維持できます。

## セットアップ手順

### 1. Notion Integrationの作成

1. [Notion Integrations](https://www.notion.so/my-integrations) にアクセス
2. 「新しいインテグレーション」をクリック
3. 以下の設定を行う：
   - 名前: `CafeKinesi Integration`（任意）
   - 関連付けるワークスペース: 対象のワークスペースを選択
   - 機能: 
     - コンテンツを読み取る: ON
     - コンテンツを更新する: OFF（読み取り専用で十分）
     - コンテンツを挿入する: OFF
   - ユーザー情報: なし

4. 「送信」をクリックして、表示される「内部インテグレーショントークン」をコピー

### 2. 環境変数の設定

`.env.local` ファイルに以下を追加：

```env
NOTION_API_SECRET=your-integration-token-here
```

### 3. Notionデータベースへのアクセス権限付与

1. Notionで対象のデータベースページを開く
2. 右上の「...」メニューから「接続を追加」を選択
3. 作成したインテグレーション（CafeKinesi Integration）を選択
4. 「確認」をクリック

**重要**: データベースの親ページにもインテグレーションを接続する必要があります。

### 4. 数式プロパティの設定

データベースに数式プロパティを追加する例：

1. データベースを開き、「+」ボタンで新しいプロパティを追加
2. プロパティタイプとして「数式」を選択
3. 例：最終更新日の数式
   ```
   formatDate(prop("Last edited time"), "YYYY年M月D日")
   ```

## 実装の詳細

### ハイブリッドAPIの仕組み

1. **ページコンテンツ**: 非公式API（react-notion-x）で取得
   - 高速なレンダリング
   - 完全なブロック情報

2. **プロパティデータ**: 公式APIで取得
   - 数式プロパティの値
   - 正確なメタデータ

### コンポーネント構成

- `lib/notion-api-hybrid.ts`: ハイブリッドAPIクライアント
- `components/NotionCollectionEnhanced.tsx`: 数式プロパティ対応のコレクションビュー
- `components/FormulaPropertyRenderer.tsx`: 個別の数式プロパティレンダラー

### 使用例

```tsx
// データベースビューでの数式プロパティ表示
<NotionCollectionEnhanced
  block={collectionBlock}
  recordMap={recordMap}
/>

// 個別ページでの数式プロパティ表示
<FormulaPropertyRenderer
  pageId={pageId}
  propertyName="最終更新日"
/>
```

## トラブルシューティング

### 数式プロパティが表示されない場合

1. **環境変数の確認**
   ```bash
   echo $NOTION_API_SECRET
   ```

2. **インテグレーションの権限確認**
   - データベースとその親ページの両方にインテグレーションが接続されているか確認

3. **APIレート制限**
   - Notion公式APIは3リクエスト/秒の制限があります
   - 大量のページがある場合は、順次取得するように実装されています

4. **デバッグ用エンドポイント**
   ```
   GET /api/test-formula?pageId=YOUR_PAGE_ID&propertyName=最終更新日
   ```

### パフォーマンスの最適化

1. **キャッシュの活用**
   - 数式プロパティは変更頻度が低いため、キャッシュが効果的

2. **並列処理**
   - 複数ページのプロパティは並列で取得

3. **フォールバック**
   - 公式APIが失敗した場合は、非公式APIのデータを使用

## 注意事項

1. **APIトークンの管理**
   - トークンは絶対に公開リポジトリにコミットしないでください
   - `.env.local` は `.gitignore` に含まれています

2. **Notionの仕様変更**
   - 非公式APIは仕様変更の影響を受ける可能性があります
   - 定期的な動作確認を推奨

3. **データの一貫性**
   - 公式APIと非公式APIのデータに差異が生じる可能性があります
   - 重要な情報は公式APIを優先

## 参考リンク

- [Notion API Documentation](https://developers.notion.com/)
- [react-notion-x Documentation](https://github.com/NotionX/react-notion-x)
- [Notion Integration Guide](https://developers.notion.com/docs/getting-started)