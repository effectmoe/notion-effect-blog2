import { NextApiRequest, NextApiResponse } from 'next'

// This API endpoint is now deprecated - use DELETE method on /api/cache-warmup-simple instead
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // CORS対応
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // 新しいAPIにリダイレクト
  const response = await fetch(`${process.env.NEXT_PUBLIC_HOST || 'http://localhost:3000'}/api/cache-warmup-simple`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': req.headers.authorization || '',
    }
  })

  const result = await response.json()
  
  return res.status(response.status).json(result)
}