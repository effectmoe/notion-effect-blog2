#!/bin/bash

# 自動デプロイスクリプト
set -e

PROJECT_DIR="$HOME/Documents/notion-effect-blog2"

echo "🚀 自動デプロイを開始します..."

# プロジェクトディレクトリに移動
cd "$PROJECT_DIR"

# Gitの状態を確認
echo "📊 Git状態を確認中..."
git status --short

# 依存関係をインストール（まだの場合）
if ! grep -q "@notionhq/client" package.json; then
    echo "📦 依存関係をインストール中..."
    npm install @notionhq/client lodash
    npm install --save-dev @types/lodash
fi

# すべての変更をステージング
echo "📝 変更をステージング中..."
git add .

# 変更内容を表示
echo "📋 変更内容:"
git diff --cached --stat

# コミット
echo "💾 コミット中..."
git commit -m "feat: Add hybrid search functionality with Notion API integration

- Implemented hybrid search using both official and unofficial Notion APIs
- Added search modal component with real-time search capabilities
- Integrated data source switching for optimal search results
- Added search indexing and caching capabilities
- Configured Blog Search integration with Notion API
- Added test page at /test-search for functionality verification

Co-Authored-By: Claude <noreply@anthropic.com>"

# プッシュ
echo "🚀 GitHubにプッシュ中..."
git push origin main

echo "✅ デプロイが完了しました！"
echo ""
echo "📌 次のステップ:"
echo "1. Vercelでビルド状況を確認: https://vercel.com/effectmoes-projects/notion-effect-blog2"
echo "2. Vercelで環境変数を設定:"
echo "   NOTION_SEARCH_API_SECRET=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"
echo "3. デプロイ完了後、以下でテスト:"
echo "   https://notion-effect-blog2.vercel.app/test-search"