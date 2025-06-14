import * as React from 'react';
import dynamic from 'next/dynamic';
import { useNotionContext } from 'react-notion-x';
import { getBlockCollectionId } from 'notion-utils';

// Dynamically import the Collection component
const Collection = dynamic(() =>
  import('react-notion-x/build/third-party/collection').then(
    (m) => m.Collection
  ),
  {
    ssr: false,
    loading: () => <div className="notion-collection-loading">Loading collection...</div>
  }
);

interface FilteredCollectionProps {
  block: any;
  className?: string;
  ctx?: any;
}

/**
 * FilteredCollection - format.property_filtersを適用するカスタムコレクションコンポーネント
 * Notionのリンクドビューでformat.property_filtersが設定されている場合に、
 * そのフィルターを適用してデータを表示する
 */
export const FilteredCollection: React.FC<FilteredCollectionProps> = ({ 
  block, 
  className,
  ctx 
}) => {
  const notionContext = useNotionContext();
  const { recordMap } = notionContext;
  const [filteredRecordMap, setFilteredRecordMap] = React.useState<any>(null);
  
  // Use provided ctx or fallback to notionContext
  const context = ctx || notionContext;
  
  React.useEffect(() => {
    if (!block || !recordMap) return;
    
    // ビューIDとコレクションIDを取得
    const viewId = block.view_ids?.[0];
    const collectionId = block.collection_id || getBlockCollectionId(block, recordMap);
    
    if (!viewId || !collectionId) {
      console.warn('FilteredCollection: Missing viewId or collectionId');
      return;
    }
    
    // ビューとコレクションの情報を取得
    const collectionView = recordMap.collection_view?.[viewId]?.value;
    const collection = recordMap.collection?.[collectionId]?.value;
    
    if (!collectionView || !collection) {
      console.warn('FilteredCollection: Missing collection or view data');
      return;
    }
    
    // コレクション名を取得してデバッグ
    const collectionName = collection?.name?.[0]?.[0] || 'Unknown';
    const viewName = collectionView?.name || 'Unknown';
    const isFAQCollection = collectionName.includes('FAQ') || collectionName.includes('よくある');
    
    console.log('📋 FilteredCollection Debug:', {
      collectionName,
      viewName,
      isFAQCollection,
      hasPropertyFilters: !!collectionView.format?.property_filters,
      hasQuery2Filters: !!collectionView.query2?.filter
    });
    
    // format.property_filtersを確認
    const propertyFilters = collectionView.format?.property_filters;
    
    if (!propertyFilters || propertyFilters.length === 0) {
      // フィルターがない場合は元のrecordMapを使用
      console.log('ℹ️ No property filters found, using original recordMap');
      setFilteredRecordMap(recordMap);
      return;
    }
    
    console.log('🔍 Applying property filters:', {
      viewId,
      collectionId,
      filters: propertyFilters
    });
    
    // recordMapをディープクローン
    const newRecordMap = JSON.parse(JSON.stringify(recordMap));
    
    // collection_queryのデータをフィルタリング
    const collectionQuery = newRecordMap.collection_query?.[collectionId]?.[viewId];
    
    if (collectionQuery?.collection_group_results) {
      const originalBlockIds = collectionQuery.collection_group_results.blockIds || [];
      const filteredBlockIds: string[] = [];
      
      // 各ブロックに対してフィルターを適用
      originalBlockIds.forEach((blockId: string) => {
        const block = newRecordMap.block?.[blockId]?.value;
        if (!block) return;
        
        let passesAllFilters = true;
        
        // すべてのproperty_filtersをチェック
        propertyFilters.forEach((filterConfig: any) => {
          const filter = filterConfig.filter;
          if (!filter) return;
          
          const propertyId = filter.property;
          const operator = filter.filter?.operator;
          const filterValue = filter.filter?.value;
          
          // プロパティの値を取得
          const propertyValue = block.properties?.[propertyId];
          
          // チェックボックスのフィルター処理
          if (operator === 'checkbox_is') {
            const isChecked = propertyValue?.[0]?.[0] === 'Yes';
            const expectedValue = filterValue?.value === true;
            
            if (isChecked !== expectedValue) {
              passesAllFilters = false;
            }
          }
          // 他のフィルタータイプもここで処理可能
        });
        
        if (passesAllFilters) {
          filteredBlockIds.push(blockId);
        }
      });
      
      console.log(`✅ Filtered ${originalBlockIds.length} items to ${filteredBlockIds.length} items`);
      
      // デバッグ: フィルタリングされたアイテムの最初の3件を表示
      if (isFAQCollection && filteredBlockIds.length > 0) {
        console.log('🔍 Filtered FAQ items (first 3):');
        filteredBlockIds.slice(0, 3).forEach((blockId, index) => {
          const block = newRecordMap.block?.[blockId]?.value;
          if (block) {
            const title = block.properties?.title?.[0]?.[0] || 'Untitled';
            console.log(`  ${index + 1}. ${title}`);
          }
        });
      }
      
      // フィルタリング結果を適用
      collectionQuery.collection_group_results.blockIds = filteredBlockIds;
      
      // total も更新
      if (collectionQuery.total !== undefined) {
        collectionQuery.total = filteredBlockIds.length;
      }
    }
    
    setFilteredRecordMap(newRecordMap);
    
  }, [block, recordMap]);
  
  // フィルタリングされたrecordMapが準備できるまで待機
  if (!filteredRecordMap) {
    return <div className="notion-collection-loading">Applying filters...</div>;
  }
  
  // フィルタリングされたコンテキストを作成
  const filteredContext = {
    ...context,
    recordMap: filteredRecordMap
  };
  
  try {
    return <Collection block={block} className={className} ctx={filteredContext} />;
  } catch (error) {
    console.error('FilteredCollection: Error rendering collection', error);
    return (
      <div className="notion-collection-error">
        <p>Error loading collection view</p>
      </div>
    );
  }
};

export default FilteredCollection;