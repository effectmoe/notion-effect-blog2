// components/ColorStyler.jsx
import { useEffect, useState } from 'react';
import { 
  loadColorSettingsFromLocalStorage, 
  saveColorSettingsToLocalStorage,
  generateColorCSS 
} from '../lib/color-customizer/color-utils';
import { colorSettings as defaultSettings } from '../lib/color-customizer/color-settings';

const ColorStyler = () => {
  const [settings, setSettings] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        // LocalStorageから読み込み
        const cachedSettings = loadColorSettingsFromLocalStorage();
        
        if (cachedSettings) {
          setSettings(cachedSettings);
          applyStyles(cachedSettings);
        } else {
          // サーバーから取得
          try {
            const response = await fetch('/api/color-settings');
            if (response.ok) {
              const data = await response.json();
              setSettings(data);
              saveColorSettingsToLocalStorage(data);
              applyStyles(data);
            } else {
              // デフォルト設定を使用
              setSettings(defaultSettings);
              applyStyles(defaultSettings);
            }
          } catch (error) {
            console.error('Failed to fetch color settings:', error);
            setSettings(defaultSettings);
            applyStyles(defaultSettings);
          }
        }
      } finally {
        setIsLoading(false);
      }
    };

    // クライアントサイドでのみ実行
    if (typeof window !== 'undefined') {
      loadSettings();
    }
  }, []);

  const applyStyles = (colorSettings) => {
    // 既存のスタイルタグを削除
    const existingStyle = document.getElementById('color-styles');
    if (existingStyle) {
      existingStyle.remove();
    }

    // CSSを生成
    const css = generateColorCSS(colorSettings);

    // スタイルタグを作成して追加
    const styleTag = document.createElement('style');
    styleTag.id = 'color-styles';
    styleTag.innerHTML = css;
    document.head.appendChild(styleTag);
  };

  // リアルタイム更新のためのイベントリスナー
  useEffect(() => {
    const handleColorUpdate = (event) => {
      if (event.detail && event.detail.settings) {
        setSettings(event.detail.settings);
        saveColorSettingsToLocalStorage(event.detail.settings);
        applyStyles(event.detail.settings);
      }
    };

    window.addEventListener('colorSettingsUpdate', handleColorUpdate);
    
    return () => {
      window.removeEventListener('colorSettingsUpdate', handleColorUpdate);
    };
  }, []);

  return null;
};

export default ColorStyler;