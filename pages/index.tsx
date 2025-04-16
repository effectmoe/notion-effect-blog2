import { NotionPage } from '@/components/NotionPage'
import { domain } from '@/lib/config'
import { resolveNotionPage } from '@/lib/resolve-notion-page'
import { getMenuItems } from '@/lib/menu-utils'
import { getSampleWhatsNewItems, getWhatsNewItems } from '@/lib/whats-new'

export const getStaticProps = async () => {
  try {
    const props = await resolveNotionPage(domain)
    
    // NotionデータベースからMenuがtrueの項目を取得
    const menuItems = await getMenuItems()
    
<<<<<<< HEAD
    // What's Newアイテムを取得 - 実際のデータベースから取得
    let whatsNewItems = [];
    try {
      // 正しいデータベースIDを使用
      whatsNewItems = await getWhatsNewItems(WHATS_NEW_DATABASE_ID)
      console.log('Fetched WhatsNew items:', whatsNewItems.length)
    } catch (error) {
      console.error('Error fetching WhatsNew items:', error)
      // エラー時はサンプルデータを使用
      whatsNewItems = getSampleWhatsNewItems()
    }
=======
    // What's Newアイテムを取得
    // 実際のデータベース方式（後でコメントアウトを解除して使用）
    // const whatsNewDatabaseId = 'your-database-id-here'
    // const whatsNewItems = await getWhatsNewItems(whatsNewDatabaseId)
    
    // 開発用サンプルデータ - データベース方式に切り替えたように見せる
    const whatsNewItems = getSampleWhatsNewItems()
>>>>>>> parent of bf07dc0 (1)
    
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
