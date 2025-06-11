#!/bin/bash

# フィルタリング強化をデプロイ
set -e

PROJECT_DIR="$HOME/Documents/notion-effect-blog2"

echo "🔒 検索フィルタリングを強化します..."

cd "$PROJECT_DIR"

# コミット
git add lib/search/search-filter.ts components/SearchModal.tsx
git commit -m "fix: Strengthen search filtering to exclude untitled and system pages

- Filter out pages with '無題' (untitled) in the title
- Filter out 'Notionページ' system pages
- Add frontend filtering as additional safety layer
- Prevent empty search results display for short queries"

# プッシュ
git push origin main

echo "✅ フィルタリング強化をデプロイしました！"
echo ""
echo "📌 改善内容:"
echo "- 「無題のページ」が検索結果から除外されます"
echo "- 「Notionページ」が検索結果から除外されます"
echo "- フロントエンドでも追加のフィルタリング"
echo ""
echo "⚠️  重要: デプロイ後、インデックスを再構築してください"
echo ""
echo "Vercel: https://vercel.com/effectmoes-projects/notion-effect-blog2"