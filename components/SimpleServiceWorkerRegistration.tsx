import { useEffect } from 'react';

export default function SimpleServiceWorkerRegistration() {
  useEffect(() => {
    if (
      typeof window !== 'undefined' &&
      'serviceWorker' in navigator &&
      window.location.hostname !== 'localhost'
    ) {
      // シンプルなService Workerを登録
      navigator.serviceWorker
        .register('/sw-simple.js')
        .then((registration) => {
          console.log('Service Worker registered successfully:', registration.scope);
          
          // 定期的な更新チェック（1時間ごと）
          setInterval(() => {
            registration.update();
          }, 60 * 60 * 1000);
        })
        .catch((error) => {
          console.error('Service Worker registration failed:', error);
        });

      // Service Workerの更新を監視
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        console.log('Service Worker updated');
      });
    }
  }, []);

  return null;
}