import React, { useEffect } from 'react';
import { onCLS, onFCP, onFID, onLCP, onTTFB, onINP } from 'web-vitals';

interface PerformanceMonitorProps {
  enabled?: boolean;
  onReport?: (metrics: any) => void;
}

export const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({
  enabled = process.env.NODE_ENV === 'development',
  onReport
}) => {
  useEffect(() => {
    if (!enabled) return;

    const metrics: any = {};

    // Core Web Vitalsの測定
    onCLS((metric) => {
      metrics.CLS = metric;
      console.log('CLS:', metric);
      onReport?.(metrics);
    });

    onFCP((metric) => {
      metrics.FCP = metric;
      console.log('FCP:', metric);
      onReport?.(metrics);
    });

    onFID((metric) => {
      metrics.FID = metric;
      console.log('FID:', metric);
      onReport?.(metrics);
    });

    onLCP((metric) => {
      metrics.LCP = metric;
      console.log('LCP:', metric);
      onReport?.(metrics);
    });

    onTTFB((metric) => {
      metrics.TTFB = metric;
      console.log('TTFB:', metric);
      onReport?.(metrics);
    });

    onINP((metric) => {
      metrics.INP = metric;
      console.log('INP:', metric);
      onReport?.(metrics);
    });

    // カスタムメトリクスの測定
    if (window.performance && window.performance.timing) {
      const timing = window.performance.timing;
      const navigation = window.performance.navigation;

      window.addEventListener('load', () => {
        setTimeout(() => {
          // ページ読み込み時間
          const pageLoadTime = timing.loadEventEnd - timing.navigationStart;
          console.log('Page Load Time:', pageLoadTime, 'ms');

          // DOMコンテンツ読み込み時間
          const domContentLoadedTime = timing.domContentLoadedEventEnd - timing.navigationStart;
          console.log('DOM Content Loaded Time:', domContentLoadedTime, 'ms');

          // First Paint
          const paintEntries = performance.getEntriesByType('paint');
          const firstPaint = paintEntries.find(entry => entry.name === 'first-paint');
          const firstContentfulPaint = paintEntries.find(entry => entry.name === 'first-contentful-paint');
          
          if (firstPaint) {
            console.log('First Paint:', firstPaint.startTime, 'ms');
          }
          if (firstContentfulPaint) {
            console.log('First Contentful Paint:', firstContentfulPaint.startTime, 'ms');
          }

          // リソースの読み込み時間
          const resources = performance.getEntriesByType('resource');
          const resourceStats = {
            scripts: resources.filter(r => r.name.includes('.js')),
            styles: resources.filter(r => r.name.includes('.css')),
            images: resources.filter(r => r.name.match(/\.(jpg|jpeg|png|gif|webp|avif|svg)/i)),
            fonts: resources.filter(r => r.name.match(/\.(woff|woff2|ttf|otf)/i))
          };

          console.log('Resource Loading Stats:', {
            scripts: `${resourceStats.scripts.length} files, ${Math.round(resourceStats.scripts.reduce((acc, r) => acc + r.duration, 0))}ms`,
            styles: `${resourceStats.styles.length} files, ${Math.round(resourceStats.styles.reduce((acc, r) => acc + r.duration, 0))}ms`,
            images: `${resourceStats.images.length} files, ${Math.round(resourceStats.images.reduce((acc, r) => acc + r.duration, 0))}ms`,
            fonts: `${resourceStats.fonts.length} files, ${Math.round(resourceStats.fonts.reduce((acc, r) => acc + r.duration, 0))}ms`
          });

          // メモリ使用量（対応ブラウザのみ）
          if ((performance as any).memory) {
            const memory = (performance as any).memory;
            console.log('Memory Usage:', {
              usedJSHeapSize: `${Math.round(memory.usedJSHeapSize / 1048576)}MB`,
              totalJSHeapSize: `${Math.round(memory.totalJSHeapSize / 1048576)}MB`,
              limit: `${Math.round(memory.jsHeapSizeLimit / 1048576)}MB`
            });
          }
        }, 100);
      });
    }
  }, [enabled, onReport]);

  if (!enabled) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 10,
        right: 10,
        background: 'rgba(0, 0, 0, 0.8)',
        color: 'white',
        padding: '10px',
        fontSize: '12px',
        fontFamily: 'monospace',
        borderRadius: '4px',
        zIndex: 9999,
        maxWidth: '300px'
      }}
    >
      <div>Performance Monitor Active</div>
      <div style={{ fontSize: '10px', marginTop: '5px' }}>
        Check console for metrics
      </div>
    </div>
  );
};

export default PerformanceMonitor;