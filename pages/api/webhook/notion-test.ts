import { NextApiRequest, NextApiResponse } from 'next';

// Notion Webhook認証テスト用のシンプルなエンドポイント
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('=== Notion Webhook Test ===');
  console.log('Method:', req.method);
  console.log('Body:', JSON.stringify(req.body, null, 2));
  
  // url_verificationチャレンジに応答
  if (req.body?.type === 'url_verification' && req.body?.challenge) {
    return res.status(200).json({ 
      challenge: req.body.challenge 
    });
  }
  
  // その他のリクエストも受け入れる
  return res.status(200).json({ 
    success: true,
    received: req.body 
  });
}