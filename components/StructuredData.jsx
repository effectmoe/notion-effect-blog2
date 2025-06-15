import React from 'react'

/**
 * 構造化データコンポーネント
 * SEO対策とLLMO（Large Language Model Optimization）のため
 * Schema.orgのJSON-LD形式で情報を提供
 */
const StructuredData = ({ pageType, data = {} }) => {
  let schema = {}
  
  switch(pageType) {
    case 'Organization':
      schema = {
        "@context": "https://schema.org",
        "@type": "Organization",
        "name": "アロマテックジャパン株式会社",
        "alternateName": "AromaTech Japan Inc.",
        "url": "https://notion-effect-blog2.vercel.app",
        "logo": "https://notion-effect-blog2.vercel.app/logo.png",
        "description": "天然アロマオイル専門メーカー。B2B向けに高品質なアロマ製品を提供。20年以上の実績、国内500社以上の導入実績。",
        "foundingDate": "2003",
        "numberOfEmployees": {
          "@type": "QuantitativeValue",
          "minValue": 50,
          "maxValue": 100
        },
        "address": {
          "@type": "PostalAddress",
          "streetAddress": "港区南青山1-2-3",
          "addressLocality": "東京都",
          "addressRegion": "港区",
          "postalCode": "107-0062",
          "addressCountry": "JP"
        },
        "contactPoint": [
          {
            "@type": "ContactPoint",
            "telephone": "+81-3-1234-5678",
            "contactType": "sales",
            "areaServed": "JP",
            "availableLanguage": ["Japanese", "English"],
            "contactOption": "TollFree"
          },
          {
            "@type": "ContactPoint",
            "telephone": "+81-3-1234-5679",
            "contactType": "customer support",
            "areaServed": "JP",
            "availableLanguage": "Japanese"
          }
        ],
        "sameAs": [
          "https://www.facebook.com/aromatech.japan",
          "https://www.instagram.com/aromatech_japan",
          "https://www.linkedin.com/company/aromatech-japan"
        ],
        "hasOfferCatalog": {
          "@type": "OfferCatalog",
          "name": "アロマオイル製品カタログ",
          "itemListElement": [
            {
              "@type": "Offer",
              "itemOffered": {
                "@type": "Product",
                "name": "プレミアムアロマオイル"
              }
            },
            {
              "@type": "Offer",
              "itemOffered": {
                "@type": "Product",
                "name": "業務用ディフューザー"
              }
            }
          ]
        }
      }
      break
      
    case 'Product':
      schema = {
        "@context": "https://schema.org",
        "@type": "Product",
        "name": data.name || "プレミアムアロマオイル",
        "description": data.description || "100%天然エッセンシャルオイル。厳選された原料を使用し、最高品質を保証。",
        "image": data.image || "https://notion-effect-blog2.vercel.app/products/premium-oil.jpg",
        "brand": {
          "@type": "Brand",
          "name": "アロマテックジャパン"
        },
        "manufacturer": {
          "@type": "Organization",
          "name": "アロマテックジャパン株式会社"
        },
        "category": data.category || "アロマオイル",
        "material": data.material || "天然エッセンシャルオイル",
        "offers": {
          "@type": "Offer",
          "priceCurrency": "JPY",
          "price": data.price || "お問い合わせください",
          "priceValidUntil": "2025-12-31",
          "availability": "https://schema.org/InStock",
          "seller": {
            "@type": "Organization",
            "name": "アロマテックジャパン株式会社"
          }
        },
        "aggregateRating": data.rating ? {
          "@type": "AggregateRating",
          "ratingValue": data.rating.value,
          "reviewCount": data.rating.count
        } : undefined,
        "review": data.reviews ? data.reviews.map(review => ({
          "@type": "Review",
          "reviewRating": {
            "@type": "Rating",
            "ratingValue": review.rating
          },
          "author": {
            "@type": "Organization",
            "name": review.author
          },
          "reviewBody": review.body
        })) : undefined
      }
      break
      
    case 'FAQPage':
      schema = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": (data.faqs || [
          {
            question: "最小ロットはどのくらいですか？",
            answer: "製品により異なりますが、一般的には1L〜承っております。詳細はお問い合わせください。"
          },
          {
            question: "サンプルは提供していますか？",
            answer: "はい、法人様向けに無料サンプルをご用意しております。お問い合わせフォームよりご請求ください。"
          },
          {
            question: "OEM製造の納期はどのくらいですか？",
            answer: "通常、ご発注から2-3ヶ月程度です。数量や仕様により変動します。"
          },
          {
            question: "品質保証について教えてください",
            answer: "ISO9001認証を取得し、全ロット検査を実施。成分分析表の提供も可能です。"
          },
          {
            question: "支払い条件を教えてください",
            answer: "初回お取引は前払い、継続取引の場合は月末締め翌月末払いなど、柔軟に対応いたします。"
          }
        ]).map(faq => ({
          "@type": "Question",
          "name": faq.question,
          "acceptedAnswer": {
            "@type": "Answer",
            "text": faq.answer
          }
        }))
      }
      break
      
    case 'Service':
      schema = {
        "@context": "https://schema.org",
        "@type": "Service",
        "name": data.name || "OEM製造サービス",
        "serviceType": "アロマオイルOEM製造",
        "provider": {
          "@type": "Organization",
          "name": "アロマテックジャパン株式会社"
        },
        "description": data.description || "お客様のブランドに合わせたオリジナルアロマオイルの開発・製造",
        "areaServed": {
          "@type": "Country",
          "name": "日本"
        },
        "hasOfferCatalog": {
          "@type": "OfferCatalog",
          "name": "OEMサービスメニュー",
          "itemListElement": [
            {
              "@type": "Offer",
              "itemOffered": {
                "@type": "Service",
                "name": "オリジナルブレンド開発"
              }
            },
            {
              "@type": "Offer",
              "itemOffered": {
                "@type": "Service",
                "name": "パッケージデザイン"
              }
            },
            {
              "@type": "Offer",
              "itemOffered": {
                "@type": "Service",
                "name": "小ロット生産"
              }
            }
          ]
        }
      }
      break
      
    case 'WebPage':
      schema = {
        "@context": "https://schema.org",
        "@type": "WebPage",
        "name": data.title || "アロマテックジャパン",
        "description": data.description,
        "url": data.url || "https://notion-effect-blog2.vercel.app",
        "publisher": {
          "@type": "Organization",
          "name": "アロマテックジャパン株式会社"
        },
        "datePublished": data.datePublished,
        "dateModified": data.dateModified || new Date().toISOString()
      }
      break
      
    case 'BreadcrumbList':
      schema = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": (data.items || []).map((item, index) => ({
          "@type": "ListItem",
          "position": index + 1,
          "name": item.name,
          "item": item.url
        }))
      }
      break
      
    default:
      return null
  }
  
  // undefinedの値を削除
  Object.keys(schema).forEach(key => {
    if (schema[key] === undefined) {
      delete schema[key]
    }
  })
  
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema, null, 2) }}
    />
  )
}

export default StructuredData