import { NextApiRequest, NextApiResponse } from 'next';
import { ALL_PAGE_IDS } from '@/lib/all-page-ids';
import { normalizePageId, isValidPageId } from '@/lib/normalize-page-id';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('[GetCompletePageList] Returning complete hardcoded page list...');
    
    // ハードコードされた完全なページリストを使用
    const pageIds = ALL_PAGE_IDS
      .filter(id => isValidPageId(id))
      .map(id => normalizePageId(id));
    
    console.log(`[GetCompletePageList] Returning ${pageIds.length} page IDs`);
    
    res.status(200).json({
      success: true,
      pageIds,
      total: pageIds.length,
      source: 'hardcoded_complete_list',
      message: `Retrieved ${pageIds.length} pages from complete list`
    });

  } catch (error) {
    console.error('[GetCompletePageList] Error:', error);
    res.status(500).json({ 
      error: 'Failed to get complete page list',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}