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
      <h3 className="whats-new-simple-title">📋 What's New</h3>
      <div className="whats-new-simple-list">
        {sortedItems.map((item) => (
          <Link href={`/${item.slug}`} key={item.id} className="whats-new-simple-item">
            <div className="whats-new-simple-date">
              {format(new Date(item.date), 'yyyy.MM.dd', { locale: ja })}
            </div>
            <div className="whats-new-simple-content">
              {item.icon && <span className="whats-new-simple-icon">{item.icon}</span>}
              {item.title}
            </div>
          </Link>
        ))}
      </div>
      
      <style jsx>{`
        .whats-new-simple-container {
<<<<<<< HEAD
          margin: 0;
          padding: 0.5rem;
          border-radius: 4px;
          background-color: #fcfcfc;
          max-width: 500px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
=======
          margin: 1.5rem 0;
          background-color: #fcfcfc;
          border-radius: 8px;
          padding: 1rem;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
        }
        
        .whats-new-simple-title {
          font-size: 1.2rem;
          font-weight: 600;
          margin-bottom: 0.75rem;
          color: #333;
>>>>>>> parent of f0db49e (1)
        }
        
        .whats-new-simple-list {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        
        .whats-new-simple-item {
          display: flex;
          align-items: baseline;
          text-decoration: none;
          color: inherit;
          transition: color 0.2s;
          padding: 0.25rem 0;
        }
        
        .whats-new-simple-item:hover {
          color: #6366f1;
        }
        
        .whats-new-simple-date {
          font-size: 0.9rem;
          color: #666;
          min-width: 6.5rem;
        }
        
        .whats-new-simple-content {
          font-size: 0.95rem;
          display: flex;
          align-items: center;
          gap: 0.25rem;
        }
        
        .whats-new-simple-icon {
          margin-right: 0.25rem;
        }
        
        @media (max-width: 640px) {
          .whats-new-simple-item {
            flex-direction: column;
            gap: 0.25rem;
          }
          
          .whats-new-simple-date {
            min-width: auto;
          }
        }
      `}</style>
    </div>
  );
};

export default WhatsNewSimple;
