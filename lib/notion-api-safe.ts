import { NotionAPI } from 'notion-client';
import type * as notion from 'notion-types';

// コレクションエラーを許容するNotionAPIクラス
export class NotionAPISafe extends NotionAPI {
  async getPage(
    pageId: string,
    options: any = {}
  ): Promise<notion.ExtendedRecordMap> {
    try {
      // まずコレクションデータを含めて取得を試みる
      return await super.getPage(pageId, {
        ...options,
        fetchCollections: true
      });
    } catch (error) {
      console.warn('Failed to fetch page with collections, retrying without collections:', error);
      
      // コレクションデータの取得に失敗した場合は、コレクションなしで再試行
      try {
        return await super.getPage(pageId, {
          ...options,
          fetchCollections: false
        });
      } catch (secondError) {
        console.error('Failed to fetch page even without collections:', secondError);
        throw secondError;
      }
    }
  }
}