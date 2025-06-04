import React, { useEffect, useState } from 'react'
import { notionHybrid } from '@/lib/notion-api-hybrid'

interface FormulaPropertyRendererProps {
  pageId: string
  propertyName: string
  className?: string
  defaultValue?: string
}

// フォーミュラプロパティを表示するためのコンポーネント
export const FormulaPropertyRenderer: React.FC<FormulaPropertyRendererProps> = ({
  pageId,
  propertyName,
  className = '',
  defaultValue = ''
}) => {
  const [value, setValue] = useState<string>(defaultValue)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchFormulaValue = async () => {
      try {
        const formulaValue = await notionHybrid.getFormulaPropertyValue(pageId, propertyName)
        if (formulaValue) {
          // 日付形式の場合、日本語形式に変換
          if (formulaValue.match(/^\d{4}-\d{2}-\d{2}/)) {
            const date = new Date(formulaValue)
            const formattedDate = `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`
            setValue(formattedDate)
          } else {
            setValue(formulaValue)
          }
        }
      } catch (error) {
        console.error('フォーミュラプロパティの取得エラー:', error)
      } finally {
        setIsLoading(false)
      }
    }

    if (pageId) {
      fetchFormulaValue()
    }
  }, [pageId, propertyName])

  if (isLoading) {
    return <span className={className}>...</span>
  }

  return <span className={className}>{value}</span>
}

export default FormulaPropertyRenderer