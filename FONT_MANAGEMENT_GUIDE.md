# フォント管理ガイド - Notion Effect Blog

## 概要
このドキュメントでは、Notion Effect Blogにおけるフォントの管理方法について説明します。本システムは、動的フォント管理システムと静的CSSによる管理の両方をサポートしています。

---

## 1. フォント管理システムの構成

### 1.1 システム構成図
```
┌─────────────────────┐
│   管理画面 (Admin)   │
│ /admin/font-settings│
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐     ┌──────────────────┐
│  Font Settings API  │────▶│ font-settings.json│
│ /api/font-settings  │     └──────────────────┘
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐     ┌──────────────────┐
│    FontStyler       │────▶│  LocalStorage    │
│  (クライアント側)    │     │  (キャッシュ)     │
└─────────────────────┘     └──────────────────┘
```

### 1.2 主要コンポーネント

| コンポーネント | ファイルパス | 役割 |
|-------------|------------|------|
| FontSettingsPanel | `/components/FontSettingsPanel.jsx` | フォント設定UI |
| FontStyler | `/components/FontStyler.jsx` | 動的CSS注入 |
| font-settings | `/lib/font-customizer/font-settings.js` | デフォルト設定 |
| font-utils | `/lib/font-customizer/font-utils.js` | CSS生成ユーティリティ |

---

## 2. Notionブロックタイプ別CSSクラス一覧

### 2.1 基本ブロック

| Notionブロック | CSSクラス | デフォルトフォント | 設定キー |
|--------------|-----------|------------------|----------|
| ページタイトル | `.notion-page-title-text` | Shippori Mincho | `title` |
| 見出し1 (H1) | `.notion-header-block` | Noto Sans JP | `heading1` |
| 見出し2 (H2) | `.notion-sub_header-block` | Noto Sans JP | `heading2` |
| 見出し3 (H3) | `.notion-sub_sub_header-block` | Noto Sans JP | `heading3` |
| テキスト | `.notion-text-block` | Noto Sans JP | `text` |
| 引用 | `.notion-quote-block` | システムフォント | - |
| コールアウト | `.notion-callout-block` | システムフォント | - |
| コード | `.notion-code-block` | モノスペース | - |

### 2.2 データベース関連

| 要素 | CSSクラス | 備考 |
|-----|-----------|------|
| リストアイテムタイトル | `.notion-list-item-title` | リストビューのタイトル |
| プロパティ（テキスト） | `.notion-property-text` | テキストプロパティ |
| プロパティ（タイトル） | `.notion-property-title` | タイトルプロパティ |
| プロパティ（数式） | `.notion-property-formula` | 数式プロパティ |
| テーブルセル | `.notion-table-cell` | テーブルビューのセル |
| ギャラリータイトル | `.notion-gallery-card-title` | ギャラリーカードのタイトル |

### 2.3 特殊要素

| 要素 | CSSクラス | 備考 |
|-----|-----------|------|
| トグルヘッダー | `.notion-toggle > summary` | トグルの見出し部分 |
| トグル内容 | `.notion-toggle-content` | トグルの中身 |
| ページアイコン | `.notion-page-icon` | 絵文字アイコン |
| パンくず | `.notion-breadcrumb` | ナビゲーション |

---

## 3. フォント設定方法

### 3.1 管理画面を使用した設定（推奨）

1. **管理画面へアクセス**
   ```
   https://your-domain.com/admin/font-settings
   パスワード: your_admin_password
   ```

2. **設定可能な項目**
   - フォントファミリー（Google Fontsから選択）
   - フォントサイズ
   - フォントウェイト（太さ）
   - 文字色
   - 背景色
   - テキスト配置
   - 文字間隔
   - 行間

3. **プリセット機能**
   - よく使う設定を保存
   - JSON形式でインポート/エクスポート

### 3.2 CSSによる直接設定

#### 基本的なCSS設定例
```css
/* styles/notion.css に追加 */

/* タイトルのフォント変更 */
.notion-page-title-text {
  font-family: 'Yu Mincho', 'Hiragino Mincho Pro', serif !important;
  font-size: 3rem !important;
  font-weight: 300 !important;
  letter-spacing: 0.1em !important;
}

/* 見出し1のフォント変更 */
.notion-header-block {
  font-family: 'Helvetica Neue', Arial, sans-serif !important;
  font-size: 2.2rem !important;
  font-weight: 600 !important;
  color: #2c3e50 !important;
}

/* 本文のフォント変更 */
.notion-text-block {
  font-family: 'Noto Serif JP', serif !important;
  font-size: 16px !important;
  line-height: 1.8 !important;
  letter-spacing: 0.05em !important;
}
```

#### Google Fontsのインポート
```css
/* styles/global.css の先頭に追加 */
@import url('https://fonts.googleapis.com/css2?family=Noto+Serif+JP:wght@400;700&family=Yu+Mincho&display=swap');
```

### 3.3 動的フォント設定API

#### 設定の取得
```javascript
// GET /api/font-settings
const response = await fetch('/api/font-settings');
const settings = await response.json();
```

#### 設定の保存
```javascript
// POST /api/font-settings
const response = await fetch('/api/font-settings', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    title: {
      fontFamily: "'Yu Gothic', sans-serif",
      fontSize: "3rem",
      // ... その他の設定
    }
  })
});
```

---

## 4. 利用可能なGoogle Fonts一覧

### 4.1 日本語フォント
| フォント名 | インポートURL | 特徴 |
|-----------|-------------|------|
| Noto Sans JP | `family=Noto+Sans+JP:wght@400;700` | ゴシック体 |
| Noto Serif JP | `family=Noto+Serif+JP:wght@400;700` | 明朝体 |
| Shippori Mincho | `family=Shippori+Mincho:wght@400;700` | 明朝体 |
| Klee One | `family=Klee+One:wght@400;600` | 手書き風 |
| M PLUS Rounded 1c | `family=M+PLUS+Rounded+1c:wght@400;700` | 丸ゴシック |

### 4.2 英語フォント
| フォント名 | インポートURL | 特徴 |
|-----------|-------------|------|
| Roboto | `family=Roboto:wght@300;400;700` | サンセリフ |
| Open Sans | `family=Open+Sans:wght@400;600;700` | サンセリフ |
| Lato | `family=Lato:wght@300;400;700` | サンセリフ |
| Playfair Display | `family=Playfair+Display:wght@400;700` | セリフ |
| Montserrat | `family=Montserrat:wght@400;600;700` | サンセリフ |

---

## 5. Notionデータベースによる自動フォント切り替え

### 5.1 実装方法

現在のシステムでは、Notionデータベースから直接フォント設定を読み取る機能は実装されていませんが、以下の方法で実現可能です：

1. **Notionにフォント設定データベースを作成**
   ```
   プロパティ例：
   - Element (Select): title, heading1, heading2, text
   - FontFamily (Text): フォント名
   - FontSize (Text): サイズ
   - FontWeight (Number): 太さ
   ```

2. **APIエンドポイントの拡張**
   ```javascript
   // pages/api/font-settings-from-notion.js
   import { Client } from '@notionhq/client';
   
   const notion = new Client({ auth: process.env.NOTION_API_SECRET });
   
   export default async function handler(req, res) {
     const database = await notion.databases.query({
       database_id: process.env.FONT_SETTINGS_DB_ID
     });
     
     // データベースの内容をフォント設定形式に変換
     const settings = convertToFontSettings(database.results);
     res.json(settings);
   }
   ```

3. **定期的な同期**
   ```javascript
   // FontStylerコンポーネントに追加
   useEffect(() => {
     const syncInterval = setInterval(async () => {
       const settings = await fetch('/api/font-settings-from-notion');
       applyFontSettings(settings);
     }, 60000); // 1分ごとに同期
     
     return () => clearInterval(syncInterval);
   }, []);
   ```

---

## 6. トラブルシューティング

### 6.1 よくある問題と解決方法

| 問題 | 原因 | 解決方法 |
|-----|------|---------|
| フォントが反映されない | CSSの優先順位 | `!important`を追加 |
| 日本語が文字化けする | フォントの読み込み失敗 | Google Fontsのインポートを確認 |
| 管理画面で保存できない | 権限不足 | APIディレクトリの書き込み権限を確認 |
| ハイドレーションエラー | サーバー/クライアントの不一致 | FontStylerの動的読み込みを確認 |

### 6.2 デバッグ方法

1. **ブラウザの開発者ツール**
   - Elements → Computed → font-familyを確認
   - Networkタブでフォントファイルの読み込みを確認

2. **コンソールログの確認**
   ```javascript
   console.log('Current font settings:', localStorage.getItem('fontSettings'));
   ```

3. **APIレスポンスの確認**
   ```bash
   curl http://localhost:3000/api/font-settings
   ```

---

## 7. ベストプラクティス

### 7.1 パフォーマンス最適化
- 使用するフォントは3種類以内に抑える
- `font-display: swap`を使用してFOUTを防ぐ
- 必要なウェイトのみをインポート

### 7.2 アクセシビリティ
- 本文は14px以上のサイズを使用
- 十分なコントラスト比を確保（WCAG AA基準: 4.5:1以上）
- 行間は1.5以上に設定

### 7.3 メンテナンス
- フォント設定はバージョン管理
- 定期的なバックアップ（設定のエクスポート）
- 変更履歴の記録

---

## 8. 設定例

### 8.1 ミニマルデザイン
```json
{
  "title": {
    "fontFamily": "'Helvetica Neue', Arial, sans-serif",
    "fontSize": "2.5rem",
    "fontWeight": "200",
    "letterSpacing": "0.05em"
  },
  "text": {
    "fontFamily": "'Helvetica Neue', Arial, sans-serif",
    "fontSize": "15px",
    "fontWeight": "300",
    "lineHeight": "1.8"
  }
}
```

### 8.2 和風デザイン
```json
{
  "title": {
    "fontFamily": "'Shippori Mincho', serif",
    "fontSize": "3rem",
    "fontWeight": "400",
    "letterSpacing": "0.15em"
  },
  "text": {
    "fontFamily": "'Noto Serif JP', serif",
    "fontSize": "16px",
    "fontWeight": "400",
    "lineHeight": "2"
  }
}
```

### 8.3 モダンデザイン
```json
{
  "title": {
    "fontFamily": "'Montserrat', sans-serif",
    "fontSize": "3.5rem",
    "fontWeight": "700",
    "letterSpacing": "-0.02em"
  },
  "text": {
    "fontFamily": "'Inter', sans-serif",
    "fontSize": "16px",
    "fontWeight": "400",
    "lineHeight": "1.6"
  }
}
```

---

## まとめ

Notion Effect Blogのフォント管理システムは、以下の3つの方法で柔軟にカスタマイズ可能です：

1. **管理画面** - 非技術者でも簡単に設定可能
2. **CSS** - 細かい調整が必要な場合
3. **API** - プログラマティックな制御

必要に応じて適切な方法を選択し、ブランドに合ったタイポグラフィを実現してください。

最終更新日: 2025年6月8日