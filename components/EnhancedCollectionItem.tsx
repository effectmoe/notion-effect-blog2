import React, { useEffect, useState } from 'react'
import { notionHybrid } from '@/lib/notion-api-hybrid'

interface EnhancedCollectionItemProps {
  pageId: string
}

// データベースアイテムに数式プロパティを追加表示
export const EnhancedCollectionItem: React.FC<EnhancedCollectionItemProps> = ({ pageId }) => {
  const [formulaValue, setFormulaValue] = useState<string>('')
  const [isLoading, setIsLoading] = useState(true)
  
  useEffect(() => {
    const fetchFormula = async () => {
      try {
        const value = await notionHybrid.getFormulaPropertyValue(pageId, '最終更新日')
        if (value) {
          setFormulaValue(value)
        }
      } catch (error) {
        console.error('Failed to fetch formula:', error)
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchFormula()
  }, [pageId])
  
  if (isLoading || !formulaValue) {
    return null
  }
  
  return (
    <span className="notion-property notion-property-formula-enhanced" style={{
      marginLeft: '8px',
      color: 'var(--fg-color-3)',
      fontSize: '14px'
    }}>
      {formulaValue}
    </span>
  )
}

export default EnhancedCollectionItem