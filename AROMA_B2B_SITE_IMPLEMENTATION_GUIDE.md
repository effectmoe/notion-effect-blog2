# アロマテックジャパン B2Bサイト実装ガイド

## 🎯 プロジェクト概要

このガイドは、現在のNotionブログをアロマ製造メーカーのB2B向けコーポレートサイトに変更するための完全な実装手順です。

## 📋 実装済みコンポーネント

### 1. 基本設定
- **site.config.ts**: アロマテックジャパン株式会社の情報に更新済み
- **robots.txt**: AI/LLMボット向け設定を追加（LLMO対策）
- **PageHead.tsx**: B2B向けメタデータを追加

### 2. 新規作成コンポーネント

#### 構造化データ（StructuredData.jsx）
- Organization（企業情報）
- Product（製品情報）
- FAQPage（よくある質問）
- Service（サービス）
- WebPage（ウェブページ）
- BreadcrumbList（パンくずリスト）

#### UIコンポーネント
- **FAQ.tsx / FAQ.module.css**: アコーディオン形式のFAQセクション
- **CTASection.tsx / CTASection.module.css**: コンバージョン促進用CTAセクション
- **Breadcrumb.tsx / Breadcrumb.module.css**: パンくずリストナビゲーション
- **Navigation.jsx / Navigation.module.css**: 階層型メガメニューナビゲーション

## 🗄️ Notionデータベース構造の設定

### 必要なNotionページ構造

```
🏢 アロマテックジャパン（ルートページ）
├── 📋 会社情報
│   ├── 会社概要
│   ├── 経営理念・ビジョン
│   ├── 代表メッセージ
│   ├── 沿革
│   └── アクセス
├── 🌿 製品情報
│   ├── 製品一覧
│   ├── プレミアムシリーズ
│   ├── ビジネスソリューション
│   ├── OEM製品事例
│   └── 品質保証
├── 🔧 OEM・カスタマイズ
│   ├── OEM製造について
│   ├── 開発フロー
│   ├── カスタムブレンド
│   ├── パッケージデザイン
│   └── OEM実績
├── 🤝 パートナーシップ
│   ├── 代理店募集
│   ├── パートナー特典
│   ├── 契約の流れ
│   ├── サポート体制
│   └── よくあるご質問
├── 💡 導入事例
│   ├── ホテル・宿泊施設
│   ├── 医療・介護施設
│   ├── オフィス・商業施設
│   └── スパ・サロン
└── 📞 お問い合わせ
    ├── 無料相談
    ├── 資料請求
    ├── サンプル請求
    ├── お見積もり
    └── 商談申込
```

### Notionページプロパティの推奨設定

各ページに以下のプロパティを追加することを推奨：

```
- タイトル（Title）: ページ名
- 説明（Description）: メタディスクリプション用
- カテゴリ（Category）: ページ分類
- 公開日（PublishedDate）: 公開日時
- 更新日（LastEditedTime）: 最終更新日時
- 検索対象（Searchable）: チェックボックス
- ページタイプ（PageType）: 選択（Company/Product/Service/Case/Contact）
- 優先度（Priority）: 数値（サイトマップ用）
```

## 🚀 実装手順

### Phase 1: 基本設定（完了済み）
1. ✅ site.config.ts の更新
2. ✅ 構造化データコンポーネントの作成
3. ✅ robots.txt の更新
4. ✅ メタデータの最適化

### Phase 2: UIコンポーネント実装（完了済み）
1. ✅ FAQコンポーネントの作成
2. ✅ CTAセクションコンポーネントの作成
3. ✅ パンくずリストコンポーネントの作成
4. ✅ ナビゲーションコンポーネントの作成

### Phase 3: Notionコンテンツ作成（要実施）

#### 1. トップページコンテンツ
```markdown
# 天然アロマオイルで、ビジネスに新たな価値を

## 私たちについて
アロマテックジャパンは、20年以上の実績を持つ天然アロマオイル専門メーカーです。
厳選された原料と独自の製造技術により、最高品質のアロマ製品を提供しています。

## 3つの強み
1. **品質へのこだわり** - ISO9001認証取得、全ロット検査実施
2. **豊富な実績** - 国内500社以上の導入実績
3. **カスタマイズ対応** - お客様のニーズに合わせたOEM製造

[CTAセクション: 資料請求・無料相談]
[FAQ: よくあるご質問]
```

#### 2. 製品ページコンテンツ例
```markdown
# プレミアムアロマオイル

## ラベンダー・プロヴァンス
- 原産地：フランス・プロヴァンス地方
- 純度：100%天然
- 容量：10ml, 50ml, 100ml, 1L
- 用途：リラクゼーション、ホテル、スパ

### 特徴
- 最高品質のラベンダーを使用
- 独自の蒸留技術で香りを保持
- ロットごとの成分分析表付き

[構造化データ: Product]
[CTA: サンプル請求]
```

## 💻 コンポーネントの使用方法

### 構造化データの実装
```jsx
import StructuredData from '@/components/StructuredData'

// 組織情報
<StructuredData pageType="Organization" />

// 製品情報
<StructuredData 
  pageType="Product" 
  data={{
    name: "ラベンダーオイル",
    description: "フランス産最高品質",
    price: "お問い合わせください"
  }}
/>
```

### FAQセクションの実装
```jsx
import FAQ, { defaultFAQItems } from '@/components/FAQ'

// デフォルトFAQを使用
<FAQ items={defaultFAQItems} />

// カスタムFAQ
<FAQ 
  items={[
    {
      question: "最小ロットは？",
      answer: "1Lから対応可能です",
      category: "ご注文"
    }
  ]}
  title="よくあるご質問"
/>
```

### CTAセクションの実装
```jsx
import CTASection, { CTAPresets } from '@/components/CTASection'

// プリセットを使用
<CTASection {...CTAPresets.catalogRequest} />

// カスタムCTA
<CTASection
  title="ビジネスに最適なアロマソリューションを"
  subtitle="まずは無料相談から"
  buttons={[
    {
      text: "無料相談を申し込む",
      href: "/contact/consultation",
      variant: "primary"
    }
  ]}
/>
```

### パンくずリストの実装
```jsx
import Breadcrumb, { BreadcrumbPresets } from '@/components/Breadcrumb'

// プリセットを使用
<Breadcrumb items={BreadcrumbPresets.products("ラベンダーオイル")} />

// カスタムパンくずリスト
<Breadcrumb 
  items={[
    { name: "製品情報", url: "/products" },
    { name: "プレミアムシリーズ", url: "/products/premium" }
  ]}
/>
```

## 🎨 デザインカスタマイズ

### CSS変数の設定
```css
:root {
  --primary-color: #2E7D32; /* アロマグリーン */
  --primary-hover-color: #1B5E20;
  --secondary-color: #8BC34A;
  --accent-color: #FFC107;
  --bg-color: #FFFFFF;
  --bg-color-alt: #F5F5F5;
  --fg-color: #212121;
  --fg-color-lighter: #757575;
  --border-color: #E0E0E0;
}
```

## 📊 LLMO（Large Language Model Optimization）対策

### 実装済みの対策
1. **構造化データ**: Schema.orgマークアップ
2. **メタデータ最適化**: AI向け追加メタタグ
3. **robots.txt**: AI/LLMボット許可設定
4. **FAQ実装**: よくある質問の構造化
5. **階層的ナビゲーション**: 明確なサイト構造

### 推奨される追加対策
1. **コンテンツの充実**: 各ページ2000文字以上
2. **内部リンク**: 関連ページへの適切なリンク
3. **更新頻度**: 定期的なコンテンツ更新
4. **サイトマップ**: XMLサイトマップの最適化

## 🔍 SEO最適化チェックリスト

- [ ] 各ページにユニークなタイトルとメタディスクリプション
- [ ] 構造化データの実装
- [ ] パンくずリストの設置
- [ ] 適切な見出し階層（H1-H6）
- [ ] 画像のalt属性設定
- [ ] 内部リンクの最適化
- [ ] モバイルフレンドリー対応
- [ ] ページ読み込み速度の最適化

## 📈 今後の拡張案

1. **多言語対応**: 英語・中国語版の追加
2. **チャットボット**: AI相談機能の実装
3. **会員専用ページ**: パートナー向け情報
4. **EC機能**: オンライン見積もり・発注システム
5. **ブログ機能**: アロマ知識・業界情報の発信

## 🛠️ トラブルシューティング

### よくある問題と解決方法

1. **Notionページが表示されない**
   - rootNotionPageIdが正しいか確認
   - Notion APIトークンの設定を確認

2. **スタイルが適用されない**
   - CSS Modulesのインポートを確認
   - クラス名の競合をチェック

3. **構造化データが認識されない**
   - Google構造化データテストツールで検証
   - JSON-LDの文法エラーをチェック

## 📞 サポート

実装に関する質問や問題がある場合は、以下を参照してください：

- Notion API ドキュメント
- Next.js ドキュメント
- react-notion-x ドキュメント

---

このガイドに従って実装を進めることで、SEO/LLMO最適化されたB2Bアロマメーカーサイトを構築できます。