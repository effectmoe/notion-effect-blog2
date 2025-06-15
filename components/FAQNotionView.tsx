import React from 'react';
import { Collection } from 'react-notion-x/build/third-party/collection';
import { useNotionContext } from 'react-notion-x';
import type { CollectionViewBlock, CollectionViewPageBlock } from 'notion-types';
import styles from './FAQNotionView.module.css';

interface FAQNotionViewProps {
  blockId?: string;
  viewId?: string;
}

export const FAQNotionView: React.FC<FAQNotionViewProps> = ({ 
  blockId = '212b802c-b0c6-80ea-b7ed-ef4459f38819',
  viewId = '212b802c-b0c6-8026-8290-000cee82ffad' // 公開FAQビューのID
}) => {
  const { recordMap } = useNotionContext();
  
  // FAQマスターブロックを取得
  const block = recordMap.block[blockId];
  
  if (!block || !block.value) {
    console.log('FAQ block not found:', blockId);
    return null;
  }
  
  // 型チェック
  if (block.value.type !== 'collection_view' && block.value.type !== 'collection_view_page') {
    console.log('Block is not a collection view:', block.value.type);
    return null;
  }
  
  const collectionBlock = block.value as CollectionViewBlock | CollectionViewPageBlock;
  
  // 特定のビューIDを強制的に使用
  const modifiedBlock = {
    ...collectionBlock,
    format: {
      ...collectionBlock.format,
      collection_pointer: {
        id: collectionBlock.collection_id || '212b802c-b0c6-8046-b4ee-000b2833619c',
        table: 'collection',
        spaceId: collectionBlock.space_id
      }
    }
  };
  
  // 特定のビューを選択するためのプロパティを追加
  const collectionProps = {
    block: modifiedBlock,
    className: styles.faqCollection,
    defaultViewId: viewId
  };

  return (
    <div className={styles.faqWrapper}>
      <h2 className={styles.faqTitle}>よくある質問</h2>
      <div className={styles.notionCollection}>
        <Collection {...collectionProps} />
      </div>
    </div>
  );
};