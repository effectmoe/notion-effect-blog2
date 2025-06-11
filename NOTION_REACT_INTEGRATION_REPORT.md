# Notion と React Notion X の統合に関する技術レポート

## 概要
このレポートは、Notionのコンテンツ構造とReact Notion Xライブラリの関係性、およびスタイリングの課題と解決策について詳述します。

---

## 1. Notion要素とReact Notion Xのマッピング関係

### 1.1 ブロックタイプ別対応表

| Notionブロックタイプ | React Notion Xクラス名 | data属性 | スタイリング可否 | 備考 |
|---------------------|------------------------|----------|-----------------|------|
| テキストブロック | `.notion-text-block` | `data-block-id` | ✅ 可能 | 基本的なテキスト要素 |
| ヘッダー | `.notion-header-block` | `data-block-id` | ✅ 可能 | H1相当 |
| サブヘッダー | `.notion-sub_header-block` | `data-block-id` | ✅ 可能 | H2相当 |
| サブサブヘッダー | `.notion-sub_sub_header-block` | `data-block-id` | ✅ 可能 | H3相当 |
| 画像 | `.notion-image-block` | `data-block-id` | ✅ 可能 | 画像コンテナ |
| コードブロック | `.notion-code-block` | `data-block-id` | ✅ 可能 | シンタックスハイライト付き |
| 引用 | `.notion-quote-block` | `data-block-id` | ✅ 可能 | 引用文 |
| コールアウト | `.notion-callout-block` | `data-block-id` | ✅ 可能 | 強調ボックス |
| トグル | `.notion-toggle-block` | `data-block-id` | ✅ 可能 | 折りたたみ可能なコンテンツ |
| カラム | `.notion-column` | なし | ⚠️ 条件付き | レイアウト用コンテナ |
| 行 | `.notion-row` | なし | ⚠️ 条件付き | カラムの親要素 |

### 1.2 データベースビュー関連

| Notionビュータイプ | React Notion Xクラス名 | レンダリング方式 | スタイリング可否 | 備考 |
|------------------|------------------------|----------------|-----------------|------|
| テーブルビュー | `.notion-table-view` | 動的生成 | ⚠️ 制限あり | テーブル形式 |
| リストビュー | `.notion-list-view` | 動的生成 | ⚠️ 制限あり | リスト形式 |
| ギャラリービュー | `.notion-gallery-view` | 動的生成 | ⚠️ 制限あり | カード形式 |
| ボードビュー | `.notion-board-view` | 動的生成 | ⚠️ 制限あり | カンバン形式 |
| カレンダービュー | `.notion-calendar-view` | 動的生成 | ❌ 困難 | カレンダー形式 |
| コレクションビュー | `.notion-collection-view` | 動的生成 | ⚠️ 制限あり | ビューのコンテナ |
| インラインデータベース | `.notion-collection` | 動的生成 | ⚠️ 制限あり | ページ内埋め込み |
| リンクされたデータベース | リンクとして表示 | 静的 | ❌ 不可 | 単なるリンク |

### 1.3 プロパティタイプ別対応表

| Notionプロパティ | React Notion Xクラス名 | 表示制御 | スタイリング可否 | 備考 |
|----------------|------------------------|---------|-----------------|------|
| タイトル | `.notion-property-title` | Notion側 | ✅ 可能 | 主要なタイトル |
| テキスト | `.notion-property-text` | Notion側 | ✅ 可能 | プレーンテキスト |
| 数値 | `.notion-property-number` | Notion側 | ✅ 可能 | 数値データ |
| 選択 | `.notion-property-select` | Notion側 | ✅ 可能 | 単一選択タグ |
| マルチ選択 | `.notion-property-multi_select` | Notion側 | ✅ 可能 | 複数選択タグ |
| 日付 | `.notion-property-date` | Notion側 | ✅ 可能 | 日付情報 |
| チェックボックス | `.notion-property-checkbox` | Notion側 | ✅ 可能 | オン/オフ |
| URL | `.notion-property-url` | Notion側 | ✅ 可能 | リンク |
| メール | `.notion-property-email` | Notion側 | ✅ 可能 | メールアドレス |
| 電話番号 | `.notion-property-phone_number` | Notion側 | ✅ 可能 | 電話番号 |
| 数式 | `.notion-property-formula` | カスタム実装 | ⚠️ 要追加処理 | 計算結果 |
| リレーション | `.notion-property-relation` | Notion側 | ⚠️ 制限あり | 他DBへの参照 |
| ロールアップ | `.notion-property-rollup` | Notion側 | ⚠️ 制限あり | 集計データ |

---

## 2. CSSスタイリングの適用可否

### 2.1 CSSが効くケース ✅

#### 静的にレンダリングされる要素
```css
/* 基本的なブロック要素 */
.notion-text-block {
  /* スタイルが確実に適用される */
  color: #333;
  font-size: 16px;
}

/* ページレイアウト要素 */
.notion-page {
  max-width: 1200px;
  margin: 0 auto;
}

/* 個別のプロパティ */
.notion-property-title {
  font-weight: bold;
}
```

#### 優先度を上げた場合
```css
/* !importantを使用 */
.notion-list-item {
  border-bottom: 1px solid #eee !important;
}

/* より具体的なセレクタ */
.notion-page-content .notion-list-view .notion-list-item {
  padding: 16px;
}
```

### 2.2 CSSが効かないケース ❌

#### 動的に生成される要素
```css
/* React Notion Xが後から生成する要素 */
.notion-collection-view {
  /* タイミングによっては適用されない */
  border: 1px solid #ddd;
}
```

#### インラインスタイルが優先される場合
```css
/* Notionの設定がインラインスタイルとして出力される */
.notion-column {
  width: 50%; /* Notionのカラム幅設定に上書きされる */
}
```

#### 仮想的な要素や動的クラス
```css
/* 存在しないクラスや、条件付きで追加されるクラス */
.notion-collection-loading {
  /* レンダリング中のみ存在 */
}
```

---

## 3. トラブルシューティングガイド

### 3.1 よくある問題と解決策

| 問題 | 原因 | 解決策 |
|-----|------|--------|
| スタイルが適用されない | セレクタの優先度が低い | `!important`を使用、より具体的なセレクタを使用 |
| レイアウトが崩れる | Notionの設定とCSSが競合 | Notion側の設定を確認、CSSを調整 |
| 動的コンテンツにスタイルが効かない | レンダリングタイミングの問題 | JavaScriptで動的に適用、MutationObserverを使用 |
| データベースビューの表示が異なる | Notion側の配置方法の違い | インラインデータベースとして統一配置 |
| プロパティが表示されない | Notion側の表示設定 | データベースビューのプロパティ設定を確認 |

### 3.2 デバッグ手順

1. **開発者ツールで要素を検査**
   - 実際に生成されているHTML構造を確認
   - 適用されているCSSルールを確認
   - インラインスタイルの有無を確認

2. **コンソールログの確認**
   - React Notion Xのエラーメッセージ
   - カスタムスクリプトのログ

3. **Notion側の設定確認**
   - ビューの種類（インライン vs リンク）
   - プロパティの表示設定
   - レイアウト構造

---

## 4. ベストプラクティス

### 4.1 Notion側の設定

1. **データベースビューの配置**
   - 常に「インラインデータベース」として配置
   - リンクではなく実際のビューを埋め込む

2. **レイアウトの統一**
   - 全ページで同じカラム構造を使用
   - ビューの設定（プロパティ、並び順）を統一

3. **プロパティ設定**
   - 必要なプロパティのみ表示
   - 数式プロパティは最小限に

### 4.2 React/CSS側の実装

1. **CSSの記述方法**
   ```css
   /* 推奨：具体的なセレクタ */
   .notion-page-content .notion-list-view {
     /* スタイル */
   }
   
   /* 避ける：汎用的すぎるセレクタ */
   div {
     /* スタイル */
   }
   ```

2. **JavaScriptの使用**
   ```javascript
   // 動的要素への対応
   const observer = new MutationObserver((mutations) => {
     // 要素が追加されたらスタイルを適用
   });
   ```

3. **パフォーマンスへの配慮**
   - 過度なDOM操作を避ける
   - CSSセレクタを最適化
   - 不要な再レンダリングを防ぐ

---

## 5. 注意事項

### 5.1 アップデートへの対応
- React Notion Xのバージョンアップによりクラス名が変更される可能性
- Notion APIの仕様変更に注意
- 定期的な動作確認が必要

### 5.2 制限事項
- Notionの有料機能（API制限など）
- ブラウザ間の互換性
- モバイルデバイスでの表示

### 5.3 セキュリティ
- クライアントサイドでのAPI処理に注意
- 個人情報を含むプロパティの扱い
- XSS対策

---

## 6. 推奨される実装アプローチ

1. **Notion側で可能な限り設定**
   - レイアウト、スタイル、表示設定はNotion側で
   - 統一感のある構造を維持

2. **CSSは補完的に使用**
   - Notionでできないスタイルのみ追加
   - グローバルなテーマ統一

3. **JavaScriptは最小限に**
   - どうしても必要な場合のみ使用
   - パフォーマンスを考慮

4. **テスト環境の構築**
   - 開発環境での十分なテスト
   - 複数のページタイプでの動作確認

---

## 7. レスポンシブデザインの実装状況

### 7.1 問題の発見と原因分析

#### 発見された問題
- **TOPページ（index.tsx）**: レスポンシブ対応が機能している
- **個別ページ（[pageId].tsx）**: レスポンシブ対応が不完全

#### 原因
1. **CSSセレクタの違い**
   ```css
   /* 問題のあったコード */
   @media only screen and (max-width: 920px) {
     .index-page.notion-page {  /* index-pageクラスのみ対象 */
       padding-left: 2vw;
       padding-right: 2vw;
     }
   }
   ```

2. **2カラムレイアウトの固定**
   - Notionの2カラムレイアウトがモバイルでも維持される
   - カラム幅が固定されて横スクロールが発生

### 7.2 実装したレスポンシブ対応

#### 基本的なレスポンシブ対応（実装済み）

```css
/* タブレット向け (1024px以下) */
@media only screen and (max-width: 1024px) {
  .notion-page {
    max-width: 100%;
    padding-left: 3vw;
    padding-right: 3vw;
  }
}

/* スマートフォン向け (768px以下) */
@media only screen and (max-width: 768px) {
  .notion-page-content {
    font-size: 14px;
  }
  
  /* ヘッダー画像の高さ調整 */
  .notion-page-cover-wrapper {
    height: 30vh !important;
    min-height: 200px;
  }
}

/* 2カラムレイアウトの1カラム化 (720px以下) */
@media only screen and (max-width: 720px) {
  .notion-row {
    display: block !important;
  }
  
  .notion-column {
    width: 100% !important;
    display: block !important;
    margin-bottom: 1rem;
  }
}

/* 小型デバイス向け (480px以下) */
@media only screen and (max-width: 480px) {
  .notion-page {
    padding-left: 1rem;
    padding-right: 1rem;
  }
  
  .notion-page-title-text {
    font-size: 1.8rem;
  }
  
  /* ギャラリービューを1カラムに */
  .notion-gallery-grid {
    grid-template-columns: 1fr !important;
  }
}
```

### 7.3 レスポンシブ対応の制限事項

| 要素 | 対応可否 | 制限事項 | 備考 |
|-----|---------|---------|------|
| テキストサイズ | ✅ 可能 | なし | CSSで完全制御可能 |
| カラムレイアウト | ✅ 可能 | Notionの設定に依存 | CSSで上書き可能 |
| 画像サイズ | ⚠️ 条件付き | Notionの画像設定に依存 | max-width: 100%で対応 |
| テーブルビュー | ⚠️ 条件付き | 横スクロールが必要 | overflow-x: autoで対応 |
| ギャラリービュー | ✅ 可能 | グリッド数の調整が必要 | grid-template-columnsで制御 |
| カレンダービュー | ❌ 困難 | 複雑な構造 | 横スクロールで対応 |
| 埋め込みコンテンツ | ❌ 困難 | iframeのサイズ固定 | Notion側の制限 |

### 7.4 レスポンシブ実装のベストプラクティス

1. **ブレークポイントの設定**
   - 1024px: タブレット横向き
   - 768px: タブレット縦向き
   - 720px: 2カラム→1カラム切替
   - 480px: 小型スマートフォン

2. **優先度の設定**
   - `!important`を適切に使用してNotionのスタイルを上書き
   - より具体的なセレクタを使用

3. **パフォーマンスの考慮**
   - 過度なDOM操作を避ける
   - CSSのみで対応可能な部分はCSSで実装

### 7.5 トラブルシューティング

| 問題 | 解決方法 |
|------|---------|
| カラムが縮まない | `.notion-column { width: 100% !important; }` |
| 横スクロールが発生 | `overflow-x: hidden`を親要素に適用 |
| テキストが小さすぎる | ビューポートメタタグの確認 |
| 画像がはみ出る | `img { max-width: 100%; height: auto; }` |

---

## まとめ

Notion と React Notion X の統合では、両者の特性を理解した上で適切なアプローチを選択することが重要です。可能な限りNotion側の機能を活用し、必要最小限のカスタマイズに留めることで、メンテナンス性の高い実装が可能になります。

レスポンシブデザインについては、CSSメディアクエリによる対応が可能ですが、Notionの構造的な制限により完全な制御は困難な場合があります。特に複雑なビュー（カレンダー、埋め込みコンテンツ）では、横スクロールなどの代替手段を検討する必要があります。

最終更新日: 2025年6月8日