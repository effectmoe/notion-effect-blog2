import { ExtendedRecordMap } from 'notion-types'

/**
 * recordMapから最新の更新時刻を取得
 * 全てのブロックのlast_edited_timeを確認し、最新のものを返す
 */
export function getLatestEditTime(recordMap: ExtendedRecordMap): number {
  let latestTime = 0

  // 全てのブロックをチェック
  if (recordMap.block) {
    Object.values(recordMap.block).forEach(blockData => {
      const block = blockData?.value
      if (block?.last_edited_time && block.last_edited_time > latestTime) {
        latestTime = block.last_edited_time
      }
    })
  }

  // コレクションもチェック
  if (recordMap.collection) {
    Object.values(recordMap.collection).forEach(collectionData => {
      const collection = collectionData?.value as any
      if (collection?.last_edited_time && collection.last_edited_time > latestTime) {
        latestTime = collection.last_edited_time
      }
    })
  }

  return latestTime
}

/**
 * バージョン対応のキャッシュキーを生成
 * last_edited_timeを含めることで、更新があった場合は新しいキャッシュキーになる
 */
export function generateVersionAwareCacheKey(
  prefix: string,
  pageId: string,
  lastEditedTime?: number
): string {
  if (lastEditedTime) {
    return `${prefix}:${pageId}:v${lastEditedTime}`
  }
  return `${prefix}:${pageId}`
}

/**
 * 古いバージョンのキャッシュをクリーンアップ
 */
export async function cleanupOldVersionCache(
  pageId: string,
  currentVersion: number,
  invalidateCache: (pattern: string) => Promise<void>
): Promise<void> {
  // 現在のバージョン以外のキャッシュを削除
  const pattern = `notion:page:${pageId}:v`
  await invalidateCache(pattern)
  
  console.log(`[VersionCache] Cleaned up old versions for page ${pageId}, keeping version ${currentVersion}`)
}