import { useEffect, useState } from 'react';
import styles from './OfflineIndicator.module.css';

export default function OfflineIndicator() {
  const [isOffline, setIsOffline] = useState(false);
  const [showIndicator, setShowIndicator] = useState(false);

  useEffect(() => {
    // 初期状態の確認
    setIsOffline(!navigator.onLine);

    const handleOnline = () => {
      setIsOffline(false);
      // オンラインに戻ったら3秒後にインジケータを非表示
      setTimeout(() => setShowIndicator(false), 3000);
    };

    const handleOffline = () => {
      setIsOffline(true);
      setShowIndicator(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // オフライン時のみ表示を更新
  useEffect(() => {
    if (isOffline) {
      setShowIndicator(true);
    }
  }, [isOffline]);

  if (!showIndicator) return null;

  return (
    <div className={`${styles.indicator} ${!isOffline ? styles.online : ''}`}>
      <div className={styles.content}>
        {isOffline ? (
          <>
            <svg className={styles.icon} viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M1 1l22 22M9 9v2a3 3 0 0 0 5.12 2.12M15 15A3 3 0 0 1 12 18v-6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span>オフラインです</span>
          </>
        ) : (
          <>
            <svg className={styles.icon} viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M5 12.55a11 11 0 0 1 14 0M8.53 16.11a6 6 0 0 1 6.95 0M12 20h.01" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span>オンラインに戻りました</span>
          </>
        )}
      </div>
    </div>
  );
}