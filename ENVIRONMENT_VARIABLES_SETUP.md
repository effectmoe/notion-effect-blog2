# 環境変数設定ガイド

## 必要な環境変数

### 1. NOTION_TOKEN_V2 (必須)
- **現在の名前**: NOTION_AUTH_TOKEN
- **変更先**: NOTION_TOKEN_V2
- **説明**: Notionの認証トークン（token_v2クッキーの値）
- **取得方法**: 
  1. Notionをブラウザで開く
  2. F12で開発者ツールを開く
  3. Application → Cookies → www.notion.so
  4. `token_v2` の値をコピー

### 2. NOTION_ACTIVE_USER (必須)
- **現在**: 未設定
- **必要な値**: Notionのユーザー ID
- **取得方法**:
  1. 同じく開発者ツールのCookies
  2. `notion_user_id` の値をコピー

### 3. NOTION_SEARCH_API_SECRET (オプション)
- **値**: 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
- **説明**: 検索専用のNotion APIキー

## Vercelでの設定手順

1. https://vercel.com/effectmoes-projects/notion-effect-blog2/settings/environment-variables にアクセス

2. 既存の環境変数を更新：
   - `NOTION_AUTH_TOKEN` の名前を `NOTION_TOKEN_V2` に変更
   - または新しく `NOTION_TOKEN_V2` を作成して同じ値を設定

3. 新規追加：
   - **Key**: NOTION_ACTIVE_USER
   - **Value**: （Cookieから取得したnotion_user_idの値）
   - **Environment**: Production, Preview, Development すべてにチェック

4. オプション追加：
   - **Key**: NOTION_SEARCH_API_SECRET
   - **Value**: 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
   - **Environment**: Production, Preview, Development すべてにチェック

5. "Save" をクリック

6. デプロイメントを再実行（Redeploy）

## 確認方法

環境変数設定後：
1. https://notion-effect-blog2.vercel.app/api/test-env にアクセス
2. すべての変数が「設定済み」と表示されることを確認

その後：
1. https://notion-effect-blog2.vercel.app/test-search で「インデックス構築」を実行
2. https://notion-effect-blog2.vercel.app/test-search-simple で検索テスト