import cs from 'classnames'
import dynamic from 'next/dynamic'
import Image from 'next/legacy/image'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { type PageBlock } from 'notion-types'
import { formatDate, getBlockTitle, getPageProperty } from 'notion-utils'
import * as React from 'react'
import BodyClassName from 'react-body-classname'
import {
  type NotionComponents,
  NotionRenderer,
  useNotionContext
} from 'react-notion-x'
import { EmbeddedTweet, TweetNotFound, TweetSkeleton } from 'react-tweet'
import { useSearchParam } from 'react-use'

import type * as types from '@/lib/types'
import * as config from '@/lib/config'
import { mapImageUrl } from '@/lib/map-image-url'
import { getCanonicalPageUrl, mapPageUrl } from '@/lib/map-page-url'
import { searchNotion } from '@/lib/search-notion'
import { useDarkMode } from '@/lib/use-dark-mode'

import { Footer } from './Footer'
import { GitHubShareButton } from './GitHubShareButton'
import { Loading } from './Loading'
import { NotionPageHeader } from './NotionPageHeader'
import { Page404 } from './Page404'
import { PageAside } from './PageAside'
import { PageHead } from './PageHead'
import { Header } from './Header'
import styles from './styles.module.css'

// -----------------------------------------------------------------------------
// dynamic imports for optional components
// -----------------------------------------------------------------------------

// コードブロックコンポーネント - 改良版
const Code = dynamic(() =>
  import('react-notion-x/build/third-party/code').then(async (m) => {
    // add / remove any prism syntaxes here
    await Promise.allSettled([
      // 必須の基本言語
      import('prismjs/components/prism-markup-templating.js'),
      import('prismjs/components/prism-markup.js'),
      
      // 人気のある言語
      import('prismjs/components/prism-bash.js'),
      import('prismjs/components/prism-javascript.js'),
      import('prismjs/components/prism-typescript.js'),
      import('prismjs/components/prism-python.js'),
      import('prismjs/components/prism-java.js'),
      import('prismjs/components/prism-css.js'),
      import('prismjs/components/prism-go.js'),
      import('prismjs/components/prism-rust.js'),
      import('prismjs/components/prism-jsx.js'),
      import('prismjs/components/prism-tsx.js'),
      import('prismjs/components/prism-yaml.js'),
      import('prismjs/components/prism-json.js'),
      import('prismjs/components/prism-markdown.js'),
      import('prismjs/components/prism-sql.js'),
      
      // その他の言語も含める
      import('prismjs/components/prism-c.js'),
      import('prismjs/components/prism-cpp.js'),
      import('prismjs/components/prism-csharp.js'),
      import('prismjs/components/prism-docker.js'),
      import('prismjs/components/prism-js-templates.js'),
      import('prismjs/components/prism-coffeescript.js'),
      import('prismjs/components/prism-diff.js'),
      import('prismjs/components/prism-git.js'),
      import('prismjs/components/prism-graphql.js'),
      import('prismjs/components/prism-handlebars.js'),
      import('prismjs/components/prism-less.js'),
      import('prismjs/components/prism-makefile.js'),
      import('prismjs/components/prism-objectivec.js'),
      import('prismjs/components/prism-ocaml.js'),
      import('prismjs/components/prism-reason.js'),
      import('prismjs/components/prism-sass.js'),
      import('prismjs/components/prism-scss.js'),
      import('prismjs/components/prism-solidity.js'),
      import('prismjs/components/prism-stylus.js'),
      import('prismjs/components/prism-swift.js'),
      import('prismjs/components/prism-wasm.js'),
      
      // HTMLテンプレート言語
      import('prismjs/components/prism-ejs.js'),
      import('prismjs/components/prism-handlebars.js'),
      import('prismjs/components/prism-pug.js')
    ])
    return m.Code
  })
)

// データベースビューコンポーネント
const Collection = dynamic(() =>
  import('react-notion-x/build/third-party/collection').then(
    (m) => m.Collection
  )
)

// 数式コンポーネント
const Equation = dynamic(() =>
  import('react-notion-x/build/third-party/equation').then((m) => m.Equation)
)

// PDFビューアーコンポーネント - SSRを無効化
const Pdf = dynamic(
  () => import('react-notion-x/build/third-party/pdf').then((m) => m.Pdf),
  {
    ssr: false
  }
)

// モーダルコンポーネント - SSRを無効化
const Modal = dynamic(
  () =>
    import('react-notion-x/build/third-party/modal').then((m) => {
      m.Modal.setAppElement('.notion-viewport')
      return m.Modal
    }),
  {
    ssr: false
  }
)

function Tweet({ id }: { id: string }) {
  const { recordMap } = useNotionContext()
  const tweet = (recordMap as types.ExtendedTweetRecordMap)?.tweets?.[id]

  return (
    <React.Suspense fallback={<TweetSkeleton />}>
      {tweet ? <EmbeddedTweet tweet={tweet} /> : <TweetNotFound />}
    </React.Suspense>
  )
}

const propertyLastEditedTimeValue = (
  { block, pageHeader },
  defaultFn: () => React.ReactNode
) => {
  if (pageHeader && block?.last_edited_time) {
    return `Last updated ${formatDate(block?.last_edited_time, {
      month: 'long'
    })}`
  }

  return defaultFn()
}

const propertyDateValue = (
  { data, schema, pageHeader },
  defaultFn: () => React.ReactNode
) => {
  if (pageHeader && schema?.name?.toLowerCase() === 'published') {
    const publishDate = data?.[0]?.[1]?.[0]?.[1]?.start_date

    if (publishDate) {
      return `${formatDate(publishDate, {
        month: 'long'
      })}`
    }
  }

  return defaultFn()
}

const propertyTextValue = (
  { schema, pageHeader },
  defaultFn: () => React.ReactNode
) => {
  if (pageHeader && schema?.name?.toLowerCase() === 'author') {
    return <b>{defaultFn()}</b>
  }

  return defaultFn()
}

// ナビゲーションメニュー項目
const getNavigationMenuItems = (site: types.Site) => {
  // デフォルトのメニュー項目
  const defaultMenuItems = [
    {
      id: 'home',
      title: 'ホーム',
      url: '/'
    }
  ]
  
  return defaultMenuItems
}

export function NotionPage({
  site,
  recordMap,
  error,
  pageId,
  menuItems // Notionデータベースからのメニューアイテムを受け取る
}: types.PageProps & { menuItems?: any[] }) {
  const router = useRouter()
  const lite = useSearchParam('lite')

  const components = React.useMemo<Partial<NotionComponents>>(
    () => ({
      nextLegacyImage: Image,
      nextLink: Link,
      Code,
      Collection,
      Equation,
      Pdf,
      Modal,
      Tweet,
      // Notionのデフォルトヘッダーをカスタムヘッダーとして使わない
      Header: () => null, // ヘッダーを非表示にする
      propertyLastEditedTimeValue,
      propertyTextValue,
      propertyDateValue
    }),
    []
  )

  // ボディにNoNotionTabsクラスを追加
  React.useEffect(() => {
    document.body.classList.add('no-notion-tabs');
    
    return () => {
      document.body.classList.remove('no-notion-tabs');
    };
  }, []);

  // ナビゲーションメニュー項目を取得
  const navigationMenuItems = React.useMemo(() => 
    site ? getNavigationMenuItems(site) : [], [site]
  )

  // lite mode is for oembed
  const isLiteMode = lite === 'true'

  const { isDarkMode } = useDarkMode()

  const siteMapPageUrl = React.useMemo(() => {
    const params: any = {}
    if (lite) params.lite = lite

    const searchParams = new URLSearchParams(params)
    return mapPageUrl(site, recordMap, searchParams)
  }, [site, recordMap, lite])

  const keys = Object.keys(recordMap?.block || {})
  const block = recordMap?.block?.[keys[0]]?.value

  // const isRootPage =
  //   parsePageId(block?.id) === parsePageId(site?.rootNotionPageId)
  const isBlogPost =
    block?.type === 'page' && block?.parent_table === 'collection'

  const showTableOfContents = !!isBlogPost
  const minTableOfContentsItems = 3

  const pageAside = React.useMemo(
    () => (
      <PageAside block={block} recordMap={recordMap} isBlogPost={isBlogPost} />
    ),
    [block, recordMap, isBlogPost]
  )

  const footer = React.useMemo(() => <Footer />, [])

  if (router.isFallback) {
    return <Loading />
  }

  if (error || !site || !block) {
    return <Page404 site={site} pageId={pageId} error={error} />
  }

  const title = getBlockTitle(block, recordMap) || site.name

  console.log('notion page', {
    isDev: config.isDev,
    title,
    pageId,
    rootNotionPageId: site.rootNotionPageId,
    recordMap
  })

  if (!config.isServer) {
    // add important objects to the window global for easy debugging
    const g = window as any
    g.pageId = pageId
    g.recordMap = recordMap
    g.block = block
  }

  const canonicalPageUrl =
    !config.isDev && getCanonicalPageUrl(site, recordMap)(pageId)

  const socialImage = mapImageUrl(
    getPageProperty<string>('Social Image', block, recordMap) ||
      (block as PageBlock).format?.page_cover ||
      config.defaultPageCover,
    block
  )

  const socialDescription =
    getPageProperty<string>('Description', block, recordMap) ||
    config.description

  return (
    <>
      <PageHead
        pageId={pageId}
        site={site}
        title={title}
        description={socialDescription}
        image={socialImage}
        url={canonicalPageUrl}
      />

      {isLiteMode && <BodyClassName className='notion-lite' />}
      {isDarkMode && <BodyClassName className='dark-mode' />}
      <BodyClassName className='no-notion-tabs' />

      {/* Notionレンダラー - 内部のヘッダーをnullに設定したので、カスタムヘッダーを外に配置 */}
      <Header menuItems={(menuItems && menuItems.length > 0) ? menuItems : navigationMenuItems} />

      <div className={styles.notionPageContainer}>
        <NotionRenderer
          bodyClassName={cs(
            styles.notion,
            'no-notion-tabs',
            pageId === site.rootNotionPageId && 'index-page'
          )}
          darkMode={isDarkMode}
          components={components}
          recordMap={recordMap}
          rootPageId={site.rootNotionPageId}
          rootDomain={site.domain}
          fullPage={!isLiteMode}
          previewImages={!!recordMap.preview_images}
          showCollectionViewDropdown={false}
          showTableOfContents={showTableOfContents}
          minTableOfContentsItems={minTableOfContentsItems}
          defaultPageIcon={config.defaultPageIcon}
          defaultPageCover={config.defaultPageCover}
          defaultPageCoverPosition={config.defaultPageCoverPosition}
          mapPageUrl={siteMapPageUrl}
          mapImageUrl={mapImageUrl}
          searchNotion={config.isSearchEnabled ? searchNotion : null}
          pageAside={pageAside}
          footer={footer}
          className="no-notion-tabs"
        />
      </div>

      <GitHubShareButton />
    </>
  )
}
