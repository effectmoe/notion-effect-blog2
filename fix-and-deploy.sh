#!/bin/bash

# 修正版デプロイスクリプト
set -e

PROJECT_DIR="$HOME/Documents/notion-effect-blog2"

echo "🔧 ビルドエラーを修正してデプロイします..."

# プロジェクトディレクトリに移動
cd "$PROJECT_DIR"

# 変更をコミット
echo "💾 修正をコミット中..."
git add lib/search/hybrid-api.ts
git commit -m "fix: Correct NotionClient import in hybrid-api.ts

- Fixed TypeScript error by importing Client correctly
- Changed NotionClient type reference to Client"

# プッシュ
echo "🚀 GitHubにプッシュ中..."
git push origin main

echo "✅ 修正版をデプロイしました！"
echo ""
echo "📌 Vercelでビルド状況を確認:"
echo "   https://vercel.com/effectmoes-projects/notion-effect-blog2"
echo ""
echo "⚠️  環境変数の設定を忘れずに！"
echo "   NOTION_SEARCH_API_SECRET=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"