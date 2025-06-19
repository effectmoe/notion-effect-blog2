// Next.js ISR (Incremental Static Regeneration) のための再検証ユーティリティ

interface RevalidateOptions {
  maxRetries?: number;
  retryDelay?: number;
}

export async function revalidatePage(
  url: string, 
  options: RevalidateOptions = {}
): Promise<boolean> {
  const { maxRetries = 3, retryDelay = 1000 } = options;
  
  // URLからパスを抽出
  const urlObj = new URL(url);
  const path = urlObj.pathname;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      // Next.js 13+ App Router の場合
      if (process.env.NEXT_PUBLIC_APP_ROUTER === 'true') {
        const revalidateUrl = new URL('/api/revalidate', process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000');
        revalidateUrl.searchParams.set('path', path);
        revalidateUrl.searchParams.set('secret', process.env.REVALIDATE_SECRET || '');
        
        const response = await fetch(revalidateUrl.toString(), {
          method: 'POST',
        });
        
        if (response.ok) {
          console.log(`Successfully revalidated: ${path}`);
          return true;
        }
      }
      
      // Pages Router の場合（フォールバック）
      const revalidateRes = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/revalidate?secret=${process.env.REVALIDATE_SECRET}&path=${path}`);
      
      if (revalidateRes.ok) {
        console.log(`Successfully revalidated: ${path}`);
        return true;
      }
      
      throw new Error(`Revalidation failed: ${revalidateRes.status}`);
      
    } catch (error) {
      console.error(`Revalidation attempt ${attempt + 1} failed:`, error);
      
      if (attempt < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, retryDelay * (attempt + 1)));
      }
    }
  }
  
  return false;
}

// バッチ再検証
export async function revalidatePages(urls: string[]): Promise<Map<string, boolean>> {
  const results = new Map<string, boolean>();
  
  // 並列で再検証を実行（最大5つずつ）
  const batchSize = 5;
  for (let i = 0; i < urls.length; i += batchSize) {
    const batch = urls.slice(i, i + batchSize);
    const batchResults = await Promise.all(
      batch.map(async (url) => {
        const success = await revalidatePage(url);
        return { url, success };
      })
    );
    
    batchResults.forEach(({ url, success }) => {
      results.set(url, success);
    });
  }
  
  return results;
}

// パスパターンによる再検証
export async function revalidateByPattern(pattern: RegExp): Promise<number> {
  // この実装は実際のサイトマップやページリストに依存します
  // 仮の実装として、基本的なパスのみを再検証します
  const commonPaths = [
    '/',
    '/about',
    '/blog',
    '/contact',
  ];
  
  const pathsToRevalidate = commonPaths.filter(path => pattern.test(path));
  const results = await revalidatePages(pathsToRevalidate.map(path => `${process.env.NEXT_PUBLIC_SITE_URL}${path}`));
  
  return Array.from(results.values()).filter(success => success).length;
}