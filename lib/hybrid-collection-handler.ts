import { ExtendedRecordMap } from 'notion-types'
import { notionHybrid } from './notion-api-hybrid'

/**
 * ハイブリッドAPIを使用してコレクションビューを処理
 * グループ化されたデータベースは公式APIから取得し、
 * 通常のデータベースは非公式APIを使用
 */
export async function handleCollectionWithHybridAPI(
  blockId: string,
  recordMap: ExtendedRecordMap
): Promise<ExtendedRecordMap> {
  console.log(`[HybridCollectionHandler] Processing block ${blockId}`)
  
  const block = recordMap.block[blockId]?.value
  if (!block || block.type !== 'collection_view') {
    return recordMap
  }
  
  // コレクションIDを取得
  const collectionId = (block as any).collection_id || 
                      (block as any).format?.collection_pointer?.id
  
  if (!collectionId) {
    console.log(`[HybridCollectionHandler] No collection ID found for block ${blockId}`)
    return recordMap
  }
  
  // ビューIDを取得して、グループ化されているかチェック
  const viewIds = (block as any).view_ids || []
  let hasGrouping = false
  
  for (const viewId of viewIds) {
    const view = recordMap.collection_view?.[viewId]?.value
    if (view?.query2?.group_by || (view as any)?.query?.group_by) {
      hasGrouping = true
      break
    }
  }
  
  // FAQマスターとカフェキネシコンテンツの特別処理
  const isTargetDatabase = (
    blockId === '215b802c-b0c6-804a-8858-d72d4df6f128' || 
    collectionId === '212b802c-b0c6-8014-9263-000b71bd252e' || // FAQマスター
    blockId === '216b802c-b0c6-808f-ac1d-dbf03d973fec' ||
    collectionId === '216b802c-b0c6-81c0-a940-000b2f6a23b3' // カフェキネシコンテンツ２
  )
  
  if (isTargetDatabase) {
    console.log(`[HybridCollectionHandler] Grouped database detected, using official API`)
    
    try {
      // グループ化プロパティを決定
      let sortProperty = 'カテゴリ'
      if (blockId === '216b802c-b0c6-808f-ac1d-dbf03d973fec' || 
          collectionId === '216b802c-b0c6-81c0-a940-000b2f6a23b3') {
        sortProperty = 'Tags'  // Statusではなくタグでソート
      }
      
      // 公式APIでデータベースアイテムを取得
      const items = await notionHybrid.getDatabaseItems(collectionId, {
        sorts: [{ property: sortProperty, direction: 'ascending' }]
      })
      
      if (items && Array.isArray(items)) {
        console.log(`[HybridCollectionHandler] Retrieved ${items.length} items from official API`)
        
        // recordMapに公式APIのデータを統合
        if (!recordMap.collection) {
          recordMap.collection = {}
        }
        
        // コレクションメタデータを追加
        recordMap.collection[collectionId] = {
          value: {
            id: collectionId,
            version: 0,
            name: [['FAQマスター']],
            schema: {}, // スキーマは後で追加
            icon: '',
            parent_id: blockId,
            parent_table: 'block',
            alive: true,
            copied_from: ''
          } as any, // 型の互換性のためanyにキャスト
          role: 'reader'
        }
        
        // 各アイテムをrecordMapに追加
        items.forEach((item: any) => {
          if (!recordMap.block[item.id]) {
            recordMap.block[item.id] = {
              value: {
                id: item.id,
                type: 'page',
                properties: item.properties,
                parent_id: collectionId,
                parent_table: 'collection',
                version: 0,
                created_time: Date.now(),
                last_edited_time: Date.now(),
                alive: true,
                created_by_table: 'notion_user',
                created_by_id: '',
                last_edited_by_table: 'notion_user',
                last_edited_by_id: ''
              } as any, // 型の互換性のためanyにキャスト
              role: 'reader'
            }
          }
        })
        
        // ビューにグループ化情報を追加
        if (viewIds.length > 0 && recordMap.collection_view) {
          const viewId = viewIds[0]
          if (recordMap.collection_view[viewId]) {
            const view = recordMap.collection_view[viewId].value as any
            
            // react-notion-xが期待する形式でグループ化情報を追加
            if (!view.format) {
              view.format = {}
            }
            
            // グループ化プロパティを決定
            let groupPropId = 'oa:|' // デフォルト: カテゴリ
            let groupPropName = 'カテゴリ'
            
            // カフェキネシコンテンツ２の場合はTagsでグループ化
            if (blockId === '216b802c-b0c6-808f-ac1d-dbf03d973fec' || 
                collectionId === '216b802c-b0c6-81c0-a940-000b2f6a23b3') {
              groupPropId = 'xaH>'  // Tags property ID
              groupPropName = 'Tags'
            }
            
            // collection_group_byを設定
            view.format.collection_group_by = groupPropId
            
            // グループ情報を作成
            const groups = generateGroupsFromItems(items, groupPropId, groupPropName)
            view.format.collection_groups = groups
            
            // query2も維持（後方互換性のため）
            if (!view.query2) {
              view.query2 = {}
            }
            view.query2.group_by = {
              property: groupPropId,
              type: 'select',
              value: {
                type: 'select',
                value: groupPropName.toLowerCase()
              }
            }
            
            view.type = 'list' // リストビューに強制
            console.log(`[HybridCollectionHandler] Added collection_group_by and collection_groups to view ${viewId}`)
            
            // collection_queryにもデータを追加（react-notion-xが期待する形式）
            if (!recordMap.collection_query) {
              recordMap.collection_query = {}
            }
            if (!recordMap.collection_query[collectionId]) {
              recordMap.collection_query[collectionId] = {}
            }
            
            // グループごとのデータを作成
            const groupedData: { [key: string]: any } = {}
            groups.forEach(group => {
              const groupValue = group.value.value
              const groupKey = `results:${group.value.type}:${groupValue}`
              
              // このグループに属するアイテムを収集
              const groupItems = items.filter(item => {
                // selectプロパティの場合
                let itemValue = item.properties?.[groupPropName]?.select?.name || 
                                item.properties?.[groupPropId]?.select?.name
                
                // multi_selectプロパティの場合（Tags）
                if (!itemValue) {
                  const multiSelect = item.properties?.[groupPropName]?.multi_select || 
                                     item.properties?.[groupPropId]?.multi_select
                  if (multiSelect && multiSelect.length > 0) {
                    // multi_selectの場合、タグのいずれかが一致すればtrue
                    return multiSelect.some((tag: any) => tag.name === groupValue)
                  }
                }
                
                itemValue = itemValue || 'その他'
                return itemValue === groupValue
              })
              
              groupedData[groupKey] = {
                type: 'results',
                blockIds: groupItems.map(item => item.id),
                aggregationResults: [],
                total: groupItems.length
              }
            })
            
            // デフォルトのresultsも追加
            groupedData.results = {
              type: 'results',
              blockIds: items.map(item => item.id),
              aggregationResults: [],
              total: items.length
            }
            
            // TypeScriptの型チェックを回避するためにanyとしてキャスト
            ;(recordMap.collection_query[collectionId] as any)[viewId] = groupedData
            console.log(`[HybridCollectionHandler] Added collection_query data for ${Object.keys(groupedData).length} groups`)
          }
        }
      }
    } catch (error) {
      console.error('[HybridCollectionHandler] Error fetching from official API:', error)
    }
  }
  
  return recordMap
}

/**
 * 都道府県データベースのような静的レンダリングを模倣
 */
/**
 * アイテムからグループ情報を生成
 */
function generateGroupsFromItems(items: any[], propertyId: string, propertyName: string): any[] {
  const groupMap = new Map<string, { value: string; count: number; type: string }>()
  
  // アイテムをグループ化
  items.forEach(item => {
    // selectプロパティの場合
    if (item.properties?.[propertyName]?.select?.name || item.properties?.[propertyId]?.select?.name) {
      const groupValue = item.properties?.[propertyName]?.select?.name || 
                        item.properties?.[propertyId]?.select?.name || 
                        'その他'
      const current = groupMap.get(groupValue) || { value: groupValue, count: 0, type: 'select' }
      current.count++
      groupMap.set(groupValue, current)
    }
    
    // multi_selectプロパティの場合（Tags）
    const multiSelect = item.properties?.[propertyName]?.multi_select || 
                       item.properties?.[propertyId]?.multi_select
    if (multiSelect && multiSelect.length > 0) {
      multiSelect.forEach((tag: any) => {
        const groupValue = tag.name
        const current = groupMap.get(groupValue) || { value: groupValue, count: 0, type: 'multi_select' }
        current.count++
        groupMap.set(groupValue, current)
      })
    }
    
    // どちらのプロパティも見つからない場合
    if (!item.properties?.[propertyName] && !item.properties?.[propertyId]) {
      const current = groupMap.get('その他') || { value: 'その他', count: 0, type: 'select' }
      current.count++
      groupMap.set('その他', current)
    }
  })
  
  // react-notion-xが期待する形式に変換
  return Array.from(groupMap.entries()).map(([value, data]) => ({
    property: propertyId,
    hidden: false,
    value: {
      type: data.type,
      value
    }
  }))
}

export function generateStaticGroupedHTML(
  items: any[],
  groupByProperty: string
): string {
  // アイテムをグループ化
  const groups: { [key: string]: any[] } = {}
  
  items.forEach(item => {
    const groupValue = item.properties?.[groupByProperty]?.select?.name || 'その他'
    if (!groups[groupValue]) {
      groups[groupValue] = []
    }
    groups[groupValue].push(item)
  })
  
  // HTMLを生成
  let html = '<div class="notion-collection-view-type-list">'
  
  Object.entries(groups).forEach(([groupName, groupItems]) => {
    html += `
      <div class="notion-collection-group">
        <summary class="notion-collection-group-title">
          <div style="display: flex; align-items: center; gap: 0.5em;">
            <svg width="12" height="12" viewBox="0 0 12 12">
              <path d="M6.02734 8.80274C6.27148 8.80274 6.47168 8.71484 6.66211 8.51465L10.2803 4.82324C10.4268 4.67676 10.5 4.49609 10.5 4.28125C10.5 3.85156 10.1484 3.5 9.72363 3.5C9.50879 3.5 9.30859 3.58789 9.15234 3.74902L6.03223 6.9668L2.90722 3.74902C2.74609 3.58789 2.55078 3.5 2.33105 3.5C1.90137 3.5 1.55469 3.85156 1.55469 4.28125C1.55469 4.49609 1.62793 4.67676 1.77441 4.82324L5.39258 8.51465C5.58789 8.71484 5.78808 8.80274 6.02734 8.80274Z" fill="currentColor"></path>
            </svg>
            <span>${groupName}</span>
            <span style="opacity: 0.5; font-size: 0.9em;">(${groupItems.length})</span>
          </div>
        </summary>
        <div class="notion-list-collection">
    `
    
    groupItems.forEach(item => {
      const title = item.properties?.title?.title?.[0]?.text?.content || 'Untitled'
      html += `
        <div class="notion-list-item">
          <div class="notion-list-item-title">
            <span>${title}</span>
          </div>
        </div>
      `
    })
    
    html += `
        </div>
      </div>
    `
  })
  
  html += '</div>'
  
  return html
}