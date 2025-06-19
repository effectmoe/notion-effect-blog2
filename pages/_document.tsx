import { IconContext } from '@react-icons/all-files'
import Document, { Head, Html, Main, NextScript } from 'next/document'

export default class MyDocument extends Document {
  render() {
    return (
      <IconContext.Provider value={{ style: { verticalAlign: 'middle' } }}>
        <Html lang='en'>
          <Head>
            <link rel='shortcut icon' href='/favicon.ico' />
            <link
              rel='icon'
              type='image/png'
              sizes='32x32'
              href='favicon.png'
            />

            <link rel='manifest' href='/manifest.json' />
            
            {/* フォント最適化: リソースヒント */}
            <link rel='preconnect' href='https://fonts.googleapis.com' />
            <link rel='preconnect' href='https://fonts.gstatic.com' crossOrigin="anonymous" />
            <link rel='dns-prefetch' href='https://fonts.googleapis.com' />
            <link rel='dns-prefetch' href='https://fonts.gstatic.com' />
            
            {/* Notion画像用のリソースヒント */}
            <link rel='dns-prefetch' href='https://www.notion.so' />
            <link rel='dns-prefetch' href='https://images.unsplash.com' />
            
            {/* 基本フォントのプリロード（サブセット版） */}
            <link
              rel='preload'
              as='style'
              href='https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400&display=swap&subset=japanese'
            />
            <link
              rel='stylesheet'
              href='https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400&display=swap&subset=japanese'
            />
            
            {/* Critical fonts inline */}
            <style dangerouslySetInnerHTML={{ __html: `
              /* 初期フォント設定 - システムフォントで即座に表示 */
              @font-face {
                font-family: 'Noto Sans JP';
                font-style: normal;
                font-weight: 400;
                font-display: swap;
                src: local('Noto Sans JP Regular'), local('NotoSansJP-Regular'),
                     local('Noto Sans CJK JP Regular');
                unicode-range: U+3000-303F, U+3040-309F, U+30A0-30FF, U+FF00-FFEF, U+4E00-9FAF;
              }
            ` }} />
            
            {/* グループ化コレクション修正CSS - インラインで追加 */}
            <style dangerouslySetInnerHTML={{ __html: `
              /* グループ要素の強制表示 */
              .notion-collection-group,
              .notion-list-view-group {
                display: block !important;
                visibility: visible !important;
                opacity: 1 !important;
              }
              
              .notion-collection-group-title {
                cursor: pointer;
                user-select: none;
              }
              
              .notion-collection-group-title:hover {
                background-color: var(--bg-color-1, rgba(0, 0, 0, 0.03));
              }
              
              [style*="display: none"] .notion-collection-group {
                display: block !important;
                visibility: visible !important;
                opacity: 1 !important;
              }
            ` }} />
          </Head>

          <body>
            <Main />

            <NextScript />
            {/* Script with custom loading to avoid hydration issues */}
            <script dangerouslySetInnerHTML={{ __html: `
              window.addEventListener('load', function() {
                // Collectionエラーを抑制するスクリプトを遅延ロード
                setTimeout(function() {
                  const errorScript = document.createElement('script');
                  errorScript.src = '/suppress-collection-errors.js';
                  document.head.appendChild(errorScript);
                }, 100);
                setTimeout(function() {
                  const script = document.createElement('script');
                  script.src = '/inject-formula-simple.js';
                  document.body.appendChild(script);
                }, 1000);
                
                // ギャラリービューのスタイリング - 一時的に無効化
                // setTimeout(function() {
                //   const script2 = document.createElement('script');
                //   script2.src = '/style-gallery-view.js';
                //   document.body.appendChild(script2);
                // }, 2000);
                
                // 都道府県リストのグリッド化 - 一時的に無効化
                // setTimeout(function() {
                //   const script2 = document.createElement('script');
                //   script2.src = '/inject-prefecture-grid.js';
                //   document.body.appendChild(script2);
                // }, 1500);
                
                // Force toggle open for galleries
                setTimeout(function() {
                  const script3 = document.createElement('script');
                  script3.src = '/force-toggle-open.js';
                  document.body.appendChild(script3);
                }, 1500);
                
                // 統合データベース修正スクリプト v2（構文エラー修正版）
                setTimeout(function() {
                  const unifiedScript = document.createElement('script');
                  unifiedScript.src = '/unified-database-fix-v2.js';
                  document.body.appendChild(unifiedScript);
                }, 500);
                
                // 強制グループレンダリング
                setTimeout(function() {
                  const forceGroupScript = document.createElement('script');
                  forceGroupScript.src = '/force-group-rendering.js';
                  document.body.appendChild(forceGroupScript);
                }, 1500);
                
                // Unified group fix - 都道府県DBの成功要因を全DBに適用
                setTimeout(function() {
                  const unifiedFixScript = document.createElement('script');
                  unifiedFixScript.src = '/unified-group-fix.js';
                  document.body.appendChild(unifiedFixScript);
                }, 1000);
                
                // 以下の個別スクリプトは統合スクリプトに含まれているため無効化
                /*
                // Comprehensive database rendering fix
                setTimeout(function() {
                  const fixDbScript = document.createElement('script');
                  fixDbScript.src = '/fix-database-rendering.js';
                  document.body.appendChild(fixDbScript);
                }, 1500);
                
                // 以下のスクリプトは汎用グループ化修正スクリプトに統合されました
                // - force-render-grouped-lists.js
                // - fix-faq-master-final.js
                // - client-side-grouping.js
                
                // ========================================
                // 汎用グループ化修正スクリプト v2
                // すべてのグループ化されたデータベースに自動対応
                // ========================================
                // 汎用グループ化修正スクリプト
                setTimeout(function() {
                  const universalGroupFixScript = document.createElement('script');
                  universalGroupFixScript.src = '/universal-group-fix-v2.js';
                  universalGroupFixScript.onload = function() {
                    console.log('[Document] Universal Group Fix v2 スクリプト読み込み完了');
                  };
                  universalGroupFixScript.onerror = function() {
                    console.error('[Document] Universal Group Fix v2 スクリプトの読み込みに失敗');
                  };
                  document.body.appendChild(universalGroupFixScript);
                }, 1000); // タイミングを少し遅らせる
                

                // 既存のグループ化関連スクリプトは汎用スクリプトに統合済み
                // - unified-group-fix.js → 統合済み
                // - ensure-group-rendering.js → 統合済み
                // - fix-faq-master-final.js → 統合済み
                // - client-side-grouping.js → 統合済み

                
                // 都道府県データベースの分析（開発環境のみ）
                if (window.location.hostname === 'localhost') {
                  setTimeout(function() {
                    const analyzeScript = document.createElement('script');
                    analyzeScript.src = '/analyze-prefecture-database.js';
                    document.body.appendChild(analyzeScript);
                  }, 3500);
                  
                  // Runtime recordMap analysis
                  setTimeout(function() {
                    const runtimeAnalysis = document.createElement('script');
                    runtimeAnalysis.src = '/analyze-runtime-recordmap.js';
                    document.body.appendChild(runtimeAnalysis);
                  }, 4000);
                  
                  // FAQ Master debug
                  setTimeout(function() {
                    const faqDebug = document.createElement('script');
                    faqDebug.src = '/debug-faq-master.js';
                    document.body.appendChild(faqDebug);
                  }, 4500);
                  
                  // FAQ Master structure debug
                  setTimeout(function() {
                    const faqStructureDebug = document.createElement('script');
                    faqStructureDebug.src = '/debug-faq-structure.js';
                    document.body.appendChild(faqStructureDebug);
                  }, 5000);
                  
                  // FAQ DOM structure debug
                  setTimeout(function() {
                    const faqDomDebug = document.createElement('script');
                    faqDomDebug.src = '/debug-faq-dom-structure.js';
                    document.body.appendChild(faqDomDebug);
                  }, 5000);
                }
                
                // デバッグツール（開発環境のみ）
                if (window.location.hostname === 'localhost') {
                  setTimeout(function() {
                    const debugScript = document.createElement('script');
                    debugScript.src = '/debug-collection-views.js';
                    document.body.appendChild(debugScript);
                  }, 2500);
                  
                  // Grouped list view debugger
                  setTimeout(function() {
                    const groupedListDebug = document.createElement('script');
                    groupedListDebug.src = '/debug-grouped-lists.js';
                    document.body.appendChild(groupedListDebug);
                  }, 3000);
                  
                  // FAQマスター Block ID Debugger
                  setTimeout(function() {
                    const faqIdDebug = document.createElement('script');
                    faqIdDebug.src = '/debug-faq-master-id.js';
                    document.body.appendChild(faqIdDebug);
                  }, 3500);
                }
                
              });
            ` }} />
          </body>
        </Html>
      </IconContext.Provider>
    )
  }
}
