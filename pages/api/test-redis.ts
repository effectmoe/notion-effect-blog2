import { NextApiRequest, NextApiResponse } from 'next';
import Redis from 'ioredis';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const results = {
    redisUrl: !!process.env.REDIS_URL,
    connectionTest: false,
    pingTest: false,
    setGetTest: false,
    error: null as string | null,
    details: {} as Record<string, any>
  };

  if (!process.env.REDIS_URL) {
    results.error = 'REDIS_URL not configured';
    return res.status(200).json(results);
  }

  let testClient: Redis | null = null;

  try {
    // 1. 接続テスト
    console.log('[Redis Test] Creating client...');
    testClient = new Redis(process.env.REDIS_URL, {
      connectTimeout: 10000,
      maxRetriesPerRequest: 1,
      retryStrategy: () => null, // テスト用なのでリトライしない
      enableOfflineQueue: false,
      lazyConnect: false,
      family: 4, // IPv4を強制
    });

    // イベントリスナー
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Connection timeout'));
      }, 10000);

      testClient!.on('connect', () => {
        console.log('[Redis Test] Connected');
        results.connectionTest = true;
        clearTimeout(timeout);
        resolve();
      });

      testClient!.on('error', (err) => {
        console.error('[Redis Test] Error:', err);
        clearTimeout(timeout);
        reject(err);
      });
    });

    // 2. Pingテスト
    console.log('[Redis Test] Sending PING...');
    const pong = await testClient.ping();
    results.pingTest = pong === 'PONG';
    console.log('[Redis Test] PING response:', pong);

    // 3. Set/Getテスト
    const testKey = 'test:connection';
    const testValue = { timestamp: new Date().toISOString(), test: true };
    
    console.log('[Redis Test] Setting test value...');
    await testClient.set(testKey, JSON.stringify(testValue), 'EX', 60);
    
    console.log('[Redis Test] Getting test value...');
    const retrieved = await testClient.get(testKey);
    results.setGetTest = !!retrieved;
    
    // 4. 追加情報
    const info = await testClient.info('server');
    const versionMatch = info.match(/redis_version:([^\r\n]+)/);
    
    results.details = {
      redisVersion: versionMatch ? versionMatch[1] : 'unknown',
      status: testClient.status,
      testValue: JSON.parse(retrieved || '{}')
    };

    // クリーンアップ
    await testClient.del(testKey);

  } catch (error: any) {
    console.error('[Redis Test] Failed:', error);
    results.error = error.message;
    results.details = {
      code: error.code,
      syscall: error.syscall,
      hostname: error.hostname,
      port: error.port
    };
  } finally {
    // 接続を閉じる
    if (testClient) {
      try {
        await testClient.quit();
      } catch (e) {
        console.error('[Redis Test] Error closing connection:', e);
      }
    }
  }

  const statusCode = results.connectionTest && results.pingTest && results.setGetTest ? 200 : 503;
  res.status(statusCode).json(results);
}