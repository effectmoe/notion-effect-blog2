# Cache Warmup Fix Documentation

## Problem Description

After clearing the cache using the `/api/cache-clear` endpoint, the cache warmup functionality would return "0 pages" because the `getSiteMap()` function was returning an empty result. This happened because the site map was cached using `pMemoize`, which creates an in-memory cache that was not being cleared by the standard cache clearing process.

## Root Cause

1. **Multiple Cache Layers**: The application uses multiple caching mechanisms:
   - Redis cache (if configured)
   - LRU in-memory cache
   - pMemoize cache (for specific functions like `getSiteMap`)

2. **Incomplete Cache Clearing**: The `/api/cache-clear` endpoint only cleared Redis and LRU caches but not the pMemoize cache used by `getSiteMap()` and `getNavigationLinkPages()`.

3. **No Fallback Strategy**: When the site map was empty (due to stale cache), there was no proper fallback to ensure important pages could still be warmed up.

## Solution Implementation

### 1. Clear pMemoize Caches

Added cache clearing functions to modules using pMemoize:

**In `/lib/get-site-map.ts`:**
```typescript
export function clearSiteMapCache() {
  getAllPages.clear()
  console.log('Site map cache cleared')
}
```

**In `/lib/notion.ts`:**
```typescript
export function clearNavigationCache() {
  getNavigationLinkPages.clear()
  console.log('Navigation cache cleared')
}
```

### 2. Update Cache Clear Endpoint

Modified `/pages/api/cache-clear.ts` to call the new cache clearing functions:

```typescript
case 'notion':
  await cache.invalidate('notion:');
  clearSiteMapCache(); // Clear pMemoize cache
  clearNavigationCache(); // Clear navigation cache
  result = { cleared: 'notion-cache' };
  break;
  
case 'all':
  // 全キャッシュクリア
  await cache.cleanup();
  clearSiteMapCache(); // Clear pMemoize cache
  clearNavigationCache(); // Clear navigation cache
  result = { cleared: 'all-caches' };
  break;
```

### 3. Implement Robust Fallback Strategy

Enhanced `/lib/get-important-pages.ts` with default important pages:

```typescript
export const DEFAULT_IMPORTANT_SLUGS = [
  'cafekinesi',
  'カフェキネシ構造',
  '都道府県リスト',
  'カフェキネシコンテンツ',
  '講座一覧',
  'ブログ',
  'アロマ購入',
  'お申込みの流れ',
  'カテゴリー',
  'プライバシーポリシー'
];
```

### 4. Improve Cache Warmup Logic

Updated `/pages/api/cache-warmup.ts` with better fallback handling:

```typescript
if (pageIds.length === 0) {
  console.log('No pages found in siteMap, using fallback strategy');
  
  const importantPageIds = await getImportantPageIds();
  const fallbackPages = [...new Set([...importantPageIds, ...DEFAULT_IMPORTANT_SLUGS])];
  pageIds = fallbackPages.slice(0, 15);
  
  console.log('Using fallback page IDs:', pageIds);
}
```

### 5. Enhanced Error Handling and Debugging

Added detailed logging and error information to help diagnose issues:

```typescript
const results = await Promise.allSettled(
  pageIds.map(async (pageId) => {
    try {
      console.log(`Fetching page: ${pageId}`);
      const result = await getPage(pageId);
      console.log(`Successfully fetched: ${pageId}`);
      return { pageId, success: true };
    } catch (error) {
      console.error(`Failed to fetch page ${pageId}:`, error);
      return { pageId, success: false, error: error.message };
    }
  })
);
```

## Testing

A test script is provided at `/scripts/test-cache-warmup.js` to verify the fix:

```bash
# Set environment variables
export API_BASE=http://localhost:3000
export CACHE_CLEAR_TOKEN=your-secret-token

# Run the test
node scripts/test-cache-warmup.js
```

The test script:
1. Clears all caches
2. Waits for cache to clear
3. Runs cache warmup
4. Verifies that pages are successfully warmed (not 0)

## Configuration

### Environment Variables

- `CACHE_CLEAR_TOKEN`: Authentication token for cache operations
- `NOTION_PAGE_ID`: Root page ID for the site
- `IMPORTANT_PAGE_IDS`: Comma-separated list of important page IDs (optional)

### Important Pages

You can configure important pages in two ways:

1. **Environment Variable**: Set `IMPORTANT_PAGE_IDS` with comma-separated page IDs
2. **Code Configuration**: Modify `DEFAULT_IMPORTANT_SLUGS` in `/lib/get-important-pages.ts`

## How It Works

1. **Cache Clear Process**:
   - Redis cache is cleared (if configured)
   - LRU memory cache is cleared
   - pMemoize caches are cleared (site map and navigation)

2. **Cache Warmup Process**:
   - Attempts to get pages from site map
   - If site map is empty (just after cache clear), uses fallback pages
   - Fetches each page to populate the cache
   - Reports success/failure statistics

## Benefits

1. **Reliable Cache Warmup**: Works even immediately after cache clear
2. **No More "0 Pages"**: Always has fallback pages to warm up
3. **Better Debugging**: Enhanced logging helps diagnose issues
4. **Complete Cache Clear**: All cache layers are properly cleared

## Future Improvements

1. **Persistent Important Pages**: Store important page IDs in a database
2. **Analytics-Based Selection**: Use page view analytics to determine important pages
3. **Progressive Warmup**: Warm up pages in priority order
4. **Cache Health Monitoring**: Add metrics to monitor cache effectiveness