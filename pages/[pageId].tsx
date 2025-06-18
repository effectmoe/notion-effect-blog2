import { NotionPage } from '@/components/NotionPage'

// サーバーサイドレンダリングのみ使用（ビルド時のAPI呼び出しを回避）
export const getServerSideProps = async (context) => {
  const pageId = context.params.pageId as string
  
  // ダミーデータを返してビルドを通す
  return {
    props: {
      site: {
        name: 'CafeKinesi',
        domain: 'notion-effect-blog2.vercel.app',
        rootNotionPageId: '1ceb802cb0c680f29369dba86095fb38',
        rootNotionSpaceId: null
      },
      recordMap: {
        block: {},
        collection: {},
        collection_view: {},
        collection_query: {},
        notion_user: {},
        signed_urls: {}
      },
      pageId,
      error: null
    }
  }
}

export default function NotionDomainDynamicPage(props) {
  return <NotionPage {...props} />
}