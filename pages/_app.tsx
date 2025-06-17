// used for rendering equations (optional)
import 'katex/dist/katex.min.css'
// used for code syntax highlighting (optional)
import 'prismjs/themes/prism-coy.css'
// core styles shared by all of react-notion-x (required)
import 'react-notion-x/src/styles.css'
// global styles shared across the entire site
import 'styles/global.css'
// this might be better for dark mode
// import 'prismjs/themes/prism-okaidia.css'
// global style overrides for notion
import 'styles/notion.css'
// global style overrides for prism theme (optional)
import 'styles/prism-theme.css'
// instructor gallery responsive styles (specific collection only)
import 'styles/instructor-gallery-responsive.css'
// instructor gallery improvements (font and spacing)
import 'styles/instructor-gallery-improvements.css'
// toggle gallery fix
import 'styles/toggle-gallery-fix.css'
// fix for grouped list views
import 'styles/fix-grouped-lists.css'
// universal database view fix
import 'styles/fix-database-views.css'
// FAQ Master specific styling
import 'styles/fix-faq-master.css'

import type { AppProps } from 'next/app'
import * as Fathom from 'fathom-client'
import { useRouter } from 'next/router'
import posthog from 'posthog-js'
import * as React from 'react'

import { bootstrap } from '@/lib/bootstrap-client'
import {
  fathomConfig,
  fathomId,
  isServer,
  posthogConfig,
  posthogId
} from '@/lib/config'
import { getMenuItemsForStaticProps } from '@/lib/menu-utils'
import { fillFormulaProperties } from '@/lib/fill-formula-properties'

import dynamic from 'next/dynamic'
import CriticalFontLoader from '@/components/CriticalFontLoader'

const FontStyler = dynamic(() => import('@/components/FontStyler'), { 
  ssr: false,
  loading: () => null
})

const ColorStyler = dynamic(() => import('@/components/ColorStyler'), { 
  ssr: false,
  loading: () => null
})

const PerformanceMonitor = dynamic(() => import('@/components/PerformanceMonitor'), {
  ssr: false,
  loading: () => null
})

const ServiceWorkerRegistration = dynamic(() => import('@/components/ServiceWorkerRegistration'), {
  ssr: false,
  loading: () => null
})

const OfflineIndicator = dynamic(() => import('@/components/OfflineIndicator'), {
  ssr: false,
  loading: () => null
})

// カスタムAppPropsの型定義を追加
type CustomAppProps = AppProps & {
  pageProps: {
    menuItems?: any[]
    [key: string]: any
  }
}

export default function App({ Component, pageProps }: CustomAppProps) {
  const router = useRouter()

  React.useEffect(() => {
    // クライアントサイドでのみbootstrapを実行
    if (!isServer) {
      bootstrap()
    }
    function onRouteChangeComplete() {
      if (fathomId) {
        Fathom.trackPageview()
      }

      if (posthogId) {
        posthog.capture('$pageview')
      }
      
      // ページ遷移時に数式プロパティを入力
      if (!isServer) {
        fillFormulaProperties()
      }
    }

    if (fathomId) {
      Fathom.load(fathomId, fathomConfig)
    }

    if (posthogId) {
      posthog.init(posthogId, posthogConfig)
    }

    router.events.on('routeChangeComplete', onRouteChangeComplete)
    
    // 初回読み込み時にも実行
    if (!isServer) {
      fillFormulaProperties()
    }

    return () => {
      router.events.off('routeChangeComplete', onRouteChangeComplete)
    }
  }, [router.events])

  // FontStylerとColorStylerコンポーネントを追加してスタイルをカスタマイズ
  return (
    <CriticalFontLoader>
      <FontStyler />
      <ColorStyler />
      <ServiceWorkerRegistration />
      <Component {...pageProps} />
      <OfflineIndicator />
      <PerformanceMonitor enabled={process.env.NODE_ENV === 'development'} />
    </CriticalFontLoader>
  )
}

// サーバーサイドでメニュー項目を取得
App.getInitialProps = async (appContext: any) => {
  // 元のgetInitialPropsを実行
  const appProps = appContext.Component.getInitialProps
    ? await appContext.Component.getInitialProps(appContext.ctx)
    : {}

  // Notionからメニュー項目を取得
  try {
    const menuItems = await getMenuItemsForStaticProps()
    
    // メニュー項目をページProps全体に追加
    return {
      pageProps: {
        ...appProps,
        menuItems
      }
    }
  } catch (error) {
    console.error('Error fetching menu items:', error)
    return {
      pageProps: {
        ...appProps,
        menuItems: []
      }
    }
  }
}