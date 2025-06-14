import React, { useState } from 'react';
import { Loading } from '../components/Loading';

const InvestigateFAQPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [pageId, setPageId] = useState('');
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const investigate = async () => {
    if (!pageId.trim()) {
      setError('ページIDを入力してください');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setData(null);
      
      const response = await fetch(`/api/investigate-faq-master?pageId=${pageId}`);
      const result = await response.json();
      
      if (result.success) {
        setData(result);
      } else {
        setError(result.error || '調査に失敗しました');
      }
    } catch (err) {
      console.error('Error investigating:', err);
      setError('調査中にエラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 20px' }}>
      <h1>🔍 FAQマスター調査ツール</h1>
      
      <div style={{ 
        marginBottom: '30px', 
        padding: '20px', 
        backgroundColor: '#e3f2fd', 
        borderRadius: '8px'
      }}>
        <p>このツールは、NotionページのFAQマスターが表示されない問題を調査します。</p>
        <p>CafeKinesiページのIDを入力して、FAQマスターのブロック情報を確認してください。</p>
      </div>

      <div style={{ marginBottom: '30px' }}>
        <input
          type="text"
          value={pageId}
          onChange={(e) => setPageId(e.target.value)}
          placeholder="ページIDを入力（例: 1234567890abcdef）"
          style={{
            width: '500px',
            padding: '10px',
            fontSize: '16px',
            border: '2px solid #ddd',
            borderRadius: '4px',
            marginRight: '10px'
          }}
        />
        <button
          onClick={investigate}
          disabled={loading}
          style={{
            padding: '10px 20px',
            fontSize: '16px',
            backgroundColor: loading ? '#ccc' : '#2196f3',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? '調査中...' : '調査開始'}
        </button>
      </div>

      {error && (
        <div style={{ 
          padding: '15px', 
          backgroundColor: '#ffebee', 
          color: '#c62828',
          borderRadius: '4px',
          marginBottom: '20px'
        }}>
          <strong>エラー:</strong> {error}
        </div>
      )}

      {loading && (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <Loading />
          <p>FAQマスターを調査中...</p>
        </div>
      )}

      {data && !loading && (
        <div>
          <div style={{ 
            padding: '20px', 
            backgroundColor: data.faqBlocksFound > 0 ? '#e8f5e9' : '#fff3e0',
            borderRadius: '8px',
            marginBottom: '20px'
          }}>
            <h2>調査結果サマリー</h2>
            <p><strong>FAQブロック数:</strong> {data.faqBlocksFound}</p>
            <p><strong>総コレクション数:</strong> {data.summary.totalCollections}</p>
            <p><strong>総ビュー数:</strong> {data.summary.totalViews}</p>
          </div>

          {data.faqBlocksFound === 0 ? (
            <div style={{ 
              padding: '20px', 
              backgroundColor: '#ffebee',
              borderRadius: '8px'
            }}>
              <h3>⚠️ FAQマスターが見つかりません</h3>
              <p>指定されたページにFAQマスターのブロックが見つかりませんでした。</p>
              <ul>
                <li>ページIDが正しいか確認してください</li>
                <li>FAQマスターがリンクドデータベースビューとして追加されているか確認してください</li>
                <li>コレクション名に「FAQ」または「よくある」が含まれているか確認してください</li>
              </ul>
            </div>
          ) : (
            <div>
              {data.faqBlocks.map((faq: any, index: number) => (
                <div key={faq.blockId} style={{ 
                  marginBottom: '30px',
                  padding: '20px',
                  backgroundColor: '#ffffff',
                  border: '2px solid #4caf50',
                  borderRadius: '8px'
                }}>
                  <h3>📋 FAQブロック {index + 1}: {faq.collectionName}</h3>
                  
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                    gap: '15px',
                    marginBottom: '20px'
                  }}>
                    <div>
                      <strong>Block ID:</strong><br />
                      <code style={{ fontSize: '12px' }}>{faq.blockId}</code>
                    </div>
                    <div>
                      <strong>Block Type:</strong> {faq.blockType}
                    </div>
                    <div>
                      <strong>Collection ID:</strong><br />
                      <code style={{ fontSize: '12px' }}>{faq.collectionId}</code>
                    </div>
                  </div>

                  <div style={{ marginBottom: '20px' }}>
                    <h4>ビュー詳細 ({faq.viewIds.length}個)</h4>
                    {faq.viewDetails.map((view: any, vIndex: number) => (
                      <div key={view.id} style={{ 
                        marginBottom: '15px',
                        padding: '15px',
                        backgroundColor: '#f5f5f5',
                        borderRadius: '4px'
                      }}>
                        <h5>ビュー {vIndex + 1}: {view.name}</h5>
                        <p><strong>View ID:</strong> <code>{view.id}</code></p>
                        <p><strong>Type:</strong> {view.type}</p>
                        <p><strong>アイテム数:</strong> {view.itemCount}</p>
                        <p><strong>プロパティフィルター:</strong> {view.hasPropertyFilters ? '✅ あり' : '❌ なし'}</p>
                        
                        {view.propertyFilters.length > 0 && (
                          <details>
                            <summary style={{ cursor: 'pointer' }}>フィルター詳細</summary>
                            <pre style={{ fontSize: '12px', overflow: 'auto' }}>
                              {JSON.stringify(view.propertyFilters, null, 2)}
                            </pre>
                          </details>
                        )}

                        {view.sampleItems.length > 0 && (
                          <div style={{ marginTop: '10px' }}>
                            <strong>サンプルアイテム:</strong>
                            {view.sampleItems.map((item: any, iIndex: number) => (
                              <div key={item.id} style={{ 
                                marginLeft: '20px', 
                                marginTop: '5px',
                                fontSize: '14px'
                              }}>
                                {iIndex + 1}. {item.title}
                                {item.properties['公開'] !== undefined && (
                                  <span style={{ marginLeft: '10px', color: item.properties['公開'] === 'Yes' ? 'green' : 'red' }}>
                                    (公開: {item.properties['公開'] || 'No'})
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {faq.queryResult && (
                    <div style={{ 
                      padding: '15px',
                      backgroundColor: '#e8f5e9',
                      borderRadius: '4px',
                      marginBottom: '15px'
                    }}>
                      <h4>クエリ結果</h4>
                      <p><strong>総件数:</strong> {faq.queryResult.total}</p>
                      <p><strong>ブロックID数:</strong> {faq.queryResult.blockIdsCount}</p>
                      <p><strong>さらにデータあり:</strong> {faq.queryResult.hasMore ? 'はい' : 'いいえ'}</p>
                    </div>
                  )}

                  <details style={{ marginTop: '15px' }}>
                    <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>スキーマ情報</summary>
                    <table style={{ 
                      width: '100%', 
                      marginTop: '10px',
                      borderCollapse: 'collapse'
                    }}>
                      <thead>
                        <tr style={{ backgroundColor: '#f5f5f5' }}>
                          <th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'left' }}>プロパティ名</th>
                          <th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'left' }}>タイプ</th>
                          <th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'left' }}>ID</th>
                        </tr>
                      </thead>
                      <tbody>
                        {faq.schema.map((prop: any) => (
                          <tr key={prop.id}>
                            <td style={{ padding: '8px', border: '1px solid #ddd' }}>{prop.name}</td>
                            <td style={{ padding: '8px', border: '1px solid #ddd' }}>{prop.type}</td>
                            <td style={{ padding: '8px', border: '1px solid #ddd', fontFamily: 'monospace', fontSize: '12px' }}>{prop.id}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </details>
                </div>
              ))}
            </div>
          )}

          <details style={{ marginTop: '30px' }}>
            <summary style={{ cursor: 'pointer', fontWeight: 'bold', fontSize: '18px' }}>
              🔧 完全な調査データ（デバッグ用）
            </summary>
            <pre style={{ 
              backgroundColor: '#f5f5f5', 
              padding: '20px', 
              borderRadius: '8px',
              overflow: 'auto',
              fontSize: '12px',
              marginTop: '10px'
            }}>
              {JSON.stringify(data, null, 2)}
            </pre>
          </details>
        </div>
      )}
    </div>
  );
};

export default InvestigateFAQPage;