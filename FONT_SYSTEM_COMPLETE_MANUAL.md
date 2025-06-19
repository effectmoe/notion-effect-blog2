# Notion Effect Blog フォントシステム完全マニュアル

## 目次
1. [システム概要](#1-システム概要)
2. [フォント管理画面の使い方](#2-フォント管理画面の使い方)
3. [フォントの追加方法](#3-フォントの追加方法)
4. [CSSによるフォント設定](#4-cssによるフォント設定)
5. [トラブルシューティング](#5-トラブルシューティング)
6. [技術仕様](#6-技術仕様)
7. [メンテナンス](#7-メンテナンス)

---

## 1. システム概要

### 1.1 フォントシステムの特徴

Notion Effect Blogのフォントシステムは、以下の特徴を持つ動的フォント管理システムです：

- **ノーコード管理**: 管理画面から簡単にフォントを変更
- **リアルタイムプレビュー**: 変更を即座に確認
- **要素別設定**: タイトル、見出し、本文を個別に設定
- **プリセット機能**: よく使う設定を保存・呼び出し
- **ハイドレーション対策**: SSRとの競合を防ぐ設計

### 1.2 システム構成

```
┌─────────────────────────────────────────────────────┐
│                   ユーザーアクセス                     │
└─────────────┬───────────────────────┬───────────────┘
              │                       │
              ▼                       ▼
┌─────────────────────┐     ┌─────────────────────┐
│   管理画面          │     │   ブログページ       │
│ /admin/font-settings│     │   全ページ          │
└─────────┬───────────┘     └──────────┬──────────┘
          │                             │
          ▼                             ▼
┌─────────────────────┐     ┌─────────────────────┐
│  FontSettingsPanel  │     │    FontStyler       │
│  設定UI＆プレビュー  │     │  動的CSS注入        │
└─────────┬───────────┘     └──────────┬──────────┘
          │                             │
          ▼                             ▼
┌─────────────────────┐     ┌─────────────────────┐
│  Font Settings API  │────▶│   LocalStorage      │
│  永続化＆配信       │     │   キャッシュ        │
└─────────┬───────────┘     └─────────────────────┘
          │
          ▼
┌─────────────────────┐
│ font-settings.json  │
│  設定ファイル       │
└─────────────────────┘
```

### 1.3 ファイル構成

```
notion-effect-blog2/
├── components/
│   ├── FontSettingsPanel.jsx    # 管理画面UI
│   └── FontStyler.jsx          # CSS動的注入
├── lib/
│   └── font-customizer/
│       ├── font-settings.js    # デフォルト設定
│       ├── font-utils.js       # ユーティリティ
│       └── available-fonts.js  # 利用可能フォント
├── pages/
│   ├── admin/
│   │   └── font-settings.jsx   # 管理画面ページ
│   └── api/
│       └── font-settings.js    # API エンドポイント
└── font-settings.json          # 保存された設定
```

---

## 2. フォント管理画面の使い方

### 2.1 アクセス方法

1. **URLにアクセス**
   ```
   開発環境: http://localhost:3000/admin/font-settings
   本番環境: https://your-domain.com/admin/font-settings
   ```

2. **パスワード入力**
   - デフォルト: `your_admin_password`
   - 環境変数 `ADMIN_PASSWORD` で変更可能

### 2.2 画面構成

```
┌────────────────────────────────────────┐
│  フォント設定管理画面                    │
├────────────────────────────────────────┤
│ [タイトル] [見出し1] [見出し2] [本文]    │ ← タブ
├────────────────────────────────────────┤
│ フォントファミリー: [▼ドロップダウン]     │
│ フォントサイズ:    [▼ 2.5rem    ]      │
│ フォントウェイト:  [▼ 700       ]      │
│ 文字色:           [■] #333333          │
│ 背景色:           [□] transparent      │
│ テキスト配置:     [▼ center     ]      │
│ 文字間隔:         [  0.02em     ]      │
│ 行間:             [  1.4        ]      │
├────────────────────────────────────────┤
│ [プレビュー表示] [設定を保存]           │
├────────────────────────────────────────┤
│ プリセット: [▼選択] [保存] [削除]       │
│ [インポート] [エクスポート]             │
└────────────────────────────────────────┘
```

### 2.3 各要素の説明

#### 設定可能な要素

| 要素 | 対象となるNotionブロック | CSSクラス |
|-----|---------------------|-----------|
| タイトル | ページタイトル | `.notion-page-title-text` |
| 見出し1 | # 見出し | `.notion-header-block` |
| 見出し2 | ## 見出し | `.notion-sub_header-block` |
| 見出し3 | ### 見出し | `.notion-sub_sub_header-block` |
| 本文 | 通常のテキスト | `.notion-text-block` |
| トグル | トグルリスト | `.notion-toggle > summary` |

#### 設定項目

| 項目 | 説明 | 値の例 |
|-----|------|--------|
| フォントファミリー | 使用するフォント | 'Noto Sans JP' |
| フォントサイズ | 文字の大きさ | 16px, 1rem, 2.5rem |
| フォントウェイト | 文字の太さ | 400（通常）, 700（太字） |
| 文字色 | テキストの色 | #333333, rgba(0,0,0,0.8) |
| 背景色 | 背景の色 | transparent, #f5f5f5 |
| テキスト配置 | 文字揃え | left, center, right |
| 文字間隔 | 字間 | 0.02em, 0.1em |
| 行間 | 行の高さ | 1.4, 1.8, 2 |

### 2.4 操作手順

#### 基本的な変更手順

1. **要素を選択**（タブをクリック）
2. **設定を変更**（各項目を調整）
3. **プレビューで確認**（プレビューボタン）
4. **設定を保存**（保存ボタン）

#### プリセットの使用

1. **現在の設定を保存**
   - プリセット名を入力
   - 「保存」ボタンをクリック

2. **プリセットを適用**
   - ドロップダウンから選択
   - 自動的に設定が反映

3. **設定のエクスポート/インポート**
   - エクスポート: JSON形式でダウンロード
   - インポート: JSONファイルをアップロード

---

## 3. フォントの追加方法

### 3.1 方法1: FontSettingsPanelに直接追加

`/components/FontSettingsPanel.jsx`を編集：

```javascript
const [fontList, setFontList] = useState([
  // 既存のフォント...
  
  // 新しいフォントを追加
  { 
    name: 'New Font Name', 
    import: "https://fonts.googleapis.com/css2?family=New+Font+Name:wght@400;700&display=swap" 
  },
]);
```

### 3.2 方法2: available-fonts.jsを使用（推奨）

1. **フォント定義ファイルに追加**
   `/lib/font-customizer/available-fonts.js`:

   ```javascript
   japanese: [
     // 既存のフォント...
     { 
       name: 'Your Font Name', 
       import: "Google FontsのURL",
       category: 'ゴシック体',
       description: 'フォントの説明'
     },
   ]
   ```

2. **FontSettingsPanelで読み込み**
   ```javascript
   import { getAllFonts } from '../lib/font-customizer/available-fonts';
   const [fontList, setFontList] = useState(getAllFonts());
   ```

### 3.3 Google Fontsの追加手順

1. **Google Fontsで検索**
   - 日本語: https://fonts.google.com/?subset=japanese
   - 英語: https://fonts.google.com/

2. **フォントを選択**
   - フォント名をクリック
   - 必要なウェイトを選択（例: 400, 700）
   - 「View selected families」をクリック

3. **インポートURLを取得**
   ```
   @import url('https://fonts.googleapis.com/css2?family=Font+Name:wght@400;700&display=swap');
   ```

4. **フォント情報を追加**
   ```javascript
   { 
     name: 'Font Name',
     import: "取得したURL（@importとurl()を除く）",
     category: 'カテゴリ',
     description: '説明'
   }
   ```

### 3.4 カスタムWebフォントの追加

Adobe FontsやTypekitなどを使用する場合：

```javascript
{ 
  name: 'Custom Font',
  fontFamily: '"custom-font-name", sans-serif',
  import: null,  // 別途<link>タグで読み込む
  category: 'カスタム',
  description: 'カスタムフォント'
}
```

`_document.tsx`に追加：
```jsx
<Head>
  <link rel="stylesheet" href="https://use.typekit.net/xxxxx.css" />
</Head>
```

---

## 4. CSSによるフォント設定

### 4.1 基本的なCSS設定

`/styles/notion.css`に追加：

```css
/* グローバルフォント設定 */
@import url('https://fonts.googleapis.com/css2?family=Your+Font&display=swap');

/* タイトルのカスタマイズ */
.notion-page-title-text {
  font-family: 'Your Font', serif !important;
  font-size: 3rem !important;
  font-weight: 300 !important;
  letter-spacing: 0.1em !important;
  line-height: 1.3 !important;
}

/* 見出し1のカスタマイズ */
.notion-header-block {
  font-family: 'Your Font', sans-serif !important;
  font-size: 2.2rem !important;
  font-weight: 600 !important;
  margin-top: 2em !important;
  margin-bottom: 0.5em !important;
}

/* 本文のカスタマイズ */
.notion-text-block {
  font-family: 'Your Font', sans-serif !important;
  font-size: 16px !important;
  line-height: 1.8 !important;
  letter-spacing: 0.05em !important;
}
```

### 4.2 Notionブロック別CSSクラス一覧

#### 基本ブロック
| ブロックタイプ | CSSクラス | 説明 |
|--------------|-----------|-----|
| ページタイトル | `.notion-page-title-text` | ページの大見出し |
| 見出し1 | `.notion-header-block` | # で作成 |
| 見出し2 | `.notion-sub_header-block` | ## で作成 |
| 見出し3 | `.notion-sub_sub_header-block` | ### で作成 |
| テキスト | `.notion-text-block` | 通常の段落 |
| 引用 | `.notion-quote-block` | > で作成 |
| コールアウト | `.notion-callout-block` | 📌 強調ボックス |
| コード | `.notion-code-block` | ``` で作成 |
| 番号付きリスト | `.notion-numbered-list` | 1. で作成 |
| 箇条書きリスト | `.notion-bulleted-list` | - で作成 |
| トグル | `.notion-toggle` | ▶ で作成 |

#### データベース関連
| 要素 | CSSクラス | 説明 |
|-----|-----------|-----|
| リストタイトル | `.notion-list-item-title` | リストビューのタイトル |
| ギャラリータイトル | `.notion-gallery-card-title` | ギャラリーカードのタイトル |
| テーブルセル | `.notion-table-cell` | テーブルのセル |
| プロパティ（タイトル） | `.notion-property-title` | タイトルプロパティ |
| プロパティ（テキスト） | `.notion-property-text` | テキストプロパティ |
| プロパティ（数値） | `.notion-property-number` | 数値プロパティ |
| プロパティ（選択） | `.notion-property-select` | セレクトプロパティ |
| プロパティ（日付） | `.notion-property-date` | 日付プロパティ |

### 4.3 レスポンシブ対応

```css
/* モバイル対応 */
@media (max-width: 768px) {
  .notion-page-title-text {
    font-size: 2rem !important;
  }
  
  .notion-header-block {
    font-size: 1.5rem !important;
  }
  
  .notion-text-block {
    font-size: 14px !important;
    line-height: 1.7 !important;
  }
}
```

### 4.4 特定ページのみのスタイル

```css
/* index-pageクラスがある場合のみ適用 */
.index-page .notion-page-title-text {
  font-size: 4rem !important;
  text-align: center !important;
}

/* 特定のページIDで適用 */
[data-page-id="your-page-id"] .notion-text-block {
  font-family: 'Special Font', serif !important;
}
```

---

## 5. トラブルシューティング

### 5.1 よくある問題と解決方法

| 問題 | 原因 | 解決方法 |
|-----|------|---------|
| フォントが反映されない | CSSの優先順位が低い | `!important`を追加 |
| 日本語が文字化けする | フォントが日本語非対応 | 日本語対応フォントを選択 |
| 管理画面で保存できない | ファイルの書き込み権限 | `chmod 666 font-settings.json` |
| ハイドレーションエラー | SSRとクライアントの不一致 | FontStylerの実装を確認 |
| フォントの読み込みが遅い | ファイルサイズが大きい | 必要なウェイトのみ読み込む |
| プレビューが動作しない | JavaScriptエラー | コンソールでエラーを確認 |

### 5.2 デバッグ方法

#### ブラウザでの確認

1. **開発者ツールを開く**（F12）

2. **Elementsタブで確認**
   ```
   要素を選択 → Computed → font-family
   ```

3. **Networkタブで確認**
   - フォントファイルが読み込まれているか
   - ステータスコードが200か

#### コンソールでの確認

```javascript
// 現在の設定を確認
console.log(localStorage.getItem('fontSettings'));

// 適用されているスタイルを確認
const title = document.querySelector('.notion-page-title-text');
console.log(getComputedStyle(title).fontFamily);
```

#### APIの確認

```bash
# 設定を取得
curl http://localhost:3000/api/font-settings

# 設定を更新
curl -X POST http://localhost:3000/api/font-settings \
  -H "Content-Type: application/json" \
  -d '{"title": {"fontFamily": "Noto Sans JP"}}'
```

### 5.3 エラーメッセージ対応

| エラー | 意味 | 対処法 |
|--------|------|--------|
| `ENOENT: no such file` | font-settings.jsonがない | APIを一度呼び出して作成 |
| `EACCES: permission denied` | 書き込み権限がない | ファイルの権限を変更 |
| `Hydration failed` | SSRとクライアントの不一致 | useEffectでクライアント側のみ実行 |
| `Failed to fetch` | APIエンドポイントエラー | APIルートを確認 |

---

## 6. 技術仕様

### 6.1 データ構造

#### font-settings.json
```json
{
  "title": {
    "fontFamily": "'Shippori Mincho', serif",
    "fontImport": "https://fonts.googleapis.com/css2?family=Shippori+Mincho:wght@400;700&display=swap",
    "color": "#333333",
    "fontSize": "2.5rem",
    "fontWeight": "700",
    "backgroundColor": "transparent",
    "textAlign": "center",
    "letterSpacing": "0.02em",
    "lineHeight": "1.4"
  },
  "heading1": { /* ... */ },
  "heading2": { /* ... */ },
  "heading3": { /* ... */ },
  "text": { /* ... */ },
  "toggle": { /* ... */ }
}
```

### 6.2 API仕様

#### GET /api/font-settings
```
レスポンス: 200 OK
{
  "title": { /* 設定オブジェクト */ },
  "heading1": { /* ... */ }
}
```

#### POST /api/font-settings
```
リクエスト:
Content-Type: application/json
{
  "title": {
    "fontFamily": "'Noto Sans JP', sans-serif"
  }
}

レスポンス: 200 OK
{ "message": "Settings saved successfully" }
```

### 6.3 コンポーネント仕様

#### FontStyler
- **役割**: クライアントサイドでCSSを動的に注入
- **実行タイミング**: useEffect内（ハイドレーション後）
- **キャッシュ**: LocalStorageに24時間保存

#### FontSettingsPanel
- **役割**: 管理画面のUI提供
- **状態管理**: React useState
- **通信**: fetch APIでバックエンドと通信

### 6.4 セキュリティ

- 管理画面はパスワード保護
- APIエンドポイントは認証なし（必要に応じて追加）
- XSS対策: React標準のエスケープ処理

---

## 7. メンテナンス

### 7.1 定期メンテナンス

#### 月次タスク
- [ ] フォント設定のバックアップ
- [ ] 使用されていないフォントの削除
- [ ] パフォーマンス測定（読み込み速度）

#### 四半期タスク
- [ ] Google Fontsの新フォント確認
- [ ] ライブラリのアップデート確認
- [ ] セキュリティパッチの適用

### 7.2 バックアップとリストア

#### バックアップ
```bash
# 設定ファイルのバックアップ
cp font-settings.json font-settings.backup.$(date +%Y%m%d).json

# 全体のバックアップ
tar -czf font-system-backup-$(date +%Y%m%d).tar.gz \
  components/Font* \
  lib/font-customizer/ \
  pages/admin/font-settings.jsx \
  pages/api/font-settings.js \
  font-settings.json
```

#### リストア
```bash
# 設定ファイルのリストア
cp font-settings.backup.20250608.json font-settings.json

# 全体のリストア
tar -xzf font-system-backup-20250608.tar.gz
```

### 7.3 アップグレード手順

1. **現在のバージョンをバックアップ**
2. **新しいファイルを配置**
3. **設定ファイルの互換性確認**
4. **テスト環境で動作確認**
5. **本番環境に適用**

### 7.4 パフォーマンス最適化

#### フォント最適化
```html
<!-- preconnect で接続を高速化 -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>

<!-- preload で重要なフォントを先読み -->
<link rel="preload" as="font" type="font/woff2" 
      href="https://fonts.gstatic.com/path/to/font.woff2" 
      crossorigin>
```

#### フォントサブセット化
```css
/* 日本語の基本的な文字のみ読み込む */
@import url('https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400&display=swap&subset=japanese');
```

---

## 付録A: 利用可能なフォント一覧

### 日本語フォント
| フォント名 | カテゴリ | ウェイト | 特徴 |
|-----------|---------|---------|------|
| Noto Sans JP | ゴシック | 100-900 | Google製の標準的なゴシック |
| Noto Serif JP | 明朝 | 200-900 | Google製の標準的な明朝 |
| M PLUS 1p | ゴシック | 100-900 | シンプルでモダン |
| M PLUS Rounded 1c | 丸ゴシック | 100-900 | 親しみやすい丸ゴシック |
| Shippori Mincho | 明朝 | 400-800 | 筆の質感を残した明朝 |
| Klee One | 手書き風 | 400,600 | 教科書体風 |
| BIZ UDPGothic | ゴシック | 400,700 | ビジネス文書向け |
| Zen Maru Gothic | 丸ゴシック | 300-900 | やわらかい印象 |

### 英語フォント
| フォント名 | カテゴリ | ウェイト | 特徴 |
|-----------|---------|---------|------|
| Roboto | Sans-serif | 100-900 | Android標準フォント |
| Open Sans | Sans-serif | 300-800 | 読みやすく汎用的 |
| Inter | Sans-serif | 100-900 | UI向けに最適化 |
| Lato | Sans-serif | 100-900 | ヒューマニスト系 |
| Montserrat | Sans-serif | 100-900 | 幾何学的でモダン |
| Playfair Display | Serif | 400-900 | エレガントなセリフ |

---

## 付録B: 設定例集

### ミニマルデザイン
```json
{
  "title": {
    "fontFamily": "'Inter', sans-serif",
    "fontSize": "2.5rem",
    "fontWeight": "200",
    "letterSpacing": "0.05em",
    "color": "#000000"
  },
  "text": {
    "fontFamily": "'Inter', sans-serif",
    "fontSize": "15px",
    "fontWeight": "300",
    "lineHeight": "1.8",
    "color": "#333333"
  }
}
```

### 和風デザイン
```json
{
  "title": {
    "fontFamily": "'Shippori Mincho', serif",
    "fontSize": "3rem",
    "fontWeight": "400",
    "letterSpacing": "0.15em",
    "textAlign": "center"
  },
  "text": {
    "fontFamily": "'Noto Serif JP', serif",
    "fontSize": "16px",
    "fontWeight": "400",
    "lineHeight": "2",
    "letterSpacing": "0.08em"
  }
}
```

### ポップデザイン
```json
{
  "title": {
    "fontFamily": "'M PLUS Rounded 1c', sans-serif",
    "fontSize": "3.5rem",
    "fontWeight": "700",
    "color": "#FF6B6B"
  },
  "text": {
    "fontFamily": "'Kosugi Maru', sans-serif",
    "fontSize": "16px",
    "fontWeight": "400",
    "lineHeight": "1.7"
  }
}
```

---

## 更新履歴

- **2025.06.08**: 初版作成
  - フォントシステムの完全マニュアル作成
  - 日本語・英語フォントの追加
  - トラブルシューティングガイド追加

---

## サポート

問題が発生した場合は、以下の順序で対処してください：

1. このマニュアルのトラブルシューティングを確認
2. ブラウザのコンソールでエラーを確認
3. `font-settings.json`の内容を確認
4. 開発環境で再現テスト

それでも解決しない場合は、以下の情報とともに報告してください：
- エラーメッセージ
- ブラウザとバージョン
- 実行した操作の手順
- `font-settings.json`の内容