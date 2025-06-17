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
                
                // Fix grouped list views
                setTimeout(function() {
                  const fixScript = document.createElement('script');
                  fixScript.src = '/fix-grouped-lists.js';
                  document.body.appendChild(fixScript);
                }, 2000);
                
                // Universal database view fix - 一時的に無効化
                /*
                setTimeout(function() {
                  const dbFixScript = document.createElement('script');
                  dbFixScript.src = '/fix-database-views.js';
                  document.body.appendChild(dbFixScript);
                }, 2500);
                */
                
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
