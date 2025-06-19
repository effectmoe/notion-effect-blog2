import { NextFederationPlugin } from '@module-federation/nextjs-mf';

const nextConfig = {
  // ... 既存の設定 ...
  
  webpack: (config, options) => {
    const { isServer } = options;
    
    // Module Federation設定
    config.plugins.push(
      new NextFederationPlugin({
        name: 'shell',
        filename: 'static/chunks/remoteEntry.js',
        exposes: {
          './Header': './components/Header',
          './Footer': './components/Footer',
          './SharedComponents': './lib/shared-components',
        },
        remotes: {
          notionRenderer: `notionRenderer@${
            isServer 
              ? 'http://localhost:3001/_next/static/chunks/remoteEntry.js'
              : '/_next/static/chunks/remoteEntry.js'
          }`,
          adminPanel: `adminPanel@${
            isServer
              ? 'http://localhost:3002/_next/static/chunks/remoteEntry.js'
              : '/_next/static/chunks/remoteEntry.js'
          }`,
        },
        shared: {
          react: { singleton: true, requiredVersion: false },
          'react-dom': { singleton: true, requiredVersion: false },
        },
        // 追加の最適化設定
        extraOptions: {
          exposePages: true,
          enableImageLoaderFix: true,
          enableUrlLoaderFix: true,
        },
      })
    );
    
    return config;
  },
};

export default nextConfig;