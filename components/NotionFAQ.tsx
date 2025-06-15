import React from 'react';
import { Collection } from 'react-notion-x/build/third-party/collection';
import { useNotionContext } from 'react-notion-x';
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

  return (
    <div className={styles.faqWrapper}>
      <h2 className={styles.faqTitle}>よくある質問</h2>
      <div className={styles.notionCollection}>
        <Collection 
          block={block.value} 
          className={styles.faqCollection}
        />
      </div>
    </div>
  );
};