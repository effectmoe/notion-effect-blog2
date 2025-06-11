# Hydration Error Fix - Complete Solution

## Problem
The hydration error was caused by several issues:

1. **Dark Mode Script**: The script in `_document.tsx` was directly modifying `document.body.classList` before React hydration, causing mismatches between server and client HTML.

2. **Client-Only Components**: Components like `FormulaPropertyDebug` and dark mode class application were rendering differently on server vs client.

3. **DOM Manipulation Scripts**: The `inject-formula-simple.js` script was modifying DOM too early, potentially during hydration.

## Solution Applied

### 1. Fixed Dark Mode Script
Changed the dark mode initialization script to use data attributes instead of directly modifying classes:

```javascript
// Before: Direct class modification
document.body.classList.add(darkMode ? classNameDark : classNameLight)

// After: Data attribute
document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light')
```

### 2. Added Mounted State Check
In `NotionPage.tsx`, added a mounted state to ensure client-only features render after hydration:

```typescript
const [mounted, setMounted] = React.useState(false)

React.useEffect(() => {
  setMounted(true)
}, [])

// Use mounted state for conditional rendering
{mounted && isDarkMode && <BodyClassName className='dark-mode' />}
darkMode={mounted ? isDarkMode : false}
{mounted && <FormulaPropertyDebug recordMap={recordMap} />}
```

### 3. Delayed DOM Manipulation
Increased the delay in `inject-formula-simple.js` from 2000ms to 3000ms to ensure hydration completes before DOM manipulation.

### 4. CSS Support for Data Attributes
Added CSS rules to support the data-theme attribute:

```css
[data-theme='dark'] body {
  background-color: var(--bg-color);
  color: var(--fg-color);
}
```

## Files Modified

1. `/pages/_document.tsx` - Modified dark mode script
2. `/components/NotionPage.tsx` - Added mounted state checks
3. `/public/inject-formula-simple.js` - Increased delay
4. `/styles/global.css` - Added data-theme CSS rules

## Testing

To test if the hydration error is fixed:

1. Clear browser cache and restart the development server
2. Open the browser console
3. Navigate to different pages
4. Check for hydration error warnings in the console
5. Verify dark mode toggles work correctly
6. Ensure formula properties still load properly

## Additional Notes

- The `mounted` pattern is a common solution for hydration issues with client-only features
- Using data attributes instead of direct class manipulation prevents SSR/CSR mismatches
- Delaying DOM manipulation scripts ensures React completes hydration first

## Future Improvements

Consider:
- Moving all client-only logic to dedicated client components
- Using Next.js 13+ app directory with client/server component boundaries
- Implementing a proper dark mode solution with next-themes library