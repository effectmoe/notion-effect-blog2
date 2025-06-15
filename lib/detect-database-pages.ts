import { ExtendedRecordMap } from 'notion-types';

/**
 * データベースページを自動検出する
 * Notionのページ構造を分析して、データベースを含むページを特定
 */
export function detectDatabasePages(recordMap: ExtendedRecordMap): boolean {
  if (!recordMap || !recordMap.block) {
    return false;
  }

  // ブロックを調べてデータベース関連のタイプを検出
  const blocks = Object.values(recordMap.block);
  
  for (const block of blocks) {
    const blockValue = block?.value;
    if (!blockValue) continue;

    // コレクションビュー（データベース）を検出
    if (
      blockValue.type === 'collection_view' ||
      blockValue.type === 'collection_view_page' ||
      blockValue.type === 'collection_view_inline'
    ) {
      return true;
    }

    // 子ブロックにデータベースがあるかチェック
    if (blockValue.content && Array.isArray(blockValue.content)) {
      for (const childId of blockValue.content) {
        const childBlock = recordMap.block[childId];
        if (childBlock?.value?.type?.includes('collection')) {
          return true;
        }
      }
    }
  }

  // コレクション情報があるかチェック
  if (recordMap.collection && Object.keys(recordMap.collection).length > 0) {
    return true;
  }

  return false;
}

/**
 * ページタイトルからデータベースの可能性を推測
 * 一般的なデータベース名のパターンをチェック
 */
export function isDatabaseByTitle(title: string): boolean {
  if (!title) return false;

  const databaseKeywords = [
    'データベース',
    'リスト',
    '一覧',
    'FAQ',
    'マスター',
    'テーブル',
    '管理',
    'DB',
    'database',
    'list',
    'table',
    'master'
  ];

  const lowerTitle = title.toLowerCase();
  return databaseKeywords.some(keyword => 
    lowerTitle.includes(keyword.toLowerCase())
  );
}