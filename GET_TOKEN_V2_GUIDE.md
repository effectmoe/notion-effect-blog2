# NOTION_TOKEN_V2 取得ガイド（画像付き）

## 手順

### 1. Notionにログイン
- https://www.notion.so にアクセス
- ログイン済みであることを確認

### 2. 開発者ツールを開く
- **Chrome/Edge**: F12キー
- **Safari**: Cmd + Option + I  
- **Firefox**: F12キー

### 3. Applicationタブを選択
開発者ツールで「Application」タブをクリック（Firefoxは「Storage」タブ）

### 4. Cookiesを展開
左側のメニューで：
1. 「Storage」セクションを見つける
2. 「Cookies」をクリックして展開
3. 「https://www.notion.so」をクリック

### 5. token_v2を探す
右側のテーブルに表示されるCookie一覧から：
- **Name**列で「token_v2」を探す
- 見つかったら、その行の**Value**列の値が必要な認証トークンです

### 6. 値をコピー
token_v2の値は通常、以下のような形式です：
- 長い文字列（100文字以上）
- ランダムな英数字の組み合わせ
- 例: `v02%3Auser_token_or_cookies%3A...（省略）...`

**重要**: Value列の値を**すべて**コピーしてください

### よくある問題

#### token_v2が見つからない場合
1. Notionに正しくログインしているか確認
2. ブラウザを更新（F5）してもう一度確認
3. 別のブラウザで試す
4. Notionからログアウトして、再度ログイン

#### 複数のtoken_v2がある場合
- 最新のもの（Expiresが最も未来の日付）を使用

## セキュリティ上の注意

⚠️ **token_v2は秘密情報です**
- 他人と共有しない
- 公開リポジトリにコミットしない
- 環境変数として安全に保管する

## 設定後の確認

Vercelに設定後、以下で確認：
```
https://notion-effect-blog2.vercel.app/api/test-env
```

「NOTION_TOKEN_V2: 設定済み」と表示されれば成功です。