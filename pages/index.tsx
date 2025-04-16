import { NotionPage } from '@/components/NotionPage'
import { domain } from '@/lib/config'
import { resolveNotionPage } from '@/lib/resolve-notion-page'
import { getMenuItems } from '@/lib/menu-utils'
import { getSampleWhatsNewItems, getWhatsNewItems } from '@/lib/whats-new'

// 正しいデータベースID
const WHATS_NEW_DATABASE_ID = '1d7b802cb0c680fd84b4f669f3f1160f'

export const getStaticProps = async () => {
  try {
    const props = await resolveNotionPage(domain)
    
    // NotionデータベースからMenuがtrueの項目を取得
    const menuItems = await getMenuItems()
    
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
