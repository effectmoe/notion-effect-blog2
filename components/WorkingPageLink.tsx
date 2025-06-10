import React from 'react'
import Link from 'next/link'
import { useNotionContext } from 'react-notion-x'

export const WorkingPageLink: React.FC<any> = ({
  href,
  as,
  passHref,
  prefetch,
  replace,
  scroll,
  shallow,
  component: Component = 'a',
  className,
  children,
  ...props
}) => {
  const { mapPageUrl } = useNotionContext()
  
  // hrefがpageIdの場合、mapPageUrlを使用してURLを生成
  let finalHref = href
  if (href && !href.startsWith('/') && !href.startsWith('http')) {
    // これはpageIdの可能性が高い
    if (mapPageUrl) {
      finalHref = mapPageUrl(href)
      console.log('[WorkingPageLink] Mapped URL:', { pageId: href, url: finalHref })
    }
  }
  
  // すでに完全なURLの場合（内部リンク）
  if (finalHref && typeof window !== 'undefined' && finalHref.includes(window.location.hostname)) {
    // URLからパスを抽出
    try {
      const url = new URL(finalHref)
      const pathname = url.pathname
      
      return (
        <Link
          href={pathname}
          as={as}
          passHref={passHref ?? true}
          prefetch={prefetch}
          replace={replace}
          scroll={scroll}
          shallow={shallow}
          legacyBehavior={true}
        >
          <Component {...props} className={className}>
            {children}
          </Component>
        </Link>
      )
    } catch (e) {
      console.error('[WorkingPageLink] Error parsing URL:', e)
    }
  }
  
  // サイト内のフルURLパターンを検出（SSR対応）
  if (finalHref && (finalHref.includes('notion-effect-blog2.vercel.app') || finalHref.includes('localhost'))) {
    try {
      const url = new URL(finalHref)
      const pathname = url.pathname
      
      return (
        <Link
          href={pathname}
          as={as}
          passHref={passHref ?? true}
          prefetch={prefetch}
          replace={replace}
          scroll={scroll}
          shallow={shallow}
          legacyBehavior={true}
        >
          <Component {...props} className={className}>
            {children}
          </Component>
        </Link>
      )
    } catch (e) {
      console.error('[WorkingPageLink] Error parsing URL:', e)
    }
  }
  
  // 外部リンクの場合
  if (finalHref && (finalHref.startsWith('http://') || finalHref.startsWith('https://'))) {
    return (
      <Component
        {...props}
        href={finalHref}
        className={className}
        target="_blank"
        rel="noopener noreferrer"
      >
        {children}
      </Component>
    )
  }
  
  // 相対パスの内部リンクの場合
  return (
    <Link
      href={finalHref || '/'}
      as={as}
      passHref={passHref ?? true}
      prefetch={prefetch}
      replace={replace}
      scroll={scroll}
      shallow={shallow}
      legacyBehavior={true}
    >
      <Component {...props} className={className}>
        {children}
      </Component>
    </Link>
  )
}