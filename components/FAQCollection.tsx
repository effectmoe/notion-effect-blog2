import * as React from 'react';
import { Collection as NotionCollection } from 'react-notion-x/build/third-party/collection';
import { useNotionContext } from 'react-notion-x';

interface CustomCollectionProps {
  block: any;
  className?: string;
  ctx?: any;
}

/**
 * FAQマスターデータベース用のカスタムCollectionコンポーネント
 * 公開プロパティのフィルタリングをデバッグ・修正
 */
export const FAQCollection: React.FC<CustomCollectionProps> = ({ 
  block, 
  className,
  ctx 
}) => {
  const notionContext = useNotionContext();
  const { recordMap } = notionContext;
  
  React.useEffect(() => {
    if (!block || !recordMap) return;
    
    // コレクションの情報を取得
    const collectionId = block.collection_id;
    const viewId = block.view_ids?.[0];
    
    if (!collectionId || !viewId) return;
    
    const collection = recordMap.collection?.[collectionId]?.value;
    const collectionView = recordMap.collection_view?.[viewId]?.value;
    
    // コレクション名を確認
    const collectionName = collection?.name?.[0]?.[0] || '';
    
    // FAQマスターの場合のみデバッグ
    if (collectionName.includes('FAQ') || collectionName.includes('よくある')) {
      console.log('📋 FAQ Collection Debug:', {
        name: collectionName,
        collectionId,
        viewId,
        viewType: collectionView?.type,
        query2: collectionView?.query2
      });
      
      // ビューのフィルター設定を確認
      if (collectionView?.query2?.filter) {
        console.log('🔍 View Filters:', collectionView.query2.filter);
        
        // フィルターの詳細を解析
        const filters = collectionView.query2.filter.filters || [];
        filters.forEach((filter: any, index: number) => {
          const schema = collection?.schema || {};
          const propSchema = Object.entries(schema).find(
            ([propId]) => propId === filter.property
          )?.[1];
          
          console.log(`Filter ${index + 1}:`, {
            propertyName: propSchema?.name,
            propertyType: propSchema?.type,
            filterType: filter.filter?.type,
            operator: filter.filter?.operator,
            value: filter.filter?.value
          });
        });
      }
      
      // コレクションデータを確認
      const collectionQuery = recordMap.collection_query?.[collectionId]?.[viewId];
      if (collectionQuery) {
        const blockIds = collectionQuery.collection_group_results?.blockIds || [];
        console.log(`📊 Total items in view: ${blockIds.length}`);
        
        // 最初の3件のデータを確認
        const schema = collection?.schema || {};
        blockIds.slice(0, 3).forEach((blockId: string, index: number) => {
          const block = recordMap.block?.[blockId]?.value;
          if (block) {
            const title = block.properties?.title?.[0]?.[0] || 'Untitled';
            console.log(`\nItem ${index + 1}: ${title}`);
            
            // 公開プロパティを探す
            Object.entries(schema).forEach(([propId, prop]: [string, any]) => {
              if (prop.name === '公開' && prop.type === 'checkbox') {
                const value = block.properties?.[propId];
                console.log(`- ${prop.name}:`, value?.[0]?.[0] || 'false');
              }
            });
          }
        });
      }
    }
  }, [block, recordMap]);
  
  // デフォルトのCollectionコンポーネントをレンダリング
  return <NotionCollection block={block} className={className} ctx={ctx} />;
};

// デフォルトのCollectionコンポーネントも再エクスポート
export { NotionCollection as DefaultCollection };
