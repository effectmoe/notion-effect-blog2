import { NextApiRequest, NextApiResponse } from 'next';
import { getPlaiceholder } from 'plaiceholder';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { src } = req.query;

  if (!src || typeof src !== 'string') {
    return res.status(400).json({ error: 'Image source is required' });
  }

  try {
    // 画像をフェッチ
    const response = await fetch(src);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status}`);
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    
    // Plaiceholderでブラー画像を生成
    const { base64, img } = await getPlaiceholder(buffer, {
      size: 10 // 小さいサイズでブラー効果
    });
    
    // キャッシュヘッダーの設定
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    
    res.status(200).json({
      base64,
      img
    });
  } catch (error) {
    console.error('Blur generation error:', error);
    res.status(500).json({ error: 'Failed to generate blur' });
  }
}