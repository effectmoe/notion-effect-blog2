(function() {
  'use strict';

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

  // 都道府県の完全な名前リスト
  const fullPrefectureNames = {
    '北海道': '北海道',
    '青森': '青森県',
    '岩手': '岩手県',
    '宮城': '宮城県',
    '秋田': '秋田県',
    '山形': '山形県',
    '福島': '福島県',
    '茨城': '茨城県',
    '栃木': '栃木県',
    '群馬': '群馬県',
    '埼玉': '埼玉県',
    '千葉': '千葉県',
    '東京': '東京都',
    '神奈川': '神奈川県',
    '新潟': '新潟県',
    '富山': '富山県',
    '石川': '石川県',
    '福井': '福井県',
    '山梨': '山梨県',
    '長野': '長野県',
    '岐阜': '岐阜県',
    '静岡': '静岡県',
    '愛知': '愛知県',
    '三重': '三重県',
    '滋賀': '滋賀県',
    '京都': '京都府',
    '大阪': '大阪府',
    '兵庫': '兵庫県',
    '奈良': '奈良県',
    '和歌山': '和歌山県',
    '鳥取': '鳥取県',
    '島根': '島根県',
    '岡山': '岡山県',
    '広島': '広島県',
    '山口': '山口県',
    '徳島': '徳島県',
    '香川': '香川県',
    '愛媛': '愛媛県',
    '高知': '高知県',
    '福岡': '福岡県',
    '佐賀': '佐賀県',
    '長崎': '長崎県',
    '熊本': '熊本県',
    '大分': '大分県',
    '宮崎': '宮崎県',
    '鹿児島': '鹿児島県',
    '沖縄': '沖縄県'
  };

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
    `;
    document.head.appendChild(style);
  }

  // 都道府県名を抽出
  function extractPrefectureName(text) {
    if (!text) return null;
    
    // 完全一致をチェック
    for (const [short, full] of Object.entries(fullPrefectureNames)) {
      if (text.includes(full) || text.includes(short)) {
        return short;
      }
    }
    return null;
  }

  // データベースが都道府県リストかどうか判定
  function isPrefectureDatabase(container) {
    // タイトルによる判定
    const title = container.querySelector('.notion-collection-header-title')?.textContent || '';
    const keywords = ['公認インストラクター', 'ナビゲーター', '都道府県', '地域別'];
    if (keywords.some(keyword => title.includes(keyword))) {
      return true;
    }

    // 都道府県名の数による判定
    const items = container.querySelectorAll('.notion-collection-item, .notion-gallery-card');
    let prefectureCount = 0;
    items.forEach(item => {
      const text = item.textContent || '';
      if (extractPrefectureName(text)) {
        prefectureCount++;
      }
    });
    
    return prefectureCount >= 10;
  }

  // 地域別にグループ化
  function groupByRegion(items) {
    const grouped = {};
    regions.forEach(region => {
      grouped[region.name] = [];
    });

    items.forEach(item => {
      const text = item.textContent || '';
      const prefectureName = extractPrefectureName(text);
      
      if (prefectureName) {
        for (const region of regions) {
          if (region.prefectures.includes(prefectureName)) {
            grouped[region.name].push(item);
            break;
          }
        }
      }
    });

    return grouped;
  }

  // 地域別UIを作成
  function createRegionalUI(container, groupedItems) {
    const regionalContainer = document.createElement('div');
    regionalContainer.className = 'prefecture-regional-container';

    regions.forEach(region => {
      const items = groupedItems[region.name];
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
        
        // リンクを保持
        const link = item.querySelector('a');
        if (link) {
          itemDiv.appendChild(link.cloneNode(true));
        } else {
          itemDiv.textContent = item.textContent;
        }
        
        listDiv.appendChild(itemDiv);
      });

      regionDiv.appendChild(listDiv);
      regionalContainer.appendChild(regionDiv);
    });

    return regionalContainer;
  }

  // メイン処理
  function processPrefectureLists() {
    // コレクションビューを探す
    const collections = document.querySelectorAll('.notion-collection-view-body, .notion-gallery-view');
    
    collections.forEach(collection => {
      // 既に処理済みの場合はスキップ
      if (collection.dataset.prefectureProcessed === 'true') return;
      
      // 都道府県データベースかチェック
      if (!isPrefectureDatabase(collection)) return;
      
      // アイテムを取得
      const items = Array.from(collection.querySelectorAll('.notion-collection-item, .notion-gallery-card'));
      if (items.length === 0) return;
      
      // 地域別にグループ化
      const groupedItems = groupByRegion(items);
      
      // UIを作成
      const regionalUI = createRegionalUI(collection, groupedItems);
      
      // 元のコンテンツを置き換え
      collection.innerHTML = '';
      collection.appendChild(regionalUI);
      
      // 処理済みフラグを設定
      collection.dataset.prefectureProcessed = 'true';
    });
  }

  // 初期化
  function initialize() {
    addStyles();
    
    // 初回実行
    setTimeout(() => {
      processPrefectureLists();
    }, 1000);
    
    // 動的な変更を監視
    const observer = new MutationObserver(() => {
      processPrefectureLists();
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