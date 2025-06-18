import * as React from 'react'
import { GetStaticProps, InferGetStaticPropsType } from 'next'

import { NotionPage } from '@/components/NotionPage'
import { domain } from '@/lib/config'
import { getSiteMap } from '@/lib/get-site-map'
import { getPage } from '@/lib/notion'

export const getStaticProps: GetStaticProps = async () => {
  try {
    const siteMap = await getSiteMap()
    const pageId = Object.keys(siteMap.canonicalPageMap)[0]
    const recordMap = await getPage(pageId)

    return {
      props: {
        recordMap
      },
      revalidate: 60
    }
  } catch (error) {
    console.error('getStaticProps error:', error)
    return {
      props: {
        recordMap: null
      },
      revalidate: 10
    }
  }
}

export default function NotionDomainIndexPage({
  recordMap
}: InferGetStaticPropsType<typeof getStaticProps>) {
  return <NotionPage recordMap={recordMap} rootDomain={domain} />
}