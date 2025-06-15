import { NextApiRequest, NextApiResponse } from 'next';

// Notion認証トークン取得用の一時的なエンドポイント
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('=== Notion Webhook Verification ===');
  console.log('Method:', req.method);
  console.log('Headers:', JSON.stringify(req.headers, null, 2));
  console.log('Body:', JSON.stringify(req.body, null, 2));
  console.log('Query:', JSON.stringify(req.query, null, 2));
  
  // 認証トークンは通常、bodyまたはqueryパラメータで送信される
  const token = req.body?.token || req.query?.token || req.body?.challenge || req.query?.challenge;
  
  if (token) {
    console.log('=== FOUND TOKEN ===');
    console.log('Token:', token);
    
    // トークンを返す（Notionが期待する形式で）
    res.status(200).json({ 
      challenge: token,
      token: token,
      message: `認証トークン: ${token}`
    });
  } else {
    res.status(200).json({ 
      message: 'No token found',
      body: req.body,
      query: req.query
    });
  }
}