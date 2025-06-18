import { NotionPage } from '@/components/NotionPage'
import { domain } from '@/lib/config'
import { resolveNotionPage } from '@/lib/resolve-notion-page'

// 静的生成に戻す
export const getStaticProps = async () => {
  try {
    const props = await resolveNotionPage(domain)
    return { props }
  } catch (err) {
    console.error('page error', domain, err)
    // エラー時は基本的なデータを返す
    return {
      props: {
        site: {
          name: 'CafeKinesi',
          domain: 'notion-effect-blog2.vercel.app',
          rootNotionPageId: '1ceb802cb0c680f29369dba86095fb38',
          rootNotionSpaceId: null
        },
        recordMap: null,
        pageId: '1ceb802cb0c680f29369dba86095fb38',
        error: err.message || 'Failed to load page'
      }
    }
  }
}

export default function NotionDomainPage(props) {
  return <NotionPage {...props} />
}