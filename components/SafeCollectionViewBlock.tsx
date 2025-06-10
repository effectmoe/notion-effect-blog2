import React from 'react';
import { Collection } from 'react-notion-x/build/third-party/collection';
import { useNotionContext } from 'react-notion-x';
import { DebugCollectionView } from './DebugCollectionView';

// エラーハンドリングを追加したCollectionコンポーネント
export function SafeCollectionViewBlock(props: any) {
  // NotionコンテキストからrecordMapを取得
  const { recordMap } = useNotionContext();
  // デバッグ用ログ：受け取ったpropsの内容を詳細に出力
  console.log('SafeCollectionViewBlock props:', {
    hasBlock: !!props.block,
    hasCollection: !!props.collection,
    hasCollectionView: !!props.collection_view,
    hasCollectionQuery: !!props.collection_query,
    blockType: props.block?.type,
    blockId: props.block?.id,
    collectionId: props.block?.collection_id,
    viewIds: props.block?.view_ids,
    propsKeys: Object.keys(props),
    // useNotionContextから取得されるデータもチェック
    hasRecordMapFromContext: !!recordMap,
    recordMapKeysFromContext: recordMap ? Object.keys(recordMap) : [],
    contextCollections: recordMap?.collection ? Object.keys(recordMap.collection) : [],
    contextViews: recordMap?.collection_view ? Object.keys(recordMap.collection_view) : [],
    contextQueries: recordMap?.collection_query ? Object.keys(recordMap.collection_query) : []
  });

  try {
    // react-notion-xのCollectionコンポーネントが必要とする主要なプロパティをチェック
    // コンテキストから取得したrecordMapも使用
    const contextRecordMap = recordMap || props.recordMap;
    
    const requiredData = {
      block: props.block,
      collection: props.collection || contextRecordMap?.collection?.[props.block?.collection_id],
      collectionView: props.collection_view || contextRecordMap?.collection_view,
      collectionQuery: props.collection_query || contextRecordMap?.collection_query
    };

    // コレクションIDが存在する場合、recordMapからデータを探す
    if (props.block?.collection_id || props.block?.type === 'collection_view' || props.block?.type === 'collection_view_page') {
      const collectionId = props.block.collection_id || props.block.id;
      const viewId = props.block.view_ids?.[0]; // 最初のビューIDを使用
      
      // コンテキストまたはpropsから利用可能なすべてのデータソースを確認
      const allCollections = {
        ...contextRecordMap?.collection,
        ...props.recordMap?.collection
      };
      
      const allCollectionViews = {
        ...contextRecordMap?.collection_view,
        ...props.recordMap?.collection_view,
        ...props.collection_view // 直接渡されたcollection_viewも確認
      };
      
      const allCollectionQueries = {
        ...contextRecordMap?.collection_query,
        ...props.recordMap?.collection_query,
        ...props.collection_query // 直接渡されたcollection_queryも確認
      };

      console.log('Attempting to find collection data:', {
        collectionId,
        viewId,
        blockCollectionId: props.block.collection_id,
        availableCollections: Object.keys(allCollections),
        availableViews: Object.keys(allCollectionViews),
        availableQueries: Object.keys(allCollectionQueries),
        hasTargetCollection: !!allCollections[collectionId],
        hasTargetView: viewId ? !!allCollectionViews[viewId] : false,
        hasTargetQuery: !!allCollectionQueries[collectionId]
      });
      
      // 利用可能なコレクションの中から該当するものを探す
      if (!allCollections[collectionId]) {
        // collection_idが見つからない場合、block.idで試す
        if (allCollections[props.block.id]) {
          console.log('Found collection using block.id instead of collection_id');
          requiredData.collection = allCollections[props.block.id];
        } else {
          // それでも見つからない場合、最初の利用可能なコレクションを使用
          const availableCollectionIds = Object.keys(allCollections);
          if (availableCollectionIds.length > 0) {
            console.log('Using first available collection:', availableCollectionIds[0]);
            requiredData.collection = allCollections[availableCollectionIds[0]];
          }
        }
      } else {
        requiredData.collection = allCollections[collectionId];
      }
      
      // ビューデータを設定（viewIdまたは最初の利用可能なビューを使用）
      if (viewId && allCollectionViews[viewId]) {
        requiredData.collectionView = allCollectionViews[viewId];
      } else if (!requiredData.collectionView && Object.keys(allCollectionViews).length > 0) {
        // viewIdが見つからない場合は、最初の利用可能なビューを使用
        const firstViewId = Object.keys(allCollectionViews)[0];
        requiredData.collectionView = allCollectionViews[firstViewId];
        console.log('Using first available view:', firstViewId);
      }
      
      // クエリデータを設定
      requiredData.collectionQuery = allCollectionQueries[collectionId] || requiredData.collectionQuery;
    }

    // コレクションデータが存在しない場合のフォールバック
    if (!requiredData.collection || !requiredData.block) {
      console.warn('Missing collection data - detailed info:', {
        block: requiredData.block,
        collection: requiredData.collection,
        collectionView: requiredData.collectionView,
        collectionQuery: requiredData.collectionQuery,
        originalProps: props,
        blockId: props.block?.id,
        blockCollectionId: props.block?.collection_id,
        allAvailableCollections: Object.keys({
          ...contextRecordMap?.collection,
          ...props.recordMap?.collection
        })
      });
      
      // 開発環境でデバッグビューを表示
      if (process.env.NODE_ENV === 'development') {
        return <DebugCollectionView block={props.block} />;
      }
      
      return (
        <div style={{ 
          padding: '20px', 
          background: '#f5f5f5', 
          borderRadius: '8px',
          margin: '10px 0' 
        }}>
          <p style={{ color: '#666' }}>
            このデータベースは現在利用できません。
          </p>
        </div>
      );
    }

    // Collectionコンポーネントに必要なプロパティを明示的に渡す
    const collectionProps = {
      ...props,
      // recordMapから取得したデータで補完
      collection: requiredData.collection || props.collection,
      collection_view: requiredData.collectionView || props.collection_view,
      collection_query: requiredData.collectionQuery || props.collection_query
    };
    
    console.log('Passing to Collection component:', {
      hasBlock: !!collectionProps.block,
      hasCollection: !!collectionProps.collection,
      hasCollectionView: !!collectionProps.collection_view,
      hasCollectionQuery: !!collectionProps.collection_query
    });
    
    return <Collection {...collectionProps} />;
  } catch (error) {
    console.error('Error rendering collection view:', error);
    return (
      <div style={{ 
        padding: '20px', 
        background: '#f5f5f5', 
        borderRadius: '8px',
        margin: '10px 0' 
      }}>
        <p style={{ color: '#666' }}>
          データベースの表示中にエラーが発生しました。
        </p>
      </div>
    );
  }
}