import React from 'react'
import dynamic from 'next/dynamic'

interface FormulaPropertyRendererProps {
  pageId: string
  propertyName: string
  className?: string
  defaultValue?: string
}

// 内部コンポーネント（クライアントサイドのみ）
const FormulaPropertyInner = dynamic(
  () => import('./FormulaPropertyInner'),
  { 
    ssr: false,
    loading: () => <span>...</span>
  }
)

// フォーミュラプロパティを表示するためのコンポーネント
export const FormulaPropertyRenderer: React.FC<FormulaPropertyRendererProps> = (props) => {
  return <FormulaPropertyInner {...props} />
}

export default FormulaPropertyRenderer