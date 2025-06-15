import { NextApiRequest, NextApiResponse } from 'next';
import { notifyPageUpdate, notifyGlobalUpdate } from '@/lib/websocket';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // 簡易認証
  const authHeader = req.headers.authorization;
  const expectedToken = process.env.CACHE_CLEAR_TOKEN;
  
  if (expectedToken && authHeader !== `Bearer ${expectedToken}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const { type = 'global', pageId, message = 'Test update' } = req.body;

    // テスト用の更新データ
    const testData = {
      message,
      timestamp: new Date().toISOString(),
      test: true,
    };

    if (type === 'page' && pageId) {
      // 特定ページの更新を通知
      notifyPageUpdate(pageId, testData);
      res.status(200).json({ 
        success: true, 
        type: 'page-update',
        pageId,
        data: testData
      });
    } else {
      // グローバル更新を通知
      notifyGlobalUpdate('test-update', testData);
      res.status(200).json({ 
        success: true, 
        type: 'global-update',
        data: testData
      });
    }
  } catch (error) {
    console.error('Test realtime error:', error);
    res.status(500).json({ 
      error: 'Failed to send test update',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}