import { NotionAPI } from 'notion-client';

// リトライ機能付きのNotionAPIクラス
export class NotionAPIWithRetry extends NotionAPI {
  private maxRetries: number;
  private retryDelay: number;
  private timeout: number;

  constructor(config?: {
    authToken?: string;
    activeUser?: string;
    userTimeZone?: string;
    maxRetries?: number;
    retryDelay?: number;
    timeout?: number;
  }) {
    super(config);
    this.maxRetries = config?.maxRetries || 3;
    this.retryDelay = config?.retryDelay || 1000;
    this.timeout = config?.timeout || 60000; // 60秒のデフォルトタイムアウト
  }

  // リトライロジックを含むラッパー
  private async withRetry<T>(
    operation: () => Promise<T>,
    operationName: string
  ): Promise<T> {
    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt < this.maxRetries; attempt++) {
      try {
        // タイムアウト付きで実行
        const result = await Promise.race([
          operation(),
          new Promise<never>((_, reject) => 
            setTimeout(() => reject(new Error(`Operation ${operationName} timed out after ${this.timeout}ms`)), this.timeout)
          )
        ]);
        
        return result;
      } catch (error) {
        lastError = error as Error;
        console.error(`Attempt ${attempt + 1} failed for ${operationName}:`, error);
        
        // タイムアウトエラーやネットワークエラーの場合はリトライ
        const isRetryableError = error instanceof Error && 
          (error.message.includes('timed out') || 
           error.message.includes('ECONNRESET') ||
           error.message.includes('ETIMEDOUT') ||
           error.message.includes('socket hang up'));
           
        if (isRetryableError) {
          if (attempt < this.maxRetries - 1) {
            const delay = this.retryDelay * Math.pow(2, attempt); // 指数バックオフ
            console.log(`Retrying ${operationName} after ${delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
          }
        } else {
          // その他のエラーは即座に再スロー
          throw error;
        }
      }
    }
    
    throw lastError || new Error(`${operationName} failed after ${this.maxRetries} attempts`);
  }

  // getPageメソッドのオーバーライド
  async getPage(pageId: string, options?: any): Promise<any> {
    return this.withRetry(
      () => super.getPage(pageId, options),
      `getPage(${pageId})`
    );
  }

  // getCollectionDataメソッドのオーバーライド
  async getCollectionData(
    collectionId: string,
    collectionViewId: string,
    collectionView: any,
    args?: any
  ): Promise<any> {
    return this.withRetry(
      () => super.getCollectionData(collectionId, collectionViewId, collectionView, args),
      `getCollectionData(${collectionId})`
    );
  }

  // getBlocksメソッドのオーバーライド
  async getBlocks(blockIds: string[]): Promise<any> {
    return this.withRetry(
      () => super.getBlocks(blockIds),
      `getBlocks(${blockIds.length} blocks)`
    );
  }

  // searchPagesメソッドのオーバーライド
  async search(params: any): Promise<any> {
    return this.withRetry(
      () => super.search(params),
      'search'
    );
  }
}