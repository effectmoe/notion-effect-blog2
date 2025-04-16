// components/FontSettingsPanel.jsx
import React, { useState, useEffect } from 'react';
import { fontSettings as defaultSettings } from '../lib/font-customizer/font-settings';
import { saveFontSettingsToLocalStorage } from '../lib/font-customizer/font-utils';

const FontSettingsPanel = () => {
  const [settings, setSettings] = useState(defaultSettings);
  const [activeTab, setActiveTab] = useState('title');
  const [showPreview, setShowPreview] = useState(false);
  const [saved, setSaved] = useState(false);
  const [fontList, setFontList] = useState([
    { name: 'Noto Sans JP', import: "https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;700&display=swap" },
    { name: 'Noto Serif JP', import: "https://fonts.googleapis.com/css2?family=Noto+Serif+JP:wght@400;700&display=swap" },
    { name: 'M PLUS 1p', import: "https://fonts.googleapis.com/css2?family=M+PLUS+1p:wght@400;700&display=swap" },
    { name: 'Kosugi Maru', import: "https://fonts.googleapis.com/css2?family=Kosugi+Maru&display=swap" },
    { name: 'Sawarabi Gothic', import: "https://fonts.googleapis.com/css2?family=Sawarabi+Gothic&display=swap" },
    { name: 'Sawarabi Mincho', import: "https://fonts.googleapis.com/css2?family=Sawarabi+Mincho&display=swap" },
    { name: 'BIZ UDPGothic', import: "https://fonts.googleapis.com/css2?family=BIZ+UDPGothic:wght@400;700&display=swap" },
    { name: 'BIZ UDPMincho', import: "https://fonts.googleapis.com/css2?family=BIZ+UDPMincho&display=swap" },
    { name: 'Shippori Mincho', import: "https://fonts.googleapis.com/css2?family=Shippori+Mincho:wght@400;700&display=swap" },
    { name: 'Zen Maru Gothic', import: "https://fonts.googleapis.com/css2?family=Zen+Maru+Gothic:wght@400;500;700&display=swap" },
    { name: 'Zen Kaku Gothic New', import: "https://fonts.googleapis.com/css2?family=Zen+Kaku+Gothic+New:wght@400;500;700&display=swap" },
    { name: 'Zen Old Mincho', import: "https://fonts.googleapis.com/css2?family=Zen+Old+Mincho:wght@400;500;700&display=swap" },
    { name: 'Yuji Syuku', import: "https://fonts.googleapis.com/css2?family=Yuji+Syuku&display=swap" },
    { name: 'Murecho', import: "https://fonts.googleapis.com/css2?family=Murecho:wght@400;500;700&display=swap" },
  ]);
  const [presets, setPresets] = useState([]);
  const [presetName, setPresetName] = useState('');

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
      // フォントファミリーが変更された場合、対応するimportも更新
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

  // 設定を保存（サーバーとローカルストレージの両方に）
  const saveSettings = async () => {
    try {
      // APIを使ってサーバーに保存
      const response = await fetch('/api/font-settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });
      
      // ローカルストレージにも保存
      saveFontSettingsToLocalStorage(settings);
      
      if (response.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      } else {
        console.warn('サーバーへの保存に失敗しましたが、ローカルには保存されました');
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch (error) {
      console.error('設定の保存に失敗しました', error);
      // サーバー保存に失敗してもローカルには保存できるかもしれない
      const localSaved = saveFontSettingsToLocalStorage(settings);
      if (localSaved) {
        console.log('ローカルストレージには保存されました');
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      } else {
        alert('設定の保存に失敗しました');
      }
    }
  };
  
  // 初期設定に戻す
  const resetToDefault = () => {
    if (confirm('本当に初期設定に戻しますか？')) {
      setSettings(defaultSettings);
      setSaved(false);
    }
  };

  // プレセットを保存
  const saveAsPreset = () => {
    if (!presetName) {
      alert('プリセット名を入力してください');
      return;
    }
    
    const newPreset = {
      name: presetName,
      settings: { ...settings }
    };
    
    const updatedPresets = [...presets, newPreset];
    setPresets(updatedPresets);
    localStorage.setItem('fontPresets', JSON.stringify(updatedPresets));
    setPresetName('');
    
    alert(`プリセット "${presetName}" が保存されました`);
  };

  // プリセットを読み込む
  const loadPreset = (index) => {
    if (confirm('現在の設定を破棄して、プリセットを読み込みますか？')) {
      setSettings({ ...presets[index].settings });
      setSaved(false);
    }
  };

  // プリセットを削除
  const deletePreset = (index) => {
    if (confirm('このプリセットを削除しますか？')) {
      const updatedPresets = [...presets];
      updatedPresets.splice(index, 1);
      setPresets(updatedPresets);
      localStorage.setItem('fontPresets', JSON.stringify(updatedPresets));
    }
  };

  // プレビュー用のスタイル
  const previewStyles = showPreview ? {
    fontFamily: settings[activeTab].fontFamily,
    color: settings[activeTab].color,
    fontSize: settings[activeTab].fontSize,
    fontWeight: settings[activeTab].fontWeight,
    backgroundColor: settings[activeTab].backgroundColor,
    textAlign: settings[activeTab].textAlign,
    letterSpacing: settings[activeTab].letterSpacing,
    lineHeight: settings[activeTab].lineHeight,
    padding: '20px',
    border: '1px solid #e0e0e0',
    borderRadius: '8px',
    maxWidth: '100%',
    marginTop: '20px'
  } : { display: 'none' };

  // プレビューテキストを取得
  const getPreviewText = () => {
    switch(activeTab) {
      case 'title':
        return 'これはタイトルのプレビューです';
      case 'heading1':
        return 'これは見出し1のプレビューです';
      case 'heading2':
        return 'これは見出し2のプレビューです';
      case 'heading3':
        return 'これは見出し3のプレビューです';
      case 'text':
        return 'これは通常テキストのプレビューです。長めの文章を表示すると行間や文字間隔の効果がわかりやすくなります。フォントの美しさは細部にこそ宿ります。';
      case 'toggle':
        return 'これはトグルのプレビューです。クリックして開閉するコンテンツです。';
      case 'toggleHeading1':
        return 'これはトグル見出し1のプレビューです';
      case 'toggleHeading2':
        return 'これはトグル見出し2のプレビューです';
      case 'toggleHeading3':
        return 'これはトグル見出し3のプレビューです';
      default:
        return 'プレビューテキスト';
    }
  };

  // 設定とプリセットを読み込む
  useEffect(() => {
    // サーバーから設定を読み込む
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
    
    // ローカルストレージからプリセットを読み込む
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

  return (
    <div className="font-settings-panel bg-white p-6 rounded-lg shadow-lg max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold text-purple-800 mb-6">Notion-Effect-Blog フォント設定</h2>
      
      {/* タブナビゲーション */}
      <div className="tabs flex flex-wrap gap-1 mb-6 border-b border-gray-200">
        {Object.keys(settings).map(tabName => (
          <button
            key={tabName}
            className={`px-4 py-2 rounded-t-lg ${activeTab === tabName ? 'bg-purple-100 font-bold text-purple-800' : 'bg-gray-100 text-gray-600'}`}
            onClick={() => setActiveTab(tabName)}
          >
            {tabName === 'title' ? 'タイトル' :
             tabName === 'heading1' ? '見出し1' :
             tabName === 'heading2' ? '見出し2' :
             tabName === 'heading3' ? '見出し3' :
             tabName === 'text' ? 'テキスト' :
             tabName === 'toggle' ? 'トグル' :
             tabName === 'toggleHeading1' ? 'トグル見出し1' :
             tabName === 'toggleHeading2' ? 'トグル見出し2' :
             tabName === 'toggleHeading3' ? 'トグル見出し3' : tabName}
          </button>
        ))}
      </div>
      
      <div className="settings-form grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* フォントファミリー */}
        <div className="form-group">
          <label className="block text-sm font-medium text-gray-700 mb-1">フォント</label>
          <select
            className="w-full p-2 border border-gray-300 rounded-md"
            value={settings[activeTab].fontFamily.replace(/'/g, '').replace(/,.+$/, '')}
            onChange={(e) => handleChange('fontFamily', e.target.value)}
          >
            {fontList.map(font => (
              <option key={font.name} value={font.name}>{font.name}</option>
            ))}
          </select>
        </div>
        
        {/* 文字色 */}
        <div className="form-group">
          <label className="block text-sm font-medium text-gray-700 mb-1">文字色</label>
          <div className="flex items-center">
            <input
              type="color"
              className="w-10 h-10 mr-2"
              value={settings[activeTab].color}
              onChange={(e) => handleChange('color', e.target.value)}
            />
            <input
              type="text"
              className="flex-1 p-2 border border-gray-300 rounded-md"
              value={settings[activeTab].color}
              onChange={(e) => handleChange('color', e.target.value)}
            />
          </div>
        </div>
        
        {/* フォントサイズ */}
        <div className="form-group">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            フォントサイズ: {settings[activeTab].fontSize}
          </label>
          <input
            type="text"
            className="w-full p-2 border border-gray-300 rounded-md"
            value={settings[activeTab].fontSize}
            onChange={(e) => handleChange('fontSize', e.target.value)}
          />
          <small className="text-gray-500">例: 1rem, 16px, 2em など</small>
        </div>
        
        {/* フォント太さ */}
        <div className="form-group">
          <label className="block text-sm font-medium text-gray-700 mb-1">フォント太さ</label>
          <select
            className="w-full p-2 border border-gray-300 rounded-md"
            value={settings[activeTab].fontWeight}
            onChange={(e) => handleChange('fontWeight', e.target.value)}
          >
            <option value="100">Thin (100)</option>
            <option value="200">Extra Light (200)</option>
            <option value="300">Light (300)</option>
            <option value="400">Regular (400)</option>
            <option value="500">Medium (500)</option>
            <option value="600">Semi Bold (600)</option>
            <option value="700">Bold (700)</option>
            <option value="800">Extra Bold (800)</option>
            <option value="900">Black (900)</option>
          </select>
        </div>
        
        {/* 背景色 */}
        <div className="form-group">
          <label className="block text-sm font-medium text-gray-700 mb-1">背景色</label>
          <div className="flex items-center">
            <input
              type="color"
              className="w-10 h-10 mr-2"
              value={settings[activeTab].backgroundColor === 'transparent' ? '#ffffff' : settings[activeTab].backgroundColor}
              onChange={(e) => handleChange('backgroundColor', e.target.value)}
            />
            <input
              type="text"
              className="flex-1 p-2 border border-gray-300 rounded-md"
              value={settings[activeTab].backgroundColor}
              onChange={(e) => handleChange('backgroundColor', e.target.value)}
            />
            <button
              className="ml-2 bg-gray-200 text-gray-700 px-2 py-1 rounded text-xs"
              onClick={() => handleChange('backgroundColor', 'transparent')}
            >
              透明
            </button>
          </div>
        </div>
        
        {/* テキスト配置 */}
        <div className="form-group">
          <label className="block text-sm font-medium text-gray-700 mb-1">テキスト配置</label>
          <div className="flex border border-gray-300 rounded-md overflow-hidden">
            <button
              className={`flex-1 py-2 ${settings[activeTab].textAlign === 'left' ? 'bg-purple-100 text-purple-800' : 'bg-white'}`}
              onClick={() => handleChange('textAlign', 'left')}
            >
              左揃え
            </button>
            <button
              className={`flex-1 py-2 ${settings[activeTab].textAlign === 'center' ? 'bg-purple-100 text-purple-800' : 'bg-white'}`}
              onClick={() => handleChange('textAlign', 'center')}
            >
              中央
            </button>
            <button
              className={`flex-1 py-2 ${settings[activeTab].textAlign === 'right' ? 'bg-purple-100 text-purple-800' : 'bg-white'}`}
              onClick={() => handleChange('textAlign', 'right')}
            >
              右揃え
            </button>
          </div>
        </div>
        
        {/* 字間 */}
        <div className="form-group">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            字間: {settings[activeTab].letterSpacing}
          </label>
          <input
            type="text"
            className="w-full p-2 border border-gray-300 rounded-md"
            value={settings[activeTab].letterSpacing}
            onChange={(e) => handleChange('letterSpacing', e.target.value)}
          />
          <small className="text-gray-500">例: 0.05em, 1px など</small>
        </div>
        
        {/* 行間 */}
        <div className="form-group">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            行間: {settings[activeTab].lineHeight}
          </label>
          <input
            type="text"
            className="w-full p-2 border border-gray-300 rounded-md"
            value={settings[activeTab].lineHeight}
            onChange={(e) => handleChange('lineHeight', e.target.value)}
          />
          <small className="text-gray-500">例: 1.5, 2, 24px など</small>
        </div>
      </div>
      
      {/* プレビュートグル */}
      <div className="flex items-center mt-6 mb-4">
        <input
          type="checkbox"
          id="preview-toggle"
          className="mr-2"
          checked={showPreview}
          onChange={() => setShowPreview(!showPreview)}
        />
        <label htmlFor="preview-toggle" className="text-gray-700">プレビューを表示</label>
      </div>
      
      {/* プレビュー領域 */}
      <div className="preview" style={previewStyles}>
        {getPreviewText()}
      </div>
      
      {/* プリセット管理 */}
      <div className="preset-manager mt-8 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold text-purple-700 mb-4">プリセット管理</h3>
        
        {/* プリセット保存フォーム */}
        <div className="flex items-center mb-4">
          <input
            type="text"
            placeholder="プリセット名"
            className="flex-1 p-2 border border-gray-300 rounded-md mr-2"
            value={presetName}
            onChange={(e) => setPresetName(e.target.value)}
          />
          <button
            className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition-colors"
            onClick={saveAsPreset}
          >
            現在の設定を保存
          </button>
        </div>
        
        {/* プリセット一覧 */}
        {presets.length > 0 ? (
          <div className="preset-list grid grid-cols-1 md:grid-cols-2 gap-3">
            {presets.map((preset, index) => (
              <div key={index} className="preset-item p-3 bg-white rounded-md border border-gray-200 flex justify-between items-center">
                <span className="font-medium">{preset.name}</span>
                <div className="flex">
                  <button
                    className="bg-blue-100 text-blue-700 px-3 py-1 rounded-md text-sm mr-2 hover:bg-blue-200"
                    onClick={() => loadPreset(index)}
                  >
                    読込
                  </button>
                  <button
                    className="bg-red-100 text-red-700 px-3 py-1 rounded-md text-sm hover:bg-red-200"
                    onClick={() => deletePreset(index)}
                  >
                    削除
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center">保存されたプリセットはありません</p>
        )}
      </div>
      
      {/* 保存ボタン */}
      <div className="actions mt-6 flex justify-between">
        <button
          className="bg-purple-600 text-white px-6 py-2 rounded-md hover:bg-purple-700 transition-colors"
          onClick={saveSettings}
        >
          設定を保存
        </button>
        <button
          className="bg-gray-200 text-gray-700 px-6 py-2 rounded-md hover:bg-gray-300 transition-colors"
          onClick={resetToDefault}
        >
          初期設定に戻す
        </button>
      </div>
      
      {/* 保存成功メッセージ */}
      {saved && (
        <div className="mt-4 p-3 bg-green-100 text-green-800 rounded-md">
          ✅ 設定が保存されました
        </div>
      )}
      
      {/* 設定をコピーするボタン */}
      <div className="mt-6">
        <button
          className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors"
          onClick={() => {
            const settingsJson = JSON.stringify(settings, null, 2);
            navigator.clipboard.writeText(settingsJson);
            alert('設定JSONがクリップボードにコピーされました。');
          }}
        >
          設定JSONをコピー
        </button>
        <p className="mt-2 text-sm text-gray-600">
          このボタンで生成されたJSONを保存しておくと、後で復元することができます。
        </p>
      </div>
      
      {/* 高度な設定 */}
      <details className="mt-6 p-4 border border-gray-200 rounded-md">
        <summary className="font-medium text-gray-700 cursor-pointer">高度な設定</summary>
        <div className="mt-4">
          <p className="mb-2 text-sm">設定JSONを直接編集（上級ユーザー向け）：</p>
          <textarea
            className="w-full h-48 p-3 border border-gray-300 rounded-md font-mono text-sm"
            value={JSON.stringify(settings, null, 2)}
            onChange={(e) => {
              try {
                const newSettings = JSON.parse(e.target.value);
                setSettings(newSettings);
                setSaved(false);
              } catch (error) {
                console.error('JSONの解析に失敗しました', error);
                // エラー時は何もしない
              }
            }}
          />
        </div>
      </details>
    </div>
  );
};

export default FontSettingsPanel;
