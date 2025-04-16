// lib/font-customizer/font-utils.js
import { fontSettings as defaultSettings } from './font-settings';

// フォント設定からCSSを生成する関数
export function generateFontCSS(settings = defaultSettings) {
  let css = '';
  let fontImports = new Set();
  
  // フォントのインポート部分を抽出
  Object.values(settings).forEach(setting => {
    if (setting.fontImport) {
      fontImports.add(setting.fontImport);
    }
  });
  
  // フォントインポートをCSSに追加
  fontImports.forEach(importUrl => {
    css += `@import url('${importUrl}');\n`;
  });
  
  // 各要素のスタイルを生成
  css += generateElementCSS('.notion-page-title-text', settings.title);
  css += generateElementCSS('.notion-h1', settings.heading1);
  css += generateElementCSS('.notion-h2', settings.heading2);
  css += generateElementCSS('.notion-h3', settings.heading3);
  css += generateElementCSS('.notion-text', settings.text);
  css += generateElementCSS('.notion-toggle', settings.toggle);
  css += generateElementCSS('.notion-toggle.notion-h1', settings.toggleHeading1);
  css += generateElementCSS('.notion-toggle.notion-h2', settings.toggleHeading2);
  css += generateElementCSS('.notion-toggle.notion-h3', settings.toggleHeading3);
  
  return css;
}

// 要素ごとのCSS生成ヘルパー関数
function generateElementCSS(selector, styles) {
  return `
${selector} {
  font-family: ${styles.fontFamily};
  color: ${styles.color};
  font-size: ${styles.fontSize};
  font-weight: ${styles.fontWeight};
  background-color: ${styles.backgroundColor};
  text-align: ${styles.textAlign};
  letter-spacing: ${styles.letterSpacing};
  line-height: ${styles.lineHeight};
}
`;
}

// ローカルストレージからフォント設定を読み込む関数
export function loadFontSettingsFromLocalStorage() {
  try {
    if (typeof window !== 'undefined') {
      const savedSettings = localStorage.getItem('fontSettings');
      if (savedSettings) {
        return JSON.parse(savedSettings);
      }
    }
  } catch (error) {
    console.error('フォント設定の読み込みに失敗しました:', error);
  }
  return defaultSettings;
}

// ローカルストレージにフォント設定を保存する関数
export function saveFontSettingsToLocalStorage(settings) {
  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem('fontSettings', JSON.stringify(settings));
      return true;
    }
  } catch (error) {
    console.error('フォント設定の保存に失敗しました:', error);
  }
  return false;
}
