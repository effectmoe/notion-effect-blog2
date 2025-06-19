import * as React from 'react';
import { useRouter } from 'next/router';
import { CacheManagement } from '@/components/CacheManagement';
import { PageHead } from '@/components/PageHead';
import { Footer } from '@/components/Footer';
import styles from '@/components/styles.module.css';

// Disable static generation for this page
export const getServerSideProps = () => {
  return { props: {} }
}

export default function AdminPage() {
  const router = typeof window !== 'undefined' ? useRouter() : null;
  const [isAuthenticated, setIsAuthenticated] = React.useState(false);
  const [password, setPassword] = React.useState('');
  const [error, setError] = React.useState('');
  const [showHelp, setShowHelp] = React.useState(false);

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
    if (router) {
      router.push('/');
    } else {
      window.location.href = '/';
    }
  };

  // ヘルプセクションのコンポーネント
  const HelpSection = () => (
    <div style={{
      marginTop: '1.5rem',
      padding: '1.5rem',
      backgroundColor: '#dbeafe',
      borderRadius: '0.5rem',
      border: '1px solid #93c5fd'
    }}>
      <h3 style={{
        fontSize: '1.125rem',
        fontWeight: '600',
        marginBottom: '1rem',
        color: '#1e3a8a'
      }}>
        📖 キャッシュ管理の使い方ガイド
      </h3>
      
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
        fontSize: '0.875rem',
        color: '#374151'
      }}>
        {/* 基本的な使い方 */}
        <div>
          <h4 style={{ fontWeight: '600', color: '#111827', marginBottom: '0.5rem' }}>
            🔧 基本的な使い方
          </h4>
          <div style={{ marginLeft: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <p>• <strong>キャッシュをクリア</strong>: 保存されているキャッシュをすべて削除します</p>
            <p>• <strong>キャッシュウォームアップ</strong>: すべてのページを事前に読み込んでキャッシュを作成します</p>
            <p style={{ color: '#6b7280', fontStyle: 'italic' }}>→ 初回アクセス時の表示速度が大幅に向上します</p>
          </div>
        </div>

        {/* いつ使うか */}
        <div>
          <h4 style={{ fontWeight: '600', color: '#111827', marginBottom: '0.5rem' }}>
            ⏰ いつ使うか
          </h4>
          <div style={{ marginLeft: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <p>• <strong>Notionでコンテンツを更新した後</strong></p>
            <p style={{ marginLeft: '1rem', color: '#6b7280' }}>→ 「キャッシュをクリア」してから「ウォームアップ」を実行</p>
            <p>• <strong>サイトの表示が遅いと感じたとき</strong></p>
            <p style={{ marginLeft: '1rem', color: '#6b7280' }}>→ 「ウォームアップ」を実行してキャッシュを再生成</p>
            <p>• <strong>定期メンテナンス（週1回程度）</strong></p>
            <p style={{ marginLeft: '1rem', color: '#6b7280' }}>→ 古いキャッシュをクリアして最新状態に保つ</p>
          </div>
        </div>

        {/* 処理時間の目安 */}
        <div>
          <h4 style={{ fontWeight: '600', color: '#111827', marginBottom: '0.5rem' }}>
            ⏱️ 処理時間の目安
          </h4>
          <div style={{ marginLeft: '1rem' }}>
            <p>• キャッシュクリア: <span style={{ color: '#059669' }}>即座に完了</span></p>
            <p>• ウォームアップ: <span style={{ color: '#f97316' }}>ページ数 × 2-3秒</span></p>
            <p style={{ color: '#6b7280', fontSize: '0.75rem', marginTop: '0.25rem' }}>
              （例: 10ページなら約20-30秒）
            </p>
          </div>
        </div>

        {/* 今後追加予定の機能 */}
        <div style={{
          padding: '1rem',
          backgroundColor: '#fef3c7',
          borderRadius: '0.25rem',
          border: '1px solid #fde68a'
        }}>
          <h4 style={{ fontWeight: '600', color: '#111827', marginBottom: '0.5rem' }}>
            📋 今後追加予定の機能
          </h4>
          <div style={{ marginLeft: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div>
              <p style={{ fontWeight: '500' }}>1. クリア＆ウォームアップ（一括処理）</p>
              <p style={{ color: '#6b7280', fontSize: '0.75rem', marginLeft: '1rem' }}>
                キャッシュクリアとウォームアップを一度に実行
              </p>
              <p style={{ color: '#6b7280', fontSize: '0.75rem', marginLeft: '1rem' }}>
                → コンテンツ大幅更新時に便利
              </p>
            </div>
            <div>
              <p style={{ fontWeight: '500' }}>2. 自動実行機能</p>
              <p style={{ color: '#6b7280', fontSize: '0.75rem', marginLeft: '1rem' }}>
                毎日深夜に自動でウォームアップを実行
              </p>
              <p style={{ color: '#6b7280', fontSize: '0.75rem', marginLeft: '1rem' }}>
                → 常に最適な状態を維持
              </p>
            </div>
          </div>
        </div>

        {/* デバッグツール */}
        <div style={{
          padding: '1rem',
          backgroundColor: '#f3e8ff',
          borderRadius: '0.25rem',
          border: '1px solid #e9d5ff',
          marginBottom: '1rem'
        }}>
          <h4 style={{ fontWeight: '600', color: '#6b21a8', marginBottom: '0.5rem' }}>
            🛠️ トラブルシューティング
          </h4>
          <div style={{ marginLeft: '1rem', color: '#7c3aed' }}>
            <p><strong>問題: ウォームアップが失敗する</strong></p>
            <div style={{ marginLeft: '1rem', fontSize: '0.825rem', color: '#4c1d95' }}>
              <p>→ 「詳細な操作」内の「デバッグテスト」を実行してエラー詳細を確認</p>
              <p>→ 削除されたページや権限のないページが原因の可能性</p>
            </div>
            <p style={{ marginTop: '0.5rem' }}><strong>問題: 特定のページが表示されない</strong></p>
            <div style={{ marginLeft: '1rem', fontSize: '0.825rem', color: '#4c1d95' }}>
              <p>→ そのページのURLを直接アクセスして個別にキャッシュを作成</p>
              <p>→ Notionでページの公開設定を確認</p>
            </div>
          </div>
        </div>

        {/* 注意事項 */}
        <div style={{
          padding: '1rem',
          backgroundColor: '#fee2e2',
          borderRadius: '0.25rem',
          border: '1px solid #fecaca'
        }}>
          <h4 style={{ fontWeight: '600', color: '#991b1b', marginBottom: '0.5rem' }}>
            ⚠️ 注意事項
          </h4>
          <div style={{ marginLeft: '1rem', color: '#b91c1c' }}>
            <p>• ウォームアップ中は処理負荷が高くなります</p>
            <p>• アクセスが多い時間帯は避けることを推奨</p>
            <p>• 処理中にページを離れても継続されます</p>
          </div>
        </div>
      </div>
    </div>
  );

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
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <button
                onClick={() => setShowHelp(!showHelp)}
                style={{
                  padding: '0.5rem 1rem',
                  background: '#dbeafe',
                  color: '#1e40af',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#bfdbfe' }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#dbeafe' }}
              >
                {showHelp ? '❌ ヘルプを閉じる' : '❓ 使い方を見る'}
              </button>
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
          </div>
          
          {/* ヘルプセクションの表示 */}
          {showHelp && <HelpSection />}
          
          <CacheManagement />
        </main>
      </div>
      
      <Footer />
    </>
  );
}