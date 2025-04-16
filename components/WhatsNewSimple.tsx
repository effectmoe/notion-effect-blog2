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
          <Link href={`/${item.slug}`} key={item.id} passHref>
            <div className="whats-new-simple-item" role="button" tabIndex={0}>
              <div className="whats-new-simple-date-title">
                {item.icon && <span className="whats-new-simple-icon">{item.icon}</span>}
                <span>{format(new Date(item.date), 'yyyy.MM.dd', { locale: ja })} | {item.title}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
      
      <style jsx>{`
        .whats-new-simple-container {
          margin: 0;
          padding: 1rem;
          border-radius: 8px;
          background-color: #fcfcfc;
          max-width: 500px;
          box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
          width: 100%;
        }
        
        .whats-new-simple-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        
        .whats-new-simple-item {
          display: flex;
          flex-direction: column;
          padding: 0.5rem;
          border-radius: 6px;
          transition: background-color 0.2s ease;
          cursor: pointer;
          text-decoration: none;
        }
        
        .whats-new-simple-item:hover {
          background-color: rgba(0, 0, 0, 0.02);
        }
        
        .whats-new-simple-date-title {
          font-size: 0.95rem;
          display: flex;
          align-items: center;
          color: #333;
          line-height: 1.5;
          position: relative;
        }
        
        .whats-new-simple-icon {
          margin-right: 0.5rem;
          font-size: 1.1rem;
        }
        
        @media (max-width: 640px) {
          .whats-new-simple-container {
            max-width: 100%;
            padding: 0.75rem;
          }
          
          .whats-new-simple-date-title {
            font-size: 0.9rem;
          }
        }
      `}</style>
    </div>
  );
};

export default WhatsNewSimple;