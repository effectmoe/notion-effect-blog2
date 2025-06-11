import { NextApiRequest, NextApiResponse } from 'next';
import sharp from 'sharp';

// キャッシュ設定
const CACHE_MAX_AGE = 60 * 60 * 24 * 365; // 1年
const CACHE_S_MAXAGE = 60 * 60 * 24 * 30; // 30日

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { src, w, q, format } = req.query;

  if (!src || typeof src !== 'string') {
    return res.status(400).json({ error: 'Image source is required' });
  }

  try {
    // 画像URLをフェッチ
    const response = await fetch(src);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status}`);
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    
    // Sharpで画像を処理
    let image = sharp(buffer);
    
    // メタデータを取得
    const metadata = await image.metadata();
    
    // 幅の調整
    const width = w ? parseInt(w as string, 10) : undefined;
    if (width && metadata.width && width < metadata.width) {
      image = image.resize(width, null, {
        withoutEnlargement: true,
        fit: 'inside'
      });
    }
    
    // フォーマットとクオリティの設定
    const quality = q ? parseInt(q as string, 10) : 85;
    const outputFormat = format as keyof sharp.FormatEnum || 'webp';
    
    // 出力設定
    switch (outputFormat) {
      case 'webp':
        image = image.webp({ quality, effort: 4 });
        break;
      case 'avif':
        image = image.avif({ quality, effort: 4 });
        break;
      case 'jpeg':
      case 'jpg':
        image = image.jpeg({ quality, progressive: true });
        break;
      case 'png':
        image = image.png({ compressionLevel: 9 });
        break;
      default:
        image = image.webp({ quality });
    }
    
    // 最適化された画像を取得
    const optimizedBuffer = await image.toBuffer();
    
    // キャッシュヘッダーの設定
    res.setHeader('Content-Type', `image/${outputFormat}`);
    res.setHeader('Cache-Control', `public, max-age=${CACHE_MAX_AGE}, s-maxage=${CACHE_S_MAXAGE}, stale-while-revalidate`);
    res.setHeader('Vary', 'Accept');
    
    // ETagの生成
    const etag = `"${Buffer.from(`${src}-${width}-${quality}-${outputFormat}`).toString('base64')}"`;
    res.setHeader('ETag', etag);
    
    // 条件付きリクエストの処理
    if (req.headers['if-none-match'] === etag) {
      res.status(304).end();
      return;
    }
    
    res.status(200).send(optimizedBuffer);
  } catch (error) {
    console.error('Image optimization error:', error);
    res.status(500).json({ error: 'Failed to optimize image' });
  }
}

// APIルートの設定
export const config = {
  api: {
    responseLimit: '10mb',
  },
};