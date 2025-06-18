import { NotionAPI } from 'notion-client'
import pLimit from 'p-limit'
import { ExtendedRecordMap } from 'notion-types'

// Rate limiting configuration
const RATE_LIMIT_CONFIG = {
  // Notion API rate limits (approximate) - more conservative for build stability
  MAX_REQUESTS_PER_SECOND: 1,
  MAX_REQUESTS_PER_MINUTE: 30,
  
  // Retry configuration
  MAX_RETRIES: 3,
  INITIAL_RETRY_DELAY: 5000, // 5 seconds
  MAX_RETRY_DELAY: 60000, // 60 seconds
  BACKOFF_MULTIPLIER: 2,
  
  // Queue configuration
  QUEUE_CONCURRENCY: 1,
  QUEUE_INTERVAL: 2000, // 2 seconds
  QUEUE_INTERVAL_CAP: 3,
}

// Track request counts for rate limiting
class RateLimitTracker {
  private requests: number[] = []
  
  canMakeRequest(): boolean {
    const now = Date.now()
    const oneSecondAgo = now - 1000
    const oneMinuteAgo = now - 60000
    
    // Remove old requests
    this.requests = this.requests.filter(time => time > oneMinuteAgo)
    
    // Check per-second limit
    const recentRequests = this.requests.filter(time => time > oneSecondAgo)
    if (recentRequests.length >= RATE_LIMIT_CONFIG.MAX_REQUESTS_PER_SECOND) {
      return false
    }
    
    // Check per-minute limit
    if (this.requests.length >= RATE_LIMIT_CONFIG.MAX_REQUESTS_PER_MINUTE) {
      return false
    }
    
    return true
  }
  
  recordRequest(): void {
    this.requests.push(Date.now())
  }
  
  getWaitTime(): number {
    const now = Date.now()
    const oneSecondAgo = now - 1000
    const oneMinuteAgo = now - 60000
    
    // Check per-second limit
    const recentRequests = this.requests.filter(time => time > oneSecondAgo)
    if (recentRequests.length >= RATE_LIMIT_CONFIG.MAX_REQUESTS_PER_SECOND) {
      // Wait until the oldest request is more than 1 second old
      const oldestRecent = Math.min(...recentRequests)
      return Math.max(0, oldestRecent + 1000 - now)
    }
    
    // Check per-minute limit
    const minuteRequests = this.requests.filter(time => time > oneMinuteAgo)
    if (minuteRequests.length >= RATE_LIMIT_CONFIG.MAX_REQUESTS_PER_MINUTE) {
      // Wait until the oldest request is more than 1 minute old
      const oldestMinute = Math.min(...minuteRequests)
      return Math.max(0, oldestMinute + 60000 - now)
    }
    
    return 0
  }
}

// Enhanced Notion API with retry and rate limiting
export class NotionAPIWithRetry extends NotionAPI {
  private rateLimiter = new RateLimitTracker()
  private limit: ReturnType<typeof pLimit>
  
  constructor(config?: any) {
    super(config)
    
    // Create a concurrency limiter
    this.limit = pLimit(RATE_LIMIT_CONFIG.QUEUE_CONCURRENCY)
  }
  
  private async waitForRateLimit(): Promise<void> {
    let waitTime = this.rateLimiter.getWaitTime()
    while (waitTime > 0) {
      console.log(`[RateLimit] Waiting ${waitTime}ms before next request...`)
      await new Promise(resolve => setTimeout(resolve, waitTime))
      waitTime = this.rateLimiter.getWaitTime()
    }
  }
  
  private async retryWithBackoff<T>(
    operation: () => Promise<T>,
    operationName: string,
    attempt = 1
  ): Promise<T> {
    try {
      // Wait for rate limit
      await this.waitForRateLimit()
      
      // Record the request
      this.rateLimiter.recordRequest()
      
      // Execute the operation
      const result = await operation()
      
      // Success - reset any backoff
      if (attempt > 1) {
        console.log(`[Retry] ${operationName} succeeded after ${attempt} attempts`)
      }
      
      return result
    } catch (error: any) {
      const isRateLimitError = error.status === 429 || 
                              error.code === 'rate_limited' ||
                              error.message?.toLowerCase().includes('rate limit')
      
      const isRetryableError = isRateLimitError ||
                              error.status === 502 ||
                              error.status === 503 ||
                              error.status === 504 ||
                              error.code === 'ECONNRESET' ||
                              error.code === 'ETIMEDOUT'
      
      if (!isRetryableError || attempt >= RATE_LIMIT_CONFIG.MAX_RETRIES) {
        console.error(`[Retry] ${operationName} failed after ${attempt} attempts:`, {
          message: error.message,
          status: error.status,
          code: error.code,
        })
        throw error
      }
      
      // Calculate backoff delay
      let delay = RATE_LIMIT_CONFIG.INITIAL_RETRY_DELAY * Math.pow(RATE_LIMIT_CONFIG.BACKOFF_MULTIPLIER, attempt - 1)
      
      // If we have a Retry-After header, use it
      if (error.headers?.['retry-after']) {
        const retryAfter = parseInt(error.headers['retry-after'])
        if (!isNaN(retryAfter)) {
          delay = retryAfter * 1000 // Convert to milliseconds
          console.log(`[Retry] Using Retry-After header: ${retryAfter}s`)
        }
      }
      
      // Cap the delay
      delay = Math.min(delay, RATE_LIMIT_CONFIG.MAX_RETRY_DELAY)
      
      console.log(`[Retry] ${operationName} failed (attempt ${attempt}/${RATE_LIMIT_CONFIG.MAX_RETRIES}), retrying in ${delay}ms...`, {
        error: error.message,
        status: error.status,
      })
      
      await new Promise(resolve => setTimeout(resolve, delay))
      
      // Retry the operation
      return this.retryWithBackoff(operation, operationName, attempt + 1)
    }
  }
  
  // Override the main API methods with retry logic
  async getPage(pageId: string, options?: any): Promise<ExtendedRecordMap> {
    return this.limit(() => 
      this.retryWithBackoff(
        () => super.getPage(pageId, options),
        `getPage(${pageId})`
      )
    )
  }
  
  async getBlocks(blockIds: string[]): Promise<any> {
    return this.limit(() =>
      this.retryWithBackoff(
        () => super.getBlocks(blockIds),
        `getBlocks(${blockIds.length} blocks)`
      )
    )
  }
  
  async getSignedFileUrls(urls: any[]): Promise<any> {
    return this.limit(() =>
      this.retryWithBackoff(
        () => super.getSignedFileUrls(urls),
        `getSignedFileUrls(${urls.length} urls)`
      )
    )
  }
  
  async search(params: any): Promise<any> {
    return this.limit(() =>
      this.retryWithBackoff(
        () => super.search(params),
        `search(${params.query})`
      )
    )
  }
  
  async getCollectionData(
    collectionId: string,
    collectionViewId: string,
    collectionView?: any,
    query?: any
  ): Promise<any> {
    return this.limit(() =>
      this.retryWithBackoff(
        () => super.getCollectionData(collectionId, collectionViewId, collectionView, query),
        `getCollectionData(${collectionId})`
      )
    )
  }
  
  // Get limiter statistics
  getLimiterStats() {
    return {
      activeCount: this.limit.activeCount,
      pendingCount: this.limit.pendingCount,
    }
  }
}

// Create a singleton instance
let notionAPIInstance: NotionAPIWithRetry | null = null

export function getNotionAPIWithRetry(config?: any): NotionAPIWithRetry {
  if (!notionAPIInstance) {
    notionAPIInstance = new NotionAPIWithRetry({
      apiBaseUrl: process.env.NOTION_API_BASE_URL || 'https://www.notion.so/api/v3',
      authToken: process.env.NOTION_API_SECRET,
      activeUser: process.env.NOTION_ACTIVE_USER || undefined,
      userTimeZone: 'Asia/Tokyo',
      ...config,
    })
  }
  return notionAPIInstance
}