// SimplifiedSearch.tsx - 簡易検索ナビゲーション
import React, { useState } from 'react';
import Link from 'next/link';
import { IoSearchOutline } from '@react-icons/all-files/io5/IoSearchOutline';
import { IoClose } from '@react-icons/all-files/io5/IoClose';
import cs from 'classnames';

import styles from './SimplifiedSearch.module.css';

// サイト内のページデータ（静的に設定）
const SITE_PAGES = [
  { id: '1ceb802cb0c680f29369dba86095fb38', title: 'ホーム', category: 'メインページ' },
  // カテゴリはここを修正して更新してください
  { id: 'page1', title: 'コーヒーの淹れ方', category: 'コーヒー' },
  { id: 'page2', title: 'エスプレッソの基礎', category: 'コーヒー' },
  { id: 'page3', title: 'おすすめコーヒー豆', category: 'コーヒー' },
  { id: 'page4', title: 'キネシオロジーとは', category: '健康' },
  { id: 'page5', title: '筋反射テスト', category: '健康' },
  { id: 'page6', title: 'セルフヒーリング', category: '健康' },
  { id: 'page7', title: 'カフェメニュー', category: 'カフェ' },
  { id: 'page8', title: '営業時間', category: 'カフェ' },
  { id: 'page9', title: 'アクセス', category: 'カフェ' },
];

// カテゴリーリスト（重複なし）
const CATEGORIES = [...new Set(SITE_PAGES.map(page => page.category))];

interface SimplifiedSearchProps {
  isVisible: boolean;
  onClose: () => void;
}

const SimplifiedSearch: React.FC<SimplifiedSearchProps> = ({ isVisible, onClose }) => {
  const [searchText, setSearchText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // 検索テキストとカテゴリでフィルター
  const filteredPages = SITE_PAGES.filter(page => {
    // カテゴリーフィルター
    if (selectedCategory && page.category !== selectedCategory) {
      return false;
    }
    
    // テキストフィルター（空の場合はすべて表示）
    if (!searchText) return true;
    
    // タイトルに検索テキストが含まれるかどうか
    return page.title.toLowerCase().includes(searchText.toLowerCase());
  });

  return (
    <div className={cs(
      styles.searchOverlay,
      isVisible ? styles.visible : styles.hidden
    )}>
      <div className={styles.searchContainer}>
        <div className={styles.searchHeader}>
          <h2 className={styles.searchTitle}>
            <IoSearchOutline size={20} /> ページ検索
          </h2>
          <button 
            className={styles.closeButton}
            onClick={onClose}
            aria-label="検索を閉じる"
          >
            <IoClose size={24} />
          </button>
        </div>
        
        <div className={styles.searchInputContainer}>
          <input
            type="text"
            placeholder="検索..."
            className={styles.searchInput}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
        </div>
        
        <div className={styles.categorySelector}>
          <button
            className={cs(
              styles.categoryButton,
              selectedCategory === null && styles.activeCategory
            )}
            onClick={() => setSelectedCategory(null)}
          >
            すべて
          </button>
          
          {CATEGORIES.map(category => (
            <button
              key={category}
              className={cs(
                styles.categoryButton,
                selectedCategory === category && styles.activeCategory
              )}
              onClick={() => setSelectedCategory(category)}
            >
              {category}
            </button>
          ))}
        </div>
        
        <div className={styles.resultsContainer}>
          {filteredPages.length > 0 ? (
            <ul className={styles.resultsList}>
              {filteredPages.map(page => (
                <li key={page.id} className={styles.resultItem}>
                  <Link
                    href={`/${page.id}`}
                    className={styles.resultLink}
                    onClick={onClose}
                  >
                    <div className={styles.resultTitle}>{page.title}</div>
                    <div className={styles.resultCategory}>{page.category}</div>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <div className={styles.noResults}>
              検索結果が見つかりませんでした
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SimplifiedSearch;
