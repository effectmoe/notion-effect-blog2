import React from 'react';
import { Collection } from 'react-notion-x/build/third-party/collection';

// エラーハンドリングを追加したCollectionコンポーネント
export function SafeCollectionViewBlock(props: any) {
  try {
    // コレクションデータが存在しない場合のフォールバック
    if (!props.collection || !props.block) {
      console.warn('Missing collection data');
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

    return <Collection {...props} />;
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