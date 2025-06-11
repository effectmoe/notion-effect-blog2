import { injectManifest } from 'workbox-build';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function buildSW() {
  try {
    const { count, size, warnings } = await injectManifest({
      swSrc: path.join(__dirname, '../src/sw.js'),
      swDest: path.join(__dirname, '../public/sw.js'),
      globDirectory: path.join(__dirname, '../public'),
      globPatterns: [
        '**/*.{html,js,css,png,jpg,jpeg,gif,svg,woff,woff2,ttf,otf,ico}'
      ],
      maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5MB
    });

    if (warnings.length > 0) {
      console.warn('Warnings encountered while building the service worker:');
      warnings.forEach(warning => console.warn(warning));
    }

    console.log(`Service worker built successfully!`);
    console.log(`${count} files will be precached, totaling ${(size / 1024 / 1024).toFixed(2)} MB.`);
  } catch (error) {
    console.error('Error building service worker:', error);
    process.exit(1);
  }
}

buildSW();