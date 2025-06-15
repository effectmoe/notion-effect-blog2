import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Check for secret to confirm this is a valid request
  const authHeader = req.headers.authorization;
  const expectedToken = process.env.CACHE_CLEAR_TOKEN;
  
  if (expectedToken && authHeader !== `Bearer ${expectedToken}`) {
    return res.status(401).json({ error: 'Invalid token' });
  }

  try {
    const { path } = req.body;
    
    if (!path) {
      return res.status(400).json({ error: 'Path is required' });
    }
    
    console.log(`[Revalidate] Revalidating path: ${path}`);
    
    // This will revalidate the page in Next.js cache
    await res.revalidate(path);
    
    console.log(`[Revalidate] Successfully revalidated: ${path}`);
    
    return res.json({ 
      revalidated: true, 
      path,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error('[Revalidate] Error:', err);
    // If there was an error, Next.js will continue
    // to show the last successfully generated page
    return res.status(500).json({ 
      error: 'Error revalidating',
      details: err instanceof Error ? err.message : 'Unknown error'
    });
  }
}