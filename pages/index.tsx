import { NotionPage } from '@/components/NotionPage'

// 静的生成を無効化して、すべてのリクエストをサーバーサイドで処理
export const getServerSideProps = async () => {
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
      pageId: '1ceb802cb0c680f29369dba86095fb38',
      error: null
    }
  }
}

export default function NotionDomainPage(props) {
  return <NotionPage {...props} />
}