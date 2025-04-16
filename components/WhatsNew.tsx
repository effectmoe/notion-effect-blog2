import React, { useState } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';

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

type WhatsNewProps = {
  items: WhatsNewItem[];
  max?: number;
  showExcerpt?: boolean;
};

export const WhatsNew: React.FC<WhatsNewProps> = ({ 
  items, 
  max = 5,
  showExcerpt = false
}) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<string | null>(null);
  
  // 日付でソート（新しい順）
  const sortedItems = [...items]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .filter(item => filter ? item.category === filter : true)
    .slice(0, max);
  
  // カテゴリーの一覧を取得
  const categories = Array.from(new Set(items.map(item => item.category).filter(Boolean)));

  return (
    <div className="whats-new-container">
      <div className="whats-new-header">
        <h3 className="whats-new-title">📋 What's New</h3>
        
        {categories.length > 0 && (
          <div className="whats-new-filters">
            <button 
              className={`filter-btn ${filter === null ? 'active' : ''}`}
              onClick={() => setFilter(null)}
            >
              All
            </button>
            {categories.map(category => (
              <button 
                key={category} 
                className={`filter-btn ${filter === category ? 'active' : ''}`}
                onClick={() => setFilter(category)}
              >
                {category}
              </button>
            ))}
          </div>
        )}
      </div>
      
      <motion.div className="whats-new-list">
        <AnimatePresence>
          {sortedItems.map((item) => (
            <motion.div 
              key={item.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="whats-new-item-container"
            >
              <div 
                className={`whats-new-item ${expandedId === item.id ? 'expanded' : ''}`}
                onClick={() => showExcerpt && item.excerpt ? setExpandedId(expandedId === item.id ? null : item.id) : null}
              >
                <div className="whats-new-main">
                  <div className="whats-new-date">
                    {format(new Date(item.date), 'yyyy.MM.dd', { locale: ja })}
                  </div>
                  <div className="whats-new-content">
                    {item.icon && <span className="whats-new-icon">{item.icon}</span>}
                    <span className="whats-new-title-text">{item.title}</span>
                  </div>
                </div>
                
                {showExcerpt && item.excerpt && (
                  <AnimatePresence>
                    {expandedId === item.id && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="whats-new-excerpt"
                      >
                        <p>{item.excerpt}</p>
                        <Link href={`/${item.slug}`} className="read-more">
                          もっと読む →
                        </Link>
                      </motion.div>
                    )}
                  </AnimatePresence>
                )}
                
                {!showExcerpt && (
                  <Link href={`/${item.slug}`} className="whats-new-link">
                    <span className="screen-reader-text">もっと読む</span>
                  </Link>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>
      
      {items.length > max && (
        <div className="whats-new-footer">
          <Link href="/news" className="see-all-button">
            すべて見る →
          </Link>
        </div>
      )}
      
      <style jsx>{`
        .whats-new-container {
          margin: 1.5rem 0;
          background-color: #fcfcfc;
          border-radius: 8px;
          padding: 1.25rem;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
          overflow: hidden;
        }
        
        .whats-new-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
          flex-wrap: wrap;
          gap: 0.5rem;
        }
        
        .whats-new-title {
          font-size: 1.2rem;
          font-weight: 600;
          margin: 0;
          color: #333;
        }
        
        .whats-new-filters {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
        }
        
        .filter-btn {
          background: none;
          border: 1px solid #e2e8f0;
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
          font-size: 0.8rem;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .filter-btn.active {
          background-color: #6366f1;
          color: white;
          border-color: #6366f1;
        }
        
        .whats-new-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        
        .whats-new-item-container {
          overflow: hidden;
        }
        
        .whats-new-item {
          display: flex;
          flex-direction: column;
          cursor: pointer;
          border-radius: 4px;
          transition: all 0.2s;
          position: relative;
        }
        
        .whats-new-main {
          display: flex;
          align-items: baseline;
          padding: 0.5rem;
        }
        
        .whats-new-item:hover {
          background-color: #f5f5f5;
        }
        
        .whats-new-item.expanded {
          background-color: #f8f9fa;
        }
        
        .whats-new-date {
          font-size: 0.9rem;
          color: #666;
          min-width: 6.5rem;
        }
        
        .whats-new-content {
          font-size: 0.95rem;
          display: flex;
          align-items: center;
          gap: 0.25rem;
          flex-grow: 1;
        }
        
        .whats-new-icon {
          margin-right: 0.25rem;
        }
        
        .whats-new-link {
          position: absolute;
          inset: 0;
          z-index: 1;
        }
        
        .screen-reader-text {
          position: absolute;
          width: 1px;
          height: 1px;
          padding: 0;
          margin: -1px;
          overflow: hidden;
          clip: rect(0, 0, 0, 0);
          white-space: nowrap;
          border-width: 0;
        }
        
        .whats-new-excerpt {
          padding: 0 0.5rem 1rem 7rem;
          font-size: 0.9rem;
          color: #4a5568;
          line-height: 1.5;
        }
        
        .read-more {
          display: inline-block;
          margin-top: 0.5rem;
          color: #6366f1;
          font-size: 0.85rem;
          text-decoration: none;
          position: relative;
          z-index: 2;
        }
        
        .whats-new-footer {
          margin-top: 1rem;
          text-align: right;
        }
        
        .see-all-button {
          display: inline-block;
          font-size: 0.9rem;
          color: #6366f1;
          text-decoration: none;
          transition: color 0.2s;
        }
        
        .see-all-button:hover {
          color: #4f46e5;
          text-decoration: underline;
        }
        
        @media (max-width: 640px) {
          .whats-new-main {
            flex-direction: column;
            align-items: flex-start;
            gap: 0.25rem;
          }
          
          .whats-new-excerpt {
            padding: 0 0.5rem 1rem 0.5rem;
          }
        }
      `}</style>
    </div>
  );
};

// シンプルバージョンのWhatsNewコンポーネント
export const WhatsNewSimple: React.FC<WhatsNewProps> = ({ 
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
          margin: 1.5rem 0;
        }
        
        .whats-new-simple-title {
          font-size: 1.2rem;
          font-weight: 600;
          margin-bottom: 0.75rem;
          color: #333;
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
