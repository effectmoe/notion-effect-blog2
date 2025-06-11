import React from 'react';
import Link from 'next/link';

// タブのインターフェース定義
export interface ViewTab {
  id: string;
  name: string;
  path: string;
  pageId: string;
}

interface NotionViewTabsProps {
  tabs?: ViewTab[];
  activeTab?: string;
}

const NotionViewTabs: React.FC<NotionViewTabsProps> = ({ 
  tabs = [], 
  activeTab = 'all'
}) => {
  return (
    <div className="notion-view-tabs">
      {/* タブのコンテンツ（このコンポーネントは実際には使用しないため最小限に） */}
    </div>
  );
};

export default NotionViewTabs;