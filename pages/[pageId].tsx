import React from 'react'
import { GetServerSideProps, InferGetServerSidePropsType } from 'next'
import { ExtendedRecordMap } from 'notion-types'
import { getBlockTitle } from 'notion-utils'

import { NotionPage } from '@/components/NotionPage'
import {
  isPreviewImageSupportEnabled,
  previewImagesEnabled
} from '@/lib/config'
import { notion } from '@/lib/notion-api'
import { mapImageUrl } from '@/lib/map-image-url'
import { getPreviewImageMap } from '@/lib/preview-images'
import { getSiteMap } from '@/lib/get-site-map'

export const getServerSideProps: GetServerSideProps<{
  recordMap: ExtendedRecordMap
  previewImagesMap?: Record<string, string>
}> = async (context) => {
  const rawPageId = context.params?.pageId as string

  try {
    const pageId = rawPageId.replace(/-/g, '')
    
    let recordMap = await notion.getPage(pageId)

    if (!recordMap) {
      throw new Error('Failed to load page')
    }

    const keys = Object.keys(recordMap?.block || {})
    const block = recordMap?.block?.[keys[0]]?.value

    if (!block) {
      throw new Error('Invalid recordMap')
    }

    const isBlogPost =
      block.type === 'page' && block.parent_table === 'collection'

    const previewImagesMap = isPreviewImageSupportEnabled
      ? await getPreviewImageMap(recordMap)
      : {}

    return {
      props: {
        recordMap,
        previewImagesMap
      }
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
}: InferGetServerSidePropsType<typeof getServerSideProps>) {
  return (
    <NotionPage recordMap={recordMap} previewImagesMap={previewImagesMap} />
  )
}