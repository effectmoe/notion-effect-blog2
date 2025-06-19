// components/FontSettingsPanel.jsx
import React, { useState, useEffect } from 'react';
import { fontSettings as defaultSettings } from '../lib/font-customizer/font-settings';
import { saveFontSettingsToLocalStorage } from '../lib/font-customizer/font-utils';
import styles from './FontSettingsPanel.module.css';

const FontSettingsPanel = () => {
  const [settings, setSettings] = useState(defaultSettings);
  const [activeTab, setActiveTab] = useState('title');
  const [showPreview, setShowPreview] = useState(true);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showColorPicker, setShowColorPicker] = useState({});
  
  const [fontList] = useState([
    // 日本語フォント
    { name: 'Noto Sans JP', import: "https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;700&display=swap", category: 'ゴシック体' },
    { name: 'Noto Serif JP', import: "https://fonts.googleapis.com/css2?family=Noto+Serif+JP:wght@400;700&display=swap", category: '明朝体' },
    { name: 'M PLUS 1p', import: "https://fonts.googleapis.com/css2?family=M+PLUS+1p:wght@400;700&display=swap", category: 'ゴシック体' },
    { name: 'M PLUS Rounded 1c', import: "https://fonts.googleapis.com/css2?family=M+PLUS+Rounded+1c:wght@400;700&display=swap", category: '丸ゴシック' },
    { name: 'Kosugi Maru', import: "https://fonts.googleapis.com/css2?family=Kosugi+Maru&display=swap", category: '丸ゴシック' },
    { name: 'Sawarabi Gothic', import: "https://fonts.googleapis.com/css2?family=Sawarabi+Gothic&display=swap", category: 'ゴシック体' },
    { name: 'Sawarabi Mincho', import: "https://fonts.googleapis.com/css2?family=Sawarabi+Mincho&display=swap", category: '明朝体' },
    { name: 'BIZ UDPGothic', import: "https://fonts.googleapis.com/css2?family=BIZ+UDPGothic:wght@400;700&display=swap", category: 'ゴシック体' },
    { name: 'BIZ UDPMincho', import: "https://fonts.googleapis.com/css2?family=BIZ+UDPMincho&display=swap", category: '明朝体' },
    { name: 'Shippori Mincho', import: "https://fonts.googleapis.com/css2?family=Shippori+Mincho:wght@400;700&display=swap", category: '明朝体' },
    { name: 'Zen Maru Gothic', import: "https://fonts.googleapis.com/css2?family=Zen+Maru+Gothic:wght@400;500;700&display=swap", category: '丸ゴシック' },
    { name: 'Zen Kaku Gothic New', import: "https://fonts.googleapis.com/css2?family=Zen+Kaku+Gothic+New:wght@400;500;700&display=swap", category: 'ゴシック体' },
    { name: 'Zen Old Mincho', import: "https://fonts.googleapis.com/css2?family=Zen+Old+Mincho:wght@400;500;700&display=swap", category: '明朝体' },
    { name: 'Yuji Syuku', import: "https://fonts.googleapis.com/css2?family=Yuji+Syuku&display=swap", category: '手書き風' },
    { name: 'Murecho', import: "https://fonts.googleapis.com/css2?family=Murecho:wght@400;500;700&display=swap", category: 'ゴシック体' },
    { name: 'Klee One', import: "https://fonts.googleapis.com/css2?family=Klee+One:wght@400;600&display=swap", category: '手書き風' },
    { name: 'Kaisei Decol', import: "https://fonts.googleapis.com/css2?family=Kaisei+Decol:wght@400;500;700&display=swap", category: 'デコラティブ' },
    { name: 'Kaisei Tokumin', import: "https://fonts.googleapis.com/css2?family=Kaisei+Tokumin:wght@400;500;700;800&display=swap", category: '明朝体' },
    { name: 'Hina Mincho', import: "https://fonts.googleapis.com/css2?family=Hina+Mincho&display=swap", category: '明朝体' },
    // 英語フォント
    { name: 'Roboto', import: "https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap", category: 'Sans-serif' },
    { name: 'Open Sans', import: "https://fonts.googleapis.com/css2?family=Open+Sans:wght@300;400;600;700&display=swap", category: 'Sans-serif' },
    { name: 'Lato', import: "https://fonts.googleapis.com/css2?family=Lato:wght@300;400;700&display=swap", category: 'Sans-serif' },
    { name: 'Montserrat', import: "https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;600;700&display=swap", category: 'Sans-serif' },
    { name: 'Playfair Display', import: "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&display=swap", category: 'Serif' },
    { name: 'Inter', import: "https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap", category: 'Sans-serif' },
  ]);
  
  const [presets, setPresets] = useState([]);
  const [presetName, setPresetName] = useState('');
  const [showImportExport, setShowImportExport] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [showFontPreview, setShowFontPreview] = useState(false);
  const [selectedFont, setSelectedFont] = useState(null);

  // タブの表示名
  const tabDisplayNames = {
    title: 'タイトル',
    heading1: '見出し1',
    heading2: '見出し2',
    heading3: '見出し3',
    text: 'テキスト',
    toggle: 'トグル',
    toggleHeading1: 'トグル見出し1',
    toggleHeading2: 'トグル見出し2',
    toggleHeading3: 'トグル見出し3'
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
    import: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
        <polyline points="7 10 12 15 17 10" />
        <line x1="12" y1="15" x2="12" y2="3" />
      </svg>
    ),
    export: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
        <polyline points="17 8 12 3 7 8" />
        <line x1="12" y1="3" x2="12" y2="15" />
      </svg>
    ),
    reset: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polyline points="1 4 1 10 7 10" />
        <polyline points="23 20 23 14 17 14" />
        <path d="M20.49 9A9 9 0 005.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 013.51 15" />
      </svg>
    ),
    close: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
      </svg>
    ),
    info: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="16" x2="12" y2="12" />
        <line x1="12" y1="8" x2="12.01" y2="8" />
      </svg>
    )
  };

  // ユーザーの変更を設定に適用
  const handleChange = (property, value) => {
    setSettings({
      ...settings,
      [activeTab]: {
        ...settings[activeTab],
        [property]: value
      }
    });
    
    if (property === 'fontFamily') {
      const selectedFont = fontList.find(font => font.name === value.replace(/'/g, '').replace(/,.+$/, ''));
      if (selectedFont) {
        setSettings({
          ...settings,
          [activeTab]: {
            ...settings[activeTab],
            fontFamily: `'${selectedFont.name}', sans-serif`,
            fontImport: selectedFont.import
          }
        });
      }
    }
    
    setSaved(false);
  };

  // 設定を保存
  const saveSettings = async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch('/api/font-settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });
      
      saveFontSettingsToLocalStorage(settings);
      
      if (response.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      } else {
        throw new Error('サーバーへの保存に失敗しました');
      }
    } catch (error) {
      setError(error.message);
      const localSaved = saveFontSettingsToLocalStorage(settings);
      if (localSaved) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } finally {
      setLoading(false);
    }
  };

  // プリセットを保存
  const savePreset = () => {
    if (!presetName.trim()) return;
    
    const newPreset = {
      name: presetName,
      settings: { ...settings },
      date: new Date().toISOString()
    };
    
    const updatedPresets = [...presets, newPreset];
    setPresets(updatedPresets);
    localStorage.setItem('fontPresets', JSON.stringify(updatedPresets));
    setPresetName('');
  };

  // プリセットを適用
  const applyPreset = (preset) => {
    setSettings(preset.settings);
    setSaved(false);
  };

  // プリセットを削除
  const deletePreset = (index) => {
    const updatedPresets = presets.filter((_, i) => i !== index);
    setPresets(updatedPresets);
    localStorage.setItem('fontPresets', JSON.stringify(updatedPresets));
  };

  // 設定をエクスポート
  const exportSettings = () => {
    const dataStr = JSON.stringify(settings, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `font-settings-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  // 設定をインポート
  const importSettings = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const importedSettings = JSON.parse(e.target.result);
          setSettings(importedSettings);
          setSaved(false);
        } catch (error) {
          setError('無効なJSONファイルです');
        }
      };
      reader.readAsText(file);
    }
  };

  // デフォルトに戻す
  const resetToDefaults = () => {
    setShowResetModal(true);
  };

  const confirmReset = () => {
    setSettings(defaultSettings);
    setSaved(false);
    setShowResetModal(false);
    setError('');
    setTimeout(() => {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }, 100);
  };

  // 初期化
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch('/api/font-settings');
        if (response.ok) {
          const data = await response.json();
          setSettings(data);
        }
      } catch (error) {
        console.error('設定の読み込みに失敗しました', error);
      }
    };
    
    const loadPresets = () => {
      const savedPresets = localStorage.getItem('fontPresets');
      if (savedPresets) {
        try {
          setPresets(JSON.parse(savedPresets));
        } catch (e) {
          console.error('プリセットの読み込みに失敗しました', e);
        }
      }
    };
    
    fetchSettings();
    loadPresets();
  }, []);

  // プレビュー用のスタイルを生成
  const getPreviewStyle = (elementType) => {
    const elementSettings = settings[elementType];
    return {
      fontFamily: elementSettings.fontFamily,
      fontSize: elementSettings.fontSize,
      fontWeight: elementSettings.fontWeight,
      color: elementSettings.color,
      backgroundColor: elementSettings.backgroundColor,
      textAlign: elementSettings.textAlign,
      letterSpacing: elementSettings.letterSpacing,
      lineHeight: elementSettings.lineHeight
    };
  };

  return (
    <div className={styles.container}>
      {/* ヘッダー */}
      <header className={styles.header}>
        <h1 className={styles.title}>フォント設定管理</h1>
        <p className={styles.subtitle}>Notion Effect Blog のフォントをカスタマイズ</p>
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

      {/* タブ */}
      <div className={styles.tabs}>
        {Object.keys(settings).map(tabName => (
          <button
            key={tabName}
            className={`${styles.tab} ${activeTab === tabName ? styles.tabActive : ''}`}
            onClick={() => setActiveTab(tabName)}
          >
            {tabDisplayNames[tabName]}
          </button>
        ))}
      </div>

      {/* 設定フォーム */}
      <div className={styles.content}>
        <div className={styles.settingsGroup}>
          {/* フォントファミリー */}
          <div className={styles.settingItem}>
            <label className={styles.label}>
              フォントファミリー
              <span className={styles.tooltip}>
                <span className={styles.tooltipIcon}>?</span>
                <span className={styles.tooltipText}>使用するフォントを選択</span>
              </span>
            </label>
            <select
              className={styles.select}
              value={settings[activeTab].fontFamily.replace(/'/g, '').replace(/,.+$/, '')}
              onChange={(e) => handleChange('fontFamily', e.target.value)}
            >
              {fontList.map(font => (
                <option key={font.name} value={font.name}>
                  {font.name} ({font.category})
                </option>
              ))}
            </select>
          </div>

          {/* フォントサイズ */}
          <div className={styles.settingItem}>
            <label className={styles.label}>
              フォントサイズ
              <span className={styles.tooltip}>
                <span className={styles.tooltipIcon}>?</span>
                <span className={styles.tooltipText}>px, rem, emなどの単位を使用可能</span>
              </span>
            </label>
            <div className={styles.sliderWrapper}>
              <input
                type="text"
                className={styles.input}
                value={settings[activeTab].fontSize}
                onChange={(e) => handleChange('fontSize', e.target.value)}
                placeholder="例: 16px, 1rem"
              />
            </div>
          </div>

          {/* フォントウェイト */}
          <div className={styles.settingItem}>
            <label className={styles.label}>フォントの太さ</label>
            <select
              className={styles.select}
              value={settings[activeTab].fontWeight}
              onChange={(e) => handleChange('fontWeight', e.target.value)}
            >
              <option value="300">細い (300)</option>
              <option value="400">通常 (400)</option>
              <option value="500">中太 (500)</option>
              <option value="600">やや太い (600)</option>
              <option value="700">太い (700)</option>
              <option value="800">極太 (800)</option>
            </select>
          </div>

          {/* 文字色 */}
          <div className={styles.settingItem}>
            <label className={styles.label}>文字色</label>
            <div className={styles.colorPickerWrapper}>
              <div 
                className={styles.colorSwatch}
                style={{ backgroundColor: settings[activeTab].color }}
                onClick={() => setShowColorPicker({ ...showColorPicker, color: !showColorPicker.color })}
              />
              <input
                type="text"
                className={`${styles.input} ${styles.colorInput}`}
                value={settings[activeTab].color}
                onChange={(e) => handleChange('color', e.target.value)}
                placeholder="#333333"
              />
              {showColorPicker.color && (
                <input
                  type="color"
                  value={settings[activeTab].color}
                  onChange={(e) => handleChange('color', e.target.value)}
                  style={{ position: 'absolute', left: 0, top: '100%', marginTop: '4px' }}
                />
              )}
            </div>
          </div>

          {/* 背景色 */}
          <div className={styles.settingItem}>
            <label className={styles.label}>背景色</label>
            <div className={styles.colorPickerWrapper}>
              <div 
                className={styles.colorSwatch}
                style={{ backgroundColor: settings[activeTab].backgroundColor }}
                onClick={() => setShowColorPicker({ ...showColorPicker, bg: !showColorPicker.bg })}
              />
              <input
                type="text"
                className={`${styles.input} ${styles.colorInput}`}
                value={settings[activeTab].backgroundColor}
                onChange={(e) => handleChange('backgroundColor', e.target.value)}
                placeholder="transparent"
              />
              {showColorPicker.bg && (
                <input
                  type="color"
                  value={settings[activeTab].backgroundColor === 'transparent' ? '#ffffff' : settings[activeTab].backgroundColor}
                  onChange={(e) => handleChange('backgroundColor', e.target.value)}
                  style={{ position: 'absolute', left: 0, top: '100%', marginTop: '4px' }}
                />
              )}
            </div>
          </div>

          {/* テキスト配置 */}
          <div className={styles.settingItem}>
            <label className={styles.label}>テキスト配置</label>
            <select
              className={styles.select}
              value={settings[activeTab].textAlign}
              onChange={(e) => handleChange('textAlign', e.target.value)}
            >
              <option value="left">左揃え</option>
              <option value="center">中央</option>
              <option value="right">右揃え</option>
              <option value="justify">両端揃え</option>
            </select>
          </div>

          {/* 文字間隔 */}
          <div className={styles.settingItem}>
            <label className={styles.label}>
              文字間隔
              <span className={styles.tooltip}>
                <span className={styles.tooltipIcon}>?</span>
                <span className={styles.tooltipText}>文字と文字の間隔（例: 0.05em）</span>
              </span>
            </label>
            <input
              type="text"
              className={styles.input}
              value={settings[activeTab].letterSpacing}
              onChange={(e) => handleChange('letterSpacing', e.target.value)}
              placeholder="例: 0.05em"
            />
          </div>

          {/* 行間 */}
          <div className={styles.settingItem}>
            <label className={styles.label}>
              行間
              <span className={styles.tooltip}>
                <span className={styles.tooltipIcon}>?</span>
                <span className={styles.tooltipText}>行の高さの倍率（例: 1.5）</span>
              </span>
            </label>
            <input
              type="text"
              className={styles.input}
              value={settings[activeTab].lineHeight}
              onChange={(e) => handleChange('lineHeight', e.target.value)}
              placeholder="例: 1.5"
            />
          </div>
        </div>

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
        </div>
      </div>

      {/* プレビュー */}
      {showPreview && (
        <div className={`${styles.previewSection} ${styles.fadeIn}`}>
          <h3 className={styles.previewTitle}>
            {icons.preview}
            <span>プレビュー</span>
          </h3>
          <div className={styles.previewContent}>
            <h1 style={getPreviewStyle('title')} className={styles.previewText}>
              サンプルタイトル
            </h1>
            <h2 style={getPreviewStyle('heading1')} className={styles.previewText}>
              見出し1のサンプル
            </h2>
            <h3 style={getPreviewStyle('heading2')} className={styles.previewText}>
              見出し2のサンプル
            </h3>
            <h4 style={getPreviewStyle('heading3')} className={styles.previewText}>
              見出し3のサンプル
            </h4>
            <p style={getPreviewStyle('text')} className={styles.previewText}>
              本文のサンプルテキストです。日本語の文章がどのように表示されるかを確認できます。
              フォントの読みやすさ、文字間隔、行間などを調整して、最適な設定を見つけてください。
            </p>
          </div>
        </div>
      )}

      {/* プリセット管理 */}
      <div className={styles.presetSection}>
        <h3 className={styles.presetTitle}>プリセット管理</h3>
        
        <div className={styles.presetGrid}>
          <div className={styles.presetItem}>
            <input
              type="text"
              className={`${styles.input} ${styles.presetInput}`}
              placeholder="プリセット名"
              value={presetName}
              onChange={(e) => setPresetName(e.target.value)}
            />
            <button 
              className={`${styles.button} ${styles.buttonSecondary}`}
              onClick={savePreset}
              disabled={!presetName.trim()}
            >
              保存
            </button>
          </div>
        </div>

        {presets.length > 0 && (
          <div className={styles.presetGrid} style={{ marginTop: '1rem' }}>
            {presets.map((preset, index) => (
              <div key={index} className={styles.presetItem}>
                <button
                  className={`${styles.button} ${styles.buttonSecondary}`}
                  onClick={() => applyPreset(preset)}
                  style={{ flex: 1 }}
                >
                  {preset.name}
                </button>
                <button
                  className={`${styles.button} ${styles.buttonDanger}`}
                  onClick={() => deletePreset(index)}
                >
                  削除
                </button>
              </div>
            ))}
          </div>
        )}

        <div className={styles.buttonGroup} style={{ marginTop: '1rem' }}>
          <button 
            className={`${styles.button} ${styles.buttonSecondary}`}
            onClick={() => setShowImportExport(true)}
          >
            {icons.import}
            <span>インポート / エクスポート</span>
          </button>
        </div>
      </div>

      {/* リセット確認モーダル */}
      {showResetModal && (
        <div className={styles.modal} onClick={() => setShowResetModal(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>設定のリセット</h3>
              <button 
                className={styles.modalClose}
                onClick={() => setShowResetModal(false)}
              >
                {icons.close}
              </button>
            </div>
            <p style={{ marginBottom: '1.5rem' }}>
              すべてのフォント設定をデフォルトに戻します。この操作は取り消せません。
            </p>
            <div className={styles.buttonGroup}>
              <button 
                className={`${styles.button} ${styles.buttonDanger}`}
                onClick={confirmReset}
              >
                リセットする
              </button>
              <button 
                className={`${styles.button} ${styles.buttonSecondary}`}
                onClick={() => setShowResetModal(false)}
              >
                キャンセル
              </button>
            </div>
          </div>
        </div>
      )}

      {/* インポート/エクスポートモーダル */}
      {showImportExport && (
        <div className={styles.modal} onClick={() => setShowImportExport(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>設定のインポート / エクスポート</h3>
              <button 
                className={styles.modalClose}
                onClick={() => setShowImportExport(false)}
              >
                {icons.close}
              </button>
            </div>
            
            <div style={{ marginBottom: '2rem' }}>
              <h4 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {icons.export}
                設定をエクスポート
              </h4>
              <p style={{ marginBottom: '1rem', color: '#6b7280' }}>
                現在のフォント設定をJSONファイルとしてダウンロードします。
              </p>
              <button 
                className={`${styles.button} ${styles.buttonPrimary}`}
                onClick={() => {
                  exportSettings();
                  setShowImportExport(false);
                }}
              >
                {icons.export}
                <span>エクスポート</span>
              </button>
            </div>
            
            <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '2rem' }}>
              <h4 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {icons.import}
                設定をインポート
              </h4>
              <p style={{ marginBottom: '1rem', color: '#6b7280' }}>
                以前エクスポートした設定ファイルを読み込みます。
              </p>
              <label className={`${styles.button} ${styles.buttonPrimary}`}>
                {icons.import}
                <span>ファイルを選択</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={(e) => {
                    importSettings(e);
                    setShowImportExport(false);
                  }}
                  style={{ display: 'none' }}
                />
              </label>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FontSettingsPanel;