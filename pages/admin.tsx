import * as React from 'react';
import { useRouter } from 'next/router';
import { CacheManagement } from '@/components/CacheManagement';
import { PageHead } from '@/components/PageHead';
import { Footer } from '@/components/Footer';
import styles from '@/components/styles.module.css';

export default function AdminPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = React.useState(false);
  const [password, setPassword] = React.useState('');
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    // セッションストレージから認証状態を確認
    const auth = sessionStorage.getItem('adminAuth');
    if (auth === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    
    // 簡易的なパスワード認証（本番環境では適切な認証システムを使用）
    const adminPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'admin123';
    
    if (password === adminPassword) {
      setIsAuthenticated(true);
      sessionStorage.setItem('adminAuth', 'true');
      setError('');
    } else {
      setError('パスワードが正しくありません');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem('adminAuth');
    router.push('/');
  };

  if (!isAuthenticated) {
    return (
      <>
        <PageHead title="管理画面 - ログイン" />
        
        <div className={styles.container}>
          <main className={styles.main}>
            <div style={{ 
              maxWidth: '400px', 
              margin: '100px auto',
              padding: '2rem',
              background: '#f9fafb',
              borderRadius: '8px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }}>
              <h1 style={{ textAlign: 'center', marginBottom: '2rem' }}>
                管理画面
              </h1>
              
              <form onSubmit={handleLogin}>
                <div style={{ marginBottom: '1rem' }}>
                  <label htmlFor="password" style={{ 
                    display: 'block', 
                    marginBottom: '0.5rem',
                    fontWeight: '500'
                  }}>
                    パスワード
                  </label>
                  <input
                    type="password"
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #e5e5e5',
                      borderRadius: '4px',
                      fontSize: '1rem'
                    }}
                    placeholder="パスワードを入力"
                    autoFocus
                  />
                </div>
                
                {error && (
                  <div style={{ 
                    color: '#ef4444', 
                    marginBottom: '1rem',
                    fontSize: '0.875rem'
                  }}>
                    {error}
                  </div>
                )}
                
                <button
                  type="submit"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    background: '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    fontSize: '1rem',
                    fontWeight: '500',
                    cursor: 'pointer'
                  }}
                >
                  ログイン
                </button>
              </form>
            </div>
          </main>
        </div>
        
        <Footer />
      </>
    );
  }

  return (
    <>
      <PageHead title="管理画面 - キャッシュ管理" />
      
      <div className={styles.container}>
        <main className={styles.main}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '2rem',
            padding: '1rem',
            background: '#f5f5f5',
            borderRadius: '8px'
          }}>
            <h1 style={{ margin: 0 }}>管理画面</h1>
            <button
              onClick={handleLogout}
              style={{
                padding: '0.5rem 1rem',
                background: '#ef4444',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '0.875rem'
              }}
            >
              ログアウト
            </button>
          </div>
          
          <CacheManagement />
        </main>
      </div>
      
      <Footer />
    </>
  );
}