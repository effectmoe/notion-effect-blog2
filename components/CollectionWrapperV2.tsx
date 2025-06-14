import * as React from 'react';
import dynamic from 'next/dynamic';
import { useNotionContext } from 'react-notion-x';

// 既存のCollectionコンポーネント
const DefaultCollection = dynamic(() =>
  import('react-notion-x/build/third-party/collection').then(m => m.Collection),
  { ssr: false }
);

// FAQ用のカスタムCollectionコンポーネント
const FAQCollection = dynamic(() =>
  import('./FAQCollection').then(m => m.FAQCollection),
  { ssr: false }
);

interface CollectionWrapperV2Props {
  block: any;
  className?: string;
  ctx?: any;
}

/**
 * Collection表示を条件分岐するラッパーコンポーネント
 * FAQマスターの場合は専用のデバッグ機能付きコンポーネントを使用
 */
export const CollectionWrapperV2: React.FC<CollectionWrapperV2Props> = (props) => {
  const { recordMap } = useNotionContext();
  const [isFAQ, setIsFAQ] = React.useState(false);
  
  React.useEffect(() => {
    if (!props.block || !recordMap) return;
    
    const collectionId = props.block.collection_id;
    if (!collectionId) return;
    
    const collection = recordMap.collection?.[collectionId]?.value;
    const collectionName = collection?.name?.[0]?.[0] || '';
    
    // FAQマスターかどうかを判定
    const isFAQDatabase = collectionName.includes('FAQ') || 
                         collectionName.includes('よくある') ||
                         collectionName.includes('質問');
    
    setIsFAQ(isFAQDatabase);
    
    if (isFAQDatabase) {
      console.log('🔍 FAQ Database detected:', collectionName);
    }
  }, [props.block, recordMap]);
  
  // FAQの場合はカスタムコンポーネント、それ以外はデフォルト
  const Component = isFAQ ? FAQCollection : DefaultCollection;
  
  return <Component {...props} />;
};
