# 🍞 パンくずリスト自動生成システム実装完了

## ✅ 実装内容

### 1. ユーティリティ関数 (`lib/breadcrumb-utils.ts`)
- **getBreadcrumbs()**: Notionの階層構造から自動的にパンくずを生成
- **getBreadcrumbJsonLd()**: SEO用の構造化データを生成
- 無限ループ防止機能付き
- ルートページの自動認識

### 2. 自動生成コンポーネント (`components/AutoBreadcrumb.tsx`)
- Notionページの親子関係を自動解析
- JSON-LD構造化データの自動挿入
- カスタマイズ可能なオプション
  - `separator`: 区切り文字（デフォルト: ›）
  - `showHome`: ホームを表示するか
  - `homeLabel`: ホームのラベル

### 3. NotionPageへの統合
- ホームページ以外で自動表示
- ヘッダー直下に配置
- レスポンシブ対応

## 🎯 特徴

### メンテナンスフリー
```
❌ 手動更新: 不要
✅ ページ移動: 自動追従
✅ タイトル変更: 自動反映
✅ 階層変更: 自動対応
```

### SEO/LLMO最適化
```json
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    {
      "@type": "ListItem",
      "position": 1,
      "name": "ホーム",
      "item": "https://example.com/"
    },
    {
      "@type": "ListItem",
      "position": 2,
      "name": "製品情報",
      "item": "https://example.com/products"
    }
  ]
}
```

### アクセシビリティ
- `aria-label="パンくずリスト"`
- `aria-current="page"` で現在位置を明示
- キーボードナビゲーション対応

## 📐 表示例

```
ホーム › 製品情報 › プレミアムシリーズ › ラベンダーオイル
```

### 階層構造
1. **ホーム**: 常に先頭（オプションで非表示可）
2. **親ページ**: 自動的に取得
3. **現在のページ**: リンクなしのテキスト

## 🔧 カスタマイズ

### 基本使用
```tsx
<AutoBreadcrumb
  pageId={pageId}
  recordMap={recordMap}
  rootPageId={site.rootNotionPageId}
/>
```

### カスタマイズ例
```tsx
<AutoBreadcrumb
  pageId={pageId}
  recordMap={recordMap}
  rootPageId={site.rootNotionPageId}
  separator="/"
  homeLabel="トップ"
  showHome={false}
  className="custom-breadcrumb"
/>
```

## 📊 メリット

1. **正確性**: 常に現在の階層を正確に表示
2. **メンテナンス性**: 一切の手動更新不要
3. **SEO効果**: 構造化データで検索エンジンに階層を伝達
4. **UX向上**: ユーザーの現在位置を明確化

## ⚠️ 注意事項

- Notionでページを深くネストしすぎると、パンくずが長くなる
- モバイルでは自動的に省略表示される（CSS対応済み）
- ホームページでは表示されない

## 🚀 今後の拡張可能性

1. **省略表示**: 深い階層での「...」表示
2. **アイコン対応**: ページタイプごとのアイコン表示
3. **カスタムスタイル**: テーマ別のデザイン切り替え

---

実装完了日: 2024年12月31日