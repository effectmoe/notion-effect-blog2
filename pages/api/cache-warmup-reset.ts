import { NextApiRequest, NextApiResponse } from 'next'

export default function handler(req: NextApiRequest, res: NextApiResponse) {
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

  // 認証チェック（オプション）
  const authHeader = req.headers.authorization
  const expectedToken = process.env.CACHE_CLEAR_TOKEN
  
  if (expectedToken && authHeader !== `Bearer ${expectedToken}`) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  // warmupStateをリセット
  const { warmupState } = require('./cache-warmup-simple')
  if (warmupState) {
    warmupState.isProcessing = false
    warmupState.startTime = 0
    warmupState.total = 0
    warmupState.processed = 0
    warmupState.succeeded = 0
    warmupState.failed = 0
    warmupState.skipped = 0
    warmupState.errors = []
    warmupState.lastUpdate = Date.now()
    warmupState.currentBatch = 0
    warmupState.pageIds = []
  }
  
  console.log('[Warmup Reset] Processing flag reset successfully')
  
  return res.status(200).json({ 
    message: 'Processing flag reset successfully',
    isProcessing: false 
  })
}