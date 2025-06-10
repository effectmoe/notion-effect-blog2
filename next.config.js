import bundleAnalyzer from '@next/bundle-analyzer'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true'
})

export default withBundleAnalyzer({
  eslint: {
    ignoreDuringBuilds: true, // ビルド時のESLintエラーを無視
  },
  reactStrictMode: false, // ハイドレーションエラーを軽減
  staticPageGenerationTimeout: 300,
  
  // Service Worker のサポート
  async headers() {
    return [
      {
        source: '/sw.js',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, must-revalidate',
          },
          {
            key: 'Service-Worker-Allowed',
            value: '/',
          },
        ],
      },
    ]
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'www.notion.so' },
      { protocol: 'https', hostname: 'notion.so' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'abs.twimg.com' },
      { protocol: 'https', hostname: 'pbs.twimg.com' },
      { protocol: 'https', hostname: 's3.us-west-2.amazonaws.com' }
    ],
    formats: ['image/avif', 'image/webp'],
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    // 画像最適化の設定
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60 * 60 * 24 * 365, // 1年
  },
  
  // パフォーマンス最適化
  compress: true,
  productionBrowserSourceMaps: false,
  
  // 実験的機能
  experimental: {
    optimizePackageImports: ['react-notion-x', '@react-icons/all-files'],
  },

  webpack: (config, context) => {
    const { dev, isServer } = context
    
    // Workaround for ensuring that `react` and `react-dom` resolve correctly
    // when using a locally-linked version of `react-notion-x`.
    // @see https://github.com/vercel/next.js/issues/50391
    const dirname = path.dirname(fileURLToPath(import.meta.url))
    config.resolve.alias.react = path.resolve(dirname, 'node_modules/react')
    config.resolve.alias['react-dom'] = path.resolve(
      dirname,
      'node_modules/react-dom'
    )
    
    // プロダクションビルドの最適化
    if (!dev && !isServer) {
      // モジュール連結の最適化
      config.optimization.concatenateModules = true
      
      // Tree shakingの強化
      config.optimization.usedExports = true
      config.optimization.sideEffects = false
      
      // React Notion Xの動的インポート設定
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          default: false,
          vendors: false,
          framework: {
            name: 'framework',
            chunks: 'all',
            test: /[\\/]node_modules[\\/](react|react-dom|scheduler|prop-types|use-subscription)[\\/]/,
            priority: 40,
            enforce: true,
          },
          lib: {
            test(module) {
              return module.size() > 160000 &&
                /node_modules[\\/]/.test(module.identifier())
            },
            name(module) {
              const moduleId = module.identifier()
              // Simple hash function without crypto
              let hash = 0
              for (let i = 0; i < moduleId.length; i++) {
                const char = moduleId.charCodeAt(i)
                hash = ((hash << 5) - hash) + char
                hash = hash & hash // Convert to 32bit integer
              }
              return 'lib-' + Math.abs(hash).toString(16).substring(0, 8)
            },
            priority: 30,
            minChunks: 1,
            reuseExistingChunk: true,
          },
          notionx: {
            name: 'notion',
            test: /[\\/]node_modules[\\/]react-notion-x[\\/]/,
            priority: 20,
            reuseExistingChunk: true,
          },
          commons: {
            name: 'commons',
            minChunks: 2,
            priority: 10,
            reuseExistingChunk: true,
          },
        },
        maxAsyncRequests: 30,
        maxInitialRequests: 25,
        minSize: 20000,
      }
    }
    
    // 不要なpolyfillの削除
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
      }
    }
    
    return config
  },

  // See https://react-tweet.vercel.app/next#troubleshooting
  transpilePackages: ['react-tweet']
})
