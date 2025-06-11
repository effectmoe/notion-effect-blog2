#!/bin/bash

# 環境変数更新スクリプト

PROJECT_DIR="$HOME/Documents/notion-effect-blog2"
ENV_FILE="$PROJECT_DIR/.env.local"

echo "📝 .env.localファイルを更新します..."

# ファイルが存在するか確認
if [ ! -f "$ENV_FILE" ]; then
    echo "⚠️  .env.localが見つかりません。新規作成します..."
    touch "$ENV_FILE"
fi

# 既にNOTION_API_SECRETが存在するか確認
if grep -q "NOTION_API_SECRET" "$ENV_FILE"; then
    echo "⚠️  NOTION_API_SECRETは既に存在します。更新しますか？ (y/n)"
    read -r answer
    if [ "$answer" = "y" ]; then
        # 既存の行を削除
        sed -i.bak '/NOTION_API_SECRET/d' "$ENV_FILE"
        echo "✅ 既存のNOTION_API_SECRETを削除しました"
    else
        echo "❌ 更新をキャンセルしました"
        exit 0
    fi
fi

# 新しいAPIキーを追加
echo "" >> "$ENV_FILE"
echo "# Notion API設定 ($(date))" >> "$ENV_FILE"
echo "NOTION_API_SECRET=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" >> "$ENV_FILE"

echo "✅ .env.localを更新しました！"
echo ""
echo "📋 現在の内容:"
echo "----------------------------------------"
tail -n 5 "$ENV_FILE"
echo "----------------------------------------"

# .gitignoreの確認
if [ -f "$PROJECT_DIR/.gitignore" ]; then
    if ! grep -q "^\.env\.local$" "$PROJECT_DIR/.gitignore"; then
        echo ""
        echo "⚠️  重要: .env.localを.gitignoreに追加します..."
        echo ".env.local" >> "$PROJECT_DIR/.gitignore"
        echo "✅ .gitignoreに追加しました"
    fi
fi

echo ""
echo "🎉 完了！次は開発サーバーを再起動してください:"
echo "   cd $PROJECT_DIR"
echo "   npm run dev"