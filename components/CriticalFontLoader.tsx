import React, { useEffect, useState } from 'react';
import FontFaceObserver from 'fontfaceobserver';
import { FONT_LOADING_STAGES, type FontLoadingStage } from '@/lib/font-subset';

interface CriticalFontLoaderProps {
  children: React.ReactNode;
}

export const CriticalFontLoader: React.FC<CriticalFontLoaderProps> = ({ children }) => {
  const [fontStage, setFontStage] = useState<FontLoadingStage>(FONT_LOADING_STAGES.SYSTEM);

  useEffect(() => {
    const loadFonts = async () => {
      try {
        // ステージ2: 基本ウェイト(400)のみ読み込み
        const fontBasic = new FontFaceObserver('Noto Sans JP', {
          weight: 400
        });

        await fontBasic.load(null, 5000); // 5秒タイムアウト
        setFontStage(FONT_LOADING_STAGES.BASIC);
        document.documentElement.classList.add('fonts-stage-basic');

        // ステージ3: 追加ウェイト(300, 700)を非同期で読み込み
        const loadAdditionalWeights = async () => {
          const fontLight = new FontFaceObserver('Noto Sans JP', {
            weight: 300
          });
          const fontBold = new FontFaceObserver('Noto Sans JP', {
            weight: 700
          });

          await Promise.all([
            fontLight.load(null, 10000),
            fontBold.load(null, 10000)
          ]);

          setFontStage(FONT_LOADING_STAGES.COMPLETE);
          document.documentElement.classList.remove('fonts-stage-basic');
          document.documentElement.classList.add('fonts-stage-complete');
        };

        // requestIdleCallbackで非優先処理として実行
        if ('requestIdleCallback' in window) {
          window.requestIdleCallback(() => {
            loadAdditionalWeights();
          });
        } else {
          // フォールバック: 100ms後に実行
          setTimeout(loadAdditionalWeights, 100);
        }
      } catch (error) {
        console.warn('Font loading failed:', error);
        // フォント読み込みに失敗してもシステムフォントで表示を続ける
        document.documentElement.classList.add('fonts-fallback');
      }
    };

    loadFonts();
  }, []);

  return (
    <>
      <style jsx global>{`
        /* ステージ1: システムフォントで即座に表示 */
        :root {
          --font-family-base: -apple-system, BlinkMacSystemFont, "Segoe UI", "Hiragino Sans", 
                              "Hiragino Kaku Gothic ProN", "Noto Sans JP", Meiryo, sans-serif;
          --font-family-heading: var(--font-family-base);
        }

        /* フォント読み込み中の調整 */
        html:not(.fonts-stage-basic):not(.fonts-stage-complete) {
          font-synthesis: none;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }

        /* ステージ2: 基本フォントが読み込まれた */
        html.fonts-stage-basic {
          --font-family-base: "Noto Sans JP", -apple-system, BlinkMacSystemFont, 
                              "Segoe UI", "Hiragino Sans", sans-serif;
        }

        /* ステージ3: 全てのウェイトが読み込まれた */
        html.fonts-stage-complete {
          --font-family-base: "Noto Sans JP", -apple-system, BlinkMacSystemFont, 
                              "Segoe UI", "Hiragino Sans", sans-serif;
          --font-family-heading: var(--font-family-base);
        }

        /* フォント切り替え時のスムーズなトランジション */
        body, h1, h2, h3, h4, h5, h6, p, span, div {
          font-family: var(--font-family-base);
          transition: font-weight 0.3s ease-out;
        }

        /* フォールバック時の調整 */
        html.fonts-fallback {
          letter-spacing: -0.02em;
        }

        /* Notion コンテンツ用のフォント設定 */
        .notion-text {
          font-family: var(--font-family-base) !important;
        }

        .notion-h1, .notion-h2, .notion-h3 {
          font-family: var(--font-family-heading) !important;
        }

        /* フォント読み込み状態インジケーター（開発時のみ） */
        ${process.env.NODE_ENV === 'development' ? `
          body::before {
            content: "Font: " attr(data-font-stage);
            position: fixed;
            top: 0;
            right: 0;
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 4px 8px;
            font-size: 12px;
            z-index: 9999;
            pointer-events: none;
          }
        ` : ''}
      `}</style>
      {process.env.NODE_ENV === 'development' && (
        <script
          dangerouslySetInnerHTML={{
            __html: `document.body.setAttribute('data-font-stage', '${fontStage}');`
          }}
        />
      )}
      {children}
    </>
  );
};

export default CriticalFontLoader;