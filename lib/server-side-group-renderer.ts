import { ExtendedRecordMap } from 'notion-types'

/**
 * サーバーサイドでグループ化されたHTMLを生成
 * react-notion-xがグループ化をサポートしていないため、
 * サーバーサイドで事前にHTMLを生成する
 */

interface GroupedItem {
  id: string
  title: string
  properties: any
}

interface GroupData {
  [groupName: string]: GroupedItem[]
}

/**
 * 特定のデータベースに対してグループ化HTMLを生成
 */
export function generateGroupedHTML(
  collectionId: string,
  recordMap: ExtendedRecordMap
): string | null {
  // 対象となるデータベース
  const targetDatabases = {
    // FAQマスター
    '212b802c-b0c6-8014-9263-000b71bd252e': {
      groupByProperty: 'カテゴリ',
      groupByPropertyId: 'oa:|',
      displayName: 'FAQマスター'
    },
    // カフェキネシコンテンツ
    '216b802c-b0c6-81c0-a940-000b2f6a23b3': {
      groupByProperty: 'カテゴリ', // multi_selectプロパティ
      groupByPropertyId: 'xaH>',
      displayName: 'カフェキネシコンテンツ'
    }
  }

  const dbConfig = targetDatabases[collectionId]
  if (!dbConfig) {
    return null
  }

  // コレクションのアイテムを収集
  const items: GroupedItem[] = []
  
  if (recordMap.block) {
    Object.entries(recordMap.block).forEach(([blockId, blockData]) => {
      const block = blockData?.value
      if (block?.parent_id === collectionId && block?.properties) {
        const title = block.properties?.title?.title?.[0]?.text?.content || 
                     block.properties?.['タイトル']?.title?.[0]?.text?.content || 
                     'Untitled'
        
        items.push({
          id: blockId,
          title,
          properties: block.properties
        })
      }
    })
  }

  if (items.length === 0) {
    return null
  }

  // グループ化
  const groups: GroupData = {}
  items.forEach(item => {
    // selectまたはmulti_selectプロパティから値を取得
    let groupValues: string[] = []
    
    // プロパティ名で取得を試みる
    const prop = item.properties?.[dbConfig.groupByProperty]
    if (prop?.select?.name) {
      groupValues = [prop.select.name]
    } else if (prop?.multi_select) {
      groupValues = prop.multi_select.map((opt: any) => opt.name)
    }
    
    // プロパティIDでも試みる
    if (groupValues.length === 0 && dbConfig.groupByPropertyId) {
      const propById = item.properties?.[dbConfig.groupByPropertyId]
      if (propById?.select?.name) {
        groupValues = [propById.select.name]
      } else if (propById?.multi_select) {
        groupValues = propById.multi_select.map((opt: any) => opt.name)
      }
    }
    
    // グループに追加
    if (groupValues.length === 0) {
      groupValues = ['その他']
    }
    
    groupValues.forEach(groupValue => {
      if (!groups[groupValue]) {
        groups[groupValue] = []
      }
      groups[groupValue].push(item)
    })
  })

  // HTML生成
  let html = `
    <div class="notion-collection-view-type-list server-rendered-groups" data-collection-id="${collectionId}">
      <div class="notion-list-view">
        <div class="notion-list-collection">
  `

  Object.entries(groups).forEach(([groupName, groupItems]) => {
    html += `
      <div class="notion-collection-group" style="display: block !important;">
        <summary class="notion-collection-group-title" style="display: list-item !important;">
          <div style="display: flex; align-items: center; gap: 0.5em; cursor: pointer;">
            <svg width="12" height="12" viewBox="0 0 12 12" style="transform: rotate(90deg); transition: transform 200ms;">
              <path d="M6.02734 8.80274C6.27148 8.80274 6.47168 8.71484 6.66211 8.51465L10.2803 4.82324C10.4268 4.67676 10.5 4.49609 10.5 4.28125C10.5 3.85156 10.1484 3.5 9.72363 3.5C9.50879 3.5 9.30859 3.58789 9.15234 3.74902L6.03223 6.9668L2.90722 3.74902C2.74609 3.58789 2.55078 3.5 2.33105 3.5C1.90137 3.5 1.55469 3.85156 1.55469 4.28125C1.55469 4.49609 1.62793 4.67676 1.77441 4.82324L5.39258 8.51465C5.58789 8.71484 5.78808 8.80274 6.02734 8.80274Z" fill="currentColor"></path>
            </svg>
            <span style="font-weight: 600;">${groupName}</span>
            <span style="opacity: 0.5; font-size: 0.9em;">(${groupItems.length})</span>
          </div>
        </summary>
        <div class="notion-list-collection" style="display: block !important;">
    `

    groupItems.forEach(item => {
      html += `
        <div class="notion-list-item" style="display: block !important;">
          <div class="notion-list-item-title">
            <a href="/${item.id.replace(/-/g, '')}" style="display: block; padding: 8px 0; text-decoration: none; color: inherit;">
              <span>${item.title}</span>
            </a>
          </div>
        </div>
      `
    })

    html += `
        </div>
      </div>
    `
  })

  html += `
        </div>
      </div>
    </div>
    
    <script>
      // グループのトグル機能
      (function() {
        const collection = document.querySelector('[data-collection-id="${collectionId}"]');
        if (!collection) return;
        
        const groupTitles = collection.querySelectorAll('.notion-collection-group-title');
        groupTitles.forEach(title => {
          title.addEventListener('click', function() {
            const group = this.parentElement;
            const content = group.querySelector('.notion-list-collection');
            const arrow = this.querySelector('svg');
            
            if (content.style.display === 'none') {
              content.style.display = 'block';
              arrow.style.transform = 'rotate(90deg)';
            } else {
              content.style.display = 'none';
              arrow.style.transform = 'rotate(0deg)';
            }
          });
        });
      })();
    </script>
  `

  return html
}

/**
 * recordMapにグループ化されたHTMLを注入
 */
export function injectGroupedHTML(
  recordMap: ExtendedRecordMap,
  blockId: string,
  html: string
): ExtendedRecordMap {
  if (!recordMap.block[blockId]) {
    return recordMap
  }

  // ブロックのformatに特別なプロパティを追加
  const block = recordMap.block[blockId].value as any
  if (!block.format) {
    block.format = {}
  }
  
  // サーバーレンダリングされたHTMLを保存
  block.format._serverRenderedHTML = html
  block.format._isServerRendered = true

  console.log(`[ServerSideGroupRenderer] Injected HTML for block ${blockId}`)
  
  return recordMap
}