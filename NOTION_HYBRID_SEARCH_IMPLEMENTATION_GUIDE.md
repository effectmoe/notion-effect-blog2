# Notion Hybrid Search Implementation Guide with Checkbox Filtering

## Table of Contents
1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Setup Procedure](#setup-procedure)
4. [API Implementation](#api-implementation)
5. [Frontend Implementation](#frontend-implementation)
6. [Common Pitfalls and Solutions](#common-pitfalls-and-solutions)
7. [Troubleshooting Guide](#troubleshooting-guide)
8. [Testing Procedures](#testing-procedures)
9. [Performance Optimization](#performance-optimization)

## Overview

This guide provides a complete implementation of Notion hybrid search with checkbox filtering functionality. The hybrid approach combines Notion's native search API with custom filtering logic to provide fast, accurate search results with real-time filtering capabilities.

### Key Features
- Real-time search with debouncing
- Checkbox-based property filtering
- Hybrid search combining API and local filtering
- Proper caching and performance optimization
- Error handling and fallback mechanisms

## Prerequisites

### Required Environment Variables
```bash
# IMPORTANT: Use NOTION_API_SECRET, not NOTION_API_KEY
NOTION_API_SECRET=your_notion_integration_token_here
```

### Database Configuration
- **Database ID**: `1ceb802cb0c6814ab43eddb38e80f2e0`
- Ensure your Notion integration has access to this database
- The database should have searchable properties configured

### Dependencies
```json
{
  "dependencies": {
    "@notionhq/client": "^2.2.14",
    "notion-client": "^6.16.0",
    "next": "^14.0.0",
    "react": "^18.2.0"
  }
}
```

## Setup Procedure

### Step 1: Environment Configuration

1. Create or update `.env.local`:
```bash
NOTION_API_SECRET=secret_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

2. **Critical**: Ensure you're using `NOTION_API_SECRET` not `NOTION_API_KEY`. This is a common source of authentication errors.

### Step 2: API Endpoint Setup

Create the hybrid search API endpoint at `pages/api/hybrid-search.ts`:

```typescript
import { NextApiRequest, NextApiResponse } from 'next';
import { Client } from '@notionhq/client';

const notion = new Client({
  auth: process.env.NOTION_API_SECRET, // Correct environment variable
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { query, filters = {} } = req.body;

  try {
    // Search implementation
    const response = await notion.databases.query({
      database_id: '1ceb802cb0c6814ab43eddb38e80f2e0',
      filter: {
        and: [
          query ? {
            or: [
              {
                property: 'Name',
                title: {
                  contains: query,
                },
              },
              {
                property: 'Description',
                rich_text: {
                  contains: query,
                },
              },
            ],
          } : undefined,
          ...Object.entries(filters).map(([property, values]) => ({
            or: values.map(value => ({
              property,
              checkbox: {
                equals: value === property,
              },
            })),
          })),
        ].filter(Boolean),
      },
    });

    // Add Cache-Control headers to prevent stale data
    res.setHeader('Cache-Control', 'no-store, max-age=0');
    res.status(200).json({ results: response.results });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Failed to search' });
  }
}
```

### Step 3: Frontend Implementation

Create a search component with proper state management:

```typescript
import { useState, useCallback, useRef } from 'react';
import Link from 'next/link'; // Use Next.js Link for internal navigation

export function NotionSearch() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [filters, setFilters] = useState({});
  const [isSearching, setIsSearching] = useState(false);
  const searchTimeoutRef = useRef(null);

  const performSearch = useCallback(async (query, currentFilters) => {
    // Clear previous results immediately
    setSearchResults([]);
    
    if (!query && Object.keys(currentFilters).length === 0) {
      return;
    }

    setIsSearching(true);

    try {
      const response = await fetch('/api/hybrid-search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          filters: currentFilters,
        }),
      });

      if (!response.ok) {
        throw new Error('Search failed');
      }

      const data = await response.json();
      setSearchResults(data.results || []);
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const handleSearchChange = useCallback((e) => {
    const value = e.target.value;
    setSearchQuery(value);

    // Clear existing timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Debounce search
    searchTimeoutRef.current = setTimeout(() => {
      performSearch(value, filters);
    }, 300);
  }, [filters, performSearch]);

  const handleFilterChange = useCallback((property, checked) => {
    const newFilters = { ...filters };
    
    if (checked) {
      if (!newFilters[property]) {
        newFilters[property] = [];
      }
      newFilters[property].push(property);
    } else {
      delete newFilters[property];
    }

    setFilters(newFilters);
    performSearch(searchQuery, newFilters);
  }, [filters, searchQuery, performSearch]);

  return (
    <div className="search-container">
      <input
        type="text"
        value={searchQuery}
        onChange={handleSearchChange}
        placeholder="Search..."
        className="search-input"
      />

      <div className="filters">
        {['Property1', 'Property2', 'Property3'].map(property => (
          <label key={property}>
            <input
              type="checkbox"
              checked={!!filters[property]}
              onChange={(e) => handleFilterChange(property, e.target.checked)}
            />
            {property}
          </label>
        ))}
      </div>

      {isSearching && <div>Searching...</div>}

      <div className="search-results">
        {searchResults.map(result => (
          <Link
            key={result.id}
            href={`/${result.id}`}
            className="search-result-item"
          >
            <h3>{result.properties.Name?.title?.[0]?.plain_text}</h3>
            <p>{result.properties.Description?.rich_text?.[0]?.plain_text}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
```

## Common Pitfalls and Solutions

### 1. Wrong Environment Variable Name

**Pitfall**: Using `NOTION_API_KEY` instead of `NOTION_API_SECRET`

**Solution**: Always use `NOTION_API_SECRET` in your environment configuration:
```javascript
// ❌ Wrong
const notion = new Client({ auth: process.env.NOTION_API_KEY });

// ✅ Correct
const notion = new Client({ auth: process.env.NOTION_API_SECRET });
```

### 2. Using Wrong API Endpoint

**Pitfall**: Using `direct-search` endpoint instead of `hybrid-search`

**Solution**: Ensure your frontend calls the correct endpoint:
```javascript
// ❌ Wrong
const response = await fetch('/api/direct-search', ...);

// ✅ Correct
const response = await fetch('/api/hybrid-search', ...);
```

### 3. Navigation Issues with Database Items

**Pitfall**: Using regular anchor tags or incorrect Link usage

**Solution**: Use Next.js Link component properly:
```javascript
// ❌ Wrong
<a href={`/${result.id}`}>{result.title}</a>

// ✅ Correct
<Link href={`/${result.id}`}>
  <span>{result.title}</span>
</Link>
```

### 4. Stale Search Results

**Pitfall**: Previous search results remain visible when starting new search

**Solution**: Clear results immediately when initiating new search:
```javascript
const performSearch = async (query, filters) => {
  // Clear previous results first
  setSearchResults([]);
  
  // Then perform the search
  // ...
};
```

### 5. Cached API Responses

**Pitfall**: Browser caching API responses leading to stale data

**Solution**: Add Cache-Control headers to API responses:
```javascript
res.setHeader('Cache-Control', 'no-store, max-age=0');
```

## Troubleshooting Guide

### Issue: "Unauthorized" Error (401)

**Symptoms**: API returns 401 error

**Solutions**:
1. Verify environment variable name is `NOTION_API_SECRET`
2. Check that the token starts with `secret_`
3. Ensure the integration has access to the database
4. Restart the Next.js development server after updating .env.local

### Issue: Empty Search Results

**Symptoms**: Search returns no results even when matches exist

**Solutions**:
1. Verify database ID is correct: `1ceb802cb0c6814ab43eddb38e80f2e0`
2. Check that searched properties exist in the database
3. Ensure property names in code match Notion database exactly
4. Test with simple queries first

### Issue: Clicking Results Doesn't Navigate

**Symptoms**: Clicking search results doesn't open the page

**Solutions**:
1. Use Next.js Link component, not anchor tags
2. Ensure href format is correct: `/${result.id}`
3. Check that the page route exists ([pageId].tsx)

### Issue: Filters Not Working

**Symptoms**: Checkbox filters don't affect results

**Solutions**:
1. Verify filter property names match database properties
2. Check that filter logic is correctly implemented
3. Ensure filters are passed to API correctly
4. Test API endpoint directly with curl/Postman

## Testing Procedures

### 1. Environment Setup Test

```bash
# Test environment variable
node -e "console.log(process.env.NOTION_API_SECRET ? 'Set' : 'Not set')"
```

### 2. API Connection Test

Create `test-notion-connection.ts`:
```typescript
import { Client } from '@notionhq/client';

const notion = new Client({
  auth: process.env.NOTION_API_SECRET,
});

async function testConnection() {
  try {
    const response = await notion.databases.retrieve({
      database_id: '1ceb802cb0c6814ab43eddb38e80f2e0',
    });
    console.log('✅ Connection successful');
    console.log('Database title:', response.title);
  } catch (error) {
    console.error('❌ Connection failed:', error);
  }
}

testConnection();
```

### 3. Search Functionality Test

```bash
# Test search API directly
curl -X POST http://localhost:3000/api/hybrid-search \
  -H "Content-Type: application/json" \
  -d '{"query": "test", "filters": {}}'
```

### 4. Filter Functionality Test

```javascript
// Test filter combinations
const testCases = [
  { query: '', filters: { Property1: ['Property1'] } },
  { query: 'search term', filters: {} },
  { query: 'search term', filters: { Property1: ['Property1'], Property2: ['Property2'] } },
];

for (const testCase of testCases) {
  const response = await fetch('/api/hybrid-search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(testCase),
  });
  
  console.log(`Test case: ${JSON.stringify(testCase)}`);
  console.log(`Result count: ${(await response.json()).results.length}`);
}
```

### 5. Navigation Test

1. Perform a search
2. Click on a result
3. Verify navigation to the correct page
4. Check browser console for errors

## Performance Optimization

### 1. Implement Debouncing

```javascript
const searchTimeoutRef = useRef(null);

const handleSearchChange = (e) => {
  const value = e.target.value;
  setSearchQuery(value);

  if (searchTimeoutRef.current) {
    clearTimeout(searchTimeoutRef.current);
  }

  searchTimeoutRef.current = setTimeout(() => {
    performSearch(value, filters);
  }, 300); // 300ms delay
};
```

### 2. Add Loading States

```javascript
{isSearching ? (
  <div className="loading-spinner">Searching...</div>
) : (
  <div className="search-results">
    {searchResults.map(result => (
      // Results
    ))}
  </div>
)}
```

### 3. Implement Result Caching

```javascript
const resultCache = useRef(new Map());

const performSearch = async (query, filters) => {
  const cacheKey = JSON.stringify({ query, filters });
  
  if (resultCache.current.has(cacheKey)) {
    setSearchResults(resultCache.current.get(cacheKey));
    return;
  }

  // Perform search...
  
  resultCache.current.set(cacheKey, results);
};
```

### 4. Optimize API Queries

```javascript
// Limit results for better performance
const response = await notion.databases.query({
  database_id: '1ceb802cb0c6814ab43eddb38e80f2e0',
  page_size: 20, // Limit initial results
  // ... rest of query
});
```

## Conclusion

This implementation provides a robust, performant search solution with checkbox filtering. Key success factors:

1. Use correct environment variable (`NOTION_API_SECRET`)
2. Implement proper error handling
3. Clear results before new searches
4. Use Next.js Link for navigation
5. Add appropriate cache headers
6. Test thoroughly at each step

Remember to monitor performance and adjust debouncing delays and result limits based on your specific use case and data volume.