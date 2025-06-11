# 数式プロパティ機能の一時無効化

ハイドレーションエラーを解決するため、一時的に数式プロパティ機能を無効化します。

## 無効化する方法

### 1. FormulaPropertyRendererを使用している箇所を削除
現在、このコンポーネントは以下の場所で使用されています：
- `components/NotionListItemEnhanced.tsx`

### 2. 代替案：CSSのみで日付表示を調整

`styles/notion.css`で、以下のCSSを使用して時間部分を非表示にできます：

```css
/* Last Edited Timeの時間部分を視覚的に隠す */
.notion-property-last_edited_time {
  display: inline-block;
  max-width: 100px;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

/* モバイルでの表示調整 */
@media (max-width: 768px) {
  .notion-property-last_edited_time {
    max-width: 80px;
  }
}
```

## 将来的な改善案

1. **Next.js App Routerへの移行**
   - React Server Componentsを使用してハイドレーション問題を回避

2. **Suspense境界の適切な配置**
   - 動的にロードされるコンポーネントを適切にラップ

3. **静的生成（SSG）の活用**
   - 数式プロパティをビルド時に取得して静的に埋め込む

## 現在の推奨事項

1. 数式プロパティ機能は一旦無効化
2. 基本的なNotionコンテンツ表示に集中
3. パフォーマンスと安定性を優先

ハイドレーションエラーは、Next.js 13+とreact-notion-xの組み合わせで発生しやすい問題です。
より安定した実装のためには、段階的な改善が必要です。