# Notionギャラリービュー レスポンシブレイアウト修正マニュアル

## 概要
このマニュアルでは、Notion-Effect-Blog2プロジェクトでNotionデータベースのギャラリービューがレスポンシブに表示されない問題の修正方法と、今後のカスタマイズ方法について説明します。

## 目次
1. [問題の概要](#問題の概要)
2. [修正内容](#修正内容)
3. [カスタマイズガイド](#カスタマイズガイド)
4. [トラブルシューティング](#トラブルシューティング)
5. [ファイル構成](#ファイル構成)

## 問題の概要

### 発生していた問題
- TOPページの右カラムにあるNotionデータベースのギャラリービューが、画面幅に応じて適切にレイアウトされない
- 通常のNotion公開ページでは正常に表示されるが、React版では崩れてしまう
- React hydrationエラーが発生し、ページが正常に動作しない

### 原因
1. **CSS Grid レスポンシブ設定の不足**: 右カラム内のギャラリービューに特化したレスポンシブ設定がなかった
2. **HTMLの構造違反**: react-notion-xライブラリが`<a>`タグ内に`<div>`を配置していた（無効なHTML）
3. **Reactフックの使用順序エラー**: 条件分岐の後にフックが配置されていた

## 修正内容

### 1. ギャラリービューのレスポンシブCSS追加
**ファイル**: `/styles/notion.css`

```css
/* 右カラム内のギャラリービュー対応 */
.notion-column .notion-gallery-grid {
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  grid-gap: 1.5vmin;
  gap: 1.5vmin;
}

/* モバイル画面での調整 */
@media (max-width: 768px) {
  .notion-column .notion-gallery-grid {
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  }
}
```

### 2. HTMLの構造違反修正
**問題**: `<a>`タグ内に`<div>`タグがあるとhydrationエラーが発生

**解決策**: CustomPageLinkコンポーネントを作成
- **ファイル**: `/components/CustomPageLink.tsx`
- `<a>`タグの代わりに`<div role="link">`を使用
- キーボードナビゲーション対応

### 3. 数式プロパティスクリプトの修正
**ファイル**: `/public/inject-formula-simple.js`
- CustomPageLinkコンポーネントに対応するセレクタを追加
- `[role="link"]`要素も検索対象に含める

## カスタマイズガイド

### ギャラリービューのカラム数を変更したい場合

**ファイル**: `/styles/notion.css`

```css
/* 例：3カラム固定にしたい場合 */
.notion-column .notion-gallery-grid {
  grid-template-columns: repeat(3, 1fr);
}

/* 例：最小幅を変更したい場合（現在180px） */
.notion-column .notion-gallery-grid {
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
}
```

### ギャラリーアイテムの間隔を調整したい場合

```css
.notion-column .notion-gallery-grid {
  gap: 2rem; /* お好みの間隔に変更 */
}
```

### レスポンシブのブレークポイントを変更したい場合

```css
/* タブレット用 */
@media (max-width: 1024px) {
  .notion-column .notion-gallery-grid {
    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  }
}

/* スマートフォン用 */
@media (max-width: 480px) {
  .notion-column .notion-gallery-grid {
    grid-template-columns: 1fr; /* 1カラムに */
  }
}
```

## トラブルシューティング

### 問題1: ギャラリービューが表示されない
**確認事項**:
1. ブラウザの開発者ツール（F12）でコンソールエラーを確認
2. CSSファイルが正しく読み込まれているか確認
3. キャッシュをクリアして再読み込み（Ctrl+F5 または Cmd+Shift+R）

### 問題2: Hydration Errorが発生する
**エラーメッセージ例**:
```
Error: Hydration failed because the initial UI does not match what was rendered on the server.
Expected server HTML to contain a matching <div> in <a>.
```

**対処法**:
1. HTMLの構造を確認（`<a>`タグ内に`<div>`や`<p>`などのブロック要素がないか）
2. 条件付きレンダリングの確認（サーバーとクライアントで異なる内容を表示していないか）
3. 開発サーバーを再起動: `npm run dev`

### 問題3: 数式プロパティ（最終更新日など）が表示されない
**確認事項**:
1. ブラウザコンソールで`[Formula Script]`で始まるログを確認
2. `/public/inject-formula-simple.js`が読み込まれているか確認
3. Notion APIの接続状態を確認

**デバッグ方法**:
```javascript
// ブラウザコンソールで実行
window.fillFormulas && window.fillFormulas()
```

### 問題4: レイアウトが崩れる
**チェックリスト**:
- [ ] CSSの構文エラーがないか確認
- [ ] 親要素のスタイルが影響していないか確認
- [ ] ブラウザの互換性を確認（Chrome、Firefox、Safari、Edge）

## ファイル構成

### 主要ファイル一覧

| ファイル | 役割 | 編集が必要な場合 |
|---------|------|-----------------|
| `/styles/notion.css` | Notionコンテンツのスタイル定義 | レイアウトやデザインを変更したい時 |
| `/components/NotionPage.tsx` | Notionページのメインコンポーネント | 機能追加や大きな変更時 |
| `/components/CustomPageLink.tsx` | リンクコンポーネント（hydration対策） | リンクの動作を変更したい時 |
| `/public/inject-formula-simple.js` | 数式プロパティ表示スクリプト | 数式の表示方法を変更したい時 |
| `/components/Header.tsx` | ヘッダーコンポーネント | ナビゲーションを変更したい時 |

### バックアップの推奨
変更前に必ず以下のコマンドでバックアップを作成してください：
```bash
# ファイルのバックアップ
cp styles/notion.css styles/notion.css.backup
```

### 変更の適用方法
1. ファイルを編集
2. 開発サーバーで確認: `npm run dev`
3. 問題なければ本番環境にデプロイ

## 注意事項

### やってはいけないこと
- ❌ `<a>`タグ内に`<div>`、`<p>`、`<h1>`などのブロック要素を配置
- ❌ サーバーサイドとクライアントサイドで異なる内容を表示
- ❌ Reactフックを条件文の中で使用

### 推奨事項
- ✅ 変更前にバックアップを作成
- ✅ 小さな変更から始める
- ✅ ブラウザの開発者ツールで動作確認
- ✅ 複数のブラウザでテスト

## サポート情報

### よくある質問
**Q: CSSを変更したが反映されない**
A: ブラウザキャッシュをクリアするか、プライベートブラウジングモードで確認してください。

**Q: エラーが解決できない**
A: エラーメッセージをコピーして、開発チームに共有してください。

### 関連ドキュメント
- [Next.js Hydration Error解説](https://nextjs.org/docs/messages/react-hydration-error)
- [CSS Grid レイアウトガイド](https://developer.mozilla.org/ja/docs/Web/CSS/CSS_Grid_Layout)
- [React-Notion-X ドキュメント](https://github.com/NotionX/react-notion-x)

---
最終更新日: 2024年1月
作成者: Claude Assistant