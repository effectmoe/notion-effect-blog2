import * as config from './config'
import { notion } from './notion-api'
import { throttleRequest } from './notion-concurrency'

// プロパティ値を取得する独自関数
function getPropertyValue(block: any, propertyName: string, recordMap: any): any {
  if (!block || !recordMap) return null
  
  try {
    // タイトルの場合は特別な処理
    if (propertyName === 'title') {
      const titleElements = block.properties?.title
      if (Array.isArray(titleElements) && titleElements.length > 0) {
        return titleElements.map(t => t[0]).join('')
      }
      return ''
    }
    
    // 通常のプロパティ
    if (block.properties && propertyName in block.properties) {
      const prop = block.properties[propertyName]
      if (Array.isArray(prop) && prop.length > 0) {
        return prop.map(p => p[0]).join('')
      }
    }
    
    return null
  } catch (err) {
    console.error('Error getting property value:', err)
    return null
  }
}

// メニュー項目の型定義
export type MenuItem = {
  id: string
  title: string
  url: string
  icon?: string
  emoji?: string
  isActive?: boolean
}

// フォールバック用のハードコードされたメニュー項目
const FALLBACK_MENU_ITEMS: MenuItem[] = [
  {
    id: 'home',
    title: 'ホーム',
    url: '/'
  },
  {
    id: 'blog',
    title: 'ブログ',
    url: '/blog'
  },
  {
    id: 'profile',
    title: 'プロフィール',
    url: '/profile'
  }
]

// Notionデータベースからメニュー項目を取得する関数
export async function getMenuItems(): Promise<MenuItem[]> {
  try {
    // rootNotionPageIdを取得
    const rootNotionPageId = process.env.NOTION_PAGE_ID || config.rootNotionPageId
    if (!rootNotionPageId) {
      console.error('Root notion page ID not found')
      return FALLBACK_MENU_ITEMS
    }

    // NotionデータベースのページデータをAPI経由で取得
    const isVercel = process.env.VERCEL || process.env.VERCEL_ENV
    const pageData = isVercel 
      ? await throttleRequest(() => notion.getPage(rootNotionPageId))
      : await notion.getPage(rootNotionPageId)
    if (!pageData) {
      console.error('Failed to get page data')
      return FALLBACK_MENU_ITEMS
    }

    // ブロックデータからデータベースのブロックを見つける
    const blocks = Object.values(pageData.block)
    
    // データベースのブロックを見つける
    const collectionBlocks = blocks.filter((block: any) => 
      (block.value?.type === 'collection_view' || 
      block.value?.type === 'collection_view_page') &&
      block.value?.collection_id // collection_idプロパティが存在するブロックのみをフィルタリング
    )
    
    if (collectionBlocks.length === 0) {
      console.error('No collection blocks found')
      return FALLBACK_MENU_ITEMS
    }

    // 各コレクションブロックからレコードを取得
    const menuItems: MenuItem[] = []

    // 各コレクションブロックを処理
    for (const block of collectionBlocks) {
      // 型アサーションを使用してTypeScriptのエラーを回避
      // collection_idが存在することがすでにフィルタリングされている
      const blockValue = (block as any).value
      const collectionId = blockValue.collection_id
      const collection = pageData.collection?.[collectionId]
      
      if (!collection) continue

      // コレクションのスキーマからMenuプロパティを探す
      const menuPropertyId = Object.entries(collection.value?.schema || {}).find(
        ([, prop]: [string, any]) => prop.name === 'Menu'
      )?.[0]

      if (!menuPropertyId) continue

      // このコレクションのすべてのページを取得
      const pageIds = Object.keys(pageData.block).filter(id => {
        const blockValue = pageData.block[id]?.value
        return blockValue?.parent_id === collectionId && blockValue?.type === 'page'
      })

      // ページごとにMenuプロパティをチェック
      for (const pageId of pageIds) {
        const blockValue = pageData.block[pageId]?.value as any
        if (!blockValue) continue

        try {
          // Menuプロパティの値を取得
          const menuValue = getPropertyValue(blockValue, menuPropertyId, pageData)
          
          // Menuプロパティがtrueの場合のみ処理
          if (menuValue === 'Yes' || menuValue === 'True' || menuValue === '✓') {
            // ページタイトルを取得
            const titleProp = getPropertyValue(blockValue, 'title', pageData) as string
            
            // タイトルが空の場合はスキップ
            if (!titleProp) continue

            // ページIDからURLを生成（IDをそのまま使用するシンプルな方法）
            const url = `/${pageId.replace(/-/g, '')}`

            // メニュー項目を追加
            menuItems.push({
              id: pageId,
              title: titleProp,
              url: url,
              icon: blockValue.format?.page_icon || '',
              emoji: blockValue.format?.page_icon || ''
            })
          }
        } catch (err) {
          console.error(`Error processing page ${pageId}:`, err)
          continue
        }
      }
    }

    // 少なくとも「ホーム」は常に表示
    if (menuItems.length === 0 || !menuItems.some(item => item.url === '/')) {
      menuItems.unshift({
        id: 'home',
        title: 'ホーム',
        url: '/'
      })
    }

    return menuItems
  } catch (error) {
    console.error('Error fetching menu items from Notion:', error)
    return FALLBACK_MENU_ITEMS
  }
}

// サーバーサイドでメニュー項目を取得するためのヘルパー関数
export async function getMenuItemsForStaticProps() {
  const menuItems = await getMenuItems()
  return menuItems
}
