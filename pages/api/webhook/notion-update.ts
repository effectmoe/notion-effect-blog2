import { NextApiRequest, NextApiResponse } from 'next';
import cache from '@/lib/cache';
import { verifyNotionWebhook } from '@/lib/notion-webhook';
import { rateLimit, rateLimitPresets } from '@/lib/rate-limiter';
// import { revalidatePage } from '@/lib/revalidate';

// レート制限を適用
const rateLimiter = rateLimit(rateLimitPresets.webhook);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // メソッドチェック
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Notionの初回認証チャレンジは認証をスキップ
  if (req.body?.type === 'url_verification') {
    console.log('Notion verification challenge received:', req.body);
    const challenge = req.body.challenge;
    if (challenge) {
      return res.status(200).json({ challenge });
    }
    return res.status(400).json({ error: 'No challenge provided' });
  }

  // レート制限チェック（認証チャレンジ以外の場合）
  const rateLimitResult = await new Promise<boolean>((resolve) => {
    rateLimiter(req, res, () => resolve(true));
  });
  
  if (!rateLimitResult) {
    return; // レート制限でブロックされた
  }

  try {
    // 通常のWebhookリクエストの場合のみ認証チェック
    const isValidWebhook = await verifyNotionWebhook(req);
    
    // Webhook検証またはトークン認証
    const authHeader = req.headers.authorization;
    const expectedToken = process.env.NOTION_WEBHOOK_TOKEN || process.env.CACHE_CLEAR_TOKEN;
    
    if (!isValidWebhook && expectedToken && authHeader !== `Bearer ${expectedToken}`) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { type, data } = req.body;
    console.log(`Received Notion webhook: ${type}`, data);

    let result;

    switch (type) {
      case 'page.updated':
      case 'page.created':
      case 'page.deleted':
        // 特定のページのキャッシュのみクリア（全体クリアを避ける）
        const pageId = data.id;
        await cache.invalidate(`notion:page:${pageId}`);
        await cache.invalidate(`notion:blocks:${pageId}`);
        // 関連するデータベースビューもクリア
        if (data.parent?.database_id) {
          await cache.invalidate(`notion:collection:${data.parent.database_id}`);
        }
        
        // Next.jsのISRを再検証（実装予定）
        // if (data.url) {
        //   await revalidatePage(data.url);
        // }
        
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
    if ((global as any).io) {
      (global as any).io.emit('cache-invalidated', {
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