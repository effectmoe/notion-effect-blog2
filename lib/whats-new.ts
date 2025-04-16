import { notion } from './notion-api';
import type { WhatsNewItem } from '@/components/WhatsNew';
import { getPageProperty } from 'notion-utils';
import * as config from './config';

/**
 * WhatsNewアイテムをNotionデータベースから取得する
 * @param databaseId 取得するデータベースのID
 * @returns WhatsNewItemの配列
 */
export async function getWhatsNewItems(databaseId: string): Promise<WhatsNewItem[]> {
  try {
    // Notionの非公式APIで直接データベースにアクセスする場合
    const recordMap = await notion.getPage(databaseId);

    // コレクションを取得
    const collections = Object.values(recordMap.collection);
    if (!collections.length) {
      console.error('No collections found');
      return [];
    }

    // コレクションビューを取得
    const collectionViewIds = Object.keys(recordMap.collection_view);
    if (!collectionViewIds.length) {
      console.error('No collection views found');
      return [];
    }

    const items: WhatsNewItem[] = [];
    const collectionId = collections[0].value.id;
    const collectionViewId = collectionViewIds[0];

    // コレクションのクエリ結果を取得
    const collectionData = await notion.getCollectionData(
      collectionId,
      collectionViewId,
      {
        type: 'table',
        loadContentCover: false
      }
    );

    // ブロックマップからページ情報を取得
    const blockIds = collectionData.result.blockIds;

    for (const blockId of blockIds) {
      const block = recordMap.block[blockId]?.value;
      if (!block) continue;

      try {
        // プロパティから各種情報を取得
        const title = getPageProperty('Name', block, recordMap);
        const dateStr = getPageProperty('Date', block, recordMap);
        const icon = block.format?.page_icon || '📄';
        const slug = getPageProperty('Slug', block, recordMap) || blockId;
        const category = getPageProperty('Category', block, recordMap);
        const excerpt = getPageProperty('Excerpt', block, recordMap);

        // 日付文字列をパース
        let date = new Date();
        if (dateStr) {
          try {
            // 文字列型かどうかを確認
            if (typeof dateStr === 'string') {
              date = new Date(dateStr);
            } else if (dateStr instanceof Date) {
              date = dateStr;
            } else if (typeof dateStr === 'number') {
              date = new Date(dateStr);
            }
          } catch (err) {
            console.error('Error parsing date:', dateStr, err);
          }
        }

        // titleの型変換を追加
        let titleStr = 'Untitled';
        if (title) {
          if (typeof title === 'string') {
            titleStr = title;
          } else if (typeof title === 'number') {
            titleStr = String(title);
          } else if (Array.isArray(title)) {
            titleStr = title.join(', ');
          } else if (typeof title === 'object') {
            titleStr = JSON.stringify(title);
          } else {
            titleStr = String(title);
          }
        }

        // items.push() の部分も修正
        items.push({
          id: blockId,
          title: titleStr,
          date: date.toISOString(),
          slug: typeof slug === 'string' ? slug : blockId,
          icon,
          category: typeof category === 'string' ? category : undefined,
          excerpt: typeof excerpt === 'string' ? excerpt : undefined
        });
      } catch (error) {
        console.error('Error processing block:', blockId, error);
      }
    }

    return items;
  } catch (error) {
    console.error('Error fetching WhatsNew items:', error);
    return [];
  }
}

/**
 * サンプルのWhatsNewアイテムを生成する（デモ用）
 * @returns WhatsNewItemの配列
 */
export function getSampleWhatsNewItems(): WhatsNewItem[] {
  return [
    {
      id: '1',
      date: '2025-04-07',
      title: 'Webサイトニューアルしました',
      slug: 'website-renewal',
      icon: '📝'
    },
    {
      id: '2',
      date: '2025-04-01',
      title: 'プロフィール更新しました',
      slug: 'profile-update',
      icon: '📝'
    }
  ];
}
