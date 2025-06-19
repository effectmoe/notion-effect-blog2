import { NextApiRequest, NextApiResponse } from 'next'
import { getPage } from '@/lib/notion'

// キャッシュ（メモリ内）
const cache = new Map()
const CACHE_TTL = 60 * 60 * 1000 // 1時間

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { pageId } = req.query

  if (!pageId || typeof pageId !== 'string') {
    return res.status(400).json({ error: 'Invalid pageId' })
  }

  // キャッシュチェック
  const cached = cache.get(pageId)
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return res.status(200).json(cached.data)
  }

  try {
    // データ取得
    const recordMap = await getPage(pageId)
    
    // キャッシュに保存
    cache.set(pageId, {
      data: recordMap,
      timestamp: Date.now()
    })

    res.status(200).json(recordMap)
  } catch (error) {
    console.error('Error fetching page:', error)
    res.status(500).json({ error: 'Failed to fetch page' })
  }
}