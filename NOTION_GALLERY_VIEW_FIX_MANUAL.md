# Notionトグルリスト内ギャラリービュー表示修正マニュアル

## 問題の概要
NotionページのトグルリストB内に配置されたギャラリービューが、Next.js（react-notion-x）でレンダリングした際に表示されない問題。

## 解決方法

### 1. Notion APIの設定を更新
トグル内のコレクションビューを含むすべてのブロックを取得するため、APIオプションを追加。

**修正ファイル:**
- `/lib/notion.ts`
- `/lib/notion-api-hybrid.ts`

**変更内容:**
```typescript
// getPage関数にオプションを追加
const recordMap = await notion.getPage(pageId, {
  fetchMissingBlocks: true,    // 不足しているブロックを取得
  fetchCollections: true,       // コレクションビューを取得
  signFileUrls: false,
  chunkLimit: 100,
  chunkNumber: 0
})
```

### 2. カスタムToggleコンポーネントの実装
トグル内のコレクションビューが正しくレンダリングされるようにカスタムコンポーネントを追加。

**修正ファイル:** `/components/NotionPage.tsx`

**変更内容:**
```typescript
// componentsマッピングにToggleコンポーネントを追加
Toggle: ({ block, children }) => {
  const [isOpen, setIsOpen] = React.useState(false)
  const title = getBlockTitle(block, recordMap)
  
  return (
    <details className="notion-toggle" open={isOpen}>
      <summary 
        className="notion-toggle-title"
        onClick={(e) => {
          e.preventDefault()
          setIsOpen(!isOpen)
        }}
      >
        {title}
      </summary>
      <div className="notion-toggle-content">
        {children}
      </div>
    </details>
  )
}
```

### 3. コレクションビュードロップダウンの有効化
NotionRendererのプロパティを更新。

**変更内容:**
```typescript
showCollectionViewDropdown={true}  // falseからtrueに変更
```

### 4. CSSスタイルの追加
トグル内のギャラリービューが正しく表示されるようにスタイルを追加。

**新規ファイル:** `/styles/toggle-gallery-fix.css`

**主要なスタイル:**
- トグルコンテンツの表示を確保
- コレクションビューの可視性を強制
- ギャラリーグリッドレイアウトの修正
- ダークモードサポート

### 5. スタイルのインポート
**修正ファイル:** `/pages/_app.tsx`

```typescript
import 'styles/toggle-gallery-fix.css'
```

## 技術的な詳細

### 問題の原因
1. **データ取得の不足**: デフォルトのAPIコールでは、トグル内のネストされたブロック（コレクションビュー）が取得されていなかった
2. **コンポーネントマッピングの欠如**: react-notion-xのデフォルトToggleコンポーネントが、子要素を適切にレンダリングしていない可能性
3. **スタイルの問題**: CSSでコレクションビューが非表示になっている可能性

### 解決策のポイント
1. **fetchMissingBlocks: true**: トグル内のブロックを確実に取得
2. **fetchCollections: true**: コレクションビューのデータを取得
3. **カスタムToggleコンポーネント**: 子要素（children）を確実にレンダリング
4. **CSSの!important**: 既存のスタイルを上書きして表示を強制

## 動作確認方法
1. 開発サーバーを再起動: `npm run dev`
2. トグルリストを含むページにアクセス
3. トグルをクリックして開く
4. ギャラリービューが正しく表示されることを確認

## トラブルシューティング
- **表示されない場合**: ブラウザの開発者ツールでConsoleエラーを確認
- **スタイルが適用されない場合**: キャッシュをクリアして再読み込み
- **データが取得できない場合**: Notion APIの認証情報を確認

## 今後の改善点
- トグルの開閉状態の保持（localStorage使用）
- アニメーションの追加
- パフォーマンスの最適化（遅延読み込み）