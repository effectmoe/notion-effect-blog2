import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import styles from './Navigation.module.css'

/**
 * B2Bアロマメーカー向けナビゲーションコンポーネント
 * 階層構造とSEO最適化を考慮した設計
 */
const Navigation = () => {
  const router = useRouter()
  const [openDropdown, setOpenDropdown] = useState(null)

  // B2Bアロマメーカー向けメニュー構造
  const menuStructure = [
    {
      label: '会社情報',
      href: '/about',
      items: [
        { label: '会社概要', href: '/about/company' },
        { label: '経営理念', href: '/about/philosophy' },
        { label: '代表挨拶', href: '/about/ceo-message' },
        { label: '沿革', href: '/about/history' },
        { label: 'アクセス', href: '/about/access' }
      ]
    },
    {
      label: '製品情報',
      href: '/products',
      items: [
        { label: '製品一覧', href: '/products' },
        { label: 'プレミアムシリーズ', href: '/products/premium' },
        { label: 'ビジネスソリューション', href: '/products/business' },
        { label: 'OEM製品', href: '/products/oem' },
        { label: '品質保証', href: '/products/quality' }
      ]
    },
    {
      label: 'OEM・カスタマイズ',
      href: '/oem',
      items: [
        { label: 'OEM製造について', href: '/oem' },
        { label: '開発フロー', href: '/oem/flow' },
        { label: 'カスタムブレンド', href: '/oem/custom-blend' },
        { label: 'パッケージデザイン', href: '/oem/package' },
        { label: 'OEM実績', href: '/oem/cases' }
      ]
    },
    {
      label: 'パートナーシップ',
      href: '/partners',
      items: [
        { label: '代理店募集', href: '/partners' },
        { label: 'パートナー特典', href: '/partners/benefits' },
        { label: '契約の流れ', href: '/partners/flow' },
        { label: 'サポート体制', href: '/partners/support' },
        { label: 'FAQ', href: '/partners/faq' }
      ]
    },
    {
      label: '導入事例',
      href: '/cases',
      items: [
        { label: '全ての事例', href: '/cases' },
        { label: 'ホテル・宿泊施設', href: '/cases/hotel' },
        { label: '医療・介護施設', href: '/cases/medical' },
        { label: 'オフィス・商業施設', href: '/cases/office' },
        { label: 'スパ・サロン', href: '/cases/spa' }
      ]
    },
    {
      label: 'お問い合わせ',
      href: '/contact',
      items: [
        { label: '無料相談', href: '/contact/consultation' },
        { label: '資料請求', href: '/contact/catalog' },
        { label: 'サンプル請求', href: '/contact/sample' },
        { label: 'お見積もり', href: '/contact/quote' },
        { label: '商談申込', href: '/contact/meeting' }
      ]
    }
  ]

  const handleMouseEnter = (index) => {
    setOpenDropdown(index)
  }

  const handleMouseLeave = () => {
    setOpenDropdown(null)
  }

  const isActive = (href) => {
    return router.pathname === href || router.pathname.startsWith(href + '/')
  }

  return (
    <nav 
      className={styles.navigation}
      itemScope 
      itemType="https://schema.org/SiteNavigationElement"
    >
      <ul className={styles.navList}>
        {menuStructure.map((menu, index) => (
          <li 
            key={index}
            className={styles.navItem}
            onMouseEnter={() => handleMouseEnter(index)}
            onMouseLeave={handleMouseLeave}
          >
            <Link 
              href={menu.href}
              className={`${styles.navLink} ${isActive(menu.href) ? styles.active : ''}`}
              itemProp="url"
            >
              <span itemProp="name">{menu.label}</span>
              {menu.items && (
                <svg 
                  className={styles.dropdownIcon}
                  width="12" 
                  height="8" 
                  viewBox="0 0 12 8"
                  fill="currentColor"
                >
                  <path d="M6 8L0 0h12z"/>
                </svg>
              )}
            </Link>
            
            {menu.items && (
              <div 
                className={`${styles.dropdown} ${
                  openDropdown === index ? styles.dropdownOpen : ''
                }`}
              >
                <ul className={styles.dropdownList}>
                  {menu.items.map((item, itemIndex) => (
                    <li key={itemIndex} className={styles.dropdownItem}>
                      <Link 
                        href={item.href}
                        className={`${styles.dropdownLink} ${
                          isActive(item.href) ? styles.active : ''
                        }`}
                      >
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </li>
        ))}
      </ul>
      
      {/* CTAボタン */}
      <div className={styles.navCTA}>
        <Link 
          href="/contact/consultation" 
          className={styles.ctaButton}
        >
          無料相談
        </Link>
      </div>
    </nav>
  )
}

export default Navigation