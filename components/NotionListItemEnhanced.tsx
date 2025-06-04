import React from 'react'
import { useNotionContext } from 'react-notion-x'
import { FormulaPropertyRenderer } from './FormulaPropertyRenderer'

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
  const [isMounted, setIsMounted] = React.useState(false)
  
  React.useEffect(() => {
    setIsMounted(true)
  }, [])
  
  // ブロックIDの正規化
  const normalizedId = blockId.replace(/-/g, '')
  
  // サーバーサイドでは何も表示しない
  if (!isMounted) {
    return null
  }
  
  return (
    <>
      {showFormula && (
        <div className="notion-list-item-property notion-list-item-property-formula">
          <span className="notion-property notion-property-formula">
            <FormulaPropertyRenderer 
              pageId={normalizedId}
              propertyName={formulaPropertyName}
              className="notion-property-formula-value"
            />
          </span>
        </div>
      )}
    </>
  )
}

export default NotionListItemEnhanced