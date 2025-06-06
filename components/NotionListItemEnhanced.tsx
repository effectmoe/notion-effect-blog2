import React from 'react'
import dynamic from 'next/dynamic'
import { useNotionContext } from 'react-notion-x'

const FormulaPropertyRenderer = dynamic(
  () => import('./FormulaPropertyRenderer'),
  { ssr: false }
)

interface NotionListItemEnhancedProps {
  blockId: string
  showFormula?: boolean
  formulaPropertyName?: string
}

// リストアイテムにフォーミュラプロパティを追加表示するコンポーネント
export const NotionListItemEnhanced: React.FC<NotionListItemEnhancedProps> = ({
  blockId,
  showFormula = true,
  formulaPropertyName = '最終更新日'
}) => {
  const { recordMap } = useNotionContext()
  
  // ブロックIDの正規化
  const normalizedId = blockId.replace(/-/g, '')
  
  if (!showFormula) {
    return null
  }
  
  return (
    <div className="notion-list-item-property notion-list-item-property-formula">
      <span className="notion-property notion-property-formula">
        <FormulaPropertyRenderer 
          pageId={normalizedId}
          propertyName={formulaPropertyName}
          className="notion-property-formula-value"
        />
      </span>
    </div>
  )
}

export default NotionListItemEnhanced