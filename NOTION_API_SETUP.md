# Notion API統合設定ガイド

このプロジェクトは公式Notion APIと非公式APIの両方をサポートしています。

## 公式Notion APIの設定手順

### 1. Notion統合の作成

1. [Notion開発者ポータル](https://www.notion.so/my-integrations)にアクセス
2. 「新しいインテグレーション」をクリック
3. 必要な情報を入力：
   - 名前: 任意の名前（例：「My Blog Integration」）
   - 関連付けるワークスペース: あなたのワークスペースを選択
4. 「送信」をクリックして統合を作成

### 2. 統合トークンの取得

1. 作成した統合のページで「Internal Integration Token」をコピー
2. `.env.local`ファイルに追加：
   ```
   NOTION_API_SECRET=secret_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```

### 3. データベースへのアクセス許可

1. Notionで対象のデータベースページを開く
2. 右上の「...」メニューから「接続」を選択
3. 作成した統合を検索して選択
4. 「確認」をクリック

### 4. 動作確認

テストエンドポイントで確認：
```
http://localhost:3000/api/test-formula?pageId=YOUR_PAGE_ID&propertyName=最終更新日
```

## 機能の違い

### 非公式API（notion-client）
- ✅ ページ全体のコンテンツ取得
- ✅ 画像・ファイルの署名付きURL取得
- ✅ 検索機能
- ❌ フォーミュラプロパティの値取得

### 公式API（@notionhq/client）
- ✅ フォーミュラプロパティの値取得
- ✅ データベースプロパティの詳細情報
- ✅ より安定したAPI
- ❌ ページコンテンツの詳細取得に制限

## トラブルシューティング

### フォーミュラプロパティが表示されない場合

1. 統合がデータベースに接続されているか確認
2. プロパティ名が正しいか確認（「最終更新日」など）
3. ブラウザの開発者ツールでコンソールエラーを確認
4. `/api/test-formula`エンドポイントでAPIレスポンスを確認

### エラー: "Invalid request URL"

- ページIDの形式を確認（ハイフンありでもなしでもOK）
- 統合のアクセス権限を確認

### エラー: "Unauthorized"

- 統合トークンが正しくコピーされているか確認
- データベースに統合が接続されているか確認