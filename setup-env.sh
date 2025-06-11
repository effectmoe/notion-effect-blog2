#!/bin/bash

# 環境変数設定スクリプト

echo "🔐 環境変数を設定します..."

# プロジェクトディレクトリ（必要に応じて変更）
PROJECT_DIR="$HOME/Documents/notion-effect-blog2"

# .env.localファイルのパス
ENV_FILE="$PROJECT_DIR/.env.local"

# APIキーを追加
echo "" >> "$ENV_FILE"
echo "# Notion API設定 ($(date))" >> "$ENV_FILE"
echo "NOTION_API_SECRET=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" >> "$ENV_FILE"

echo "✅ 環境変数を設定しました: $ENV_FILE"
echo ""
echo "⚠️  重要: .env.local ファイルは .gitignore に含まれていることを確認してください"
echo ""

# .gitignoreの確認
if [ -f "$PROJECT_DIR/.gitignore" ]; then
    if grep -q ".env.local" "$PROJECT_DIR/.gitignore"; then
        echo "✅ .env.local は .gitignore に含まれています"
    else
        echo "⚠️  警告: .env.local を .gitignore に追加してください"
        echo ".env.local" >> "$PROJECT_DIR/.gitignore"
        echo "✅ .gitignore に .env.local を追加しました"
    fi
fi