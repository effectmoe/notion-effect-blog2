# 🍞 パンくずリスト自動生成システム 完全ガイド

## 📋 概要

Notionのページ階層構造から自動的にパンくずリストを生成するシステムを実装しました。手動更新は一切不要で、ページの移動や名前変更に自動的に追従します。

---

## 🗂️ 実装ファイル構成

### 1. コアロジック
```
lib/breadcrumb-utils.ts
├── getBreadcrumbs() - 階層構造の解析
└── getBreadcrumbJsonLd() - SEO構造化データ生成
```

### 2. UIコンポーネント
```
components/AutoBreadcrumb.tsx - 表示コンポーネント
components/Breadcrumb.module.css - スタイリング（既存）
```

### 3. 統合部分
```
components/NotionPage.tsx - L414-420で呼び出し
components/styles.module.css - L33-39でレイアウト調整
```

---

## 🔧 実装の仕組み

### 1. 階層解析プロセス
```typescript
// 現在のページから親ページを辿る処理
1. 現在のページIDから開始
2. recordMapから親ページを取得
3. ルートページに到達するまで繰り返し
4. 訪問済みページをSetで管理（無限ループ防止）
5. 配列の先頭にホームを追加
```

### 2. 表示制御
```tsx
// NotionPage.tsx での制御
{pageId !== site.rootNotionPageId && (
  <AutoBreadcrumb
    pageId={pageId}
    recordMap={recordMap}
    rootPageId={site.rootNotionPageId}
  />
)}
```
- **ホームページでは非表示**
- **階層が1つの場合も非表示**

### 3. SEO最適化
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
    }
  ]
}
```

---

## ⚠️ 注意事項

### 1. Notionでの階層構造
```
❌ 避けるべき構造:
- 循環参照（A→B→C→A）
- 極端に深い階層（5階層以上）
- 同じ名前の連続

✅ 推奨される構造:
- 明確な親子関係
- 2-4階層程度
- わかりやすいページ名
```

### 2. パフォーマンス考慮事項
- **キャッシュ**: useMemoで結果をキャッシュ
- **再計算**: pageId、recordMap変更時のみ
- **無限ループ防止**: visitedPagesセットで管理

### 3. スタイリングの制約
```css
/* 既存のBreadcrumb.module.cssを使用 */
- カスタマイズする場合は既存クラスを上書き
- モバイル対応は自動（文字省略あり）
- ダークモード対応済み
```

---

## 📖 使用方法

### 基本的な使用（現在の実装）
```tsx
// 自動的にNotionPage内で呼び出される
// 開発者が直接触る必要なし
```

### カスタマイズが必要な場合
```tsx
<AutoBreadcrumb
  pageId={pageId}
  recordMap={recordMap}
  rootPageId={rootPageId}
  separator=" / "        // デフォルト: "›"
  homeLabel="TOP"       // デフォルト: "ホーム"
  showHome={false}      // デフォルト: true
  className="custom"    // 追加CSS
/>
```

---

## 🚀 今後の運用方法

### 1. 日常的な運用
```
開発者の作業：
- なし（完全自動）

コンテンツ編集者の作業：
- Notionでページを適切な階層に配置
- わかりやすいページタイトルを設定
```

### 2. トラブルシューティング

#### パンくずが表示されない
```
確認項目:
□ ホームページではないか
□ ページに親ページが設定されているか
□ recordMapにページ情報が含まれているか
```

#### 間違った階層が表示される
```
確認項目:
□ Notionでの親子関係が正しいか
□ 循環参照がないか
□ キャッシュの問題（ページリロード）
```

### 3. 拡張・改修時の注意

#### 機能追加時
```typescript
// breadcrumb-utils.ts を編集
// 例：アイコン追加
export interface BreadcrumbItem {
  id: string
  title: string
  url: string
  icon?: string  // 追加
}
```

#### スタイル変更時
```css
/* 新しいCSSファイルで上書き */
.customBreadcrumb {
  /* Breadcrumb.module.css のクラスを上書き */
}
```

---

## 📊 効果測定

### SEO効果の確認
1. **Google Search Console**
   - パンくずリッチリザルトの表示確認
   - 構造化データの検証

2. **構造化データテストツール**
   ```
   https://search.google.com/test/rich-results
   ```

### ユーザビリティ指標
- 直帰率の改善
- ページ間の回遊率向上
- 平均滞在時間の増加

---

## 🔄 メンテナンス

### 定期確認項目（月次）
- [ ] 構造化データのエラーチェック
- [ ] 極端に深い階層がないか確認
- [ ] モバイルでの表示確認

### アップデート時の確認
- [ ] react-notion-xのバージョンアップ時の互換性
- [ ] Next.jsアップデート時の動作確認
- [ ] 新しいSEO要件への対応

---

## 💡 ベストプラクティス

### 1. Notion側の構造設計
```
🏠 ホーム
├── 📁 製品情報
│   ├── 📄 カテゴリA
│   │   └── 📄 製品詳細
│   └── 📄 カテゴリB
└── 📁 サポート
    └── 📄 FAQ
```

### 2. ページタイトルの付け方
```
✅ 良い例:
- 明確で簡潔
- カテゴリを示す
- 階層がわかる

❌ 悪い例:
- 長すぎる（30文字以上）
- 記号の多用
- 同じ名前の繰り返し
```

### 3. 階層の深さ
```
推奨: 2-3階層
許容: 4階層まで
避ける: 5階層以上
```

---

## 🆘 トラブル対応連絡先

技術的な問題が発生した場合：
1. このドキュメントで解決策を確認
2. `components/AutoBreadcrumb.tsx` のコメント参照
3. `lib/breadcrumb-utils.ts` の実装確認

---

## 📝 変更履歴

| 日付 | 変更内容 | 実装者 |
|------|---------|--------|
| 2024/12/31 | 初期実装 | Claude Code |

---

*このドキュメントは、パンくずリスト自動生成システムの技術仕様と運用ガイドです。*
*最終更新: 2024年12月31日*