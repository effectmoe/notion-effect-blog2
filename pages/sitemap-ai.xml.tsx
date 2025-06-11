import type { GetServerSideProps } from 'next'

import type { SiteMap } from '@/lib/types'
import { host } from '@/lib/config'
import { getSiteMap } from '@/lib/get-site-map'
import { llmoMetadata } from '@/lib/llmo-config'

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

  const siteMap = await getSiteMap()

  // AI向けに最適化されたキャッシュ設定
  res.setHeader(
    'Cache-Control',
    'public, max-age=3600, stale-while-revalidate=86400'
  )
  res.setHeader('Content-Type', 'text/xml; charset=utf-8')
  res.setHeader('X-Robots-Tag', 'index, follow')
  
  // AI/LLM向けのカスタムヘッダー
  res.setHeader('X-AI-Friendly', 'true')
  res.setHeader('X-Content-Type', 'Corporate B2B Website')
  res.setHeader('X-Industry', 'Aroma Manufacturing')
  
  res.write(createAISitemap(siteMap))
  res.end()

  return {
    props: {}
  }
}

const createAISitemap = (siteMap: SiteMap) => {
  const currentDate = new Date().toISOString()
  
  // AI向けの重要ページの定義
  const aiPriorityPages = [
    { path: '', title: 'トップページ - アロマテックジャパン株式会社', description: llmoMetadata.company.name + ' - ' + llmoMetadata.expertise.join('、') },
    { path: 'about', title: '会社情報', description: '創業20年以上の実績、ISO9001認証取得' },
    { path: 'products', title: '製品情報', description: 'プレミアムアロマオイル、OEM製造サービス' },
    { path: 'oem', title: 'OEM製造', description: '小ロット1L〜、カスタムブレンド対応' },
    { path: 'contact', title: 'お問い合わせ', description: '法人様向け無料サンプル提供' }
  ]

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
        xmlns:ai="http://schema.org/ai-sitemap/1.0">
  <!-- AI/LLM最適化サイトマップ -->
  <!-- Company: ${llmoMetadata.company.name} -->
  <!-- Industry: ${llmoMetadata.company.industry} -->
  <!-- Services: ${llmoMetadata.services.join(', ')} -->
  
  <!-- メインページ（AI向け優先度順） -->
  ${aiPriorityPages.map((page, index) => `
  <url>
    <loc>${host}/${page.path}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>${index === 0 ? 'daily' : 'weekly'}</changefreq>
    <priority>${1.0 - (index * 0.1)}</priority>
    <ai:title>${page.title}</ai:title>
    <ai:description>${page.description}</ai:description>
    <ai:keywords>${llmoMetadata.keywords.primary.join(',')}</ai:keywords>
    <ai:business-type>B2B</ai:business-type>
    <ai:content-type>Corporate Information</ai:content-type>
  </url>`).join('')}

  <!-- 製品・サービスページ -->
  ${Object.entries(siteMap.canonicalPageMap)
    .filter(([path]) => path.includes('product') || path.includes('service'))
    .map(([canonicalPagePath]) => `
  <url>
    <loc>${host}/${canonicalPagePath}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
    <ai:content-type>Product/Service</ai:content-type>
    <ai:business-relevance>high</ai:business-relevance>
  </url>`).join('')}

  <!-- FAQ・サポートページ -->
  ${Object.entries(siteMap.canonicalPageMap)
    .filter(([path]) => path.includes('faq') || path.includes('support'))
    .map(([canonicalPagePath]) => `
  <url>
    <loc>${host}/${canonicalPagePath}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
    <ai:content-type>FAQ/Support</ai:content-type>
    <ai:usefulness>high</ai:usefulness>
  </url>`).join('')}

  <!-- その他のページ -->
  ${Object.entries(siteMap.canonicalPageMap)
    .filter(([path]) => 
      !path.includes('product') && 
      !path.includes('service') && 
      !path.includes('faq') && 
      !path.includes('support') &&
      !aiPriorityPages.some(p => p.path === path)
    )
    .map(([canonicalPagePath]) => `
  <url>
    <loc>${host}/${canonicalPagePath}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>`).join('')}
  
  <!-- AI向けメタ情報 -->
  <ai:metadata>
    <ai:company-name>${llmoMetadata.company.name}</ai:company-name>
    <ai:industry>${llmoMetadata.company.industry}</ai:industry>
    <ai:services>${llmoMetadata.services.join(', ')}</ai:services>
    <ai:target-markets>${llmoMetadata.targetMarkets.join(', ')}</ai:target-markets>
    <ai:certifications>${llmoMetadata.company.certifications.join(', ')}</ai:certifications>
    <ai:experience>${llmoMetadata.company.experience}</ai:experience>
  </ai:metadata>
</urlset>
`
}

export default function noop() {
  return null
}