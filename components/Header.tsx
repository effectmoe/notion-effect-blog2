import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { FaGithub } from '@react-icons/all-files/fa/FaGithub'
import { FaInstagram } from '@react-icons/all-files/fa/FaInstagram'
import { FaFacebook } from '@react-icons/all-files/fa/FaFacebook'
import { IoSearchOutline } from '@react-icons/all-files/io5/IoSearchOutline'
import cs from 'classnames'

import * as config from '@/lib/config'
import styles from './Header.module.css'
import { MenuItem } from '@/lib/menu-utils'
import { notionViews } from '@/lib/notion-views'
import HamburgerMenu from './HamburgerMenu'

// notionViewsからフォールバック用メニュー項目を生成
const DEFAULT_MENU_ITEMS: MenuItem[] = notionViews.map(view => ({
  id: view.id,
  title: view.name,
  url: view.path
}))

type HeaderProps = {
  menuItems?: MenuItem[]
}

export function HeaderImpl({ menuItems = DEFAULT_MENU_ITEMS }: HeaderProps) {
  // menuItemsがundefinedの場合はDEFAULT_MENU_ITEMSを使用する
  const items = menuItems?.length ? menuItems : DEFAULT_MENU_ITEMS;
  const router = useRouter()
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [isSearchVisible, setIsSearchVisible] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [isSearching, setIsSearching] = useState(false)
  
  // 検索実行関数
  const handleSearch = async (e) => {
    e?.preventDefault()
    
    if (!searchQuery || searchQuery.trim().length < 2) {
      return
    }
    
    setIsSearching(true)
    // 検索前に結果をクリア
    setSearchResults([])
    
    try {
      console.log('検索リクエスト送信:', { query: searchQuery.trim() })
      
      // ハイブリッド検索APIを使用（チェックボックスでフィルタリング）
      const response = await fetch('/api/hybrid-search?query=' + encodeURIComponent(searchQuery.trim()), {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache'
        }
      })
      
      if (!response.ok) {
        throw new Error(`検索リクエストに失敗しました: ${response.status}`)
      }
      
      const results = await response.json()
      console.log('検索結果の詳細:', results)
      console.log('検索結果の項目数:', results.results?.length || 0)
      console.log('検索結果の構造:', JSON.stringify(results, null, 2))
      
      // results.resultsが配列であることを確認
      const searchResultsArray = Array.isArray(results.results) ? results.results : []
      setSearchResults(searchResultsArray)
    } catch (error) {
      console.error('検索エラー:', error)
      setSearchResults([])
    } finally {
      setIsSearching(false)
    }
  }
  
  // Enterキーで検索実行
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSearch(e)
    }
  }

  // スクロール検出用のイベントリスナー
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50)
    }
    
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])


  // 現在のページに基づいてアクティブなメニュー項目を判断
  const isActive = (url: string) => {
    if (url === '/' && router.pathname === '/') {
      return true
    }
    return router.pathname.startsWith(url) && url !== '/'
  }

  // メニューの開閉を切り替える
  const toggleMenu = () => {
    setMenuOpen(!menuOpen)
    // メニューを開くときは検索を閉じる
    if (!menuOpen) {
      setIsSearchVisible(false)
    }
  }

  // 検索の表示/非表示を切り替える
  const toggleSearch = () => {
    setIsSearchVisible(!isSearchVisible)
    // 検索を開くときはメニューを閉じる
    if (!isSearchVisible) {
      setMenuOpen(false)
    }
  }

  // メニュー項目をクリックした時の処理
  const handleMenuItemClick = () => {
    // メニューを閉じる
    setMenuOpen(false)
  }

  // ロゴコンポーネント
  const Logo = () => (
    <Link href="/" className={styles.logo}>
      <span className={styles.logoText}>CafeKinesi</span>
    </Link>
  )

  return (
    <header 
      className={cs(
        styles.header, 
        scrolled && styles.headerScrolled
      )}
    >
      <div className={styles.headerContent}>
        {/* ロゴ */}
        <div className={styles.headerLeft}>
          <Logo />
        </div>

        {/* デスクトップ用ナビゲーション - メニュー項目はハンバーガーメニューにのみ表示 */}
        <div className={styles.desktopNav}>
          {/* ここは空にして、メニュー項目はハンバーガーメニューにのみ表示する */}
        </div>

        {/* ヘッダー右側の要素 */}
        <div className={styles.headerRight}>
          {/* 検索ボタン */}
          <button 
            className={styles.iconButton} 
            onClick={toggleSearch}
            aria-label={isSearchVisible ? '検索を閉じる' : '検索を開く'}
          >
            <IoSearchOutline size={22} />
          </button>


          {/* SNSリンク */}
          {config.instagram && (
            <a
              href={`https://instagram.com/${config.instagram}`}
              target="_blank"
              rel="noopener noreferrer"
              className={cs(styles.iconButton, styles.instagramButton)}
              aria-label="Instagramを見る"
            >
              <FaInstagram size={20} />
            </a>
          )}

          {config.facebook && (
            <a
              href={`https://facebook.com/${config.facebook}`}
              target="_blank"
              rel="noopener noreferrer"
              className={cs(styles.iconButton, styles.facebookButton)}
              aria-label="Facebookを見る"
            >
              <FaFacebook size={20} />
            </a>
          )}

          {/* ハンバーガーメニューボタン（常に表示） */}
          <HamburgerMenu menuItems={items} currentPath={router.pathname} />
        </div>
      </div>

      {/* 検索オーバーレイ */}
      <div className={cs(
        styles.searchOverlay,
        isSearchVisible ? styles.searchVisible : styles.searchHidden
      )}>
        <div className={styles.searchContainer}>
          <form onSubmit={handleSearch} className={styles.searchForm}>
            <input 
              type="text" 
              className={styles.searchInput} 
              placeholder="検索..."
              aria-label="検索"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <button 
              type="submit" 
              className={styles.searchButton}
              disabled={isSearching || !searchQuery.trim()}
            >
              {isSearching ? '検索中...' : '検索'}
            </button>
          </form>
          
          {/* 検索結果 */}
          {searchResults.length > 0 && (
            <div className={styles.searchResults}>
              <h3 className={styles.searchResultsTitle}>検索結果 ({searchResults.length}件)</h3>
              <ul className={styles.searchResultsList}>
                {searchResults.map((result: any) => {
                  console.log('検索結果レンダリング:', result);
                  
                  // ハイブリッド検索APIの結果からデータを抽出
                  const id = result.id || result.pageId;
                  const title = result.title || '無題のページ';
                  const excerpt = result.excerpt || result.content || '';
                  const url = result.url || `/${id}`;
                  
                  if (!id) {
                    console.warn('検索結果にIDがありません:', result);
                    return null;
                  }
                  
                  return (
                    <li key={id} className={styles.searchResultItem}>
                      <a 
                        href={url} 
                        className={styles.searchResultLink}
                        onClick={() => {
                          setIsSearchVisible(false);
                          setSearchQuery('');
                          setSearchResults([]);
                        }}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <span className={styles.searchResultTitle}>
                          {title}
                        </span>
                        {excerpt && (
                          <span className={styles.searchResultDescription}>
                            {excerpt}
                          </span>
                        )}
                      </a>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
          
          {/* 検索結果がない場合のメッセージ */}
          {searchQuery.trim().length > 1 && searchResults.length === 0 && !isSearching && (
            <div className={styles.noResults}>
              検索結果が見つかりませんでした
            </div>
          )}
        </div>
      </div>

      {/* モバイルメニュー（常に表示） */}
      {/* <div className={cs(
        styles.mobileMenu,
        menuOpen ? styles.mobileMenuOpen : styles.mobileMenuClosed
      )}>
        <nav className={styles.mobileNav}>
          <ul className={styles.mobileNavList}>
            {items.map((item) => (
              <li key={item.id} className={styles.mobileNavItem}>
                <Link 
                  href={item.url} 
                  className={cs(
                    styles.mobileNavLink,
                    isActive(item.url) && styles.activeMobileLink
                  )}
                  onClick={handleMenuItemClick}
                >
                  {item.emoji && (
                    <span className={styles.menuItemEmoji}>{item.emoji}</span>
                  )}
                  {item.title}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div> */}
    </header>
  )
}

export const Header = React.memo(HeaderImpl)
