import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // セキュリティ: シークレットトークンの検証
  if (req.query.secret !== process.env.REVALIDATE_SECRET) {
    return res.status(401).json({ message: 'Invalid token' });
  }

  const path = req.query.path as string;
  
  if (!path) {
    return res.status(400).json({ message: 'Path is required' });
  }

  try {
    // Next.js 12以降のISR再検証
    await res.revalidate(path);
    
    console.log(`Revalidated path: ${path}`);
    
    return res.json({ 
      revalidated: true,
      path,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error('Error revalidating:', err);
    return res.status(500).json({ 
      message: 'Error revalidating',
      error: err instanceof Error ? err.message : 'Unknown error'
    });
  }
}