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
                
                // Comprehensive database rendering fix
                setTimeout(function() {
                  const fixDbScript = document.createElement('script');
                  fixDbScript.src = '/fix-database-rendering.js';
                  document.body.appendChild(fixDbScript);
                }, 1500);
                
                // Force render grouped lists
                setTimeout(function() {
                  const forceRenderScript = document.createElement('script');
                  forceRenderScript.src = '/force-render-grouped-lists.js';
                  document.body.appendChild(forceRenderScript);
                }, 2000);
                
                // Final FAQ Master fix
                setTimeout(function() {
                  const finalFixScript = document.createElement('script');
                  finalFixScript.src = '/fix-faq-master-final.js';
                  document.body.appendChild(finalFixScript);
                }, 1000);
                
                // Client-side grouping implementation
                setTimeout(function() {
                  const groupingScript = document.createElement('script');
                  groupingScript.src = '/client-side-grouping.js';
                  document.body.appendChild(groupingScript);
                }, 2500);
                
                // グループ化修正スクリプトの最適化された読み込み順序
                // 1. 基本的なグループ修正 (500ms)
                setTimeout(function() {
                  const unifiedFixScript = document.createElement('script');
                  unifiedFixScript.src = '/unified-group-fix.js';
                  unifiedFixScript.async = true;
                  document.body.appendChild(unifiedFixScript);
                }, 500);
                
                // 2. グループレンダリング保証 (1500ms)
                setTimeout(function() {
                  const ensureGroupScript = document.createElement('script');
                  ensureGroupScript.src = '/ensure-group-rendering.js';
                  ensureGroupScript.async = true;
                  document.body.appendChild(ensureGroupScript);
                }, 1500);
                
                // 3. クライアントサイドグループ化 (2500ms) - 既存のまま
                
                // 既存のスクリプトは削除または統合
                // FAQマスター専用修正スクリプト - 削除（unified-group-fix.jsに統合済み）
                // グループ化されたDBをリストビューで表示 - 削除（unified-group-fix.jsに統合済み）
                
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
                }
                
              });
            ` }} />
          </body>
        </Html>
      </IconContext.Provider>
    )
  }
}
