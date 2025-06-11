#!/bin/bash

# ハイブリッド検索機能の実装スクリプト

echo "🔍 Notion Effect Blog - ハイブリッド検索機能の実装を開始します..."

# 実際のプロジェクトディレクトリのパスを設定
# ※このパスを実際のプロジェクトディレクトリに変更してください
TARGET_DIR="/Users/tonychustudio/Documents/notion-effect-blog2"
SOURCE_DIR="/Users/tonychustudio/Desktop/notion-effect-blog2"

# 色付きの出力
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# ステップ1: ターゲットディレクトリの確認
echo -e "\n${YELLOW}ステップ1: プロジェクトディレクトリの確認${NC}"
if [ ! -d "$TARGET_DIR" ]; then
    echo -e "${RED}エラー: プロジェクトディレクトリが見つかりません: $TARGET_DIR${NC}"
    echo "正しいパスを指定してください。"
    exit 1
fi
echo -e "${GREEN}✓ プロジェクトディレクトリを確認しました${NC}"

# ステップ2: 必要なディレクトリの作成
echo -e "\n${YELLOW}ステップ2: 必要なディレクトリの作成${NC}"
mkdir -p "$TARGET_DIR/lib/search"
mkdir -p "$TARGET_DIR/pages/api/search"
echo -e "${GREEN}✓ ディレクトリを作成しました${NC}"

# ステップ3: ファイルのコピー
echo -e "\n${YELLOW}ステップ3: 検索機能のファイルをコピー${NC}"

# lib/searchディレクトリ
if [ -d "$SOURCE_DIR/lib/search" ]; then
    cp -r "$SOURCE_DIR/lib/search/"* "$TARGET_DIR/lib/search/"
    echo -e "${GREEN}✓ lib/search ディレクトリをコピーしました${NC}"
else
    echo -e "${RED}警告: lib/search ディレクトリが見つかりません${NC}"
fi

# コンポーネント
if [ -f "$SOURCE_DIR/components/SearchModal.tsx" ]; then
    cp "$SOURCE_DIR/components/SearchModal.tsx" "$TARGET_DIR/components/"
    cp "$SOURCE_DIR/components/SearchModal.module.css" "$TARGET_DIR/components/"
    echo -e "${GREEN}✓ SearchModalコンポーネントをコピーしました${NC}"
else
    echo -e "${RED}警告: SearchModalコンポーネントが見つかりません${NC}"
fi

# API
if [ -d "$SOURCE_DIR/pages/api/search" ]; then
    cp -r "$SOURCE_DIR/pages/api/search/"* "$TARGET_DIR/pages/api/search/"
    echo -e "${GREEN}✓ 検索APIをコピーしました${NC}"
else
    echo -e "${RED}警告: 検索APIが見つかりません${NC}"
fi

# テストページ
if [ -f "$SOURCE_DIR/pages/test-search.tsx" ]; then
    cp "$SOURCE_DIR/pages/test-search.tsx" "$TARGET_DIR/pages/"
    echo -e "${GREEN}✓ テストページをコピーしました${NC}"
fi

# ドキュメント
if [ -f "$SOURCE_DIR/SEARCH_IMPLEMENTATION_GUIDE.md" ]; then
    cp "$SOURCE_DIR/SEARCH_IMPLEMENTATION_GUIDE.md" "$TARGET_DIR/"
    echo -e "${GREEN}✓ ドキュメントをコピーしました${NC}"
fi

# ステップ4: package.jsonの更新
echo -e "\n${YELLOW}ステップ4: 依存関係の追加${NC}"
cd "$TARGET_DIR"

# 必要なパッケージをインストール
echo "依存関係をインストールしています..."
npm install @notionhq/client lodash
npm install --save-dev @types/lodash

echo -e "${GREEN}✓ 依存関係をインストールしました${NC}"

# ステップ5: 環境変数の確認
echo -e "\n${YELLOW}ステップ5: 環境変数の設定${NC}"
if [ ! -f "$TARGET_DIR/.env.local" ]; then
    echo -e "${RED}警告: .env.local ファイルが見つかりません${NC}"
    echo "以下の環境変数を .env.local に追加してください："
    echo ""
    echo "NOTION_API_SECRET=your_notion_api_secret_here"
else
    if grep -q "NOTION_API_SECRET" "$TARGET_DIR/.env.local"; then
        echo -e "${GREEN}✓ NOTION_API_SECRET は既に設定されています${NC}"
    else
        echo -e "${YELLOW}以下の行を .env.local に追加してください：${NC}"
        echo ""
        echo "NOTION_API_SECRET=your_notion_api_secret_here"
    fi
fi

# ステップ6: 統合手順の表示
echo -e "\n${YELLOW}ステップ6: 次の手順${NC}"
echo ""
echo "1. 既存のヘッダーコンポーネントに検索ボタンを追加："
echo "   - components/Header.tsx または類似のファイルを編集"
echo "   - SearchModal をインポートして統合"
echo ""
echo "2. Notion APIキーを取得："
echo "   - https://www.notion.so/my-integrations にアクセス"
echo "   - 新しいインテグレーションを作成"
echo "   - APIキーを .env.local に設定"
echo ""
echo "3. インデックスの構築："
echo "   - npm run dev でローカルサーバーを起動"
echo "   - http://localhost:3000/test-search にアクセス"
echo "   - 「インデックス構築」ボタンをクリック"
echo ""
echo "4. デプロイ："
echo "   - git add ."
echo "   - git commit -m \"feat: Add hybrid search functionality\""
echo "   - git push origin main"
echo ""
echo -e "${GREEN}✅ ハイブリッド検索機能の実装準備が完了しました！${NC}"