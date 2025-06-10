import React from 'react';
import { useNotionContext } from 'react-notion-x';

export function DebugCollectionView({ block }: { block: any }) {
  const { recordMap } = useNotionContext();
  
  // ブロックの詳細情報を表示
  const blockInfo = {
    blockId: block?.id,
    blockType: block?.type,
    collectionId: block?.collection_id,
    viewIds: block?.view_ids,
    format: block?.format
  };
  
  // 利用可能なコレクションとビューを検索
  const collections = recordMap?.collection || {};
  const collectionViews = recordMap?.collection_view || {};
  const collectionQueries = recordMap?.collection_query || {};
  
  // コレクションIDがブロック内のプロパティに含まれているか確認
  const possibleCollectionIds = [
    block?.collection_id,
    block?.format?.collection_pointer?.id,
    block?.parent_id // 親がコレクションの可能性
  ].filter(Boolean);
  
  const foundCollections = possibleCollectionIds.map(id => ({
    id,
    found: !!collections[id],
    data: collections[id]
  }));
  
  return (
    <div style={{
      padding: '20px',
      background: '#f0f0f0',
      borderRadius: '8px',
      margin: '10px 0',
      fontSize: '12px',
      fontFamily: 'monospace'
    }}>
      <h4>デバッグ情報</h4>
      
      <div style={{ marginBottom: '10px' }}>
        <strong>ブロック情報:</strong>
        <pre>{JSON.stringify(blockInfo, null, 2)}</pre>
      </div>
      
      <div style={{ marginBottom: '10px' }}>
        <strong>利用可能なコレクション:</strong>
        <ul>
          {Object.keys(collections).map(id => (
            <li key={id}>{id}</li>
          ))}
        </ul>
      </div>
      
      <div style={{ marginBottom: '10px' }}>
        <strong>コレクション検索結果:</strong>
        <pre>{JSON.stringify(foundCollections, null, 2)}</pre>
      </div>
      
      <div style={{ marginBottom: '10px' }}>
        <strong>ブロック全体のデータ:</strong>
        <details>
          <summary>クリックして展開</summary>
          <pre style={{ maxHeight: '300px', overflow: 'auto' }}>
            {JSON.stringify(block, null, 2)}
          </pre>
        </details>
      </div>
      
      <p style={{ color: '#666', marginTop: '10px' }}>
        ※ このデバッグ情報は開発中のみ表示されます
      </p>
    </div>
  );
}