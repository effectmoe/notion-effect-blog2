/**
 * Static search index for immediate availability
 * This provides basic search functionality while the full index is being built
 */

import type { SearchIndexItem } from './types'

export const staticSearchIndex: SearchIndexItem[] = [
  {
    id: '1ceb802cb0c680f29369dba86095fb38',
    pageId: '1ceb802cb0c680f29369dba86095fb38',
    title: 'ホームページ',
    content: 'キネシオロジー カフェ アロマ 講座 効果 歴史 動画 特長 キネシオロジーやアロマセラピーに関する情報を提供しています',
    searchableText: 'ホームページ キネシオロジー カフェ アロマ 講座 効果 歴史 動画 特長 キネシオロジーやアロマセラピーに関する情報を提供しています',
    lastIndexed: new Date().toISOString(),
    keywords: ['キネシオロジー', 'カフェ', 'アロマ', '講座', '効果', '歴史', '動画', '特長'],
    metadata: {
      lastEditedTime: new Date().toISOString(),
      createdTime: new Date().toISOString(),
      tags: [],
      category: undefined,
      author: undefined,
      status: undefined,
      publishedDate: undefined,
      properties: {}
    }
  }
]