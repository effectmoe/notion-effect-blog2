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
          </Head>

          <body>
            <Main />

            <NextScript />
            {/* Script with custom loading to avoid hydration issues */}
            <script dangerouslySetInnerHTML={{ __html: `
              window.addEventListener('load', function() {
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
              });
            ` }} />
          </body>
        </Html>
      </IconContext.Provider>
    )
  }
}
