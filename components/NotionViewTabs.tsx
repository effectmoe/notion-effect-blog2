import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import styles from './NotionViewTabs.module.css';

// タブの型定義
export type ViewTab = {
  id: string;
  name: string;
  path: string;
  pageId?: string;
};

type NotionViewTabsProps = {
  tabs: ViewTab[];
};

const NotionViewTabs: React.FC<NotionViewTabsProps> = ({ tabs }) => {
  const router = useRouter();

  // 現在のパスが指定されたタブのパスかどうかを判断する
  const isActiveTab = (path: string) => {
    if (path === '/' && router.pathname === '/') {
      return true;
    }
    return router.pathname === path || router.asPath === path;
  };

  return (
    <div className={styles.tabsContainer}>
      <nav className={styles.tabs}>
        <ul className={styles.tabsList}>
          {tabs.map((tab) => (
            <li key={tab.id} className={styles.tabItem}>
              <Link
                href={tab.path}
                className={`${styles.tabLink} ${isActiveTab(tab.path) ? styles.active : ''}`}
                prefetch={false}
              >
                {tab.name}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
};

export default NotionViewTabs;