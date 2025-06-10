import React from 'react'
import { useNotionContext } from 'react-notion-x'
import { useRouter } from 'next/router'

export function CollectionDebug() {
  const { recordMap, mapPageUrl } = useNotionContext()
  const router = useRouter()
  
  React.useEffect(() => {
    // データベースアイテムのリンクをデバッグ
    const debugLinks = () => {
      // より詳細なセレクタでデータベースアイテムを探す
      const selectors = [
        '.notion-collection-item',
        '.notion-collection-card',
        '.notion-gallery-grid a',
        '.notion-table a',
        '.notion-list-item',
        '.notion-page-link'
      ]
      
      selectors.forEach(selector => {
        const elements = document.querySelectorAll(selector)
        if (elements.length > 0) {
          console.log(`[CollectionDebug] Found ${elements.length} elements with selector: ${selector}`)
        }
      })
      
      const collectionItems = document.querySelectorAll('.notion-collection-item, .notion-collection-card, .notion-gallery-grid > div')
      console.log('[CollectionDebug] Found collection items:', collectionItems.length)
      
      collectionItems.forEach((item, index) => {
        const link = item.querySelector('a') || item.closest('a')
        const htmlItem = item as HTMLElement
        const isClickable = htmlItem.style.cursor === 'pointer' || (link && (link as HTMLAnchorElement).href)
        
        console.log(`[CollectionDebug] Item ${index}:`, {
          hasLink: !!link,
          href: link?.getAttribute('href'),
          fullHref: (link as HTMLAnchorElement)?.href,
          isClickable,
          className: item.className,
          tagName: item.tagName
        })
        
        // クリックイベントリスナーを追加してデバッグ
        if (!htmlItem.dataset.debugListener) {
          htmlItem.dataset.debugListener = 'true'
          item.addEventListener('click', (e) => {
            const linkHref = (link as HTMLAnchorElement)?.href
            console.log(`[CollectionDebug] Collection item clicked:`, {
              target: e.target,
              currentTarget: e.currentTarget,
              link: linkHref,
              defaultPrevented: e.defaultPrevented,
              bubbles: e.bubbles
            })
            
          }, true)
        }
      })
      
      // ページリンクの状態も確認
      const pageLinks = document.querySelectorAll('.notion-page-link')
      console.log('[CollectionDebug] Found page links:', pageLinks.length)
      pageLinks.forEach((link, index) => {
        console.log(`[CollectionDebug] Page link ${index}:`, {
          href: (link as HTMLAnchorElement).href,
          className: link.className,
          hasOnClick: !!(link as any).onclick
        })
      })
    }
    
    // 初回実行
    setTimeout(debugLinks, 1000)
    
    // inject-formula-simple.jsのアイテムも確認
    setTimeout(() => {
      const formulaItems = document.querySelectorAll('.notion-list-item.notion-page-link')
      console.log('[CollectionDebug] Formula script items:', formulaItems.length)
      formulaItems.forEach((item, index) => {
        const anchor = item as HTMLAnchorElement
        console.log(`[CollectionDebug] Formula item ${index}:`, {
          href: anchor.href,
          pathname: anchor.pathname,
          onclick: anchor.onclick,
          hasClickHandler: !!(anchor as any).onclick || anchor.onclick !== null
        })
      })
    }, 2000)
    
    // DOMの変更を監視
    const observer = new MutationObserver(() => {
      debugLinks()
    })
    
    observer.observe(document.body, {
      childList: true,
      subtree: true
    })
    
    return () => observer.disconnect()
  }, [router])
  
  // mapPageUrl関数もデバッグ
  React.useEffect(() => {
    if (mapPageUrl && typeof mapPageUrl === 'function') {
      console.log('[CollectionDebug] mapPageUrl test:', {
        testId: '1234567890',
        result: mapPageUrl('1234567890')
      })
    }
  }, [mapPageUrl])
  
  return null
}