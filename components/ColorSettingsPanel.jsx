// components/ColorSettingsPanel.jsx
import React, { useState, useEffect } from 'react';
import { colorSettings as defaultSettings, colorPresets } from '../lib/color-customizer/color-settings';
import { 
  saveColorSettingsToLocalStorage,
  loadColorSettingsFromLocalStorage,
  clearColorSettingsFromLocalStorage,
  hexToRgba, 
  suggestTextColor 
} from '../lib/color-customizer/color-utils';
import styles from './ColorSettingsPanel.module.css';

const ColorSettingsPanel = () => {
  const [settings, setSettings] = useState(defaultSettings);
  const [activePreset, setActivePreset] = useState('default');
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPreview, setShowPreview] = useState(true);
  const [expandedCategories, setExpandedCategories] = useState({
    basic: true,
    text: true,
    code: true,
    interactive: true,
    database: true,
    properties: true,
    textBackgrounds: true,
    layout: true
  });

  // 設定名の日本語表示
  const settingDisplayNames = {
    page: 'ページ全体',
    header: 'ヘッダー',
    footer: 'フッター',
    sidebar: 'サイドバー',
    pageTitle: 'ページタイトル',
    heading1: '見出し1 (H1)',
    heading2: '見出し2 (H2)',
    heading3: '見出し3 (H3)',
    text: '本文',
    link: 'リンク',
    codeBlock: 'コードブロック',
    inlineCode: 'インラインコード',
    quote: '引用',
    callout: 'コールアウト',
    toggle: 'トグル',
    button: 'ボタン',
    table: 'テーブル',
    listItem: 'リストアイテム',
    galleryCard: 'ギャラリーカード',
    selection: 'テキスト選択',
    propertySelectYellow: 'データベースタグ（黄色）',
    propertySelectBlue: 'データベースタグ（青）',
    propertySelectGreen: 'データベースタグ（緑）',
    propertySelectPink: 'データベースタグ（ピンク）',
    propertySelectGray: 'データベースタグ（グレー）',
    textYellowBackground: 'テキスト背景（黄色）',
    textBlueBackground: 'テキスト背景（青）',
    textPinkBackground: 'テキスト背景（ピンク）',
    textPurpleBackground: 'テキスト背景（紫）',
    textGreenBackground: 'テキスト背景（緑）',
    textGrayBackground: 'テキスト背景（グレー）'
  };

  // カテゴリ分類
  const categories = {
    basic: {
      name: '基本要素',
      icon: '🎨',
      items: ['page', 'header', 'footer', 'sidebar']
    },
    text: {
      name: 'テキスト要素',
      icon: '📝',
      items: ['pageTitle', 'heading1', 'heading2', 'heading3', 'text', 'link']
    },
    code: {
      name: 'コード・引用',
      icon: '💻',
      items: ['codeBlock', 'inlineCode', 'quote']
    },
    interactive: {
      name: 'インタラクティブ要素',
      icon: '🔄',
      items: ['callout', 'toggle', 'button']
    },
    database: {
      name: 'データベース',
      icon: '📊',
      items: ['table', 'listItem', 'galleryCard']
    },
    properties: {
      name: 'データベースのタグ',
      icon: '🏷️',
      items: ['propertySelectYellow', 'propertySelectBlue', 'propertySelectGreen', 'propertySelectPink', 'propertySelectGray']
    },
    textBackgrounds: {
      name: 'テキストの背景色',
      icon: '🎨',
      items: ['textYellowBackground', 'textBlueBackground', 'textPinkBackground', 'textPurpleBackground', 'textGreenBackground', 'textGrayBackground']
    },
    layout: {
      name: 'その他',
      icon: '🎯',
      items: ['selection'],
      description: 'テキスト選択時のハイライト色など'
    }
  };

  // アイコン SVG
  const icons = {
    save: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" />
        <polyline points="17 21 17 13 7 13 7 21" />
        <polyline points="7 3 7 8 15 8" />
      </svg>
    ),
    preview: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    ),
    reset: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polyline points="1 4 1 10 7 10" />
        <polyline points="23 20 23 14 17 14" />
        <path d="M20.49 9A9 9 0 005.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 013.51 15" />
      </svg>
    ),
    export: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
        <polyline points="17 8 12 3 7 8" />
        <line x1="12" y1="3" x2="12" y2="15" />
      </svg>
    ),
    import: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
        <polyline points="7 10 12 15 17 10" />
        <line x1="12" y1="15" x2="12" y2="3" />
      </svg>
    ),
    expand: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polyline points="6 9 12 15 18 9" />
      </svg>
    ),
    collapse: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polyline points="18 15 12 9 6 15" />
      </svg>
    )
  };

  // プリセットを適用
  const applyPreset = (presetKey) => {
    const preset = colorPresets[presetKey];
    if (preset) {
      // デフォルト設定とマージして完全な設定を保証
      const mergedSettings = { ...defaultSettings, ...preset.settings };
      setSettings(mergedSettings);
      setActivePreset(presetKey);
      setSaved(false);
      
      // リアルタイム更新
      const event = new CustomEvent('colorSettingsUpdate', { 
        detail: { settings: mergedSettings } 
      });
      window.dispatchEvent(event);
    }
  };

  // 設定を変更
  const handleColorChange = (elementKey, property, value) => {
    console.log('Changing color:', elementKey, property, value);
    
    const newSettings = {
      ...settings,
      [elementKey]: {
        ...settings[elementKey],
        [property]: value
      }
    };
    
    console.log('New settings:', newSettings);
    
    setSettings(newSettings);
    setSaved(false);
    setActivePreset('custom');
    
    // リアルタイム更新
    const event = new CustomEvent('colorSettingsUpdate', { 
      detail: { settings: newSettings } 
    });
    window.dispatchEvent(event);
  };

  // 設定を保存
  const saveSettings = async () => {
    setLoading(true);
    setError('');
    
    try {
      // まずLocalStorageに保存
      const localSaved = saveColorSettingsToLocalStorage(settings);
      
      // リアルタイムで反映
      const event = new CustomEvent('colorSettingsUpdate', { 
        detail: { settings } 
      });
      window.dispatchEvent(event);
      
      // サーバーに保存を試みる
      try {
        const response = await fetch('/api/color-settings', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(settings),
        });
        
        if (!response.ok) {
          console.error('Server save failed:', response.status);
        }
      } catch (fetchError) {
        console.error('Failed to save to server:', fetchError);
        // サーバー保存に失敗してもローカル保存が成功していれば続行
      }
      
      if (localSaved) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      } else {
        throw new Error('設定の保存に失敗しました');
      }
    } catch (error) {
      setError(error.message);
      console.error('Save error:', error);
    } finally {
      setLoading(false);
    }
  };

  // 設定をリセット
  const resetToDefaults = () => {
    if (window.confirm('すべての色設定をデフォルトに戻しますか？')) {
      setSettings(defaultSettings);
      setActivePreset('default');
      setSaved(false);
      
      const event = new CustomEvent('colorSettingsUpdate', { 
        detail: { settings: defaultSettings } 
      });
      window.dispatchEvent(event);
    }
  };

  // キャッシュをクリア
  const clearCache = () => {
    if (window.confirm('キャッシュされた色設定をクリアしますか？\nページがリロードされます。')) {
      clearColorSettingsFromLocalStorage();
      window.location.reload();
    }
  };

  // エクスポート
  const exportSettings = () => {
    const dataStr = JSON.stringify(settings, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `color-settings-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  // インポート
  const importSettings = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const importedSettings = JSON.parse(e.target.result);
          setSettings(importedSettings);
          setSaved(false);
          setActivePreset('custom');
          
          const updateEvent = new CustomEvent('colorSettingsUpdate', { 
            detail: { settings: importedSettings } 
          });
          window.dispatchEvent(updateEvent);
        } catch (error) {
          setError('無効なJSONファイルです');
        }
      };
      reader.readAsText(file);
    }
  };

  // カテゴリの展開/折りたたみ
  const toggleCategory = (category) => {
    setExpandedCategories({
      ...expandedCategories,
      [category]: !expandedCategories[category]
    });
  };

  // 初期化
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        // まずLocalStorageから読み込み
        const cachedSettings = loadColorSettingsFromLocalStorage();
        if (cachedSettings) {
          console.log('Loading from localStorage:', cachedSettings);
          // デフォルト設定とマージして、欠けているプロパティを補完
          const mergedSettings = { ...defaultSettings };
          Object.keys(cachedSettings).forEach(key => {
            if (mergedSettings[key]) {
              mergedSettings[key] = { ...mergedSettings[key], ...cachedSettings[key] };
            }
          });
          setSettings(mergedSettings);
        } else {
          // サーバーから取得
          try {
            const response = await fetch('/api/color-settings');
            if (response.ok) {
              const data = await response.json();
              console.log('Loading from server:', data);
              // デフォルト設定とマージ
              const mergedSettings = { ...defaultSettings };
              Object.keys(data).forEach(key => {
                if (mergedSettings[key]) {
                  mergedSettings[key] = { ...mergedSettings[key], ...data[key] };
                }
              });
              setSettings(mergedSettings);
            } else {
              // サーバーエラーの場合はデフォルト設定を使用
              console.log('Server error, using default settings');
              setSettings(defaultSettings);
            }
          } catch (fetchError) {
            // ネットワークエラーの場合もデフォルト設定を使用
            console.log('Network error, using default settings');
            setSettings(defaultSettings);
          }
        }
      } catch (error) {
        console.error('設定の読み込みに失敗しました', error);
      }
    };
    
    fetchSettings();
  }, []);

  // カラーピッカー
  const renderColorControl = (elementKey, property, label, value) => {
    const isTransparent = value === 'transparent';
    
    return (
      <div className={styles.colorControl}>
        <label className={styles.colorLabel}>{label}</label>
        <div className={styles.colorInputWrapper}>
          <div 
            className={`${styles.colorSwatch} ${isTransparent ? styles.colorSwatchTransparent : ''}`}
            style={{ backgroundColor: isTransparent ? 'transparent' : value }}
            onClick={() => {
              const input = document.getElementById(`${elementKey}-${property}-picker`);
              input?.click();
            }}
            title={isTransparent ? "クリックして色を選択" : "クリックして色を変更"}
          />
          <input
            type="text"
            className={styles.colorInput}
            value={value}
            onChange={(e) => handleColorChange(elementKey, property, e.target.value)}
            placeholder="#000000"
          />
          <button
            type="button"
            className={`${styles.transparentButton} ${isTransparent ? styles.transparentButtonActive : ''}`}
            onClick={() => handleColorChange(elementKey, property, 'transparent')}
            title="透明に設定"
          >
            透明
          </button>
          <input
            id={`${elementKey}-${property}-picker`}
            type="color"
            value={isTransparent ? '#ffffff' : value}
            onChange={(e) => handleColorChange(elementKey, property, e.target.value)}
            style={{ display: 'none' }}
          />
        </div>
      </div>
    );
  };

  return (
    <div className={styles.container}>
      {/* ヘッダー */}
      <header className={styles.header}>
        <h1 className={styles.title}>カラー設定管理</h1>
        <p className={styles.subtitle}>Notion Effect Blog の配色をカスタマイズ</p>
      </header>

      {/* アラート */}
      {saved && (
        <div className={`${styles.alert} ${styles.alertSuccess} ${styles.fadeIn}`}>
          <span>✓</span>
          <span>設定が正常に保存されました</span>
        </div>
      )}
      
      {error && (
        <div className={`${styles.alert} ${styles.alertError}`}>
          <span>⚠</span>
          <span>{error}</span>
        </div>
      )}

      {/* プリセット選択 */}
      <div className={styles.presetSelector}>
        <h2 style={{ marginBottom: '1rem' }}>カラープリセット</h2>
        <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '1rem' }}>
          プリセットをクリックすると、あらかじめ設定された配色パターンが適用されます。
          適用後も個別に色を調整できます。
        </p>
        <div className={styles.presetGrid}>
          {Object.entries(colorPresets).map(([key, preset]) => (
            <div
              key={key}
              className={`${styles.presetCard} ${activePreset === key ? styles.presetCardActive : ''}`}
              onClick={() => applyPreset(key)}
            >
              <div className={styles.presetName}>{preset.name}</div>
              <div className={styles.presetDescription}>{preset.description}</div>
            </div>
          ))}
          <div
            className={`${styles.presetCard} ${activePreset === 'custom' ? styles.presetCardActive : ''}`}
          >
            <div className={styles.presetName}>カスタム</div>
            <div className={styles.presetDescription}>手動で設定</div>
          </div>
        </div>
      </div>

      {/* 設定セクション */}
      {Object.entries(categories).map(([categoryKey, category]) => (
        <div key={categoryKey} className={styles.categorySection}>
          <h3 
            className={styles.categoryTitle}
            onClick={() => toggleCategory(categoryKey)}
            style={{ cursor: 'pointer' }}
          >
            <span className={styles.categoryIcon}>{category.icon}</span>
            <span>{category.name}</span>
            {category.description && (
              <span style={{ fontSize: '0.75rem', color: '#9ca3af', marginLeft: '0.5rem' }}>
                ({category.description})
              </span>
            )}
            <span style={{ marginLeft: 'auto' }}>
              {expandedCategories[categoryKey] ? icons.collapse : icons.expand}
            </span>
          </h3>
          
          {expandedCategories[categoryKey] && (
            <div className={styles.settingsGrid}>
              {category.items.map(itemKey => {
                const item = settings[itemKey];
                if (!item) {
                  console.warn(`Missing settings for ${itemKey} in category ${categoryKey}`);
                  return null;
                }
                
                return (
                  <div key={itemKey} className={styles.settingItem}>
                    <div className={styles.settingHeader}>
                      <div>
                        <div className={styles.settingName}>{settingDisplayNames[itemKey] || itemKey}</div>
                        <div className={styles.settingInfo}>
                          <span className={styles.settingClass}>クラス: {item.className || `.notion-${itemKey}`}</span>
                          <span className={styles.settingPath}>ファイル: styles/notion.css</span>
                        </div>
                      </div>
                      <div 
                        className={styles.settingPreview}
                        style={{
                          backgroundColor: item.backgroundColor,
                          color: item.textColor === 'inherit' ? '#374151' : item.textColor,
                          borderColor: item.borderColor || item.backgroundColor,
                          border: itemKey.includes('property') ? `1px solid ${item.borderColor || item.backgroundColor}` : undefined,
                          padding: itemKey.includes('property') ? '2px 8px' : (itemKey.includes('textBackground') ? '0.25rem 0.5rem' : '0.5rem 1rem'),
                          borderRadius: itemKey.includes('property') ? '3px' : (itemKey.includes('textBackground') ? '4px' : '6px'),
                          fontSize: itemKey.includes('property') ? '0.75rem' : '0.875rem',
                          fontWeight: itemKey.includes('property') ? '500' : 'normal',
                          lineHeight: itemKey.includes('property') ? '1.2' : '1.5'
                        }}
                      >
                        {itemKey.includes('property') ? 'タグ' : (itemKey.includes('textBackground') ? 'テキスト' : 'サンプル')}
                      </div>
                    </div>
                    
                    <div className={styles.colorControls}>
                      {item.backgroundColor !== undefined && 
                        renderColorControl(itemKey, 'backgroundColor', '背景色', item.backgroundColor)
                      }
                      {item.textColor !== undefined && 
                        renderColorControl(itemKey, 'textColor', 'テキスト色', item.textColor)
                      }
                      {item.borderColor !== undefined && 
                        renderColorControl(itemKey, 'borderColor', 'ボーダー色', item.borderColor)
                      }
                      {item.hoverBackgroundColor !== undefined && 
                        renderColorControl(itemKey, 'hoverBackgroundColor', 'ホバー背景色', item.hoverBackgroundColor)
                      }
                      {item.hoverColor !== undefined && 
                        renderColorControl(itemKey, 'hoverColor', 'ホバー文字色', item.hoverColor)
                      }
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ))}

      {/* ボタン */}
      <div className={styles.buttonGroup}>
        <button 
          className={`${styles.button} ${styles.buttonPrimary}`}
          onClick={saveSettings}
          disabled={loading}
        >
          {loading ? <span className={styles.loading} /> : icons.save}
          <span>設定を保存</span>
        </button>
        
        <button 
          className={`${styles.button} ${styles.buttonSecondary}`}
          onClick={() => setShowPreview(!showPreview)}
        >
          {icons.preview}
          <span>プレビュー{showPreview ? 'を隠す' : 'を表示'}</span>
        </button>
        
        <button 
          className={`${styles.button} ${styles.buttonDanger}`}
          onClick={resetToDefaults}
        >
          {icons.reset}
          <span>デフォルトに戻す</span>
        </button>
        
        <button 
          className={`${styles.button} ${styles.buttonSecondary}`}
          onClick={exportSettings}
          title="現在の色設定をJSONファイルとして保存します"
        >
          {icons.export}
          <span>エクスポート</span>
        </button>
        
        <label className={`${styles.button} ${styles.buttonSecondary}`} title="保存したJSONファイルから色設定を読み込みます">
          {icons.import}
          <span>インポート</span>
          <input
            type="file"
            accept=".json"
            onChange={importSettings}
            style={{ display: 'none' }}
          />
        </label>
        
        <button 
          className={`${styles.button} ${styles.buttonSecondary}`}
          onClick={clearCache}
          title="キャッシュをクリアして問題を解決"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 6h18" />
            <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
            <line x1="10" y1="11" x2="10" y2="17" />
            <line x1="14" y1="11" x2="14" y2="17" />
          </svg>
          <span>キャッシュクリア</span>
        </button>
      </div>

      {/* プレビュー */}
      {showPreview && (
        <div className={`${styles.previewSection} ${styles.fadeIn}`}>
          <div className={styles.previewHeader}>
            <h3 className={styles.previewTitle}>
              {icons.preview}
              <span>ライブプレビュー</span>
            </h3>
            <button
              className={styles.refreshButton}
              onClick={() => {
                const iframe = document.querySelector('iframe[title="Color Preview"]');
                if (iframe) {
                  iframe.src = iframe.src;
                }
              }}
              title="プレビューを更新"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="23 4 23 10 17 10" />
                <polyline points="1 20 1 14 7 14" />
                <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
              </svg>
              <span>更新</span>
            </button>
          </div>
          <div className={styles.previewContent}>
            <div className={styles.previewFrame}>
              <iframe
                src={window.location.origin}
                style={{
                  width: '100%',
                  height: '1200px',
                  border: 'none',
                  borderRadius: '8px'
                }}
                title="Color Preview"
              />
            </div>
            <p style={{ marginTop: '1rem', color: '#6b7280', fontSize: '0.875rem' }}>
              ※ 色の変更はリアルタイムで反映されます
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ColorSettingsPanel;