# Notion Effect Blog カラー管理システム完全マニュアル

## 目次
1. [システム概要](#1-システム概要)
2. [システム構造](#2-システム構造)
3. [アクセス方法](#3-アクセス方法)
4. [管理画面の使い方](#4-管理画面の使い方)
5. [設定可能な要素一覧](#5-設定可能な要素一覧)
6. [カラープリセット](#6-カラープリセット)
7. [高度な設定](#7-高度な設定)
8. [トラブルシューティング](#8-トラブルシューティング)
9. [技術仕様](#9-技術仕様)
10. [メンテナンス](#10-メンテナンス)

---

## 1. システム概要

### 1.1 カラー管理システムとは
Notion Effect Blogのカラー管理システムは、サイト全体の配色をGUIで簡単に管理できるシステムです。CSSの知識がなくても、視覚的に色を選択・変更でき、リアルタイムでプレビューを確認できます。

### 1.2 主な特徴
- **ノーコード操作**: プログラミング知識不要
- **リアルタイムプレビュー**: 変更が即座に反映
- **カテゴリー別管理**: 要素をグループ化して整理
- **プリセット機能**: ダークモード、セピアなど
- **インポート/エクスポート**: 設定の保存と共有
- **レスポンシブ対応**: モバイルでも操作可能

### 1.3 システムのメリット
- デザインの一貫性を保持
- ブランドカラーの統一管理
- ダークモード対応が簡単
- チーム間での設定共有が可能

---

## 2. システム構造

### 2.1 ファイル構成
```
notion-effect-blog2/
├── components/
│   ├── ColorSettingsPanel.jsx      # 管理画面UI
│   ├── ColorSettingsPanel.module.css # 管理画面スタイル
│   └── ColorStyler.jsx             # CSS動的注入コンポーネント
├── lib/
│   └── color-customizer/
│       ├── color-settings.js       # デフォルト設定・プリセット
│       └── color-utils.js          # ユーティリティ関数
├── pages/
│   ├── admin/
│   │   └── color-settings.jsx      # 管理画面ページ
│   └── api/
│       └── color-settings.js       # APIエンドポイント
└── color-settings.json             # 保存された設定（自動生成）
```

### 2.2 システムフロー
```
┌─────────────────────────────────────────────────────┐
│                   ユーザーアクセス                     │
└─────────────┬───────────────────────┬───────────────┘
              │                       │
              ▼                       ▼
┌─────────────────────┐     ┌─────────────────────┐
│   管理画面          │     │   ブログページ       │
│ /admin/color-settings│     │   全ページ          │
└─────────┬───────────┘     └──────────┬──────────┘
          │                             │
          ▼                             ▼
┌─────────────────────┐     ┌─────────────────────┐
│ ColorSettingsPanel  │     │    ColorStyler      │
│  設定UI＆プレビュー  │     │  動的CSS注入        │
└─────────┬───────────┘     └──────────┬──────────┘
          │                             │
          ▼                             ▼
┌─────────────────────┐     ┌─────────────────────┐
│  Color Settings API │────▶│   LocalStorage      │
│  永続化＆配信       │     │   キャッシュ(24h)    │
└─────────┬───────────┘     └─────────────────────┘
          │
          ▼
┌─────────────────────┐
│ color-settings.json │
│  設定ファイル       │
└─────────────────────┘
```

### 2.3 データフロー
1. **設定変更時**
   - ユーザーが管理画面で色を変更
   - リアルタイムでColorStylerコンポーネントに通知
   - CSSが動的に生成・適用
   - 保存ボタンでAPIに送信

2. **ページ読み込み時**
   - ColorStylerがLocalStorageを確認
   - キャッシュがない場合はAPIから取得
   - CSSを生成してページに適用

---

## 3. アクセス方法

### 3.1 管理画面URL
```
開発環境: http://localhost:3000/admin/color-settings
本番環境: https://your-domain.com/admin/color-settings
```

### 3.2 認証情報
```
パスワード: your_admin_password
```
※ 環境変数 `NEXT_PUBLIC_ADMIN_PASSWORD` で変更可能

### 3.3 ログイン手順
1. 上記URLにアクセス
2. パスワード入力画面が表示
3. パスワードを入力して「ログイン」をクリック
4. 認証成功後、管理画面が表示

※ セッションストレージに保存されるため、ブラウザを閉じるまで再ログイン不要

---

## 4. 管理画面の使い方

### 4.1 画面構成
```
┌────────────────────────────────────────────────────┐
│  カラー設定管理                              [ログアウト] │
│  Notion Effect Blog の配色をカスタマイズ              │
├────────────────────────────────────────────────────┤
│  カラープリセット                                     │
│  [デフォルト] [ダークモード] [セピア] [カスタム]      │
├────────────────────────────────────────────────────┤
│  🎨 基本要素                                    [▼]  │
│  ┌─────────────┬─────────────┬─────────────┐      │
│  │ページ全体    │ヘッダー      │フッター      │      │
│  │[■]背景色    │[■]背景色    │[■]背景色    │      │
│  │[■]文字色    │[■]文字色    │[■]文字色    │      │
│  └─────────────┴─────────────┴─────────────┘      │
├────────────────────────────────────────────────────┤
│  📝 テキスト要素                                [▼]  │
│  ┌─────────────┬─────────────┬─────────────┐      │
│  │タイトル      │見出し1       │見出し2       │      │
│  │[■]背景色    │[■]背景色    │[■]背景色    │      │
│  │[■]文字色    │[■]文字色    │[■]文字色    │      │
│  └─────────────┴─────────────┴─────────────┘      │
├────────────────────────────────────────────────────┤
│ [設定を保存] [プレビュー] [リセット] [エクスポート]   │
└────────────────────────────────────────────────────┘
```

### 4.2 基本操作

#### 4.2.1 色の変更
1. **カラースウォッチをクリック**
   - カラーピッカーが開く
   - 好きな色を選択

2. **16進数で直接入力**
   - 入力欄に `#FF5733` のような形式で入力
   - `transparent` で透明に設定可能

3. **プレビューで確認**
   - 各要素の右側にプレビューが表示
   - 変更がリアルタイムで反映

#### 4.2.2 プリセットの使用
1. **プリセットカードをクリック**
   - デフォルト、ダークモード、セピアから選択
   - 即座に全体の配色が変更

2. **カスタムプリセット**
   - 手動で調整した設定は「カスタム」として保存

#### 4.2.3 カテゴリーの操作
- **展開/折りたたみ**: カテゴリータイトルをクリック
- **一覧**: 基本要素、テキスト要素、コード・引用、インタラクティブ要素、データベース、その他

### 4.3 設定の保存
1. **「設定を保存」ボタンをクリック**
2. **成功メッセージが表示**
3. **LocalStorageとサーバーの両方に保存**

---

## 5. 設定可能な要素一覧

### 5.1 基本要素
| 要素 | 設定項目 | 対象CSS | 説明 |
|-----|----------|---------|------|
| page | backgroundColor, textColor | body, .notion-app-inner | ページ全体の背景と文字色 |
| header | backgroundColor, textColor, borderColor | .notion-header, .header | ヘッダー部分 |
| footer | backgroundColor, textColor, borderColor | .footer | フッター部分 |
| sidebar | backgroundColor, textColor, borderColor | .notion-aside | サイドバー |

### 5.2 テキスト要素
| 要素 | 設定項目 | 対象CSS | 説明 |
|-----|----------|---------|------|
| pageTitle | backgroundColor, textColor | .notion-page-title-text | ページタイトル |
| heading1 | backgroundColor, textColor | .notion-header-block | 見出し1（H1） |
| heading2 | backgroundColor, textColor | .notion-sub_header-block | 見出し2（H2） |
| heading3 | backgroundColor, textColor | .notion-sub_sub_header-block | 見出し3（H3） |
| text | backgroundColor, textColor | .notion-text-block | 本文テキスト |
| link | backgroundColor, textColor, hoverColor | .notion-link | リンク |

### 5.3 コード・引用
| 要素 | 設定項目 | 対象CSS | 説明 |
|-----|----------|---------|------|
| codeBlock | backgroundColor, textColor, borderColor | .notion-code-block | コードブロック |
| inlineCode | backgroundColor, textColor | .notion-inline-code | インラインコード |
| quote | backgroundColor, textColor, borderColor | .notion-quote-block | 引用ブロック |

### 5.4 インタラクティブ要素
| 要素 | 設定項目 | 対象CSS | 説明 |
|-----|----------|---------|------|
| callout | backgroundColor, textColor, borderColor | .notion-callout-block | コールアウト |
| toggle | backgroundColor, textColor, hoverBackgroundColor | .notion-toggle | トグルリスト |
| button | backgroundColor, textColor, hoverBackgroundColor, borderColor | .notion-button | ボタン |

### 5.5 データベース
| 要素 | 設定項目 | 対象CSS | 説明 |
|-----|----------|---------|------|
| table | backgroundColor, textColor, borderColor, headerBackgroundColor | .notion-table | テーブル |
| listItem | backgroundColor, textColor, hoverBackgroundColor, borderColor | .notion-list-item | リストアイテム |
| galleryCard | backgroundColor, textColor, hoverBackgroundColor, borderColor | .notion-gallery-card | ギャラリーカード |

### 5.6 その他
| 要素 | 設定項目 | 対象CSS | 説明 |
|-----|----------|---------|------|
| selection | backgroundColor, textColor | ::selection | テキスト選択時 |

---

## 6. カラープリセット

### 6.1 デフォルト
標準的な明るい配色。読みやすさを重視した設定。

```javascript
{
  page: { backgroundColor: '#ffffff', textColor: '#374151' },
  header: { backgroundColor: '#ffffff', textColor: '#1f2937' },
  // ... 他の要素
}
```

### 6.2 ダークモード
目に優しい暗い配色。夜間の閲覧に最適。

```javascript
{
  page: { backgroundColor: '#0f172a', textColor: '#e2e8f0' },
  header: { backgroundColor: '#1e293b', textColor: '#f1f5f9' },
  // ... 他の要素
}
```

### 6.3 セピア
温かみのある配色。長時間の読書に適している。

```javascript
{
  page: { backgroundColor: '#fef6e4', textColor: '#5c4b3a' },
  header: { backgroundColor: '#fef6e4', textColor: '#5c4b3a' },
  // ... 他の要素
}
```

### 6.4 カスタムプリセットの作成
1. 好みの配色に調整
2. エクスポート機能でJSONファイルを保存
3. 必要に応じてインポートで復元

---

## 7. 高度な設定

### 7.1 設定のエクスポート/インポート

#### エクスポート手順
1. 「エクスポート」ボタンをクリック
2. `color-settings-YYYY-MM-DD.json` 形式でダウンロード
3. チームメンバーと共有可能

#### インポート手順
1. 「インポート」ボタンをクリック
2. JSONファイルを選択
3. 設定が即座に適用

### 7.2 APIを使用した自動化

#### 設定の取得
```bash
curl https://your-domain.com/api/color-settings
```

#### 設定の更新
```bash
curl -X POST https://your-domain.com/api/color-settings \
  -H "Content-Type: application/json" \
  -d '{
    "page": {
      "backgroundColor": "#000000",
      "textColor": "#ffffff"
    }
  }'
```

### 7.3 カスタムCSSとの併用
ColorStylerが生成するCSSは `!important` が付いているため、通常のCSSより優先されます。特定の要素だけ除外したい場合は、より詳細なセレクタを使用してください。

```css
/* ColorStylerの設定を上書きする例 */
.special-section .notion-text-block {
  color: #FF0000 !important;
}
```

---

## 8. トラブルシューティング

### 8.1 よくある問題と解決方法

| 問題 | 原因 | 解決方法 |
|-----|------|----------|
| 色が反映されない | キャッシュの問題 | ブラウザキャッシュをクリア（Ctrl+Shift+R） |
| 保存できない | 権限の問題 | color-settings.jsonの書き込み権限を確認 |
| プレビューが表示されない | JavaScript無効 | JavaScriptを有効にする |
| ログインできない | パスワード間違い | 環境変数を確認 |
| 一部の要素だけ色が変わらない | CSS優先順位 | !importantが付いているか確認 |

### 8.2 デバッグ方法

#### ブラウザコンソールで確認
```javascript
// 現在の設定を確認
console.log(localStorage.getItem('colorSettings'));

// ColorStylerが生成したCSSを確認
console.log(document.getElementById('color-styles').innerHTML);
```

#### 開発者ツールで確認
1. F12で開発者ツールを開く
2. Elementsタブで要素を選択
3. Stylesパネルで適用されているCSSを確認

### 8.3 設定のリセット
管理画面で「デフォルトに戻す」をクリック、または：

```javascript
// LocalStorageをクリア
localStorage.removeItem('colorSettings');
localStorage.removeItem('colorSettingsTimestamp');
```

---

## 9. 技術仕様

### 9.1 color-settings.json構造
```json
{
  "page": {
    "backgroundColor": "#ffffff",
    "textColor": "#374151",
    "className": "body, .notion-app-inner"
  },
  "header": {
    "backgroundColor": "#ffffff",
    "textColor": "#1f2937",
    "borderColor": "#e5e7eb",
    "className": ".notion-header, .header"
  },
  // ... 他の要素
}
```

### 9.2 CSS生成ロジック
```javascript
// color-utils.js の generateColorCSS 関数
Object.entries(settings).forEach(([key, config]) => {
  if (config.backgroundColor) {
    css += `${config.className} { background-color: ${config.backgroundColor} !important; }\n`;
  }
  if (config.textColor) {
    css += `${config.className} { color: ${config.textColor} !important; }\n`;
  }
  // ... 他のプロパティ
});
```

### 9.3 イベントシステム
```javascript
// カラー設定更新イベント
const event = new CustomEvent('colorSettingsUpdate', { 
  detail: { settings: newSettings } 
});
window.dispatchEvent(event);

// リスナー登録
window.addEventListener('colorSettingsUpdate', (event) => {
  // 設定を適用
});
```

### 9.4 パフォーマンス最適化
- LocalStorageキャッシュ: 24時間
- CSS生成: 変更時のみ
- スタイルタグ: 1つのみ使用（既存を置換）

---

## 10. メンテナンス

### 10.1 定期メンテナンス

#### 週次タスク
- [ ] 設定ファイルのバックアップ
- [ ] LocalStorageキャッシュの確認
- [ ] エラーログの確認

#### 月次タスク
- [ ] 使用されていない設定の整理
- [ ] パフォーマンス測定
- [ ] ユーザーフィードバックの収集

### 10.2 バックアップとリストア

#### バックアップコマンド
```bash
# 設定ファイルのバックアップ
cp color-settings.json color-settings.backup.$(date +%Y%m%d).json

# システム全体のバックアップ
tar -czf color-system-backup-$(date +%Y%m%d).tar.gz \
  components/ColorSettings* \
  components/ColorStyler.jsx \
  lib/color-customizer/ \
  pages/admin/color-settings.jsx \
  pages/api/color-settings.js \
  color-settings.json
```

#### リストアコマンド
```bash
# 設定ファイルのリストア
cp color-settings.backup.20250608.json color-settings.json

# システム全体のリストア
tar -xzf color-system-backup-20250608.tar.gz
```

### 10.3 アップデート手順
1. 現在のシステムをバックアップ
2. 新しいファイルを配置
3. package.jsonの依存関係を確認
4. ビルドテスト実行
5. 本番環境へデプロイ

### 10.4 セキュリティ
- 管理画面はパスワード保護
- セッションストレージ使用（XSS対策）
- APIエンドポイントは認証なし（必要に応じて追加）

---

## 付録A: カラーパレット例

### ブランドカラーセット
```javascript
const brandColors = {
  primary: '#8b5cf6',    // 紫
  secondary: '#ec4899',  // ピンク
  success: '#10b981',    // 緑
  warning: '#f59e0b',    // オレンジ
  error: '#ef4444',      // 赤
  info: '#3b82f6'        // 青
};
```

### アクセシビリティ配慮
- 文字と背景のコントラスト比: 4.5:1以上推奨
- リンクは周囲のテキストと区別可能に
- フォーカス状態を明確に表示

---

## 付録B: よくある質問（FAQ）

**Q: フォント設定と併用できますか？**
A: はい、フォント設定システムと完全に独立して動作します。

**Q: 部分的に色を変更できますか？**
A: はい、各要素個別に設定可能です。

**Q: モバイルで管理画面は使えますか？**
A: はい、レスポンシブ対応しています。

**Q: 設定はどこに保存されますか？**
A: サーバー（color-settings.json）とブラウザ（LocalStorage）の両方に保存されます。

---

## 更新履歴
- **2025.06.08**: 初版作成
  - カラー管理システム実装
  - 3つのプリセット追加
  - 管理画面UI実装

---

## サポート
問題が発生した場合は、以下の順序で対処してください：

1. このマニュアルのトラブルシューティングを確認
2. ブラウザコンソールでエラーを確認
3. color-settings.jsonの内容を確認
4. 開発環境で再現テスト

解決しない場合は、以下の情報とともに報告してください：
- エラーメッセージ
- ブラウザとバージョン
- 実行した操作の手順
- color-settings.jsonの内容（機密情報は除く）