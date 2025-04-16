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
// custom styles for What's New section
import 'styles/whats-new.css'

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
import FontStyler from '@/components/FontStyler'

if (!isServer) {
  bootstrap()
}

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
    function onRouteChangeComplete() {
      if (fathomId) {
        Fathom.trackPageview()
      }

      if (posthogId) {
        posthog.capture('$pageview')
      }
    }

    if (fathomId) {
      Fathom.load(fathomId, fathomConfig)
    }

    if (posthogId) {
      posthog.init(posthogId, posthogConfig)
    }

    router.events.on('routeChangeComplete', onRouteChangeComplete)

    return () => {
      router.events.off('routeChangeComplete', onRouteChangeComplete)
    }
  }, [router.events])

  // FontStylerコンポーネントを追加してフォントをカスタマイズ
  return (
    <>
      <FontStyler />
      <Component {...pageProps} />
    </>
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