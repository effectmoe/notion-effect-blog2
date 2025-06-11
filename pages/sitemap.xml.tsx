import type { GetServerSideProps } from 'next'

import type { SiteMap } from '@/lib/types'
import { host } from '@/lib/config'
import { getSiteMap } from '@/lib/get-site-map'

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

  // cache for up to 8 hours
  res.setHeader(
    'Cache-Control',
    'public, max-age=28800, stale-while-revalidate=28800'
  )
  res.setHeader('Content-Type', 'text/xml')
  res.write(createSitemap(siteMap))
  res.end()

  return {
    props: {}
  }
}

const createSitemap = (siteMap: SiteMap) => {
  // 現在の日時を取得（lastmod用）
  const currentDate = new Date().toISOString().split('T')[0]
  
  // ページの優先度を決定する関数
  const getPriority = (path: string): string => {
    if (path === '' || path === '/') return '1.0'
    if (path.includes('about') || path.includes('company')) return '0.9'
    if (path.includes('products') || path.includes('services')) return '0.8'
    if (path.includes('contact') || path.includes('inquiry')) return '0.8'
    if (path.includes('partners') || path.includes('oem')) return '0.7'
    if (path.includes('cases') || path.includes('blog')) return '0.6'
    return '0.5'
  }
  
  // 更新頻度を決定する関数
  const getChangeFreq = (path: string): string => {
    if (path === '' || path === '/') return 'daily'
    if (path.includes('about') || path.includes('company')) return 'monthly'
    if (path.includes('products')) return 'weekly'
    if (path.includes('blog') || path.includes('news')) return 'daily'
    if (path.includes('cases')) return 'weekly'
    return 'monthly'
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
  <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
          xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
          xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
          xmlns:xhtml="http://www.w3.org/1999/xhtml"
          xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9
                              http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">
    <!-- トップページ -->
    <url>
      <loc>${host}</loc>
      <lastmod>${currentDate}</lastmod>
      <changefreq>daily</changefreq>
      <priority>1.0</priority>
    </url>

    ${Object.entries(siteMap.canonicalPageMap)
      .map(([canonicalPagePath, pageId]) =>
        `
    <url>
      <loc>${host}/${canonicalPagePath}</loc>
      <lastmod>${currentDate}</lastmod>
      <changefreq>${getChangeFreq(canonicalPagePath)}</changefreq>
      <priority>${getPriority(canonicalPagePath)}</priority>
    </url>
        `.trim()
      )
      .join('\n    ')}
  </urlset>
`
}

export default function noop() {
  return null
}
