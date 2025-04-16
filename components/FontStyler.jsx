// components/FontStyler.jsx
import React, { useEffect, useState } from 'react';
import { generateFontCSS, loadFontSettingsFromLocalStorage } from '../lib/font-customizer/font-utils';
import { fontSettings as defaultSettings } from '../lib/font-customizer/font-settings';

export const FontStyler = () => {
  const [settings, setSettings] = useState(defaultSettings);
  
  useEffect(() => {
    // サーバーサイドレンダリング時には実行しない
    if (typeof window === 'undefined') return;
    
    // 設定を読み込む関数
    const loadSettings = async () => {
      try {
        // 最初にAPIから設定を読み込もうとする
        const response = await fetch('/api/font-settings');
        
        if (response.ok) {
          const data = await response.json();
          setSettings(data);
        } else {
          // APIが失敗したらローカルストレージから読み込む
          const loadedSettings = loadFontSettingsFromLocalStorage();
          if (loadedSettings) {
            setSettings(loadedSettings);
          }
        }
      } catch (error) {
        console.warn('設定の読み込みに失敗しました', error);
        // エラー時はローカルストレージを試す
        try {
          const loadedSettings = loadFontSettingsFromLocalStorage();
          if (loadedSettings) {
            setSettings(loadedSettings);
          }
        } catch (e) {
          console.error('ローカルストレージからの読み込みに失敗しました', e);
        }
      }
    };
    
    loadSettings();
  }, []);
  
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // 既存のスタイルタグを探す
    let styleTag = document.getElementById('custom-font-styles');
    
    // なければ作成
    if (!styleTag) {
      styleTag = document.createElement('style');
      styleTag.id = 'custom-font-styles';
      document.head.appendChild(styleTag);
    }
    
    // CSSを生成して適用
    const css = generateFontCSS(settings);
    styleTag.innerHTML = css;
  }, [settings]);

  return null; // このコンポーネントはUIを持たない
};

export default FontStyler;
