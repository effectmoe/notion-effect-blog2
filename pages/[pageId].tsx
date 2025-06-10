import { type GetStaticProps } from 'next'

import { NotionPage } from '@/components/NotionPage'
import { domain, isDev } from '@/lib/config'
import { getSiteMap } from '@/lib/get-site-map'
import { resolveNotionPage } from '@/lib/resolve-notion-page'
import { getMenuItems } from '@/lib/menu-utils'
import { type PageProps, type Params } from '@/lib/types'

export const getStaticProps: GetStaticProps<PageProps, Params> = async (
  context
) => {
  const rawPageId = context.params.pageId as string

  try {
    // タイムアウトを防ぐために、Promise.raceを使用
    const pagePromise = resolveNotionPage(domain, rawPageId)
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Page fetch timeout')), 25000) // 25秒でタイムアウト
    })
    
    const props = await Promise.race([pagePromise, timeoutPromise]) as PageProps
    
    // NotionデータベースからMenuがtrueの項目を取得（エラーハンドリング付き）
    let menuItems = []
    try {
      menuItems = await getMenuItems()
    } catch (menuErr) {
      console.error('Failed to fetch menu items:', menuErr)
      // メニューの取得に失敗してもページは表示する
    }
    
    // propsにmenuItemsを追加
    return { 
      props: {
        ...props,
        menuItems
      }, 
      revalidate: 10 
    }
  } catch (err) {
    console.error('page error', domain, rawPageId, err)
    
    // タイムアウトエラーの場合は、エラーページを表示
    if (err.message === 'Page fetch timeout') {
      return {
        props: {
          site: null,
          recordMap: null,
          pageId: rawPageId,
          error: {
            statusCode: 504,
            message: 'Page loading timeout. Please try again later.'
          },
          menuItems: []
        },
        revalidate: 60 // 1分後に再試行
      }
    }

    // we don't want to publish the error version of this page, so
    // let next.js know explicitly that incremental SSG failed
    throw err
  }
}

export async function getStaticPaths() {
  // ビルド時のNextRouterエラーを回避するため、
  // 初期ビルドではページを生成せず、
  // リクエスト時にオンデマンドで生成
  return {
    paths: [],
    fallback: 'blocking' // SSRフォールバック
  }
}

export default function NotionDomainDynamicPage(props) {
  return <NotionPage {...props} />
}
