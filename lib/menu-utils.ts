import * as config from './config'
import { notionViews } from './notion-views'
import type { MenuItem } from './types'

// 固定のメニュー項目を返す関数
export async function getMenuItems(): Promise<MenuItem[]> {
  try {
    // notionViewsからメニュー項目を生成（ファイルを新たに作成した時のデフォルト値を使用）
    const menuItems = notionViews.map(view => ({
      id: view.id,
      title: view.name,
      url: view.path
    }))
    
    return menuItems
  } catch (error) {
    console.error('Error generating menu items:', error)
    // エラーが発生した場合は空の配列を返す
    return []
  }
}

// サーバーサイドでメニュー項目を取得するためのヘルパー関数
export async function getMenuItemsForStaticProps() {
  const menuItems = await getMenuItems()
  return menuItems
}