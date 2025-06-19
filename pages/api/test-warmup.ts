import { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('[TestWarmup] Request received')
  
  // 環境変数チェック
  const env = {
    NOTION_ROOT_PAGE_ID: process.env.NOTION_ROOT_PAGE_ID || 'NOT SET',
    NEXT_PUBLIC_HOST: process.env.NEXT_PUBLIC_HOST || 'NOT SET',
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL || 'NOT SET',
  }
  
  console.log('[TestWarmup] Environment:', env)
  
  // 単一ページのテスト
  if (env.NOTION_ROOT_PAGE_ID !== 'NOT SET') {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 
                     process.env.NEXT_PUBLIC_HOST || 
                     'https://notion-effect-blog2.vercel.app'
      
      const testPageId = 'cafekinesi' // 既知のページIDでテスト
      const url = `${baseUrl}/${testPageId}`
      
      console.log('[TestWarmup] Testing URL:', url)
      
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000)
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'x-cache-warmup': 'true',
          'x-skip-redis': 'true'
        },
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)
      
      const result = {
        url: url,
        status: response.status,
        ok: response.ok,
        headers: {
          'content-type': response.headers.get('content-type'),
          'cache-control': response.headers.get('cache-control'),
          'x-cache': response.headers.get('x-cache')
        }
      }
      
      if (response.ok) {
        const text = await response.text()
        result['responseLength'] = text.length
        result['isHTML'] = text.includes('<!DOCTYPE') || text.includes('<html')
      } else {
        result['error'] = await response.text()
      }
      
      return res.status(200).json({
        success: true,
        environment: env,
        testResult: result
      })
      
    } catch (error: any) {
      return res.status(200).json({
        success: false,
        environment: env,
        error: error.message,
        stack: error.stack
      })
    }
  }
  
  return res.status(200).json({
    success: false,
    environment: env,
    error: 'NOTION_ROOT_PAGE_ID not set'
  })
}