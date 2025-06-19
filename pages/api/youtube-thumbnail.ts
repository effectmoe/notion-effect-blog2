import { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { videoId, quality = 'hqdefault' } = req.query
  
  if (!videoId || typeof videoId !== 'string') {
    return res.status(400).json({ error: 'Video ID is required' })
  }
  
  const qualities = ['maxresdefault', 'hqdefault', 'mqdefault', 'default']
  const selectedQuality = qualities.includes(quality as string) ? quality : 'hqdefault'
  
  try {
    // 複数の品質を試す
    const qualityOrder = [selectedQuality, ...qualities.filter(q => q !== selectedQuality)]
    
    for (const q of qualityOrder) {
      try {
        const imageUrl = `https://img.youtube.com/vi/${videoId}/${q}.jpg`
        const response = await fetch(imageUrl)
        
        if (response.ok) {
          const buffer = await response.arrayBuffer()
          
          // キャッシュヘッダーを設定
          res.setHeader('Content-Type', 'image/jpeg')
          res.setHeader('Cache-Control', 'public, max-age=31536000, immutable')
          res.setHeader('X-YouTube-Quality', q)
          
          return res.send(Buffer.from(buffer))
        }
      } catch (error) {
        console.log(`Failed to fetch ${q} quality for video ${videoId}`)
      }
    }
    
    // すべての品質で失敗した場合
    throw new Error('No thumbnail available')
    
  } catch (error) {
    console.error('[YouTube Thumbnail] Error:', error)
    
    // プレースホルダー画像を返す（1x1の透明なGIF）
    const placeholder = Buffer.from(
      'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
      'base64'
    )
    
    res.setHeader('Content-Type', 'image/gif')
    res.setHeader('Cache-Control', 'public, max-age=3600')
    res.status(404).send(placeholder)
  }
}