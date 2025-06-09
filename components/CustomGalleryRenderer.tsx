import React from 'react'
import Link from 'next/link'
import { CollectionViewProps } from 'react-notion-x'
import { Collection } from 'react-notion-x/build/third-party/collection'
import { getTextContent, getPageTitle } from 'notion-utils'
import { useNotionContext } from 'react-notion-x'
import styles from './CustomGalleryRenderer.module.css'

export const CustomGalleryRenderer: React.FC<CollectionViewProps> = (props) => {
  const { collection, collectionView, collectionData } = props
  const { recordMap, mapPageUrl } = useNotionContext()
  
  // コレクションのタイトルを取得
  const collectionTitle = getTextContent(collection?.name) || ''
  
  // ギャラリービューかどうかを確認
  const isGalleryView = collectionView?.type === 'gallery'
  
  // 都道府県リストかどうかを確認（タイトルまたは最初のアイテムの内容で判断）
  const isPrefectureList = collectionTitle.includes('公認インストラクター') || 
                          collectionTitle.includes('ナビゲーター') ||
                          collectionTitle.includes('都道府県')
  
  // コレクションデータから最初のアイテムを取得して内容を確認
  const firstItemId = Object.keys(collectionData || {})[0]
  const firstItem = firstItemId ? recordMap.block[firstItemId]?.value : null
  const firstItemTitle = firstItem ? getTextContent(firstItem.properties?.title) || '' : ''
  
  // 都道府県名のパターンマッチング
  const prefecturePattern = /^(北海道|青森県|岩手県|宮城県|秋田県|山形県|福島県|茨城県|栃木県|群馬県|埼玉県|千葉県|東京都|神奈川県|新潟県|富山県|石川県|福井県|山梨県|長野県|岐阜県|静岡県|愛知県|三重県|滋賀県|京都府|大阪府|兵庫県|奈良県|和歌山県|鳥取県|島根県|岡山県|広島県|山口県|徳島県|香川県|愛媛県|高知県|福岡県|佐賀県|長崎県|熊本県|大分県|宮崎県|鹿児島県|沖縄県)$/
  const containsPrefectures = prefecturePattern.test(firstItemTitle)
  
  // デバッグログ
  console.log('CustomGalleryRenderer - Props:', props)
  console.log('CustomGalleryRenderer - Title:', collectionTitle)
  console.log('CustomGalleryRenderer - IsGalleryView:', isGalleryView)
  console.log('CustomGalleryRenderer - IsPrefectureList:', isPrefectureList)
  console.log('CustomGalleryRenderer - ViewType:', collectionView?.type)
  console.log('CustomGalleryRenderer - FirstItemTitle:', firstItemTitle)
  console.log('CustomGalleryRenderer - ContainsPrefectures:', containsPrefectures)
  console.log('CustomGalleryRenderer - CollectionData:', collectionData)
  
  // ギャラリービューかつ都道府県リストの場合、または都道府県を含むコレクションの場合はカスタムレンダリング
  if ((isGalleryView && isPrefectureList) || containsPrefectures) {
    console.log('Rendering custom gallery for prefectures')
    
    // コレクションアイテムを取得
    const blockIds = (collectionView as any)?.page_sort || 
                    (collectionView as any)?.collection_group_results?.blockIds ||
                    Object.keys(collectionData || {})
    
    const items = blockIds
      .map((blockId: string) => {
        const block = recordMap.block[blockId]?.value || collectionData[blockId]
        if (!block) return null
        
        const title = getPageTitle(recordMap, blockId) || 
                     getTextContent(block.properties?.title) ||
                     ''
        
        return {
          id: blockId,
          title: title,
          url: mapPageUrl(blockId)
        }
      })
      .filter(Boolean)
    
    return (
      <div className={styles.galleryContainer}>
        <h3 className={styles.galleryTitle}>{collectionTitle}</h3>
        <div className={styles.galleryGrid}>
          {items.map((item: any) => (
            <Link
              key={item.id}
              href={item.url}
              className={styles.galleryItem}
            >
              <div className={styles.itemContent}>
                <div className={styles.itemTitle}>
                  {item.title}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    )
  }
  
  // それ以外の場合はデフォルトのCollectionコンポーネントを使用
  return <Collection {...props} />
}