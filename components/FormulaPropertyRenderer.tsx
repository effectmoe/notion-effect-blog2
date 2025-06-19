import React, { useEffect, useState } from 'react'

interface FormulaPropertyRendererProps {
  pageId: string
  propertyName: string
  className?: string
  defaultValue?: string
}

// フォーミュラプロパティを表示するためのコンポーネント（SSR対応版）
export const FormulaPropertyRenderer: React.FC<FormulaPropertyRendererProps> = ({
  pageId,
  propertyName,
  className = '',
  defaultValue = ''
}) => {
  const [value, setValue] = useState<string>(defaultValue)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
    
    const fetchFormulaValue = async () => {
      try {
        const response = await fetch(`/api/test-formula?pageId=${encodeURIComponent(pageId)}`)
        const data = await response.json()
        
        if (data.formulaValue) {
          // 日付形式の場合、日本語形式に変換
          if (data.formulaValue.match(/^\d{4}-\d{2}-\d{2}/)) {
            const date = new Date(data.formulaValue)
            const formattedDate = `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`
            setValue(formattedDate)
          } else {
            setValue(data.formulaValue)
          }
        }
      } catch (error) {
        console.error('フォーミュラプロパティの取得エラー:', error)
      }
    }

    if (pageId) {
      fetchFormulaValue()
    }
  }, [pageId, propertyName])

  // サーバーとクライアントで同じ内容を表示（初期は defaultValue または '...'）
  return <span className={className}>{isMounted ? value : (defaultValue || '...')}</span>
}

export default FormulaPropertyRenderer