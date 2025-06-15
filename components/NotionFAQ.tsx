import React from 'react';
import { Collection } from 'react-notion-x/build/third-party/collection';
import { useNotionContext } from 'react-notion-x';
import type { CollectionViewBlock, CollectionViewPageBlock } from 'notion-types';
import styles from './NotionFAQ.module.css';

interface NotionFAQProps {
  blockId: string;
}

export const NotionFAQ: React.FC<NotionFAQProps> = ({ blockId }) => {
  const { recordMap } = useNotionContext();
  
  // FAQマスターブロックを取得
  const block = recordMap.block[blockId];
  
  if (!block || !block.value) {
    return null;
  }
  
  // 型チェック
  if (block.value.type !== 'collection_view' && block.value.type !== 'collection_view_page') {
    return null;
  }

  return (
    <div className={styles.faqWrapper}>
      <h2 className={styles.faqTitle}>よくある質問</h2>
      <div className={styles.notionCollection}>
        <Collection 
          block={block.value as CollectionViewBlock | CollectionViewPageBlock} 
          className={styles.faqCollection}
        />
      </div>
    </div>
  );
};