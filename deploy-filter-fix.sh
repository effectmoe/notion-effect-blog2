#!/bin/bash

# フィルタリング修正をデプロイ
set -e

PROJECT_DIR="$HOME/Documents/notion-effect-blog2"

echo "🔒 Notionシステムページを除外する修正をデプロイします..."

cd "$PROJECT_DIR"

# コミット
git add lib/search/
git commit -m "fix: Filter out Notion system pages from search results

- Added page validation to exclude Notion system pages
- Only index known blog pages (8 pages)
- Filter out untitled, test, private, and template pages
- Prevent Notion internal pages from appearing in search results"

# プッシュ
git push origin main

echo "✅ フィルタリング修正をデプロイしました！"
echo ""
echo "📌 重要な変更:"
echo "- Notionのシステムページが検索結果から除外されます"
echo "- 既知のブログページ（8ページ）のみがインデックスされます"
echo "- インデックスの再構築が必要です"
echo ""
echo "Vercel: https://vercel.com/effectmoes-projects/notion-effect-blog2"