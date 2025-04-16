// pages/api/font-settings.js
import fs from 'fs';
import path from 'path';
import { fontSettings as defaultSettings } from '../../lib/font-customizer/font-settings';

// font-settings.jsonのパスを設定
const configPath = path.join(process.cwd(), 'font-settings.json');

export default async function handler(req, res) {
  // GET: 設定を読み込む
  if (req.method === 'GET') {
    try {
      if (fs.existsSync(configPath)) {
        const settings = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        return res.status(200).json(settings);
      } else {
        // デフォルト設定を返す
        return res.status(200).json(defaultSettings);
      }
    } catch (error) {
      console.error('設定読み込みエラー:', error);
      return res.status(500).json({ error: '設定の読み込みに失敗しました' });
    }
  }
  
  // POST: 設定を保存する
  if (req.method === 'POST') {
    try {
      // リクエストボディから設定を取得
      const settings = req.body;
      
      // JSONファイルに保存
      fs.writeFileSync(configPath, JSON.stringify(settings, null, 2), 'utf8');
      
      return res.status(200).json({ success: true, message: '設定が保存されました' });
    } catch (error) {
      console.error('設定保存エラー:', error);
      return res.status(500).json({ error: '設定の保存に失敗しました' });
    }
  }
  
  // サポートされていないメソッド
  return res.status(405).end('Method Not Allowed');
}
