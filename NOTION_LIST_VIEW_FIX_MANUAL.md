# Notionリストビュー重複タイトル修正マニュアル

## 📋 概要

Notion + react-notion-x環境でリストビュー表示時に発生する「タイトルブロック」と「ページプロパティのタイトル」の重複表示問題を解決するための実装手順書です。

## 🔍 問題の詳細

### 現象
```
┌─ notion-list-body ─────────────────────────────┐
│                                                │
│  ┌─ notion-list-item notion-page-link ────┐   │
│  │                                        │   │
│  │  ┌─ notion-list-item-title ──────┐    │   │
│  │  │  タイトルブロック ✅           │    │   │
│  │  └───────────────────────────────┘    │   │
│  │  ┌─ notion-property-title ───────┐    │   │
│  │  │  ページプロパティ（重複）❌     │    │   │
│  │  └───────────────────────────────┘    │   │
│  └────────────────────────────────────────┘   │
└────────────────────────────────────────────────┘
```

### 原因
react-notion-xがリストビューをレンダリングする際に、以下の2つの要素が生成される：
1. **タイトルブロック** (`.notion-list-item-title`) - メインのタイトル表示
2. **プロパティタイトル** (`.notion-property-title`) - データベースプロパティとしてのタイトル

## 🛠️ 解決方法

### 方針B: CSS非表示による修正（推奨）

最もシンプルで保守性の高い方法です。

#### 実装手順

1. **ファイルを開く**
   ```bash
   # プロジェクトのstyles/notion.cssを開く
   /styles/notion.css
   ```

2. **CSSルールを追加**
   
   以下のCSSコードをnotion.cssファイルの最後に追加します：

   ```css
   /* リストビューでの重複タイトルプロパティを非表示にする - 改善版 */

   /* リストアイテム内の重複するタイトルプロパティを非表示 */
   .notion-list-item .notion-property.notion-property-title {
     display: none !important;
   }

   /* より具体的なセレクタで確実に非表示にする */
   .notion-list-body .notion-list-item .notion-property-title {
     display: none !important;
   }

   /* リスト内のプロパティとしてのタイトルを非表示 */
   .notion-list-item .notion-list-item-property.notion-property-title {
     display: none !important;
   }

   /* モダンブラウザ向け: has()セレクタを使用してより確実に非表示 */
   .notion-list-item:has(.notion-list-item-title) .notion-property-title {
     display: none !important;
   }

   /* リストビューでのタイトル列ヘッダーも非表示にする */
   .notion-list-view .notion-property-title {
     display: none !important;
   }

   /* コレクションリスト内でのタイトルプロパティを非表示 */
   .notion-collection-list .notion-property-title {
     display: none !important;
   }

   /* リストアイテムのタイトル部分は表示を維持 */
   .notion-list-item-title {
     display: block !important;
   }

   /* リストアイテムのスタイリング改善 */
   .notion-list-item {
     padding: 16px 0;
     border-bottom: 1px solid rgba(55, 53, 47, 0.09);
   }

   .dark-mode .notion-list-item {
     border-bottom-color: rgba(255, 255, 255, 0.094);
   }

   .notion-list-item:last-child {
     border-bottom: none;
   }

   /* リストアイテムタイトルのスタイリング */
   .notion-list-item-title {
     font-size: 16px;
     line-height: 1.5;
     font-weight: 500;
   }

   /* リストビュー全体のレイアウト調整 */
   .notion-list-body {
     display: block;
   }

   /* コレクションヘッダーでタイトル列を非表示 */
   .notion-collection-header .notion-collection-column-title:has(.notion-property-title) {
     display: none !important;
   }

   /* 古いブラウザ向けフォールバック */
   .notion-collection-header .notion-collection-column-title[data-property="title"] {
     display: none !important;
   }
   ```

3. **追加の互換性ルール（オプション）**
   
   既存のプロジェクトとの互換性を保つために、以下のルールも追加できます：

   ```css
   /* List view customizations to remove duplicate title - existing rules kept for compatibility */
   .notion-list-view .notion-list-item-property .notion-property-title {
     display: none !important;
   }

   /* Hide the property container that contains title property */
   .notion-list-view .notion-list-item-property:has(.notion-property-title) {
     display: none !important;
   }

   /* Fallback for browsers that don't support :has() */
   .notion-list-view .notion-list-item-body .notion-property.notion-property-title {
     display: none !important;
   }

   /* Target parent of title property */
   .notion-list-view .notion-list-item-body > div:has(.notion-property-title) {
     display: none !important;
   }

   /* More specific targeting for title properties in list items */
   .notion-collection-list .notion-property-title,
   .notion-list-collection .notion-property-title,
   .notion-list-item-property[class*="title"] {
     display: none !important;
   }
   ```

## ✅ 動作確認

1. **開発サーバーの起動**
   ```bash
   npm run dev
   ```

2. **ブラウザでの確認項目**
   - [ ] リストビューでタイトルが1つだけ表示されること
   - [ ] タイトルブロック（`.notion-list-item-title`）が正常に表示
   - [ ] プロパティタイトル（`.notion-property-title`）が非表示
   - [ ] ダークモードでも正常に動作
   - [ ] 他のビュー（ギャラリー、テーブル等）に影響がないこと

3. **開発者ツールでの確認**
   ```html
   <!-- 期待するHTML構造 -->
   <div class="notion-list-body">
     <div class="notion-list-item notion-page-link">
       <div class="notion-list-item-title">タイトルテキスト</div>
       <!-- notion-property-titleが存在しないこと -->
     </div>
   </div>
   ```

## 🔧 トラブルシューティング

### 問題: CSSが適用されない場合

1. **キャッシュのクリア**
   - ブラウザのハードリロード（Ctrl/Cmd + Shift + R）
   - Next.jsのキャッシュクリア: `.next`フォルダを削除

2. **CSSの優先順位確認**
   - `!important`が正しく適用されているか確認
   - より具体的なセレクタを使用

### 問題: 特定のビューで問題が発生

1. **セレクタの調整**
   ```css
   /* より具体的なセレクタを追加 */
   .notion-collection-view-type-list .notion-property-title {
     display: none !important;
   }
   ```

## 📝 メンテナンス

### react-notion-xアップデート時の注意

1. **クラス名の変更確認**
   - `.notion-list-item`
   - `.notion-property-title`
   - `.notion-list-item-title`

2. **新しいバージョンでの動作確認**
   - 開発者ツールで要素を検査
   - 必要に応じてセレクタを更新

### 代替案

#### 方針A: コンポーネントオーバーライド（高度）

react-notion-xのコンポーネントを直接カスタマイズする方法：

```typescript
// components/CustomCollectionRow.tsx
import React from 'react'
import { CollectionRowProps } from 'react-notion-x'

export const CustomCollectionRow: React.FC<CollectionRowProps> = (props) => {
  // カスタム実装
  return (
    <div className="notion-list-item notion-page-link">
      <div className="notion-list-item-title">
        {/* タイトルのみ表示 */}
      </div>
    </div>
  )
}

// NotionPage.tsxで使用
const components = {
  collectionRow: CustomCollectionRow,
  // 他のコンポーネント
}
```

#### 方針C: JavaScriptでの動的制御

```javascript
// 実行時にDOMを操作（非推奨）
useEffect(() => {
  const titleProperties = document.querySelectorAll('.notion-property-title');
  titleProperties.forEach(el => {
    if (el.closest('.notion-list-item')) {
      el.style.display = 'none';
    }
  });
}, []);
```

## 🚀 デプロイ前チェックリスト

- [ ] ローカル環境での動作確認完了
- [ ] 全てのビュータイプ（リスト、ギャラリー、テーブル）で確認
- [ ] ライトモード・ダークモード両方で確認
- [ ] モバイル・タブレット・デスクトップで確認
- [ ] パフォーマンスへの影響なし

## 📚 参考情報

- **react-notion-x公式ドキュメント**: https://github.com/NotionX/react-notion-x
- **Notion API**: https://developers.notion.com/
- **CSS :has()セレクタ**: https://developer.mozilla.org/en-US/docs/Web/CSS/:has

---

最終更新日: 2025年6月4日
作成者: Claude Code Assistant