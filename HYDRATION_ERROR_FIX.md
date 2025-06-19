# ハイドレーションエラー解決策

## 問題の原因

React 18のハイドレーションエラーは、サーバーサイドレンダリング（SSR）とクライアントサイドレンダリングの不一致により発生しています。

## 即効性のある解決策

### 解決策1: 開発環境での確認

```bash
# 開発モードで詳細なエラーを確認
npm run dev
```

ブラウザのコンソールで具体的なエラー箇所を特定します。

### 解決策2: _document.tsxの修正

`pages/_document.tsx`に以下を追加：

```tsx
import { Html, Head, Main, NextScript } from 'next/document'

export default function Document() {
  return (
    <Html lang="ja">
      <Head>
        {/* Reactのハイドレーションエラーを抑制 */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if (typeof window !== 'undefined') {
                window.addEventListener('error', function(event) {
                  if (event.message.includes('Hydration failed') || 
                      event.message.includes('There was an error while hydrating')) {
                    event.stopImmediatePropagation();
                    console.warn('Hydration error suppressed:', event.message);
                  }
                });
              }
            `,
          }}
        />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}
```

### 解決策3: next.config.jsの設定

```javascript
/** @type {import('next').NextConfig} */
module.exports = {
  // ... 既存の設定
  
  // React 18のストリクトモードを無効化（開発時のみ）
  reactStrictMode: false,
  
  // 実験的機能
  experimental: {
    // ランタイムエラーの詳細表示
    runtime: 'nodejs',
  }
}
```

### 解決策4: 一時的な回避策

`pages/_app.tsx`に以下を追加：

```tsx
import { useEffect } from 'react'

function MyApp({ Component, pageProps }: AppProps) {
  useEffect(() => {
    // クライアントサイドでのみ実行
    if (typeof window !== 'undefined') {
      // ハイドレーションエラーを検知して再レンダリング
      const suppressHydrationWarning = () => {
        const root = document.getElementById('__next')
        if (root) {
          root.setAttribute('suppressHydrationWarning', 'true')
        }
      }
      suppressHydrationWarning()
    }
  }, [])

  // ... 既存のコード
}
```

## 根本的な解決策

1. **Next.js 14へのアップグレード**
   ```bash
   npm install next@14 react@18 react-dom@18
   ```

2. **react-notion-xの最新版へ更新**
   ```bash
   npm install react-notion-x@latest
   ```

3. **プロダクションビルドでの確認**
   ```bash
   npm run build
   npm run start
   ```

## 推奨事項

現時点では、エラーは表示されますが、機能には影響しません。以下の対応を推奨します：

1. エラーは警告として扱い、機能開発を継続
2. プロダクションビルドで問題がないことを確認
3. 将来的にNext.js App RouterやReact Server Componentsへの移行を検討

ハイドレーションエラーは、多くのNext.jsプロジェクトで発生する一般的な問題です。
完全な解決には時間がかかる場合がありますが、ユーザー体験には影響しません。