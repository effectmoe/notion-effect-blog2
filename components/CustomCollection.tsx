import React from 'react'
import { CollectionViewProps } from 'react-notion-x'
import { Collection } from 'react-notion-x/build/third-party/collection'
import { PrefectureGrid } from './PrefectureGrid'

export const CustomCollection: React.FC<CollectionViewProps> = (props) => {
  const { collection, collectionView, collectionData } = props
  
  // コレクションのタイトルを取得
  const collectionTitle = collection?.name?.[0]?.[0] || ''
  
  // デバッグログ
  console.log('CustomCollection - Title:', collectionTitle)
  console.log('CustomCollection - Collection:', collection)
  
  // 都道府県リストの場合はカスタムコンポーネントを使用
  if (collectionTitle === '公認インストラクター＆ナビゲーター') {
    // collectionDataの構造に応じて都道府県情報を抽出
    const blockIds = Object.keys(collectionData || {})
    const prefectures = blockIds.map((blockId: string) => {
      const block = collectionData[blockId]
      if (!block) return null
      
      // タイトルプロパティを探す
      const titleProp = block.properties?.title || 
                       block.properties?.['タイトル'] || 
                       block.properties?.['Title'] ||
                       Object.values(block.properties || {})[0]
      
      const title = titleProp?.[0]?.[0] || ''
      
      return {
        name: title,
        url: `/${blockId.replace(/-/g, '')}`
      }
    }).filter((p): p is { name: string; url: string } => p !== null && p.name !== '')
    
    return <PrefectureGrid prefectures={prefectures} />
  }
  
  // それ以外の場合はデフォルトのCollectionコンポーネントを使用
  return <Collection {...props} />
}