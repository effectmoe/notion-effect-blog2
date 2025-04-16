import * as config from './config'

// ハードコードされたメニュー項目の定義
const MENU_ITEMS = [
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

// 代替のメニュー項目取得関数
export async function getMenuItems() {
  try {
    // 静的なメニュー項目を返す
    return MENU_ITEMS
  } catch (error) {
    console.error('Error with menu items:', error)
    // エラーが発生した場合は空の配列を返す
    return []
  }
}

// サーバーサイドでメニュー項目を取得するためのヘルパー関数
export async function getMenuItemsForStaticProps() {
  const menuItems = await getMenuItems()
  return menuItems
}
