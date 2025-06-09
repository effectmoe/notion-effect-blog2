(function() {
  'use strict';

  console.log('[Prefecture UI] Script loaded v2');

  // 地域の定義
  const regions = [
    {
      name: '北海道',
      prefectures: ['北海道']
    },
    {
      name: '東北',
      prefectures: ['青森', '岩手', '宮城', '秋田', '山形', '福島']
    },
    {
      name: '関東',
      prefectures: ['茨城', '栃木', '群馬', '埼玉', '千葉', '東京', '神奈川']
    },
    {
      name: '中部',
      prefectures: ['新潟', '富山', '石川', '福井', '山梨', '長野', '岐阜', '静岡', '愛知']
    },
    {
      name: '近畿',
      prefectures: ['三重', '滋賀', '京都', '大阪', '兵庫', '奈良', '和歌山']
    },
    {
      name: '中国',
      prefectures: ['鳥取', '島根', '岡山', '広島', '山口']
    },
    {
      name: '四国',
      prefectures: ['徳島', '香川', '愛媛', '高知']
    },
    {
      name: '九州・沖縄',
      prefectures: ['福岡', '佐賀', '長崎', '熊本', '大分', '宮崎', '鹿児島', '沖縄']
    }
  ];

  // すべての都道府県名
  const allPrefectures = regions.flatMap(r => r.prefectures);

  // スタイルを追加
  function addStyles() {
    const styleId = 'prefecture-regional-styles';
    if (document.getElementById(styleId)) return;

    const style = document.createElement('style');
    style.id = styleId;
    style.innerHTML = `
      .prefecture-regional-container {
        margin: 20px 0;
      }
      .prefecture-region {
        margin-bottom: 30px;
      }
      .prefecture-region-title {
        font-size: 1.2em;
        font-weight: bold;
        margin-bottom: 10px;
        padding: 8px 12px;
        background-color: var(--bg-color-1, #f5f5f5);
        border-left: 4px solid var(--fg-color-2, #333);
      }
      .prefecture-list {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
        gap: 10px;
        padding: 10px;
      }
      .prefecture-item {
        padding: 8px 12px;
        background-color: var(--bg-color-0, #fff);
        border: 1px solid var(--bg-color-1, #e0e0e0);
        border-radius: 4px;
        text-align: center;
        transition: all 0.2s ease;
      }
      .prefecture-item:hover {
        background-color: var(--bg-color-1, #f5f5f5);
        border-color: var(--fg-color-2, #333);
      }
      .prefecture-item a {
        text-decoration: none;
        color: var(--fg-color-0, #333);
        display: block;
      }
      /* 元のリストを非表示 */
      .prefecture-original-list {
        display: none !important;
      }
    `;
    document.head.appendChild(style);
  }

  // メイン処理
  function processPrefectureLists() {
    console.log('[Prefecture UI] Processing...');

    // notion-page-linkで都道府県を含むものを探す
    const pageLinks = document.querySelectorAll('.notion-page-link');
    const prefectureElements = Array.from(pageLinks).filter(link => {
      const text = link.textContent || '';
      return allPrefectures.some(pref => text.includes(pref));
    });

    console.log('[Prefecture UI] Found prefecture links:', prefectureElements.length);

    if (prefectureElements.length < 10) {
      console.log('[Prefecture UI] Not enough prefectures found');
      return;
    }

    // 最初の都道府県要素から共通の親要素を探す
    let commonParent = prefectureElements[0];
    while (commonParent && !commonParent.classList.contains('notion-collection-view')) {
      commonParent = commonParent.parentElement;
      if (!commonParent || commonParent === document.body) {
        console.log('[Prefecture UI] Could not find collection parent');
        return;
      }
    }

    // 既に処理済みかチェック
    if (commonParent.dataset.prefectureProcessed === 'true') {
      return;
    }

    console.log('[Prefecture UI] Found collection parent:', commonParent.className);

    // 地域別にグループ化
    const grouped = {};
    regions.forEach(region => {
      grouped[region.name] = [];
    });

    prefectureElements.forEach(element => {
      const text = element.textContent || '';
      const matchedPref = allPrefectures.find(pref => text.includes(pref));
      
      if (matchedPref) {
        for (const region of regions) {
          if (region.prefectures.includes(matchedPref)) {
            // リンク要素を探す
            const link = element.querySelector('a') || element.closest('a');
            if (link) {
              grouped[region.name].push({
                text: text.trim(),
                href: link.href,
                element: element
              });
            }
            break;
          }
        }
      }
    });

    // 地域別UIを作成
    const container = document.createElement('div');
    container.className = 'prefecture-regional-container';

    regions.forEach(region => {
      const items = grouped[region.name];
      if (items.length === 0) return;

      const regionDiv = document.createElement('div');
      regionDiv.className = 'prefecture-region';

      const titleDiv = document.createElement('div');
      titleDiv.className = 'prefecture-region-title';
      titleDiv.textContent = region.name;
      regionDiv.appendChild(titleDiv);

      const listDiv = document.createElement('div');
      listDiv.className = 'prefecture-list';

      items.forEach(item => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'prefecture-item';
        
        const link = document.createElement('a');
        link.href = item.href;
        link.textContent = item.text;
        itemDiv.appendChild(link);
        
        listDiv.appendChild(itemDiv);
      });

      regionDiv.appendChild(listDiv);
      container.appendChild(regionDiv);
    });

    // 元のコレクションビューの後に挿入
    commonParent.parentElement.insertBefore(container, commonParent.nextSibling);
    
    // 元のリストを非表示にする
    commonParent.classList.add('prefecture-original-list');
    
    // 処理済みフラグを設定
    commonParent.dataset.prefectureProcessed = 'true';

    console.log('[Prefecture UI] Successfully created regional view');
  }

  // 初期化
  function initialize() {
    addStyles();
    
    // 少し待ってから実行
    setTimeout(() => {
      processPrefectureLists();
    }, 2000);
    
    // 動的な変更を監視
    let debounceTimer;
    const observer = new MutationObserver(() => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        processPrefectureLists();
      }, 500);
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  // ページ読み込み完了後に実行
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
  } else {
    initialize();
  }

})();