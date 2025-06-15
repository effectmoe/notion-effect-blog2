import { NextApiRequest, NextApiResponse } from 'next';
import cache from '@/lib/cache';
import { verifyNotionWebhook } from '@/lib/notion-webhook';
import { revalidatePage } from '@/lib/revalidate';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Notion Webhookの検証
    const isValid = await verifyNotionWebhook(req);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid webhook signature' });
    }

    const { type, data } = req.body;
    console.log(`Received Notion webhook: ${type}`, data);

    let result;

    switch (type) {
      case 'page.updated':
      case 'page.created':
      case 'page.deleted':
        // ページ関連のキャッシュをクリア
        const pageId = data.id;
        await cache.invalidate(`notion:page:${pageId}`);
        await cache.invalidate(`notion:blocks:${pageId}`);
        
        // Next.jsのISRを再検証
        if (data.url) {
          await revalidatePage(data.url);
        }
        
        result = { 
          cleared: 'page-cache', 
          pageId,
          revalidated: true 
        };
        break;

      case 'database.updated':
        // データベース関連のキャッシュをクリア
        const databaseId = data.id;
        await cache.invalidate(`notion:database:${databaseId}`);
        await cache.invalidate(`notion:search`);
        
        result = { 
          cleared: 'database-cache', 
          databaseId 
        };
        break;

      case 'block.updated':
      case 'block.created':
      case 'block.deleted':
        // ブロック関連のキャッシュをクリア
        const blockId = data.id;
        const parentId = data.parent?.page_id || data.parent?.database_id;
        
        await cache.invalidate(`notion:blocks:${blockId}`);
        if (parentId) {
          await cache.invalidate(`notion:page:${parentId}`);
        }
        
        result = { 
          cleared: 'block-cache', 
          blockId,
          parentId 
        };
        break;

      default:
        // 不明なイベントタイプの場合は全体をクリア
        await cache.invalidate('notion:');
        result = { 
          cleared: 'all-notion-cache',
          reason: 'unknown-event-type',
          type 
        };
    }

    // WebSocketで接続中のクライアントに通知
    if (global.io) {
      global.io.emit('cache-invalidated', {
        type,
        data,
        timestamp: new Date().toISOString()
      });
    }

    res.status(200).json({
      success: true,
      ...result,
      timestamp: new Date().toISOString(),
      message: 'Cache invalidated successfully'
    });

  } catch (error) {
    console.error('Webhook processing error:', error);
    res.status(500).json({ 
      error: 'Failed to process webhook',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}