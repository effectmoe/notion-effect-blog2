#!/bin/bash

# デプロイスクリプト
set -e

echo "🚀 ハイブリッド検索機能のデプロイを開始します..."

# プロジェクトディレクトリ
PROJECT_DIR="$HOME/Documents/notion-effect-blog2"
SOURCE_DIR="$HOME/Desktop/notion-effect-blog2"

# 色付き出力
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# ステップ1: プロジェクトディレクトリに移動
echo -e "\n${YELLOW}ステップ1: プロジェクトディレクトリに移動${NC}"
cd "$PROJECT_DIR"
echo -e "${GREEN}✓ $(pwd)${NC}"

# ステップ2: ファイルをコピー
echo -e "\n${YELLOW}ステップ2: 検索機能のファイルをコピー${NC}"

# lib/search
cp -r "$SOURCE_DIR/lib/search" ./lib/
echo -e "${GREEN}✓ lib/search${NC}"

# components
cp "$SOURCE_DIR/components/SearchModal.tsx" ./components/
cp "$SOURCE_DIR/components/SearchModal.module.css" ./components/
echo -e "${GREEN}✓ SearchModalコンポーネント${NC}"

# API
mkdir -p ./pages/api/search
cp "$SOURCE_DIR/pages/api/search/index.ts" ./pages/api/search/
cp "$SOURCE_DIR/pages/api/search/reindex.ts" ./pages/api/search/
echo -e "${GREEN}✓ 検索API${NC}"

# テストページ
cp "$SOURCE_DIR/pages/test-search.tsx" ./pages/
echo -e "${GREEN}✓ テストページ${NC}"

# ドキュメント
cp "$SOURCE_DIR/SEARCH_IMPLEMENTATION_GUIDE.md" ./
echo -e "${GREEN}✓ ドキュメント${NC}"

# ステップ3: 依存関係の確認
echo -e "\n${YELLOW}ステップ3: 依存関係の確認${NC}"
if ! grep -q "@notionhq/client" package.json; then
    echo "依存関係をインストール中..."
    npm install @notionhq/client lodash
    npm install --save-dev @types/lodash
else
    echo -e "${GREEN}✓ 依存関係は既にインストール済み${NC}"
fi

# ステップ4: Git状態確認
echo -e "\n${YELLOW}ステップ4: Git状態の確認${NC}"
git status --short

# ステップ5: コミット
echo -e "\n${YELLOW}ステップ5: 変更をコミット${NC}"
git add .
git commit -m "feat: Add hybrid search functionality with Notion API integration

- Implemented hybrid search using both official and unofficial Notion APIs
- Added search modal component with real-time search
- Integrated data source switching for optimal search results
- Added search indexing and caching capabilities
- Configured Blog Search integration with Notion API"

# ステップ6: プッシュ
echo -e "\n${YELLOW}ステップ6: GitHubにプッシュ${NC}"
git push origin main

echo -e "\n${GREEN}✅ デプロイが完了しました！${NC}"
echo ""
echo "次のステップ:"
echo "1. Vercelのダッシュボードでビルド状況を確認"
echo "2. 環境変数を設定:"
echo "   - NOTION_SEARCH_API_SECRET=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"
echo "3. デプロイ完了後、/test-search でテスト"
echo ""
echo "Vercel: https://vercel.com/effectmoes-projects/notion-effect-blog2"