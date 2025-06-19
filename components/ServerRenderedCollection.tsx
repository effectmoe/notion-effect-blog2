import React from 'react'
import { Block } from 'notion-types'

interface ServerRenderedCollectionProps {
  block: Block
}

/**
 * サーバーサイドでレンダリングされたコレクションビューを表示
 */
export const ServerRenderedCollection: React.FC<ServerRenderedCollectionProps> = ({ block }) => {
  const format = (block as any).format
  
  // サーバーレンダリングされたHTMLがある場合
  if (format?._isServerRendered && format?._serverRenderedHTML) {
    return (
      <div 
        className="server-rendered-collection"
        dangerouslySetInnerHTML={{ __html: format._serverRenderedHTML }}
      />
    )
  }
  
  // サーバーレンダリングされていない場合は何も表示しない
  return null
}