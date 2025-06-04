# Notion ハイブリッドAPI実装 - 実装完了報告

## 実装状況

プロジェクトでNotionハイブリッドAPIシステムの実装が完了しました。公式APIと非公式APIを組み合わせることで、数式プロパティなどの高度な機能をサポートしています。

## 現在の実装内容

### 1. ハイブリッドAPIクライアント (`lib/notion-api-hybrid.ts`)
- ✅ Notion公式SDK (`@notionhq/client`) がインストール済み
- ✅ 公式APIと非公式APIを統合するクラス実装済み
- ✅ フォーミュラプロパティ取得メソッド実装済み

### 2. 既存コンポーネント
- ✅ `FormulaPropertyRenderer.tsx` - 個別の数式プロパティ表示
- ✅ `NotionListItemEnhanced.tsx` - リストビューでの数式プロパティ表示
- ✅ 環境変数 `NOTION_API_SECRET` 設定済み

### 3. データベースビューでの数式プロパティ表示

現在、数式プロパティをデータベースビュー（リスト、テーブル、ギャラリーなど）で表示するには、以下の方法があります：

#### 方法1: カスタムプロパティフォーマッターを使用

`NotionPage.tsx`でカスタムプロパティフォーマッターを追加：

```tsx
// 数式プロパティ用のカスタムフォーマッター
const propertyFormulaValue = (
  { schema, block, data },
  defaultFn: () => React.ReactNode
) => {
  if (schema?.type === 'formula' && schema?.name === '最終更新日') {
    // ここで数式プロパティの値を取得・表示
    return <FormulaPropertyRenderer 
      pageId={block?.id}
      propertyName={schema.name}
    />
  }
  return defaultFn()
}

// componentsに追加
const components = React.useMemo<Partial<NotionComponents>>(
  () => ({
    // ... 他のコンポーネント
    propertyFormulaValue, // 追加
  }),
  []
)
```

#### 方法2: Last Edited Timeプロパティのカスタマイズ（実装済み）

現在、`propertyLastEditedTimeValue`で日付のみ表示するようカスタマイズ済み：

```tsx
const propertyLastEditedTimeValue = (
  { block, pageHeader },
  defaultFn: () => React.ReactNode
) => {
  if (pageHeader || block?.last_edited_time) {
    const lastEditedTime = block?.last_edited_time
    if (lastEditedTime) {
      const date = new Date(lastEditedTime)
      const formatted = `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`
      return <span className="notion-property-last_edited_time_formatted">{formatted}</span>
    }
  }
  return defaultFn()
}
```

## Notionでの設定手順

### 1. Notion Integrationの設定
1. [Notion Integrations](https://www.notion.so/my-integrations)でインテグレーションを作成
2. トークンを取得して `.env.local` に設定済み

### 2. データベースへの接続
1. データベースページで「...」→「接続を追加」
2. 作成したインテグレーションを選択
3. **重要**: データベースの親ページにも接続が必要

### 3. 数式プロパティの作成
データベースで数式プロパティを追加：
```
formatDate(prop("Last edited time"), "YYYY年M月D日")
```

## テストエンドポイント

数式プロパティが正しく取得できるかテスト：
```
GET /api/test-formula?pageId=YOUR_PAGE_ID&propertyName=最終更新日
```

## トラブルシューティング

### 数式プロパティが表示されない場合

1. **Notion側の確認**
   - インテグレーションがデータベースに接続されているか
   - 数式プロパティが正しく設定されているか

2. **API権限の確認**
   - 環境変数 `NOTION_API_SECRET` が正しく設定されているか
   - トークンが有効か

3. **デバッグ方法**
   - ブラウザの開発者ツールでコンソールログを確認
   - `/api/test-formula` エンドポイントでAPIレスポンスを確認

## 今後の拡張案

1. **キャッシュの実装**
   - 数式プロパティの値をキャッシュして性能向上

2. **他のプロパティタイプ対応**
   - リレーション、ロールアップなどの対応

3. **リアルタイム更新**
   - WebSocketを使用した自動更新

## まとめ

現在のシステムは以下を実現しています：
- ✅ 公式APIと非公式APIのハイブリッド統合
- ✅ 数式プロパティの取得機能
- ✅ 個別ページでの数式プロパティ表示
- ✅ 環境変数による設定管理
- ✅ エラーハンドリングとフォールバック

データベースビューでの数式プロパティ表示を完全に実装するには、上記の方法1のようなカスタムプロパティフォーマッターの追加実装が推奨されます。