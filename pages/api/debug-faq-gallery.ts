import { NextApiRequest, NextApiResponse } from 'next'
import { notion } from '@/lib/notion-api'
import { patchFAQRecordMap } from '@/lib/patch-faq-recordmap'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    // CafeKinesiページのID
    const pageId = '1ceb802cb0c680f29369dba86095fb38'
    
    // ページデータを取得
    const recordMap = await notion.getPage(pageId, {
      fetchMissingBlocks: true,
      fetchCollections: true,
      signFileUrls: false,
      chunkLimit: 500
    })
    
    // パッチを適用
    const patchedRecordMap = patchFAQRecordMap(recordMap)
    
    // FAQマスターブロックの情報
    const faqMasterBlockId = '212b802c-b0c6-80be-aa3a-e91428cbde58'
    const faqCollectionId = '212b802c-b0c6-8046-b4ee-000b2833619c'
    
    const faqBlock = patchedRecordMap.block[faqMasterBlockId]?.value
    const faqCollection = patchedRecordMap.collection?.[faqCollectionId]?.value
    const faqCollectionQuery = patchedRecordMap.collection_query?.[faqCollectionId]
    
    // ビュー情報
    const viewId = (faqBlock as any)?.view_ids?.[0]
    const faqView = viewId ? patchedRecordMap.collection_view?.[viewId]?.value : null
    
    // コレクション内のアイテム数を確認
    let itemCount = 0
    if (faqCollectionQuery?.collection_group_results) {
      const results = faqCollectionQuery.collection_group_results
      itemCount = results.blockIds?.length || 0
    }
    
    const debugInfo = {
      pageId,
      faqBlock: {
        exists: !!faqBlock,
        id: faqMasterBlockId,
        type: faqBlock?.type,
        collection_id: (faqBlock as any)?.collection_id,
        view_ids: (faqBlock as any)?.view_ids,
        hasFormat: !!(faqBlock as any)?.format,
        formatCollectionPointer: (faqBlock as any)?.format?.collection_pointer
      },
      faqCollection: {
        exists: !!faqCollection,
        id: faqCollectionId,
        name: faqCollection?.name?.[0]?.[0],
        schemaKeys: Object.keys(faqCollection?.schema || {}),
        parent_id: faqCollection?.parent_id
      },
      faqView: {
        exists: !!faqView,
        id: viewId,
        type: faqView?.type,
        name: faqView?.name,
        hasFilter: !!(faqView?.format as any)?.filter,
        filterDetails: (faqView?.format as any)?.filter
      },
      collectionQuery: {
        exists: !!faqCollectionQuery,
        hasResults: !!faqCollectionQuery?.collection_group_results,
        itemCount,
        sampleIds: faqCollectionQuery?.collection_group_results?.blockIds?.slice(0, 5)
      },
      recordMapStructure: {
        hasBlock: !!patchedRecordMap.block,
        hasCollection: !!patchedRecordMap.collection,
        hasCollectionView: !!patchedRecordMap.collection_view,
        hasCollectionQuery: !!patchedRecordMap.collection_query,
        blockCount: Object.keys(patchedRecordMap.block || {}).length,
        collectionCount: Object.keys(patchedRecordMap.collection || {}).length,
        viewCount: Object.keys(patchedRecordMap.collection_view || {}).length
      }
    }
    
    res.status(200).json({
      success: true,
      debugInfo,
      recommendation: getRecommendation(debugInfo)
    })
  } catch (error) {
    console.error('Debug error:', error)
    res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack
    })
  }
}

function getRecommendation(debugInfo: any): string[] {
  const recommendations = []
  
  if (!debugInfo.faqBlock.exists) {
    recommendations.push('FAQ block not found in recordMap')
  }
  
  if (!debugInfo.faqBlock.collection_id) {
    recommendations.push('FAQ block is missing collection_id - patch may not be working')
  }
  
  if (!debugInfo.faqCollection.exists) {
    recommendations.push('FAQ collection data not found - need to fetch collection separately')
  }
  
  if (debugInfo.faqView.hasFilter) {
    recommendations.push('View has filters that might be hiding items')
  }
  
  if (debugInfo.collectionQuery.itemCount === 0) {
    recommendations.push('No items found in collection query results')
  }
  
  return recommendations
}