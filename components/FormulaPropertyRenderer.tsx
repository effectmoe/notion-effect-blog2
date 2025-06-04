import React from 'react'

interface FormulaPropertyRendererProps {
  pageId: string
  propertyName: string
  className?: string
  defaultValue?: string
}

// 一時的に無効化 - 数式プロパティの代わりに固定テキストを表示
export const FormulaPropertyRenderer: React.FC<FormulaPropertyRendererProps> = ({
  pageId,
  propertyName,
  className = '',
  defaultValue = ''
}) => {
  // 数式プロパティ機能を一時的に無効化
  // エラーが解決したら、FormulaPropertyRenderer.tsx.backup から復元してください
  return null
}

export default FormulaPropertyRenderer