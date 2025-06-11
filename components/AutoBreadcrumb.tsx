import React from 'react'
import Link from 'next/link'
import { type ExtendedRecordMap } from 'notion-types'
import { getBreadcrumbs, getBreadcrumbJsonLd, type BreadcrumbItem } from '@/lib/breadcrumb-utils'
import styles from './Breadcrumb.module.css'

interface AutoBreadcrumbProps {
  pageId: string
  recordMap: ExtendedRecordMap
  rootPageId: string
  className?: string
  separator?: string
  showHome?: boolean
  homeLabel?: string
}

/**
 * 自動生成パンくずリストコンポーネント
 * Notionのページ階層から自動的にパンくずを生成
 */
export const AutoBreadcrumb: React.FC<AutoBreadcrumbProps> = ({
  pageId,
  recordMap,
  rootPageId,
  className = '',
  separator = '›',
  showHome = true,
  homeLabel = 'ホーム'
}) => {
  // パンくずリストを生成
  const breadcrumbs = React.useMemo(() => {
    const items = getBreadcrumbs(pageId, recordMap, rootPageId)
    
    // ホームラベルをカスタマイズ
    if (items.length > 0 && items[0].id === rootPageId && homeLabel !== 'ホーム') {
      items[0].title = homeLabel
    }
    
    // showHomeがfalseの場合、ホームを除外
    if (!showHome && items.length > 0 && items[0].id === rootPageId) {
      return items.slice(1)
    }
    
    return items
  }, [pageId, recordMap, rootPageId, showHome, homeLabel])

  // パンくずが1つ以下の場合は表示しない（現在のページのみ）
  if (breadcrumbs.length <= 1) {
    return null
  }

  // 構造化データ用のURL
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
  const jsonLd = getBreadcrumbJsonLd(breadcrumbs, baseUrl)

  return (
    <>
      {/* 構造化データ */}
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      
      {/* パンくずリスト本体 */}
      <nav 
        className={`${styles.breadcrumb} ${className}`}
        aria-label="パンくずリスト"
      >
        <ol className={styles.breadcrumbList}>
          {breadcrumbs.map((item, index) => {
            const isLast = index === breadcrumbs.length - 1
            
            return (
              <li 
                key={item.id} 
                className={styles.breadcrumbItem}
              >
                {!isLast ? (
                  <>
                    <Link 
                      href={item.url}
                      className={styles.breadcrumbLink}
                    >
                      {item.title}
                    </Link>
                    <span 
                      className={styles.breadcrumbSeparator}
                      aria-hidden="true"
                    >
                      {separator}
                    </span>
                  </>
                ) : (
                  <span 
                    className={styles.breadcrumbCurrent}
                    aria-current="page"
                  >
                    {item.title}
                  </span>
                )}
              </li>
            )
          })}
        </ol>
      </nav>
    </>
  )
}

export default AutoBreadcrumb