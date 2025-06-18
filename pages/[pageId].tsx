import React from 'react'
import { GetStaticPaths, GetStaticProps, InferGetStaticPropsType } from 'next'
import { ExtendedRecordMap } from 'notion-types'

import { NotionPage } from '@/components/NotionPage'
import {
  isPreviewImageSupportEnabled
} from '@/lib/config'
import { getSiteMap } from '@/lib/get-site-map'
import { getPage } from '@/lib/notion'
import { getPreviewImageMap } from '@/lib/preview-images'

export const getStaticPaths: GetStaticPaths = async () => {
  try {
    const siteMap = await getSiteMap()
    const paths = Object.keys(siteMap.canonicalPageMap).map((pageId) => ({
      params: {
        pageId
      }
    }))

    return {
      paths,
      fallback: 'blocking'
    }
  } catch (error) {
    console.error('getStaticPaths error:', error)
    return {
      paths: [],
      fallback: 'blocking'
    }
  }
}

export const getStaticProps: GetStaticProps<{
  recordMap: ExtendedRecordMap
  previewImagesMap?: Record<string, string>
}> = async (context) => {
  const rawPageId = context.params?.pageId as string

  try {
    const pageId = rawPageId.replace(/-/g, '')
    const recordMap = await getPage(pageId)

    if (!recordMap) {
      throw new Error('Failed to load page')
    }

    const keys = Object.keys(recordMap?.block || {})
    const block = recordMap?.block?.[keys[0]]?.value

    if (!block) {
      throw new Error('Invalid recordMap')
    }

    const previewImagesMap = isPreviewImageSupportEnabled
      ? await getPreviewImageMap(recordMap)
      : {}

    return {
      props: {
        recordMap,
        previewImagesMap
      },
      revalidate: 60
    }
  } catch (err) {
    console.error('page error', err)

    return {
      notFound: true
    }
  }
}

export default function NotionDomainDynamicPage({
  recordMap,
  previewImagesMap
}: InferGetStaticPropsType<typeof getStaticProps>) {
  return (
    <NotionPage recordMap={recordMap} previewImagesMap={previewImagesMap} />
  )
}