#!/bin/bash

# 二度目の修正デプロイ
set -e

PROJECT_DIR="$HOME/Documents/notion-effect-blog2"

echo "🔧 インポートエラーを修正してデプロイします（第2回）..."

cd "$PROJECT_DIR"

# コミット
git add lib/search/hybrid-api.ts
git commit -m "fix: Use dynamic import for @notionhq/client to resolve build error

- Changed to dynamic import to avoid TypeScript compilation issues
- Made official API initialization asynchronous
- Added error handling for API initialization"

# プッシュ
git push origin main

echo "✅ 修正版（第2回）をデプロイしました！"
echo ""
echo "📌 Vercelでビルド状況を確認:"
echo "   https://vercel.com/effectmoes-projects/notion-effect-blog2"