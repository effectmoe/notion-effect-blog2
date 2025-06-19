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
    
    // What's Newアイテムを取得 - 実際のデータベースから取得
    let whatsNewItems = [];
    try {
      // 正しいデータベースIDを使用
      // 注：実際に使用する場合はデータベースIDを正しく設定してください
      // const WHATS_NEW_DATABASE_ID = 'your-database-id-here'
      // whatsNewItems = await getWhatsNewItems(WHATS_NEW_DATABASE_ID)
      // console.log('Fetched WhatsNew items:', whatsNewItems.length)
      
      // 開発用サンプルデータ
      whatsNewItems = getSampleWhatsNewItems()
    } catch (error) {
      console.error('Error fetching WhatsNew items:', error)
      // エラー時はサンプルデータを使用
      whatsNewItems = getSampleWhatsNewItems()
    }
    
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
