import Head from 'next/head'

import type * as types from '@/lib/types'
import * as config from '@/lib/config'
import { getSocialImageUrl } from '@/lib/get-social-image-url'

export function PageHead({
  site,
  title,
  description,
  pageId,
  image,
  url
}: types.PageProps & {
  title?: string
  description?: string
  image?: string
  url?: string
}) {
  const rssFeedUrl = `${config.host}/feed`

  title = title ?? site?.name
  description = description ?? site?.description

  const socialImageUrl = getSocialImageUrl(pageId) || image

  return (
    <Head>
      <meta charSet='utf-8' />
      <meta httpEquiv='Content-Type' content='text/html; charset=utf-8' />
      <meta
        name='viewport'
        content='width=device-width, initial-scale=1, shrink-to-fit=no, viewport-fit=cover'
      />

      <meta name='mobile-web-app-capable' content='yes' />
      <meta name='apple-mobile-web-app-status-bar-style' content='black' />

      <meta
        name='theme-color'
        media='(prefers-color-scheme: light)'
        content='#fefffe'
        key='theme-color-light'
      />
      <meta
        name='theme-color'
        media='(prefers-color-scheme: dark)'
        content='#2d3439'
        key='theme-color-dark'
      />

      <meta name='robots' content='index,follow' />
      <meta property='og:type' content='website' />

      {site && (
        <>
          <meta property='og:site_name' content={site.name} />
          <meta property='twitter:domain' content={site.domain} />
        </>
      )}

      {config.twitter && (
        <meta name='twitter:creator' content={`@${config.twitter}`} />
      )}

      {description && (
        <>
          <meta name='description' content={description} />
          <meta property='og:description' content={description} />
          <meta name='twitter:description' content={description} />
        </>
      )}

      {socialImageUrl ? (
        <>
          <meta name='twitter:card' content='summary_large_image' />
          <meta name='twitter:image' content={socialImageUrl} />
          <meta property='og:image' content={socialImageUrl} />
        </>
      ) : (
        <meta name='twitter:card' content='summary' />
      )}

      {url && (
        <>
          <link rel='canonical' href={url} />
          <meta property='og:url' content={url} />
          <meta property='twitter:url' content={url} />
        </>
      )}

      <link
        rel='alternate'
        type='application/rss+xml'
        href={rssFeedUrl}
        title={site?.name}
      />

      <meta property='og:title' content={title} />
      <meta name='twitter:title' content={title} />
      <title>{title}</title>
      
      {/* B2Bアロマメーカー向け追加メタデータ */}
      <meta name='keywords' content='アロマオイル,業務用,B2B,OEM,天然,エッセンシャルオイル,香り,空間演出,アロマテックジャパン' />
      <meta name='author' content='アロマテックジャパン株式会社' />
      
      {/* 企業情報メタデータ */}
      <meta name='company:industry' content='アロマ製造業' />
      <meta name='company:founded' content='2003' />
      <meta name='company:employees' content='50-100' />
      <meta name='company:type' content='B2B' />
      
      {/* 追加のOpen Graphタグ */}
      <meta property='og:locale' content='ja_JP' />
      <meta property='og:site_name' content='アロマテックジャパン株式会社' />
      
      {/* ビジネス向けメタデータ */}
      <meta name='business:contact_data:street_address' content='港区南青山1-2-3' />
      <meta name='business:contact_data:locality' content='東京都' />
      <meta name='business:contact_data:postal_code' content='107-0062' />
      <meta name='business:contact_data:country_name' content='日本' />
      <meta name='business:contact_data:phone_number' content='+81-3-1234-5678' />
      
      {/* AI/LLMクローラー向け追加情報 */}
      <meta name='ai:business_type' content='天然アロマオイル専門メーカー' />
      <meta name='ai:services' content='アロマオイル製造,OEM製造,カスタムブレンド,業務用アロマ' />
      <meta name='ai:target_market' content='ホテル,スパ,医療機関,オフィス,商業施設' />
      
      {/* 拡張AI向けメタタグ */}
      <meta name='ai:description' content={description || 'アロマテックジャパンは20年以上の実績を持つ天然アロマオイル専門メーカーです。B2B向けに高品質なアロマソリューションを提供'} />
      <meta name='ai:keywords' content='アロマオイル,B2B,業務用,アロマテックジャパン,OEM,天然アロマ,香り,アロマ製造,エッセンシャルオイル,空間演出' />
      <meta name='ai:category' content='B2B Manufacturing' />
      <meta name='ai:industry' content='Aroma & Fragrance' />
      <meta name='ai:language' content='ja' />
      <meta name='ai:region' content='JP' />
      <meta name='ai:company_size' content='medium' />
      <meta name='ai:certification' content='ISO9001,有機JAS認証' />
      <meta name='ai:specialization' content='カスタムブレンド,小ロット対応,品質管理' />
      <meta name='ai:experience_years' content='20+' />
      
      {/* Perplexity AI向け */}
      <meta name='perplexity:category' content='Business Services' />
      <meta name='perplexity:topic' content='Aroma Manufacturing' />
      
      {/* Claude向け */}
      <meta name='claude:content_type' content='Corporate Website' />
      <meta name='claude:expertise' content='B2B Aroma Solutions' />
      
      {/* ChatGPT向け */}
      <meta name='openai:domain' content='Manufacturing' />
      <meta name='openai:vertical' content='Aromatherapy' />
    </Head>
  )
}
