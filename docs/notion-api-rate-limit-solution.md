# Notion API 429 Rate Limit Solution

## Problem Analysis

The 429 "Too Many Requests" error from Notion API indicates that the application is exceeding Notion's rate limits. Based on the codebase analysis, the main issues are:

1. **No retry logic with exponential backoff** - The original implementation doesn't retry failed requests
2. **High concurrency** - Multiple parallel requests without proper rate limiting
3. **Aggressive cache warmup** - Trying to fetch too many pages too quickly
4. **No request queue management** - Requests are sent immediately without throttling

## Implemented Solutions

### 1. Enhanced Notion API with Retry Logic (`lib/notion-api-with-retry.ts`)

Created a wrapper around the Notion API client that implements:

- **Rate limit tracking** - Monitors requests per second and per minute
- **Exponential backoff** - Retries with increasing delays (2s, 4s, 8s...)
- **Request queue** - Limits concurrent requests to 2
- **Respect Retry-After headers** - Uses server-specified wait times
- **Automatic retry for transient errors** - Handles 429, 502, 503, 504 errors

### 2. Reduced Concurrency Across the Application

Updated concurrent request limits:
- Navigation link fetching: 4 → 2 concurrent requests
- Missing block fetching: 3 → 1 concurrent request
- Cache warmup batch size: 5 → 2 (or 1 without Redis)
- Delay between batches: 15s → 30-45s

### 3. API Status Monitoring (`pages/api/notion-api-status.ts`)

Created an endpoint to monitor:
- Current API limiter statistics
- Cache hit/miss rates
- Rate limit recommendations
- System uptime and health

## Configuration

### Rate Limits (in `lib/notion-api-with-retry.ts`)

```typescript
const RATE_LIMIT_CONFIG = {
  MAX_REQUESTS_PER_SECOND: 3,
  MAX_REQUESTS_PER_MINUTE: 50,
  MAX_RETRIES: 3,
  INITIAL_RETRY_DELAY: 2000, // 2 seconds
  MAX_RETRY_DELAY: 60000, // 60 seconds
  BACKOFF_MULTIPLIER: 2,
  QUEUE_CONCURRENCY: 2,
}
```

## Usage

The enhanced API is automatically used throughout the application. No code changes required in existing files.

### Monitoring API Usage

```bash
curl http://localhost:3000/api/notion-api-status
```

## Best Practices

1. **Cache Everything**: Use the 30-minute cache TTL to reduce API calls
2. **Batch Operations**: Group related requests and add delays between batches
3. **Monitor 429 Errors**: Check logs for rate limit patterns
4. **Use Webhooks**: Consider Notion webhooks for real-time updates instead of polling
5. **Progressive Loading**: Load critical content first, then fetch additional data

## Emergency Measures

If still experiencing 429 errors:

1. **Increase delays**: Edit `DELAY_BETWEEN_BATCHES` in cache-warmup.ts
2. **Reduce concurrency**: Lower `QUEUE_CONCURRENCY` in notion-api-with-retry.ts
3. **Disable cache warmup**: Skip automatic cache warming after deployments
4. **Enable Redis**: Use Redis for distributed caching to reduce API calls

## Monitoring Commands

```bash
# Check API status
curl http://localhost:3000/api/notion-api-status

# Check cache status
curl http://localhost:3000/api/cache-status

# View cache statistics
curl http://localhost:3000/cache-monitor
```

## Future Improvements

1. **Implement request deduplication** - Prevent duplicate concurrent requests
2. **Add circuit breaker pattern** - Temporarily disable API calls during outages
3. **Use Notion's official SDK** - Consider migrating to @notionhq/client for better rate limit handling
4. **Implement request prioritization** - Prioritize user-facing requests over background tasks

## Troubleshooting

### Still getting 429 errors?

1. Check if multiple instances are running (local dev + production)
2. Verify no other applications are using the same Notion token
3. Review logs for patterns in failed requests
4. Consider implementing a global request counter with Redis

### Performance degradation?

1. The delays are necessary to avoid rate limits
2. Enable Redis caching for better performance
3. Pre-warm critical pages during low-traffic periods
4. Use static generation for pages that rarely change