# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common Development Commands

### Development
```bash
npm run dev      # Start development server on http://localhost:3000
npm run build    # Build for production (includes Service Worker build)
npm run start    # Start production server
npm run deploy   # Deploy to Vercel
```

### Code Quality
```bash
npm run test             # Run all tests (lint + prettier)
npm run test:lint        # Run ESLint
npm run test:prettier    # Check code formatting
npm run analyze          # Analyze bundle size
```

### Dependency Management
```bash
npm run deps:upgrade    # Upgrade notion-related packages
npm run deps:link       # Link local react-notion-x packages for development
npm run deps:unlink     # Unlink and restore npm packages
```

## Architecture Overview

### Core Stack
- **Framework**: Next.js 15 with React 18 and TypeScript
- **CMS**: Notion via `react-notion-x` library
- **Deployment**: Vercel
- **Node**: Requires >= 18

### Key Architectural Patterns

#### 1. Notion Integration
The project uses a **hybrid Notion API approach**:
- **Official API** (`@notionhq/client`): Used for authenticated operations, database queries, and property access
- **Unofficial API** (`notion-client`): Used for public page rendering and search
- **Hybrid API** (`lib/notion-api-hybrid.ts`): Intelligently switches between APIs based on operation type

#### 2. Multi-Layer Caching System
```
Browser → Service Worker → Memory (LRU) → Redis → Origin
```
- **Memory Cache**: LRU cache for fastest access
- **Redis**: Optional distributed cache (configure with `REDIS_HOST` and `REDIS_PASSWORD`)
- **Service Worker**: Offline support and browser-level caching
- **Cache Management**: Admin panel at `/admin` for manual control

#### 3. Page Routing & URL Mapping
- Notion page IDs are mapped to slugified URLs
- Development URLs include page ID suffix for debugging
- Production URLs are cleaner without ID
- Custom slugs supported via `Slug` property in Notion

#### 4. Collection View Handling (Currently Being Fixed)
- **Problem**: Grouped list views not displaying correctly
- **Files involved**:
  - `lib/hybrid-collection-handler.ts` (new)
  - `components/CollectionViewWrapper.tsx`
  - `public/client-side-grouping.js`
- **Known working**: Gallery views with grouping (e.g., 都道府県データベース)
- **Known broken**: List views with grouping (e.g., FAQマスター)

#### 5. Search Implementation
Hybrid search system combining multiple approaches:
- Notion's native search API
- Custom indexed search
- Fallback search for offline/error scenarios

## Critical Configuration

### Primary Configuration
All site configuration is in `site.config.ts`:
- `rootNotionPageId`: The main Notion page ID (required)
- `domain`: Your deployment domain
- Redis and preview images are optional features

### Environment Variables
Required for certain features:
```bash
# Notion API (optional but recommended)
NOTION_API_SECRET=secret_xxx

# Redis Cache (optional)
REDIS_HOST=xxx
REDIS_PASSWORD=xxx

# Analytics (optional)
NEXT_PUBLIC_FATHOM_ID=xxx
NEXT_PUBLIC_POSTHOG_ID=xxx
```

### Vercel Settings
**Important**: Disable "Vercel Authentication" under Deployment Protection to ensure social preview images work correctly.

## Current Known Issues

1. **Grouped List Views**: Not rendering correctly in collection views
   - Temporary workaround: Use gallery view with grouping
   - Investigation log: `docs/grouped-list-view-investigation-log.md`

2. **FAQ Master Display**: Collection with grouping not showing items
   - Debug scripts available in project root
   - Client-side fixes being tested in `public/fix-faq-master-final.js`

## Key Directories for Complex Features

### Custom Features
- **Font/Color Customization**: `lib/font-customizer/`, `lib/color-settings.js`
- **Japan Map Integration**: `components/JapanMap.tsx`
- **Cache Management UI**: `components/CacheManagement.tsx`
- **FAQ System**: `components/FAQ.tsx` and related debug scripts

### API Endpoints
- `/api/search-notion`: Main search endpoint
- `/api/cache-*`: Cache management endpoints
- `/api/font-settings`, `/api/color-settings`: Customization endpoints

## Development Tips

1. When debugging Notion content, check browser console for global `recordMap` object
2. Service Worker can be disabled in development if causing issues
3. Use `?_vercel_no_cache=1` query parameter to bypass edge caching
4. Admin panel requires password authentication (check sessionStorage)

## FAQマスター グループ化問題の調査ログ

- **開始日時**: 2025-06-18 JST
- **問題**: FAQマスターのグループ化が表示されない
- **関連ブロックID**: `212b802cb0c680b3b04afec4203ee8d7`

### 現在の状況
- FAQマスターはNotionでグループ化されているが、Webサイトで表示されない
- 同じグループ化機能を使用している「都道府県データベース」は正常に表示される
- 問題はリストビューのグループ化に限定される（ギャラリービューは正常）

### 調査済みの内容
1. グループ要素（`.notion-collection-group`）は存在するが、内容が空
2. `public/client-side-grouping.js`でクライアントサイドの修正を試みている
3. `lib/hybrid-collection-handler.ts`で新しいハンドラーを実装中

### 関連ファイル
- 調査ログ: `docs/grouped-list-view-investigation-log.md`
- デバッグスクリプト: `analyze-faq-structure.mjs`, `debug-faq-view.mjs`
- 修正試行: `public/fix-faq-master-final.js`