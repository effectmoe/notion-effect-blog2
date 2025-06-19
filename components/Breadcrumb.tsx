import React from 'react'
import Link from 'next/link'
import styles from './Breadcrumb.module.css'
import StructuredData from './StructuredData'

interface BreadcrumbItem {
  name: string
  url: string
}

interface BreadcrumbProps {
  items: BreadcrumbItem[]
  showHome?: boolean
  homeLabel?: string
  separator?: string
  showStructuredData?: boolean
  className?: string
}

/**
 * パンくずリストコンポーネント
 * SEO対策とユーザビリティ向上のため
 * 構造化データも同時に出力
 */
const Breadcrumb: React.FC<BreadcrumbProps> = ({
  items,
  showHome = true,
  homeLabel = 'ホーム',
  separator = '›',
  showStructuredData = true,
  className = ''
}) => {
  // ホームを含めた完全なパンくずリストを作成
  const fullItems: BreadcrumbItem[] = showHome
    ? [{ name: homeLabel, url: '/' }, ...items]
    : items

  // 構造化データ用の配列を作成
  const structuredDataItems = fullItems.map((item, index) => ({
    name: item.name,
    url: `https://notion-effect-blog2.vercel.app${item.url}`
  }))

  return (
    <>
      {showStructuredData && (
        <StructuredData 
          pageType="BreadcrumbList" 
          data={{ items: structuredDataItems }}
        />
      )}
      
      <nav 
        className={`${styles.breadcrumb} ${className}`}
        aria-label="パンくずリスト"
      >
        <ol className={styles.breadcrumbList}>
          {fullItems.map((item, index) => {
            const isLast = index === fullItems.length - 1
            
            return (
              <li 
                key={index} 
                className={styles.breadcrumbItem}
              >
                {!isLast ? (
                  <>
                    <Link 
                      href={item.url}
                      className={styles.breadcrumbLink}
                    >
                      {item.name}
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
                    {item.name}
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

// よく使うパンくずリストのプリセット
export const BreadcrumbPresets = {
  // 会社情報ページ用
  company: (pageName: string): BreadcrumbItem[] => [
    { name: '会社情報', url: '/about' },
    { name: pageName, url: '#' }
  ],
  
  // 製品情報ページ用
  products: (productName?: string): BreadcrumbItem[] => {
    const items = [{ name: '製品情報', url: '/products' }]
    if (productName) {
      items.push({ name: productName, url: '#' })
    }
    return items
  },
  
  // OEMページ用
  oem: (pageName?: string): BreadcrumbItem[] => {
    const items = [{ name: 'OEM製造', url: '/oem' }]
    if (pageName) {
      items.push({ name: pageName, url: '#' })
    }
    return items
  },
  
  // パートナーシップページ用
  partners: (pageName?: string): BreadcrumbItem[] => {
    const items = [{ name: 'パートナーシップ', url: '/partners' }]
    if (pageName) {
      items.push({ name: pageName, url: '#' })
    }
    return items
  },
  
  // 導入事例ページ用
  cases: (caseName?: string): BreadcrumbItem[] => {
    const items = [{ name: '導入事例', url: '/cases' }]
    if (caseName) {
      items.push({ name: caseName, url: '#' })
    }
    return items
  },
  
  // お問い合わせページ用
  contact: (formType?: string): BreadcrumbItem[] => {
    const items = [{ name: 'お問い合わせ', url: '/contact' }]
    if (formType) {
      items.push({ name: formType, url: '#' })
    }
    return items
  }
}

export default Breadcrumb