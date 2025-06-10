import { NotionAPI } from 'notion-client';
import type * as notion from 'notion-types';
import { fetchCollectionDataSafely } from './notion-collection-helper';

// 拡張されたNotionAPIクラス
export class NotionAPIEnhanced extends NotionAPI {
  private maxRetries: number = 3;
  private retryDelay: number = 2000;
  private timeout: number = 60000;

  constructor(config?: any) {
    super(config);
  }

  async getPage(
    pageId: string,
    {
      concurrency = 3,
      fetchMissingBlocks = true,
      fetchCollections = true,
      signFileUrls = true,
      chunkLimit = 100,
      chunkNumber = 0,
      ...rest
    }: any = {}
  ): Promise<notion.ExtendedRecordMap> {
    try {
      // 基本的なページデータを取得（コレクションなし）
      const recordMap = await super.getPage(pageId, {
        concurrency,
        fetchMissingBlocks,
        fetchCollections: false, // 最初はコレクションなしで取得
        signFileUrls,
        chunkLimit,
        chunkNumber,
        ...rest
      });

      // コレクションデータを別途安全に取得
      if (fetchCollections && recordMap) {
        console.log('Fetching collection data safely...');
        await fetchCollectionDataSafely(recordMap, this, {
          concurrency,
          kyOptions: rest.kyOptions
        });
      }

      return recordMap;
    } catch (error) {
      console.error('Error in getPage:', error);
      
      // リトライロジック
      for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
        try {
          console.log(`Retry attempt ${attempt}/${this.maxRetries}...`);
          await new Promise(resolve => setTimeout(resolve, this.retryDelay * attempt));
          
          return await super.getPage(pageId, {
            concurrency,
            fetchMissingBlocks,
            fetchCollections: false, // リトライ時はコレクションなし
            signFileUrls,
            chunkLimit,
            chunkNumber,
            ...rest
          });
        } catch (retryError) {
          if (attempt === this.maxRetries) {
            throw retryError;
          }
        }
      }
      
      throw error;
    }
  }

  // getCollectionDataメソッドもオーバーライドしてタイムアウト処理を追加
  async getCollectionData(
    collectionId: string,
    collectionViewId: string,
    collectionView: any,
    args?: any
  ): Promise<any> {
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error(`Collection data timeout: ${collectionId}`)), this.timeout);
    });

    try {
      return await Promise.race([
        super.getCollectionData(collectionId, collectionViewId, collectionView, args),
        timeoutPromise
      ]);
    } catch (error) {
      console.warn(`Failed to get collection data for ${collectionId}:`, error);
      // エラーが発生してもnullを返してページの表示を継続
      return null;
    }
  }
}