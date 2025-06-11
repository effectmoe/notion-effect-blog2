/**
 * 既存のヘッダーコンポーネントに検索機能を統合するサンプルコード
 * 
 * このコードを参考に、実際のHeader.tsxやHeaderMenu.tsxに統合してください
 */

import React, { useState, useEffect } from 'react'
import { SearchModal } from './SearchModal'

// 既存のヘッダーコンポーネントに以下を追加

export function HeaderWithSearch() {
  const [isSearchOpen, setIsSearchOpen] = useState(false)

  // キーボードショートカット（Cmd/Ctrl + K）
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setIsSearchOpen(true)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <>
      {/* 既存のヘッダー内容 */}
      <header>
        {/* 他のヘッダー要素 */}
        
        {/* 検索ボタンを追加 */}
        <button
          onClick={() => setIsSearchOpen(true)}
          style={{
            padding: '8px 16px',
            backgroundColor: 'transparent',
            border: '1px solid #ddd',
            borderRadius: '6px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '14px',
            color: '#666'
          }}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          <span>検索</span>
          <kbd style={{
            padding: '2px 4px',
            backgroundColor: '#f0f0f0',
            borderRadius: '3px',
            fontSize: '12px',
            marginLeft: '8px'
          }}>
            {navigator.platform.includes('Mac') ? '⌘' : 'Ctrl'} K
          </kbd>
        </button>
      </header>

      {/* 検索モーダル */}
      <SearchModal 
        isOpen={isSearchOpen} 
        onClose={() => setIsSearchOpen(false)} 
      />
    </>
  )
}

// スタイルの例（CSS Modules使用の場合）
/*
.searchButton {
  padding: 8px 16px;
  background-color: transparent;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: var(--fg-color-secondary);
  transition: all 0.2s;
}

.searchButton:hover {
  background-color: var(--bg-color-hover);
  border-color: var(--primary-color);
}

.searchButton svg {
  width: 16px;
  height: 16px;
}

.searchButton kbd {
  padding: 2px 4px;
  background-color: var(--bg-color-secondary);
  border-radius: 3px;
  font-size: 12px;
  margin-left: 8px;
  font-family: monospace;
}
*/