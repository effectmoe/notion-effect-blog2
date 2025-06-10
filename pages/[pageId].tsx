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
    const props = await resolveNotionPage(domain, rawPageId)
    
    // NotionデータベースからMenuがtrueの項目を取得
    const menuItems = await getMenuItems()
    
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
