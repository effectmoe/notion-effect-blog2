import { NextApiRequest, NextApiResponse } from 'next';
import { promises as fs } from 'fs';
import path from 'path';

// 失敗ページのログファイルパス
const FAILED_PAGES_LOG = path.join(process.cwd(), '.cache-warmup-failed-pages.json');

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // 認証チェック
  const authHeader = req.headers.authorization;
  const expectedToken = process.env.CACHE_CLEAR_TOKEN;
  
  if (expectedToken && authHeader !== `Bearer ${expectedToken}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method === 'GET') {
    // 失敗ページリストを取得
    try {
      const data = await fs.readFile(FAILED_PAGES_LOG, 'utf8');
      const failedPages = JSON.parse(data);
      return res.status(200).json({
        success: true,
        failedPages,
        count: failedPages.length
      });
    } catch (error) {
      // ファイルが存在しない場合は空配列を返す
      return res.status(200).json({
        success: true,
        failedPages: [],
        count: 0
      });
    }
  } else if (req.method === 'POST') {
    // 失敗ページを記録
    const { failedPages } = req.body;
    
    if (!Array.isArray(failedPages)) {
      return res.status(400).json({ error: 'Invalid request body' });
    }

    try {
      // 既存のデータを読み込む
      let existingPages = [];
      try {
        const data = await fs.readFile(FAILED_PAGES_LOG, 'utf8');
        existingPages = JSON.parse(data);
      } catch (error) {
        // ファイルが存在しない場合は新規作成
      }

      // 新しい失敗ページを追加（重複を避ける）
      const updatedPages = Array.from(new Set([...existingPages, ...failedPages]));
      
      // ファイルに保存
      await fs.writeFile(FAILED_PAGES_LOG, JSON.stringify(updatedPages, null, 2));
      
      return res.status(200).json({
        success: true,
        message: 'Failed pages recorded',
        count: updatedPages.length
      });
    } catch (error) {
      console.error('Error saving failed pages:', error);
      return res.status(500).json({ error: 'Failed to save data' });
    }
  } else if (req.method === 'DELETE') {
    // 失敗ページリストをクリア
    try {
      await fs.unlink(FAILED_PAGES_LOG);
      return res.status(200).json({
        success: true,
        message: 'Failed pages list cleared'
      });
    } catch (error) {
      // ファイルが存在しない場合も成功とする
      return res.status(200).json({
        success: true,
        message: 'No failed pages to clear'
      });
    }
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}