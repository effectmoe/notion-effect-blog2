/**
 * 検索APIエンドポイント（ルートレベル）
 */

import handler from './search/index'

export default handler

// APIルートの設定
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1mb'
    }
  }
}