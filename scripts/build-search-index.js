#!/usr/bin/env node

/**
 * 検索インデックスをビルドするスクリプト
 * 
 * 使用方法:
 * node scripts/build-search-index.js
 */

const https = require('https')

const API_URL = process.env.VERCEL_URL 
  ? `https://${process.env.VERCEL_URL}/api/search/reindex`
  : 'https://notion-effect-blog2.vercel.app/api/search/reindex'

console.log('🔨 検索インデックスの構築を開始します...')
console.log(`API URL: ${API_URL}`)

const data = JSON.stringify({ mode: 'full' })

const options = {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
}

const req = https.request(API_URL, options, (res) => {
  let responseData = ''

  res.on('data', (chunk) => {
    responseData += chunk
  })

  res.on('end', () => {
    try {
      const result = JSON.parse(responseData)
      console.log('\n✅ レスポンス:', result)
      
      if (res.statusCode === 202) {
        console.log('\n🚀 インデックス構築が開始されました！')
        console.log('ステータスを確認するには、以下のURLにアクセスしてください:')
        console.log(`${API_URL} (GET)`)
      } else {
        console.error('\n❌ エラーが発生しました:', result.error || 'Unknown error')
      }
    } catch (e) {
      console.error('\n❌ レスポンスの解析エラー:', e.message)
      console.log('Raw response:', responseData)
    }
  })
})

req.on('error', (error) => {
  console.error('\n❌ リクエストエラー:', error.message)
})

req.write(data)
req.end()