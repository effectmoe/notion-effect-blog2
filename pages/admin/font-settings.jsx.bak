// pages/admin/font-settings.jsx
import FontSettingsPanel from '../../components/FontSettingsPanel';
import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';

// 簡易的な管理画面パスワード（本番環境では.envファイルなどで管理することをお勧めします）
const ADMIN_PASSWORD = 'cafeinesi2024';

export default function FontSettingsPage() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // 簡易的な管理者認証
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const adminPassword = localStorage.getItem('adminPassword');
    if (adminPassword === ADMIN_PASSWORD) {
      setIsAdmin(true);
      setIsLoading(false);
    } else {
      const password = prompt('管理者パスワードを入力してください:');
      if (password === ADMIN_PASSWORD) {
        localStorage.setItem('adminPassword', password);
        setIsAdmin(true);
      } else {
        alert('パスワードが正しくありません');
        window.location.href = '/';
      }
      setIsLoading(false);
    }
  }, []);
  
  if (isLoading) return <div className="p-8 text-center">読み込み中...</div>;
  if (!isAdmin) return <div className="p-8 text-center">アクセス権限がありません</div>;
  
  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8">
      <Head>
        <title>フォント設定 - Notion-Effect-Blog</title>
      </Head>
      
      <div className="max-w-6xl mx-auto">
        <div className="mb-6 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-purple-800">フォント設定管理</h1>
          <Link href="/" className="bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded-md text-gray-700 transition-colors">
            ホームに戻る
          </Link>
        </div>
        
        <FontSettingsPanel />
        
        <div className="mt-8 text-center text-gray-600 text-sm">
          <p>© {new Date().getFullYear()} Notion-Effect-Blog</p>
        </div>
      </div>
    </div>
  );
}
