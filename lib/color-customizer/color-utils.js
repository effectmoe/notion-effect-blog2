// lib/color-customizer/color-utils.js

/**
 * カラー設定をLocalStorageに保存
 */
export const saveColorSettingsToLocalStorage = (settings) => {
  try {
    localStorage.setItem('colorSettings', JSON.stringify(settings));
    localStorage.setItem('colorSettingsTimestamp', Date.now().toString());
    return true;
  } catch (error) {
    console.error('Failed to save color settings to localStorage:', error);
    return false;
  }
};

/**
 * LocalStorageからカラー設定を読み込み
 */
export const loadColorSettingsFromLocalStorage = () => {
  try {
    const settings = localStorage.getItem('colorSettings');
    const timestamp = localStorage.getItem('colorSettingsTimestamp');
    
    if (settings && timestamp) {
      const age = Date.now() - parseInt(timestamp);
      // 24時間以内ならキャッシュを使用
      if (age < 24 * 60 * 60 * 1000) {
        return JSON.parse(settings);
      }
    }
    return null;
  } catch (error) {
    console.error('Failed to load color settings from localStorage:', error);
    return null;
  }
};

/**
 * カラー設定からCSSを生成
 */
export const generateColorCSS = (settings) => {
  let css = '';
  
  Object.entries(settings).forEach(([key, config]) => {
    if (config.className && config.className !== '::selection') {
      // カンマで区切られた複数のセレクタを処理
      const selectors = config.className.split(',').map(s => s.trim());
      
      selectors.forEach(selector => {
        const rules = [];
        
        if (config.backgroundColor && config.backgroundColor !== 'transparent') {
          rules.push(`background-color: ${config.backgroundColor} !important`);
          // 背景画像もリセット（既存のグラデーションを上書き）
          if (selector.includes('_background')) {
            rules.push(`background-image: none !important`);
          }
        }
        
        if (config.textColor) {
          rules.push(`color: ${config.textColor} !important`);
        }
        
        if (config.borderColor) {
          rules.push(`border-color: ${config.borderColor} !important`);
        }
        
        if (rules.length > 0) {
          css += `${selector} { ${rules.join('; ')}; }\n`;
        }
      });
    
      // ホバー状態
      if (config.hoverBackgroundColor || config.hoverColor) {
        const selectors = config.className.split(',').map(s => s.trim());
        selectors.forEach(selector => {
          const hoverRules = [];
          if (config.hoverBackgroundColor) {
            hoverRules.push(`background-color: ${config.hoverBackgroundColor} !important`);
          }
          if (config.hoverColor) {
            hoverRules.push(`color: ${config.hoverColor} !important`);
          }
          if (hoverRules.length > 0) {
            css += `${selector}:hover { ${hoverRules.join('; ')}; }\n`;
          }
        });
      }
      
      // テーブルヘッダー
      if (key === 'table' && config.headerBackgroundColor) {
        css += `.notion-table-header-cell { background-color: ${config.headerBackgroundColor} !important; }\n`;
      }
    }
  });
  
  // 選択時のスタイル
  if (settings.selection) {
    css += `::selection { background-color: ${settings.selection.backgroundColor} !important; color: ${settings.selection.textColor} !important; }\n`;
    css += `::-moz-selection { background-color: ${settings.selection.backgroundColor} !important; color: ${settings.selection.textColor} !important; }\n`;
  }
  
  return css;
};

/**
 * 16進数カラーをRGBAに変換
 */
export const hexToRgba = (hex, alpha = 1) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? 
    `rgba(${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}, ${alpha})` : 
    hex;
};

/**
 * カラーの明度を計算
 */
export const getColorBrightness = (color) => {
  const hex = color.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  return ((r * 299) + (g * 587) + (b * 114)) / 1000;
};

/**
 * 背景色に対して適切なテキスト色を提案
 */
export const suggestTextColor = (backgroundColor) => {
  const brightness = getColorBrightness(backgroundColor);
  return brightness > 128 ? '#000000' : '#ffffff';
};

/**
 * プリセットを適用
 */
export const applyPreset = (presetName, presets) => {
  const preset = presets[presetName];
  return preset ? preset.settings : null;
};