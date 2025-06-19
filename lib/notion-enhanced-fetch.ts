import { ExtendedRecordMap } from 'notion-types'
import { NotionAPI } from 'notion-client'

// Define grouped databases configuration
const groupedDatabases = [
  {
    blockId: '215b802c-b0c6-804a-8858-d72d4df6f128',
    collectionId: '212b802c-b0c6-8014-9263-000b71bd252e',
    name: 'FAQマスター',
    groupByProperty: 'oa:|', // カテゴリ
    groupByType: 'select'
  },
  {
    blockId: '216b802c-b0c6-808f-ac1d-dbf03d973fec',
    collectionId: '216b802c-b0c6-81c0-a940-000b2f6a23b3',
    name: 'カフェキネシコンテンツ２',
    groupByProperty: 'xaH>', // Tags
    groupByType: 'multi_select'
  }
]

/**
 * Enhance collection views with proper group_by data
 */
export async function enhanceCollectionViews(
  recordMap: ExtendedRecordMap,
  notion: NotionAPI
): Promise<ExtendedRecordMap> {
  if (!recordMap.collection_view) return recordMap

  console.log('[enhanceCollectionViews] Processing collection views...')

  // Process each collection view
  for (const [viewId, viewData] of Object.entries(recordMap.collection_view)) {
    const view = viewData?.value
    if (!view) continue

    // Skip if already has query2 data
    if ((view as any).query2?.group_by) {
      console.log(`[enhanceCollectionViews] View ${viewId} already has group_by`)
      continue
    }

    // Check if this is a list view that might need grouping
    if (view.type === 'list' || view.type === 'table') {
      console.log(`[enhanceCollectionViews] Checking view ${viewId} of type ${view.type}`)

      // Find the collection ID for this view
      let collectionId = null
      let foundBlockId = null
      
      // Find block that uses this view
      for (const [blockId, blockData] of Object.entries(recordMap.block)) {
        const block = blockData?.value
        if ((block as any)?.view_ids?.includes(viewId)) {
          foundBlockId = blockId
          collectionId = (block as any).collection_id || 
                        (block as any).format?.collection_pointer?.id
          
          // リンクされたデータベースの場合、view自体のcollection_pointerも確認
          if (!collectionId && (view.format as any)?.collection_pointer?.id) {
            collectionId = (view.format as any).collection_pointer.id
            console.log(`[enhanceCollectionViews] Found collection_id in view format: ${collectionId}`)
          }
          break
        }
      }

      // Check if this is a grouped database
      const groupedDb = groupedDatabases.find(db => 
        db.blockId === foundBlockId || 
        db.collectionId === collectionId ||
        // Also check with normalized IDs (without hyphens)
        db.blockId.replace(/-/g, '') === foundBlockId ||
        db.collectionId.replace(/-/g, '') === collectionId
      )

      if (groupedDb) {
        console.log(`[enhanceCollectionViews] Found grouped database: ${groupedDb.name}`)
        
        // Add the group_by configuration
        if (!(view as any).query2) {
          (view as any).query2 = {}
        }
        
        // Add grouping configuration
        (view as any).query2.group_by = {
          property: groupedDb.groupByProperty,
          type: groupedDb.groupByType,
          value: {
            type: groupedDb.groupByType,
            value: groupedDb.groupByProperty
          }
        }
        
        // IMPORTANT: Also add format.collection_group_by for react-notion-x
        if (!(view as any).format) {
          (view as any).format = {}
        }
        (view as any).format.collection_group_by = groupedDb.groupByProperty
        
        // FAQマスター用のグループを手動で追加
        if (groupedDb.name === 'FAQマスター') {
          (view as any).format.collection_groups = [
            { property: 'oa:|', hidden: false, value: { type: 'select', value: 'ユーザー管理' }},
            { property: 'oa:|', hidden: false, value: { type: 'select', value: 'API' }},
            { property: 'oa:|', hidden: false, value: { type: 'select', value: 'トラブルシューティング' }},
            { property: 'oa:|', hidden: false, value: { type: 'select', value: 'その他' }}
          ]
        }
        
        // カフェキネシコンテンツ２用のグループを手動で追加（タグでグループ化）
        if (groupedDb.name === 'カフェキネシコンテンツ２') {
          (view as any).format.collection_groups = [
            { property: 'xaH>', hidden: false, value: { type: 'multi_select', value: 'インストラクター' }},
            { property: 'xaH>', hidden: false, value: { type: 'multi_select', value: 'ショッピング' }},
            { property: 'xaH>', hidden: false, value: { type: 'multi_select', value: 'ブログ' }},
            { property: 'xaH>', hidden: false, value: { type: 'multi_select', value: '代表者' }},
            { property: 'xaH>', hidden: false, value: { type: 'multi_select', value: '会員ページ' }},
            { property: 'xaH>', hidden: false, value: { type: 'multi_select', value: '講座' }}
          ]
        }
        
        console.log(`[enhanceCollectionViews] Added group_by to ${groupedDb.name} view`)
      }
    }
  }

  return recordMap
}