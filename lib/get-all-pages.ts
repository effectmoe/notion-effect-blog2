import * as types from 'notion-types';
import { getAllPagesInSpace } from 'notion-utils';
import { getSiteMap } from './get-site-map';

// 重複を排除したページリストを取得
export async function getAllPageIds(
  rootNotionPageId?: string,
  rootNotionSpaceId?: string
): Promise<string[]> {
  console.log('[Page List] Getting all page IDs...');
  console.log('[Page List] Root page ID:', rootNotionPageId);
  console.log('[Page List] Root space ID:', rootNotionSpaceId);
  
  try {
    // サイトマップからページ情報を取得
    const siteMap = await getSiteMap();
    
    if (!siteMap?.pageMap) {
      console.error('[Page List] No page map found in site map');
      return [];
    }

    // ページIDとタイトルのマッピングを作成
    const pageIdToTitle = new Map<string, string>();
    const titleToPageIds = new Map<string, string[]>();
    const canonicalToPageIds = new Map<string, string[]>();
    
    // 各ページの情報を収集
    for (const [pageId, recordMap] of Object.entries(siteMap.pageMap)) {
      try {
        // recordMapからページ情報を取得
        const canonicalPageId = siteMap.canonicalPageMap?.[pageId] || pageId;
        
        // ページタイトルを取得
        let title = pageId;
        if (recordMap && recordMap.block) {
          const block = recordMap.block[pageId]?.value;
          if (block?.properties?.title) {
            title = block.properties.title[0]?.[0] || pageId;
          }
        }
        
        pageIdToTitle.set(pageId, title);
        
        // タイトルごとにページIDをグループ化
        if (!titleToPageIds.has(title)) {
          titleToPageIds.set(title, []);
        }
        titleToPageIds.get(title)!.push(pageId);
        
        // canonicalPageIdごとにもグループ化
        if (!canonicalToPageIds.has(canonicalPageId)) {
          canonicalToPageIds.set(canonicalPageId, []);
        }
        canonicalToPageIds.get(canonicalPageId)!.push(pageId);
        
      } catch (error) {
        console.error(`[Page List] Error processing page ${pageId}:`, error);
      }
    }
    
    // 重複を検出してログ出力
    const duplicatePageIds = new Set<string>();
    const validPageIds = new Set<string>();
    
    // タイトルの重複をチェック
    for (const [title, ids] of titleToPageIds.entries()) {
      if (ids.length > 1) {
        console.warn(`[Page List] ⚠️ Duplicate pages found for title "${title}":`, ids);
        // 最初のIDを有効とし、残りは重複として記録
        validPageIds.add(ids[0]);
        ids.slice(1).forEach(id => duplicatePageIds.add(id));
      } else {
        validPageIds.add(ids[0]);
      }
    }
    
    // canonicalPageIdの重複もチェック
    for (const [canonicalId, ids] of canonicalToPageIds.entries()) {
      if (ids.length > 1 && !ids.every(id => id === canonicalId)) {
        console.warn(`[Page List] ⚠️ Multiple pages with canonical ID "${canonicalId}":`, ids);
        // 既に有効とされているIDがあればそれを維持、なければ最初のIDを使用
        const validId = ids.find(id => validPageIds.has(id)) || ids[0];
        ids.forEach(id => {
          if (id !== validId) {
            duplicatePageIds.add(id);
            validPageIds.delete(id);
          }
        });
      }
    }
    
    // 重複を除外したページIDリストを作成
    const uniquePageIds = Array.from(validPageIds);
    
    console.log(`[Page List] ✅ Total pages in map: ${pageIdToTitle.size}`);
    console.log(`[Page List] ✅ Unique pages: ${uniquePageIds.length}`);
    console.log(`[Page List] ⚠️ Duplicate pages excluded: ${duplicatePageIds.size}`);
    
    if (duplicatePageIds.size > 0) {
      console.log('[Page List] Excluded duplicate page IDs:', Array.from(duplicatePageIds));
    }
    
    return uniquePageIds;
    
  } catch (error) {
    console.error('[Page List] Failed to get page IDs:', error);
    return [];
  }
}

// キャッシュキーを一意にする関数
export function getUniquePageCacheKey(pageId: string, canonicalPageId?: string): string {
  // pageId（UUID）を優先してキャッシュキーとする
  // これにより重複するcanonicalPageIdがあっても別々にキャッシュされる
  return `notion-page-${pageId}`;
}

// ページIDが重複リストに含まれているかチェック
export async function isPageDuplicate(pageId: string): Promise<boolean> {
  try {
    const siteMap = await getSiteMap();
    if (!siteMap?.canonicalPageMap) return false;
    
    const canonicalId = siteMap.canonicalPageMap[pageId];
    if (!canonicalId) return false;
    
    // 同じcanonicalIdを持つ他のページがあるかチェック
    const sameCanonicalPages = Object.entries(siteMap.canonicalPageMap)
      .filter(([id, canonical]) => canonical === canonicalId)
      .map(([id]) => id);
    
    return sameCanonicalPages.length > 1 && sameCanonicalPages[0] !== pageId;
  } catch (error) {
    console.error('[Page List] Error checking duplicate:', error);
    return false;
  }
}