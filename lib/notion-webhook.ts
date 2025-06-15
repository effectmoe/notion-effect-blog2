import crypto from 'crypto';
import { NextApiRequest } from 'next';

// Notion Webhookの署名検証
export async function verifyNotionWebhook(req: NextApiRequest): Promise<boolean> {
  const webhookSecret = process.env.NOTION_WEBHOOK_SECRET;
  
  if (!webhookSecret) {
    console.warn('NOTION_WEBHOOK_SECRET is not set');
    return false;
  }

  // Notionからの署名ヘッダーを取得
  const signature = req.headers['x-notion-signature'] as string;
  if (!signature) {
    return false;
  }

  // リクエストボディを文字列として取得
  const body = JSON.stringify(req.body);
  
  // HMAC-SHA256で署名を計算
  const expectedSignature = crypto
    .createHmac('sha256', webhookSecret)
    .update(body)
    .digest('hex');

  // タイミング攻撃を防ぐため、crypto.timingSafeEqualを使用
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

// Webhookイベントの型定義
export interface NotionWebhookEvent {
  type: 
    | 'page.created'
    | 'page.updated'
    | 'page.deleted'
    | 'database.created'
    | 'database.updated'
    | 'database.deleted'
    | 'block.created'
    | 'block.updated'
    | 'block.deleted';
  data: {
    id: string;
    url?: string;
    parent?: {
      page_id?: string;
      database_id?: string;
    };
    [key: string]: any;
  };
  timestamp: string;
}

// Webhookのリトライ設定
export const WEBHOOK_RETRY_CONFIG = {
  maxRetries: 3,
  retryDelay: 1000, // 1秒
  backoffMultiplier: 2,
};