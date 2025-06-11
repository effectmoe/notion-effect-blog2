#!/bin/bash

# 簡略化版でデプロイ
set -e

PROJECT_DIR="$HOME/Documents/notion-effect-blog2"

echo "🚀 簡略化版でデプロイします..."

cd "$PROJECT_DIR"

# コミット
git add lib/search/hybrid-api.ts
git commit -m "fix: Temporarily simplify hybrid API to avoid build errors

- Disabled official API integration temporarily
- Using only unofficial API for now
- Will re-enable official API after resolving import issues"

# プッシュ
git push origin main

echo "✅ 簡略化版をデプロイしました！"
echo ""
echo "📌 これで検索機能は動作します（非公式APIのみ使用）"
echo ""
echo "Vercelでビルド状況を確認:"
echo "https://vercel.com/effectmoes-projects/notion-effect-blog2"