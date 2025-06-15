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
  const ctx = useNotionContext();
  const { recordMap } = ctx;
  
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
  
  // コレクションコンポーネントに渡すプロパティ
  const collectionProps = {
    block: collectionBlock,
    className: styles.faqCollection,
    ctx: ctx
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