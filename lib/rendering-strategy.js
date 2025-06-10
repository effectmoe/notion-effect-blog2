// SSG/ISR/SSRハイブリッドレンダリング戦略
// ページの特性に応じて最適なレンダリング方法を自動選択

import { notion } from './notion-api';
import cache from './cache';

// レンダリング戦略の定義
export const RenderingStrategy = {
  SSG: 'static',      // Static Site Generation
  ISR: 'incremental', // Incremental Static Regeneration
  SSR: 'server',      // Server Side Rendering
  CSR: 'client',      // Client Side Rendering (フォールバック)
};

// ページ分析結果の型
export interface PageAnalysis {
  strategy: keyof typeof RenderingStrategy;
  revalidate?: number;
  priority: 'high' | 'medium' | 'low';
  complexity: 'simple' | 'medium' | 'complex';
  updateFrequency: 'static' | 'daily' | 'hourly' | 'realtime';
  hasInteractiveContent: boolean;
  estimatedBuildTime: number; // ミリ秒
}

// ページ更新履歴の追跡
class UpdateTracker {
  private updateHistory = new Map<string, Date[]>();
  
  async recordUpdate(pageId: string) {
    const history = this.updateHistory.get(pageId) || [];
    history.push(new Date());
    
    // 最新100件のみ保持
    if (history.length > 100) {
      history.shift();
    }
    
    this.updateHistory.set(pageId, history);
    
    // 永続化
    await cache.set(`update-history:${pageId}`, history, 86400 * 30); // 30日間保持
  }
  
  async getUpdateFrequency(pageId: string): Promise<string> {
    let history = this.updateHistory.get(pageId);
    
    if (!history) {
      // キャッシュから復元
      history = await cache.get(`update-history:${pageId}`) || [];
      this.updateHistory.set(pageId, history);
    }
    
    if (history.length < 2) return 'static';
    
    // 平均更新間隔を計算
    const intervals = [];
    for (let i = 1; i < history.length; i++) {
      intervals.push(history[i].getTime() - history[i-1].getTime());
    }
    
    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const avgDays = avgInterval / (1000 * 60 * 60 * 24);
    
    if (avgDays < 0.04) return 'realtime';      // 1時間以内
    if (avgDays < 1) return 'hourly';           // 1日以内
    if (avgDays < 7) return 'daily';            // 1週間以内
    return 'static';                             // それ以上
  }
}

const updateTracker = new UpdateTracker();

// ページ分析とレンダリング戦略の決定
export async function analyzePageForStrategy(pageId: string): Promise<PageAnalysis> {
  try {
    // ページデータの取得
    const page = await notion.getPage(pageId);
    const blocks = Object.values(page.block || {});
    
    // 更新頻度の分析
    const updateFrequency = await updateTracker.getUpdateFrequency(pageId);
    
    // コンテンツの複雑度分析
    const complexity = analyzeComplexity(blocks);
    
    // インタラクティブコンテンツの検出
    const hasInteractiveContent = detectInteractiveContent(blocks);
    
    // ビルド時間の推定
    const estimatedBuildTime = estimateBuildTime(blocks, complexity);
    
    // レンダリング戦略の決定
    let strategy: keyof typeof RenderingStrategy;
    let revalidate: number | undefined;
    
    if (updateFrequency === 'realtime' || hasInteractiveContent) {
      // リアルタイム更新が必要な場合はSSR
      strategy = 'SSR';
    } else if (updateFrequency === 'hourly') {
      // 時間単位で更新される場合はISR（1時間）
      strategy = 'ISR';
      revalidate = 3600;
    } else if (updateFrequency === 'daily') {
      // 日次更新の場合はISR（6時間）
      strategy = 'ISR';
      revalidate = 21600;
    } else {
      // ほとんど更新されない場合はSSG
      strategy = 'SSG';
    }
    
    // ビルド時間が長すぎる場合はISRに変更
    if (strategy === 'SSG' && estimatedBuildTime > 10000) {
      strategy = 'ISR';
      revalidate = 86400; // 24時間
    }
    
    // 優先度の決定
    const priority = determinePriority(page, updateFrequency);
    
    return {
      strategy,
      revalidate,
      priority,
      complexity,
      updateFrequency,
      hasInteractiveContent,
      estimatedBuildTime,
    };
  } catch (error) {
    console.error('Page analysis failed:', error);
    // エラー時はSSRにフォールバック
    return {
      strategy: 'SSR',
      priority: 'low',
      complexity: 'simple',
      updateFrequency: 'static',
      hasInteractiveContent: false,
      estimatedBuildTime: 0,
    };
  }
}

// コンテンツの複雑度を分析
function analyzeComplexity(blocks: any[]): 'simple' | 'medium' | 'complex' {
  const blockTypes = blocks.map(b => b.value?.type).filter(Boolean);
  
  // 複雑なブロックタイプ
  const complexTypes = ['collection_view', 'embed', 'video', 'pdf', 'code'];
  const complexCount = blockTypes.filter(t => complexTypes.includes(t)).length;
  
  if (complexCount > 5) return 'complex';
  if (complexCount > 0 || blocks.length > 100) return 'medium';
  return 'simple';
}

// インタラクティブコンテンツの検出
function detectInteractiveContent(blocks: any[]): boolean {
  const interactiveTypes = [
    'collection_view', // データベース
    'embed',          // 埋め込みコンテンツ
    'poll',           // 投票
    'synced_block',   // 同期ブロック
  ];
  
  return blocks.some(block => {
    const type = block.value?.type;
    if (interactiveTypes.includes(type)) return true;
    
    // カスタムコードブロックの検出
    if (type === 'code' && block.value?.properties?.language?.[0]?.[0] === 'javascript') {
      return true;
    }
    
    return false;
  });
}

// ビルド時間の推定
function estimateBuildTime(blocks: any[], complexity: string): number {
  // 基本時間（ミリ秒）
  let baseTime = 100;
  
  // ブロック数による追加時間
  baseTime += blocks.length * 10;
  
  // 複雑度による倍率
  const complexityMultiplier = {
    simple: 1,
    medium: 2,
    complex: 5,
  };
  
  baseTime *= complexityMultiplier[complexity] || 1;
  
  // 特定のブロックタイプによる追加時間
  blocks.forEach(block => {
    const type = block.value?.type;
    switch (type) {
      case 'image':
        baseTime += 50; // 画像処理
        break;
      case 'collection_view':
        baseTime += 500; // データベース処理
        break;
      case 'embed':
        baseTime += 200; // 埋め込み処理
        break;
    }
  });
  
  return baseTime;
}

// 優先度の決定
function determinePriority(
  page: any, 
  updateFrequency: string
): 'high' | 'medium' | 'low' {
  // ホームページやランディングページは高優先度
  if (page.id === process.env.NOTION_ROOT_PAGE_ID) {
    return 'high';
  }
  
  // 頻繁に更新されるページは高優先度
  if (updateFrequency === 'realtime' || updateFrequency === 'hourly') {
    return 'high';
  }
  
  // プロパティにfeaturedがある場合は中優先度
  if (page.properties?.featured) {
    return 'medium';
  }
  
  return 'low';
}

// Next.jsのgetStaticPropsに渡す設定を生成
export async function generateRenderingConfig(pageId: string) {
  const analysis = await analyzePageForStrategy(pageId);
  
  switch (analysis.strategy) {
    case 'SSG':
      return {
        revalidate: false,
        notFound: false,
      };
      
    case 'ISR':
      return {
        revalidate: analysis.revalidate || 3600,
        notFound: false,
      };
      
    case 'SSR':
      // SSRの場合は特別な設定は不要
      return null;
      
    default:
      return {
        revalidate: 3600,
        notFound: false,
      };
  }
}

// ビルド時の最適化順序を決定
export async function getBuildPriority(pageIds: string[]): Promise<string[]> {
  const analyses = await Promise.all(
    pageIds.map(async (id) => ({
      id,
      analysis: await analyzePageForStrategy(id),
    }))
  );
  
  // 優先度とビルド時間でソート
  return analyses
    .sort((a, b) => {
      // 優先度で比較
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      const priorityDiff = 
        priorityOrder[a.analysis.priority] - priorityOrder[b.analysis.priority];
      
      if (priorityDiff !== 0) return priorityDiff;
      
      // ビルド時間で比較（短い方を先に）
      return a.analysis.estimatedBuildTime - b.analysis.estimatedBuildTime;
    })
    .map(item => item.id);
}

// エクスポート
export default {
  analyzePageForStrategy,
  generateRenderingConfig,
  getBuildPriority,
  updateTracker,
};