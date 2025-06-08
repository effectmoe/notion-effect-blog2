// pages/api/color-settings.js
import fs from 'fs';
import path from 'path';
import { colorSettings as defaultSettings } from '../../lib/color-customizer/color-settings';

const settingsPath = path.join(process.cwd(), 'color-settings.json');

export default function handler(req, res) {
  if (req.method === 'GET') {
    // 設定を読み込む
    try {
      if (fs.existsSync(settingsPath)) {
        const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
        // デフォルト設定とマージして、欠けているプロパティを補完
        const mergedSettings = { ...defaultSettings };
        Object.keys(settings).forEach(key => {
          if (mergedSettings[key]) {
            mergedSettings[key] = { ...mergedSettings[key], ...settings[key] };
          }
        });
        res.status(200).json(mergedSettings);
      } else {
        // ファイルが存在しない場合はデフォルト設定を返す
        res.status(200).json(defaultSettings);
      }
    } catch (error) {
      console.error('Error reading color settings:', error);
      res.status(500).json({ error: 'Failed to read settings' });
    }
  } else if (req.method === 'POST') {
    // 設定を保存する
    try {
      const settings = req.body;
      fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
      res.status(200).json({ message: 'Settings saved successfully' });
    } catch (error) {
      console.error('Error saving color settings:', error);
      res.status(500).json({ error: 'Failed to save settings' });
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}