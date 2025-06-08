// components/ColorSettingsPanel.jsx
import React, { useState, useEffect } from 'react';
import { colorSettings as defaultSettings, colorPresets } from '../lib/color-customizer/color-settings';
import { 
  saveColorSettingsToLocalStorage, 
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
    propertySelectGray: 'データベースタグ（グレー）'
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
    layout: {
      name: 'その他',
      icon: '🎯',
      items: ['selection']
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
      setSettings(preset.settings);
      setActivePreset(presetKey);
      setSaved(false);
      
      // リアルタイム更新
      const event = new CustomEvent('colorSettingsUpdate', { 
        detail: { settings: preset.settings } 
      });
      window.dispatchEvent(event);
    }
  };

  // 設定を変更
  const handleColorChange = (elementKey, property, value) => {
    const newSettings = {
      ...settings,
      [elementKey]: {
        ...settings[elementKey],
        [property]: value
      }
    };
    
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
        const response = await fetch('/api/color-settings');
        if (response.ok) {
          const data = await response.json();
          setSettings(data);
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
              if (!isTransparent) {
                const input = document.getElementById(`${elementKey}-${property}-picker`);
                input?.click();
              }
            }}
          />
          <input
            type="text"
            className={styles.colorInput}
            value={value}
            onChange={(e) => handleColorChange(elementKey, property, e.target.value)}
            placeholder="#000000"
          />
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
            <span style={{ marginLeft: 'auto' }}>
              {expandedCategories[categoryKey] ? icons.collapse : icons.expand}
            </span>
          </h3>
          
          {expandedCategories[categoryKey] && (
            <div className={styles.settingsGrid}>
              {category.items.map(itemKey => {
                const item = settings[itemKey];
                if (!item) return null;
                
                return (
                  <div key={itemKey} className={styles.settingItem}>
                    <div className={styles.settingHeader}>
                      <div className={styles.settingName}>{settingDisplayNames[itemKey] || itemKey}</div>
                      <div 
                        className={styles.settingPreview}
                        style={{
                          backgroundColor: item.backgroundColor,
                          color: item.textColor,
                          borderColor: item.borderColor || item.backgroundColor,
                          border: itemKey.includes('property') ? `1px solid ${item.borderColor || item.backgroundColor}` : undefined,
                          padding: itemKey.includes('property') ? '2px 8px' : '0.5rem 1rem',
                          borderRadius: itemKey.includes('property') ? '3px' : '6px',
                          fontSize: itemKey.includes('property') ? '0.75rem' : '0.875rem',
                          fontWeight: itemKey.includes('property') ? '500' : 'normal',
                          lineHeight: itemKey.includes('property') ? '1.2' : '1.5'
                        }}
                      >
                        {itemKey.includes('property') ? '見出し2' : 'サンプル'}
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
        >
          {icons.export}
          <span>エクスポート</span>
        </button>
        
        <label className={`${styles.button} ${styles.buttonSecondary}`}>
          {icons.import}
          <span>インポート</span>
          <input
            type="file"
            accept=".json"
            onChange={importSettings}
            style={{ display: 'none' }}
          />
        </label>
      </div>

      {/* プレビュー */}
      {showPreview && (
        <div className={`${styles.previewSection} ${styles.fadeIn}`}>
          <h3 className={styles.previewTitle}>
            {icons.preview}
            <span>ライブプレビュー</span>
          </h3>
          <div className={styles.previewContent}>
            <div className={styles.previewFrame}>
              <iframe
                src={window.location.origin}
                style={{
                  width: '100%',
                  height: '600px',
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