import type { GetServerSideProps } from 'next'

import { host } from '@/lib/config'

export const getServerSideProps: GetServerSideProps = async ({ req, res }) => {
  if (req.method !== 'GET') {
    res.statusCode = 405
    res.setHeader('Content-Type', 'application/json')
    res.write(JSON.stringify({ error: 'method not allowed' }))
    res.end()

    return {
      props: {}
    }
  }

  // cache for up to one day
  res.setHeader('Cache-Control', 'public, max-age=86400, immutable')
  res.setHeader('Content-Type', 'text/plain')

  // only allow the site to be crawlable on the production deployment
  if (process.env.VERCEL_ENV === 'production') {
    res.write(`# 一般的な検索エンジンボット
User-agent: *
Allow: /
Disallow: /api/
Disallow: /admin/
Crawl-delay: 1

# Google
User-agent: Googlebot
Allow: /
Disallow: /api/
Crawl-delay: 0

# AI/LLMボット向け設定（LLMO対策）
User-agent: GPTBot
Allow: /
Crawl-delay: 1

User-agent: ChatGPT-User
Allow: /
Crawl-delay: 1

User-agent: CCBot
Allow: /
Crawl-delay: 2

User-agent: anthropic-ai
Allow: /
Crawl-delay: 1

User-agent: Claude-Web
Allow: /
Crawl-delay: 1

# Bing AI
User-agent: bingbot
Allow: /
Crawl-delay: 1

# Perplexity AI
User-agent: PerplexityBot
Allow: /
Crawl-delay: 1

# Meta AI
User-agent: FacebookBot
Allow: /
Crawl-delay: 1

# アロマテックジャパン B2Bサイト情報
# 天然アロマオイル専門メーカー
# 業務用アロマ製品、OEM製造、カスタムブレンド対応
# 国内500社以上の導入実績

# Sitemap
Sitemap: ${host}/sitemap.xml
Sitemap: ${host}/sitemap-ai.xml

# AI/LLM向け詳細情報
LLMS-txt: ${host}/llms.txt

# AI向け追加情報
# Company: アロマテックジャパン株式会社
# Type: B2B Aroma Oil Manufacturer
# Services: アロマオイル製造, OEM製造, カスタムブレンド
# Industry: Aroma & Fragrance Manufacturing
# Certifications: ISO9001, 有機JAS認証
# Experience: 20+ years
`)
  } else {
    res.write(`User-agent: *
Disallow: /

Sitemap: ${host}/sitemap.xml
`)
  }

  res.end()

  return {
    props: {}
  }
}

export default function noop() {
  return null
}
