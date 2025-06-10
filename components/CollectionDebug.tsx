import React from 'react'
import { useNotionContext } from 'react-notion-x'

export function CollectionDebug() {
  const { recordMap, mapPageUrl } = useNotionContext()
  
  React.useEffect(() => {
    // データベースアイテムのリンクをデバッグ
    const debugLinks = () => {
      const collectionItems = document.querySelectorAll('.notion-collection-item')
      console.log('[CollectionDebug] Found collection items:', collectionItems.length)
      
      collectionItems.forEach((item, index) => {
        const link = item.querySelector('a') || item.closest('a')
        if (link) {
          console.log(`[CollectionDebug] Item ${index} link:`, {
            href: link.getAttribute('href'),
            onclick: link.onclick,
            element: link
          })
        } else {
          console.log(`[CollectionDebug] Item ${index} has no link`)
        }
        
        // クリックイベントリスナーを追加してデバッグ
        item.addEventListener('click', (e) => {
          console.log(`[CollectionDebug] Collection item clicked:`, {
            target: e.target,
            currentTarget: e.currentTarget,
            propagationStopped: e.defaultPrevented
          })
        }, true)
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
    
    // DOMの変更を監視
    const observer = new MutationObserver(() => {
      debugLinks()
    })
    
    observer.observe(document.body, {
      childList: true,
      subtree: true
    })
    
    return () => observer.disconnect()
  }, [])
  
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