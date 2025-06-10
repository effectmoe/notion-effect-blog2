// 高度なWebpack設定 - 究極のコード分割とバンドル最適化

const webpack = require('webpack');
const TerserPlugin = require('terser-webpack-plugin');
const CompressionPlugin = require('compression-webpack-plugin');
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
const WorkboxPlugin = require('workbox-webpack-plugin');

module.exports = (nextConfig) => {
  return {
    ...nextConfig,
    webpack: (config, { dev, isServer, webpack }) => {
      // 既存の設定を適用
      if (nextConfig.webpack) {
        config = nextConfig.webpack(config, { dev, isServer, webpack });
      }

      if (!dev && !isServer) {
        // 1. グラニュラーチャンク戦略
        config.optimization.splitChunks = {
          chunks: 'all',
          maxAsyncRequests: 30,
          maxInitialRequests: 25,
          minSize: 20000,
          cacheGroups: {
            // フレームワークコア
            framework: {
              test: /[\\/]node_modules[\\/](react|react-dom|scheduler)[\\/]/,
              name: 'framework',
              priority: 50,
              reuseExistingChunk: true,
            },
            
            // React関連ライブラリ
            reactEcosystem: {
              test: /[\\/]node_modules[\\/](react-.*|@react-.*)[\\/]/,
              name: 'react-ecosystem',
              priority: 45,
            },
            
            // Notion Core（最重要）
            notionCore: {
              test: /[\\/]node_modules[\\/]react-notion-x[\\/](?!.*third-party)/,
              name: 'notion-core',
              priority: 40,
            },
            
            // Notionブロック（タイプ別分割）
            notionBlocks: {
              test: /[\\/]node_modules[\\/]react-notion-x[\\/].*third-party[\\/](.*?)[\\/]/,
              name: (module, chunks, cacheGroupKey) => {
                const match = /third-party[\\/]([^/]+)/.exec(module.identifier());
                const blockType = match ? match[1] : 'misc';
                return `notion-block-${blockType}`;
              },
              priority: 35,
              minSize: 5000,
            },
            
            // 数式・コード関連（重い処理）
            heavyweight: {
              test: /[\\/]node_modules[\\/](katex|prismjs|highlight\.js)[\\/]/,
              name: 'heavyweight-libs',
              priority: 30,
              chunks: 'async', // 非同期のみ
            },
            
            // ユーティリティライブラリ
            utilities: {
              test: /[\\/]node_modules[\\/](lodash|date-fns|uuid)[\\/]/,
              name: (module) => {
                const packageName = module.context.match(/[\\/]node_modules[\\/](.*?)[\\/]/)[1];
                return `utils-${packageName.replace('@', '').replace('/', '-')}`;
              },
              priority: 25,
              minSize: 10000,
            },
            
            // ポリフィル
            polyfills: {
              test: /[\\/]node_modules[\\/](core-js|regenerator-runtime)[\\/]/,
              name: 'polyfills',
              priority: 20,
              chunks: 'initial',
            },
            
            // 共通モジュール
            commons: {
              name: 'commons',
              minChunks: 2,
              priority: 10,
              reuseExistingChunk: true,
              enforce: true,
            },
            
            // デフォルト
            default: {
              minChunks: 2,
              priority: -20,
              reuseExistingChunk: true,
            },
          },
        };

        // 2. 動的インポートの最適化
        config.plugins.push(
          new webpack.optimize.MinChunkSizePlugin({
            minChunkSize: 10000, // 10KB未満のチャンクは結合
          })
        );

        // 3. Prefetch/Preloadの自動設定
        config.plugins.push({
          apply: (compiler) => {
            compiler.hooks.compilation.tap('PrefetchPlugin', (compilation) => {
              compilation.hooks.htmlWebpackPluginAlterAssetTags?.tapAsync(
                'PrefetchPlugin',
                (data, cb) => {
                  // 重要なチャンクにpreloadを追加
                  data.assetTags.scripts.forEach((tag) => {
                    if (tag.attributes.src?.includes('notion-core')) {
                      tag.attributes.rel = 'preload';
                      tag.attributes.as = 'script';
                    }
                  });
                  
                  // 非重要なチャンクにprefetchを追加
                  const prefetchChunks = ['heavyweight-libs', 'notion-block-'];
                  data.assetTags.scripts.forEach((tag) => {
                    if (prefetchChunks.some(chunk => tag.attributes.src?.includes(chunk))) {
                      const prefetchTag = {
                        tagName: 'link',
                        attributes: {
                          rel: 'prefetch',
                          href: tag.attributes.src,
                        },
                      };
                      data.assetTags.meta.push(prefetchTag);
                    }
                  });
                  
                  cb(null, data);
                }
              );
            });
          },
        });

        // 4. 高度な圧縮設定
        config.optimization.minimizer = [
          new TerserPlugin({
            terserOptions: {
              parse: {
                ecma: 2020,
              },
              compress: {
                ecma: 5,
                comparisons: false,
                inline: 2,
                drop_console: true,
                drop_debugger: true,
                pure_funcs: ['console.log', 'console.info'],
                passes: 2,
                // Notion特有の最適化
                pure_getters: true,
                unsafe: true,
                unsafe_comps: true,
                unsafe_Function: true,
                unsafe_math: true,
                unsafe_proto: true,
                unsafe_regexp: true,
                unsafe_undefined: true,
                unused: true,
              },
              mangle: {
                safari10: true,
                // プロパティ名の短縮（注意が必要）
                properties: {
                  regex: /^_/,
                },
              },
              format: {
                ecma: 5,
                comments: false,
                ascii_only: true,
              },
            },
            parallel: true,
            extractComments: false,
          }),
        ];

        // 5. Brotli圧縮
        config.plugins.push(
          new CompressionPlugin({
            filename: '[path][base].br',
            algorithm: 'brotliCompress',
            test: /\.(js|css|html|svg)$/,
            compressionOptions: {
              level: 11,
            },
            threshold: 10240,
            minRatio: 0.8,
          })
        );

        // 6. モジュール連結の最適化
        config.optimization.concatenateModules = true;
        config.optimization.providedExports = true;
        config.optimization.usedExports = true;
        config.optimization.sideEffects = false;

        // 7. カスタムランタイムチャンク
        config.optimization.runtimeChunk = {
          name: (entrypoint) => `runtime-${entrypoint.name}`,
        };

        // 8. バンドル分析（開発時のみ）
        if (process.env.ANALYZE) {
          config.plugins.push(
            new BundleAnalyzerPlugin({
              analyzerMode: 'static',
              reportFilename: './analyze.html',
              generateStatsFile: true,
              statsFilename: './stats.json',
            })
          );
        }

        // 9. Service Worker用のチャンク
        config.plugins.push(
          new WorkboxPlugin.InjectManifest({
            swSrc: './src/sw.js',
            swDest: 'sw.js',
            exclude: [/\.map$/, /^manifest.*\.js$/],
            // 特定のチャンクをプリキャッシュ
            include: [
              /framework.*\.js$/,
              /notion-core.*\.js$/,
              /commons.*\.js$/,
            ],
          })
        );
      }

      // 10. 開発環境での最適化
      if (dev) {
        // 開発時も適度な分割を維持
        config.optimization.splitChunks = {
          chunks: 'all',
          cacheGroups: {
            default: {
              minChunks: 2,
              priority: -20,
              reuseExistingChunk: true,
            },
          },
        };
      }

      return config;
    },
  };
};