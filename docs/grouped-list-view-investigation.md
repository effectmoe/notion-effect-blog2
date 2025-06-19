# Grouped List View Investigation

## Issue Description
Two databases behave differently when displayed as grouped list views:
1. **"カフェキネシラバーズ" (Cafe Kinesi Lovers)** - Does NOT display when grouped by prefecture (北海道, 東北, etc.)
2. **"FAQマスター"** - Displays correctly when grouped

## Investigation Summary

### Files Created/Modified

1. **`/styles/fix-grouped-lists.css`** - CSS fixes for grouped list view visibility
   - Forces grouped list views to be visible
   - Fixes potential z-index and overflow issues
   - Adds responsive adjustments

2. **`/public/fix-grouped-lists.js`** - JavaScript fix for runtime issues
   - Detects and fixes hidden grouped list views
   - Monitors DOM changes to reapply fixes
   - Only runs on pages with affected databases

3. **`/public/debug-grouped-lists.js`** - Debug tool for development
   - Analyzes grouped list view structure
   - Reports on hidden elements
   - Checks recordMap for collection configurations

4. **`/investigate-grouped-lists.js`** - Server-side investigation script
   - Uses Notion API to analyze database structures
   - Compares properties between working and non-working databases
   - Helps identify structural differences

### Root Causes (Potential)

1. **CSS Display Issues**: Some grouped list views may have `display: none` or `visibility: hidden` applied
2. **Collection View Configuration**: Different databases might have different view configurations
3. **Linked vs Regular Databases**: The problematic database might be a linked database with different handling
4. **Property Types**: Grouping by certain property types (e.g., select vs multi-select) might behave differently

### Solutions Applied

1. **CSS Override** (`fix-grouped-lists.css`):
   ```css
   .notion-collection-view-type-list .notion-list-view-group {
     display: block !important;
     visibility: visible !important;
     opacity: 1 !important;
   }
   ```

2. **Runtime Fix** (`fix-grouped-lists.js`):
   - Automatically detects and fixes hidden grouped list views
   - Only runs on pages containing affected databases
   - Monitors for dynamic content changes

3. **Debug Tools**:
   - Use `window.debugGroupedLists()` in console to analyze current state
   - Check console logs for detailed information about collection views

### How to Test

1. **Development**:
   ```bash
   npm run dev
   ```
   - Navigate to a page with "カフェキネシラバーズ" database
   - Open browser console
   - Look for debug messages starting with "🔍"
   - Use `window.debugGroupedLists()` for manual analysis

2. **Server-side Investigation**:
   ```bash
   node investigate-grouped-lists.js
   ```
   - Requires `NOTION_TOKEN` in `.env`
   - Compares database structures

### Next Steps

If the issue persists:

1. **Check Collection View Wrapper**: The `EnhancedCollectionViewWrapper` component handles collection rendering. It might need specific handling for grouped list views.

2. **Inspect react-notion-x**: The issue might be in the upstream `react-notion-x` library's handling of grouped list views.

3. **Database-specific Configuration**: Consider adding database-specific handling in the collection view wrapper based on collection ID or name.

4. **View Type Detection**: Add more sophisticated view type detection to apply fixes only to grouped list views.

### Related Files

- `/components/EnhancedCollectionViewWrapper.tsx` - Main collection rendering component
- `/components/CollectionViewWrapper.tsx` - Original collection wrapper
- `/styles/notion.css` - Global Notion styles
- `/pages/_app.tsx` - Style imports
- `/pages/_document.tsx` - Script loading