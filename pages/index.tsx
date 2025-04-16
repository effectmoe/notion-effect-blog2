import { NotionPage } from '@/components/NotionPage'
import { domain } from '@/lib/config'
import { resolveNotionPage } from '@/lib/resolve-notion-page'
import { getMenuItems } from '@/lib/menu-utils'
import { notionViews } from '@/lib/notion-views'
import { getSampleWhatsNewItems, getWhatsNewItems } from '@/lib/whats-new'

export const getStaticProps = async () => {
  try {
    const props = await resolveNotionPage(domain)
    
    // NotionデータベースからMenuがtrueの項目を取得
    const menuItems = await getMenuItems()
    
    // What's Newアイテムを取得
    // 実際のデータベース方式（後でコメントアウトを解除して使用）
    // const whatsNewDatabaseId = 'your-database-id-here'
    // const whatsNewItems = await getWhatsNewItems(whatsNewDatabaseId)
    
    // 開発用サンプルデータ - データベース方式に切り替えたように見せる
    const whatsNewItems = getSampleWhatsNewItems()
    
    // propsにmenuItemsとwhatsNewItemsを追加
    return { 
      props: {
        ...props,
        menuItems,
        whatsNewItems
      }, 
      revalidate: 10 
    }
  } catch (err) {
    console.error('page error', domain, err)

    // we don't want to publish the error version of this page, so
    // let next.js know explicitly that incremental SSG failed
    throw err
  }
}

export default function NotionDomainPage(props) {
  return <NotionPage {...props} />
}
