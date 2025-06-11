# フォント追加ガイド

## フォントを追加する3つの方法

### 方法1: 管理画面から直接追加（最も簡単）

現在のコードを変更しました。`/components/FontSettingsPanel.jsx`に以下のフォントを追加済みです：

**新しく追加した日本語フォント:**
- M PLUS Rounded 1c（丸ゴシック）
- Klee One（手書き風）
- Kaisei Decol（装飾的楷書）
- Kaisei Tokumin（楷書系明朝）
- Hina Mincho（繊細な明朝）

**新しく追加した英語フォント:**
- Roboto
- Open Sans
- Lato
- Montserrat
- Playfair Display
- Inter

### 方法2: available-fonts.jsファイルを使用（推奨）

`/lib/font-customizer/available-fonts.js`ファイルを作成しました。新しいフォントを追加する手順：

1. **ファイルを開く**
   ```
   /lib/font-customizer/available-fonts.js
   ```

2. **適切なカテゴリに追加**
   ```javascript
   // 日本語フォントの場合
   japanese: [
     // 既存のフォント...
     { 
       name: 'Your Font Name', 
       import: "https://fonts.googleapis.com/css2?family=Your+Font+Name:wght@400;700&display=swap",
       category: 'ゴシック体', // または '明朝体', '手書き風' など
       description: 'フォントの説明'
     },
   ]
   ```

3. **FontSettingsPanelを更新**
   ```javascript
   // components/FontSettingsPanel.jsx の先頭に追加
   import { getAllFonts } from '../lib/font-customizer/available-fonts';
   
   // fontListの初期化を変更
   const [fontList, setFontList] = useState(getAllFonts());
   ```

### 方法3: Google Fontsから新しいフォントを探して追加

1. **Google Fontsにアクセス**
   - 日本語フォント: https://fonts.google.com/?subset=japanese
   - 英語フォント: https://fonts.google.com/

2. **フォントを選択**
   - 使いたいフォントをクリック
   - 「+ Select this style」をクリック
   - 右側のパネルから`@import`のURLをコピー

3. **フォント情報を追加**
   ```javascript
   { 
     name: 'フォント名', 
     import: "コピーしたURL",
     category: 'カテゴリ',
     description: '説明'
   }
   ```

## フォント追加の例

### 例1: 日本語フォント「Stick」を追加

1. Google Fontsで「Stick」を検索
2. インポートURLを取得
3. 以下のように追加：

```javascript
{ 
  name: 'Stick', 
  import: "https://fonts.googleapis.com/css2?family=Stick&display=swap",
  category: 'デコラティブ',
  description: '棒状の個性的なフォント'
}
```

### 例2: Webフォントサービスを使用

Adobe Fontsなど他のサービスのフォントを使用する場合：

```javascript
{ 
  name: 'A1 Gothic', 
  fontFamily: '"a1-gothic", sans-serif',
  import: null, // Adobe Fontsはlink要素で読み込むため
  category: 'ゴシック体',
  description: 'Adobe Fontsのゴシック体'
}
```

## 注意事項

1. **パフォーマンス**
   - フォントファイルのサイズに注意
   - 使用するウェイト（太さ）は必要最小限に
   - `display=swap`を使用してFOUTを防ぐ

2. **ライセンス**
   - Google Fontsは無料で商用利用可
   - 他のフォントはライセンスを確認

3. **日本語フォントのサイズ**
   - 日本語フォントは英語フォントより大きい
   - 必要なサブセットのみ読み込むことを推奨

4. **フォールバック**
   - システムフォントへのフォールバックを設定
   ```javascript
   fontFamily: "'Your Font', 'Noto Sans JP', sans-serif"
   ```

## トラブルシューティング

| 問題 | 解決方法 |
|-----|---------|
| フォントが表示されない | インポートURLが正しいか確認 |
| 選択肢に出てこない | ブラウザキャッシュをクリア |
| 文字化けする | 日本語対応フォントか確認 |
| 読み込みが遅い | ウェイトを減らす、サブセット化 |

最終更新日: 2025年6月8日