# Notion ユーザーID 取得ガイド

## 取得手順（画像付き）

### 1. Notionにログイン
https://www.notion.so にアクセスしてログイン

### 2. 開発者ツールを開く
- Windows: `F12` または `Ctrl+Shift+I`
- Mac: `Cmd+Option+I`

### 3. Cookieを確認

#### Chrome/Edgeの場合：
1. **Application** タブをクリック
2. 左側メニューの **Storage** → **Cookies** → **https://www.notion.so**
3. Cookie一覧から探す：
   - `notion_user_id`: これがユーザーID

#### Firefoxの場合：
1. **Storage** タブをクリック
2. **Cookies** → **https://www.notion.so**
3. `notion_user_id` を探す

### 見つけるべきCookie

| Cookie名 | 説明 | 例 |
|---------|------|-----|
| notion_user_id | ユーザーID（必要） | e9a4c8f7-1234-5678-9abc-def123456789 |
| token_v2 | 認証トークン（既に設定済み） | 長い文字列 |

### よくある問題

1. **notion_user_id が見つからない場合**
   - Notionに正しくログインしているか確認
   - ブラウザを更新してみる
   - 別のブラウザで試す

2. **値の形式**
   - 正しい形式: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`
   - 8-4-4-4-12 文字のハイフン区切り

### 設定方法

Vercelの環境変数に追加：
- **Key**: NOTION_ACTIVE_USER
- **Value**: （コピーしたnotion_user_idの値）

例：
```
NOTION_ACTIVE_USER=e9a4c8f7-1234-5678-9abc-def123456789
```