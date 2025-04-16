import React from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';

// WhatsNewのアイテム型定義
export type WhatsNewItem = {
  id: string;
  date: string;
  title: string;
  slug: string;
  icon?: string;
  category?: string;
  excerpt?: string;
};

type WhatsNewSimpleProps = {
  items: WhatsNewItem[];
  max?: number;
};

// シンプルバージョンのWhatsNewコンポーネント
const WhatsNewSimple: React.FC<WhatsNewSimpleProps> = ({ 
  items, 
  max = 5
}) => {
  // 日付でソート（新しい順）
  const sortedItems = [...items]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, max);

  return (
    <div className="whats-new-simple-container">
      <div className="whats-new-simple-list">
        {sortedItems.map((item) => (
          <div key={item.id} className="whats-new-simple-item">
            <div className="whats-new-simple-date-title">
              {item.icon && <span className="whats-new-simple-icon">{item.icon}</span>}
              {format(new Date(item.date), 'yyyy.MM.dd')} | {item.title}
            </div>
          </div>
        ))}
      </div>
      
      <style jsx>{`
        .whats-new-simple-container {
          margin: 0;
          padding: 0.5rem;
          border: 1px solid #95c066;
          border-radius: 4px;
          background-color: #fff;
          max-width: 500px;
        }
        
        .whats-new-simple-list {
          display: flex;
          flex-direction: column;
        }
        
        .whats-new-simple-item {
          display: flex;
          flex-direction: column;
          padding: 0.25rem 0;
        }
        
        .whats-new-simple-date-title {
          font-size: 0.95rem;
          display: flex;
          align-items: center;
          color: #333;
        }
        
        .whats-new-simple-icon {
          margin-right: 0.5rem;
        }
        
        @media (max-width: 640px) {
          .whats-new-simple-container {
            max-width: 100%;
          }
        }
      `}</style>
    </div>
  );
};

export default WhatsNewSimple;