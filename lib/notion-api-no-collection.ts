import { NotionAPI } from 'notion-client';

// コレクションデータの取得を無効化したNotionAPIクラス
export class NotionAPINoCollection extends NotionAPI {
  async getPage(
    pageId: string,
    {
      concurrency = 3,
      fetchMissingBlocks = true,
      fetchCollections = false, // デフォルトで無効化
      signFileUrls = true,
      chunkLimit = 100,
      chunkNumber = 0,
      ...rest
    }: any = {}
  ): Promise<any> {
    // 環境変数でコレクションデータの取得を制御
    const shouldFetchCollections = process.env.DISABLE_COLLECTION_DATA === 'true' ? false : fetchCollections;
    
    return super.getPage(pageId, {
      concurrency,
      fetchMissingBlocks,
      fetchCollections: shouldFetchCollections,
      signFileUrls,
      chunkLimit,
      chunkNumber,
      ...rest
    });
  }
}