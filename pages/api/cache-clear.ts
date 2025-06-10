import { NextApiRequest, NextApiResponse } from 'next';
import cache from '@/lib/cache';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // 簡易的な認証（本番環境では適切な認証を実装）
  const authHeader = req.headers.authorization;
  const expectedToken = process.env.CACHE_CLEAR_TOKEN;
  
  if (expectedToken && authHeader !== `Bearer ${expectedToken}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const { pattern, type = 'all' } = req.body;
    
    let result;
    
    switch (type) {
      case 'pattern':
        if (!pattern) {
          return res.status(400).json({ error: 'Pattern is required' });
        }
        await cache.invalidate(pattern);
        result = { cleared: 'pattern', pattern };
        break;
        
      case 'notion':
        await cache.invalidate('notion:');
        result = { cleared: 'notion-cache' };
        break;
        
      case 'all':
        // 全キャッシュクリア
        await cache.cleanup();
        result = { cleared: 'all-caches' };
        break;
        
      default:
        return res.status(400).json({ error: 'Invalid type' });
    }
    
    // Service Workerのキャッシュもクリア（クライアントサイドで実行）
    res.status(200).json({
      success: true,
      ...result,
      timestamp: new Date().toISOString(),
      message: 'Cache cleared successfully'
    });
  } catch (error) {
    console.error('Cache clear error:', error);
    res.status(500).json({ 
      error: 'Failed to clear cache',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}