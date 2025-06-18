import { NotionPage } from '@/components/NotionPage'
import { domain } from '@/lib/config'
import { resolveNotionPage } from '@/lib/resolve-notion-page'

// 静的生成に戻す（ビルド時は最小限のページのみ）
export const getStaticProps = async (context) => {
  const rawPageId = context.params.pageId as string
  
  try {
    const props = await resolveNotionPage(domain, rawPageId)
    return { props }
  } catch (err) {
    console.error('page error', domain, rawPageId, err)
    // エラー時は404を返す
    return {
      notFound: true
    }
  }
}

export async function getStaticPaths() {
  return {
    paths: [],
    fallback: 'blocking'
  }
}

export default function NotionDomainDynamicPage(props) {
  return <NotionPage {...props} />
}