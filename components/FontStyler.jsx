// components/FontStyler.jsx
import React, { useEffect, useState } from 'react';
import { generateFontCSS, loadFontSettingsFromLocalStorage } from '../lib/font-customizer/font-utils';
import { fontSettings as defaultSettings } from '../lib/font-customizer/font-settings';

export const FontStyler = () => {
  // ハイドレーションエラーを防ぐため、クライアントサイドでのみ動作するようにする
  const [hasMounted, setHasMounted] = useState(false);
  
  useEffect(() => {
    setHasMounted(true);
  }, []);
  
  useEffect(() => {
    if (!hasMounted) return;
    
    // 設定を読み込む関数
    const loadAndApplySettings = async () => {
      let finalSettings = defaultSettings;
      
      try {
        // 最初にAPIから設定を読み込もうとする
        const response = await fetch('/api/font-settings');
        
        if (response.ok) {
          const data = await response.json();
          finalSettings = data;
        } else {
          // APIが失敗したらローカルストレージから読み込む
          const loadedSettings = loadFontSettingsFromLocalStorage();
          if (loadedSettings) {
            finalSettings = loadedSettings;
          }
        }
      } catch (error) {
        console.warn('設定の読み込みに失敗しました', error);
        // エラー時はローカルストレージを試す
        try {
          const loadedSettings = loadFontSettingsFromLocalStorage();
          if (loadedSettings) {
            finalSettings = loadedSettings;
          }
        } catch (e) {
          console.error('ローカルストレージからの読み込みに失敗しました', e);
        }
      }
      
      // 既存のスタイルタグを探す
      let styleTag = document.getElementById('custom-font-styles');
      
      // なければ作成
      if (!styleTag) {
        styleTag = document.createElement('style');
        styleTag.id = 'custom-font-styles';
        document.head.appendChild(styleTag);
      }
      
      // CSSを生成して適用
      const css = generateFontCSS(finalSettings);
      styleTag.innerHTML = css;
    };
    
    loadAndApplySettings();
  }, [hasMounted]);

  return null; // このコンポーネントはUIを持たない
};

export default FontStyler;
