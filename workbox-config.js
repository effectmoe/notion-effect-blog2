module.exports = {
  globDirectory: 'public/',
  globPatterns: [
    '**/*.{html,js,css,png,jpg,jpeg,gif,svg,woff,woff2,ttf,otf,ico}'
  ],
  globIgnores: [
    'sw.js',
    'workbox-*.js',
    '**/node_modules/**/*'
  ],
  swDest: 'public/sw.js',
  swSrc: 'public/sw.js',
  
  // Workbox設定
  runtimeCaching: [
    {
      // Notion API レスポンス
      urlPattern: /^https:\/\/.*\.notion\.so\/.*/i,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'notion-api-cache',
        networkTimeoutSeconds: 3,
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 60 * 60, // 1時間
        },
        cacheableResponse: {
          statuses: [0, 200],
        },
      },
    },
    {
      // 画像
      urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'images-cache',
        expiration: {
          maxEntries: 200,
          maxAgeSeconds: 60 * 60 * 24 * 30, // 30日
          purgeOnQuotaError: true,
        },
      },
    },
    {
      // フォント
      urlPattern: /^https:\/\/fonts\.(?:googleapis|gstatic)\.com\/.*/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'google-fonts-cache',
        expiration: {
          maxEntries: 30,
          maxAgeSeconds: 60 * 60 * 24 * 365, // 1年
        },
      },
    },
    {
      // JS/CSS
      urlPattern: /\.(?:js|css)$/i,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'static-resources',
        expiration: {
          maxEntries: 60,
          maxAgeSeconds: 60 * 60 * 24 * 30, // 30日
        },
      },
    },
  ],
  
  // プリキャッシュマニフェストのカスタマイズ
  manifestTransforms: [
    (manifestEntries, compilation) => {
      // マニフェストエントリーをフィルタリング
      const filtered = manifestEntries.filter(entry => {
        // 大きすぎるファイルは除外
        return entry.size < 5 * 1024 * 1024; // 5MB
      });
      
      return {
        manifest: filtered,
        warnings: [],
      };
    },
  ],
};