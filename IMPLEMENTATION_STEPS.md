# ハイブリッド検索機能 - 実装手順

## 準備完了状況
- ✅ Notion APIキー取得済み: `ntn_493950527426...`
- ✅ 検索機能のコード実装済み
- ⏳ プロジェクトへの統合待ち

## 即座に実行する手順

### 1. ターミナルで実行（5分）

```bash
# 実際のプロジェクトディレクトリに移動
cd ~/Documents/notion-effect-blog2

# 検索機能のファイルをコピー
cp -r ~/Desktop/notion-effect-blog2/lib/search ./lib/
cp ~/Desktop/notion-effect-blog2/components/SearchModal.* ./components/
mkdir -p ./pages/api/search
cp -r ~/Desktop/notion-effect-blog2/pages/api/search/* ./pages/api/search/
cp ~/Desktop/notion-effect-blog2/pages/test-search.tsx ./pages/

# 環境変数を設定
echo "" >> .env.local
echo "# Notion API設定" >> .env.local
echo "NOTION_API_SECRET=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" >> .env.local

# 依存関係をインストール
npm install @notionhq/client lodash
npm install --save-dev @types/lodash

# 開発サーバーを起動
npm run dev
```

### 2. ブラウザで確認（2分）

1. http://localhost:3000/test-search を開く
2. 「インデックス構築」ボタンをクリック
3. 構築完了後、「検索APIテスト」をクリック
4. 「検索モーダルを開く」で動作確認

### 3. ヘッダーに統合（5分）

`components/Header.tsx`または`components/HeaderMenu.tsx`を編集：

```tsx
// 1. インポートを追加
import { useState, useEffect } from 'react'
import { SearchModal } from './SearchModal'

// 2. コンポーネント内に状態を追加
const [isSearchOpen, setIsSearchOpen] = useState(false)

// 3. キーボードショートカットを追加
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault()
      setIsSearchOpen(true)
    }
  }
  window.addEventListener('keydown', handleKeyDown)
  return () => window.removeEventListener('keydown', handleKeyDown)
}, [])

// 4. 検索ボタンをJSXに追加
<button onClick={() => setIsSearchOpen(true)}>
  🔍 検索 (⌘K)
</button>

// 5. モーダルをJSXの最後に追加
<SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
```

### 4. デプロイ（3分）

```bash
# 変更をコミット
git add .
git commit -m "feat: Add hybrid search with Notion API integration"

# プッシュ（自動デプロイ）
git push origin main
```

## トラブルシューティング

### エラー: "Notion API connection failed"
→ Notionでインテグレーションのアクセス権限を設定してください

### エラー: "No pages found"
→ インデックスを再構築してください

### 検索結果が0件
→ Notionページの共有設定を確認してください

## 次のステップ

1. 検索パフォーマンスの監視
2. 検索履歴の実装
3. 検索結果のカスタマイズ

## サポート

問題が発生した場合は、エラーメッセージと共にお知らせください。