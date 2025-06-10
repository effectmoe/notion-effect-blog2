# Notionデータベース設定ガイド

Notionデータベースが表示されない場合の設定確認手順です。

## 1. Notionインテグレーションの設定確認

### ステップ1: インテグレーションの作成/確認
1. https://www.notion.so/my-integrations にアクセス
2. 使用しているインテグレーションを確認
3. 「Capabilities」で以下が有効になっているか確認：
   - Read content
   - Read comments
   - Read user information

### ステップ2: データベースの共有設定
1. Notionでデータベースを含むページを開く
2. 右上の「...」メニューをクリック
3. 「Connections」または「接続」を選択
4. 使用しているインテグレーションを追加（まだ追加されていない場合）
5. インテグレーションにアクセス権限があることを確認

## 2. データベースの設定確認

### 確認項目：
1. **データベースタイプ**
   - Table view（テーブルビュー）
   - Gallery view（ギャラリービュー）
   - Board view（ボードビュー）
   - List view（リストビュー）
   - Calendar view（カレンダービュー）

2. **データベースの場所**
   - インラインデータベース（ページ内に埋め込まれている）
   - フルページデータベース（独立したページ）

3. **フィルターとソート**
   - 複雑なフィルターが設定されていないか
   - ソート条件が適切か

## 3. APIトークンの権限確認

`.env.local`ファイルのトークンが正しいか確認：
```bash
NOTION_API_SECRET=ntn_xxxxxxxxxxxxx
```

このトークンは以下から取得できます：
1. https://www.notion.so/my-integrations
2. 対象のインテグレーションをクリック
3. 「Secrets」タブから「Internal Integration Secret」をコピー

## 4. デバッグ手順

### ブラウザの開発者ツールで確認：
1. **Console**タブ
   ```javascript
   // ページのrecordMapを確認
   console.log(window.__recordMap);
   
   // collection関連のデータを確認
   console.log(window.__recordMap?.collection);
   console.log(window.__recordMap?.collection_view);
   console.log(window.__recordMap?.collection_query);
   ```

2. **Network**タブ
   - `loadPageChunk`のリクエストを確認
   - `queryCollection`のリクエストを確認
   - レスポンスにcollectionデータが含まれているか確認

### サーバーログで確認：
開発環境の場合：
```bash
npm run dev
```

ターミナルに表示されるログで以下を確認：
- `Fetching page with collections...`
- `Page fetched successfully with collections:`
- コレクション関連のカウント数

## 5. 一般的な問題と解決策

### 問題1: データベースが共有されていない
**解決策**: 上記のステップ2を実行してデータベースをインテグレーションと共有

### 問題2: APIトークンの権限不足
**解決策**: 新しいインテグレーションを作成し、適切な権限を設定

### 問題3: データベースのビュータイプがサポートされていない
**解決策**: Table viewまたはGallery viewを使用

### 問題4: データベースが複雑すぎる
**解決策**: シンプルなテーブルビューでテスト

### 問題5: プライベートページ内のデータベース
**解決策**: データベースを含むページ全体をインテグレーションと共有

## 6. テスト用のシンプルなデータベース作成

問題の切り分けのため、以下の手順でテスト用データベースを作成：

1. Notionで新しいページを作成
2. `/table`と入力してテーブルを作成
3. シンプルなカラムを追加（Name, Status, Date など）
4. いくつかのサンプルデータを入力
5. ページをインテグレーションと共有
6. このページのIDでアプリケーションをテスト

## 7. 追加のデバッグオプション

`lib/notion.ts`でデバッグモードを有効化：
```javascript
export async function getPageWithCache(pageId: string) {
  console.log('Getting page with cache:', pageId);
  
  const recordMap = await notion.getPage(pageId, {
    fetchCollections: true,
    fetchMissingBlocks: true,
    // デバッグ用に詳細ログを有効化
    kyOptions: {
      hooks: {
        beforeRequest: [
          request => {
            console.log('Notion API Request:', request.url);
          }
        ],
        afterResponse: [
          response => {
            console.log('Notion API Response:', response.status);
          }
        ]
      }
    }
  });
  
  console.log('RecordMap collections:', {
    collectionCount: Object.keys(recordMap.collection || {}).length,
    collectionViewCount: Object.keys(recordMap.collection_view || {}).length,
    collectionQueryCount: Object.keys(recordMap.collection_query || {}).length
  });
  
  return recordMap;
}
```

これらの手順に従って設定を確認し、問題を特定してください。