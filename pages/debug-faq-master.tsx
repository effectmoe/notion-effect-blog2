import React, { useState, useEffect } from 'react';
import { Loading } from '../components/Loading';

const DebugFAQMasterPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [targetBlockId, setTargetBlockId] = useState('');
  const [collectionData, setCollectionData] = useState<any>(null);
  const [pageIdInput, setPageIdInput] = useState('');
  
  // CafeKinesiページのID（実際のIDに置き換えてください）
  const cafeKinesiPageId = pageIdInput || 'YOUR_CAFEKINESI_PAGE_ID_HERE';

  const fetchDebugData = async (blockId?: string) => {
    try {
      setLoading(true);
      setError(null);
      
      let url = `/api/debug-faq-block?pageId=${cafeKinesiPageId}`;
      if (blockId) {
        url += `&blockId=${blockId}`;
      }
      
      const response = await fetch(url);
      const result = await response.json();
      
      if (result.success) {
        setData(result);
      } else {
        setError(result.error || 'データの取得に失敗しました');
      }
    } catch (err) {
      console.error('Error fetching debug data:', err);
      setError('データの取得中にエラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // 初期状態では何もしない（ユーザーがページIDを入力してから取得）
  }, []);

  const handleBlockInvestigation = (blockId: string) => {
    setTargetBlockId(blockId);
    fetchDebugData(blockId);
  };

  const fetchCollectionData = async (collectionId: string, viewId: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/debug-collection-data?collectionId=${collectionId}&viewId=${viewId}`);
      const result = await response.json();
      
      if (result.success) {
        setCollectionData(result);
      } else {
        setError(result.error || 'コレクションデータの取得に失敗しました');
      }
    } catch (err) {
      console.error('Error fetching collection data:', err);
      setError('コレクションデータの取得中にエラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <Loading />
        <p>デバッグデータを読み込んでいます...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: '#e74c3c' }}>
        <h2>エラー</h2>
        <p>{error}</p>
        <button onClick={() => fetchDebugData()} style={{ 
          marginTop: '20px',
          padding: '10px 20px',
          backgroundColor: '#3498db',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer'
        }}>
          再試行
        </button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 20px' }}>
      <h1>FAQマスター デバッグツール</h1>
      
      <div style={{ 
        marginBottom: '30px', 
        padding: '20px', 
        backgroundColor: '#f8f9fa', 
        borderRadius: '8px',
        border: '1px solid #dee2e6'
      }}>
        <h2>使い方</h2>
        <ol>
          <li>CafeKinesiページ内のコレクションビューブロックが下に表示されます</li>
          <li>FAQマスターのブロックを見つけて「詳細を調査」をクリック</li>
          <li>そのブロックの詳細情報（collection_id、view_ids、データ件数など）を確認</li>
        </ol>
        <p><strong>注意:</strong> CafeKinesiページのIDを正しく設定してください: <code>{cafeKinesiPageId}</code></p>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <label>
          ページID: 
          <input
            type="text"
            value={pageIdInput}
            onChange={(e) => setPageIdInput(e.target.value)}
            placeholder="ページIDを入力"
            style={{
              marginLeft: '10px',
              padding: '5px 10px',
              width: '400px',
              border: '1px solid #ccc',
              borderRadius: '4px'
            }}
          />
        </label>
        <button
          onClick={() => fetchDebugData()}
          style={{
            marginLeft: '10px',
            padding: '5px 15px',
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          取得
        </button>
      </div>

      {data && (
        <>
          <div style={{ marginBottom: '30px' }}>
            <h2>ページ情報</h2>
            <div style={{ 
              backgroundColor: '#e8f4f8', 
              padding: '15px', 
              borderRadius: '5px',
              fontFamily: 'monospace',
              fontSize: '14px'
            }}>
              <p><strong>Page ID:</strong> {data.page_id}</p>
              <p><strong>コレクションブロック数:</strong> {data.total_collection_blocks}</p>
              <p><strong>コレクション数:</strong> {data.collections_count}</p>
              <p><strong>ビュー数:</strong> {data.collection_views_count}</p>
            </div>
          </div>

          <div style={{ marginBottom: '30px' }}>
            <h2>コレクションビューブロック一覧</h2>
            {data.collection_blocks.map((block: any, index: number) => {
              const isFAQ = block.collection_name.includes('FAQ') || block.collection_name.includes('よくある');
              
              return (
                <div key={block.id} style={{ 
                  marginBottom: '20px',
                  padding: '20px',
                  backgroundColor: isFAQ ? '#fff3cd' : '#ffffff',
                  border: `2px solid ${isFAQ ? '#ffc107' : '#dee2e6'}`,
                  borderRadius: '8px'
                }}>
                  <h3 style={{ marginTop: 0 }}>
                    {index + 1}. {block.collection_name} {isFAQ && '⭐ (FAQの可能性)'}
                  </h3>
                  
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                    gap: '10px',
                    fontSize: '14px'
                  }}>
                    <div>
                      <strong>Block ID:</strong><br />
                      <code style={{ fontSize: '12px' }}>{block.id}</code>
                    </div>
                    <div>
                      <strong>Type:</strong> {block.type}
                    </div>
                    <div>
                      <strong>Collection ID:</strong><br />
                      <code style={{ fontSize: '12px' }}>{block.collection_id}</code>
                    </div>
                    <div>
                      <strong>View数:</strong> {block.view_ids.length}
                    </div>
                  </div>

                  {block.views.length > 0 && (
                    <div style={{ marginTop: '15px' }}>
                      <strong>ビュー情報:</strong>
                      {block.views.map((view: any, vIndex: number) => (
                        <div key={view.id} style={{ 
                          marginLeft: '20px', 
                          marginTop: '5px',
                          fontSize: '14px'
                        }}>
                          {vIndex + 1}. {view.name} (Type: {view.type})
                          {view.format?.property_filters && (
                            <span style={{ color: '#28a745' }}> ✓ フィルター有り</span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  <div style={{ marginTop: '15px' }}>
                    <button
                      onClick={() => handleBlockInvestigation(block.id)}
                      style={{
                        padding: '8px 16px',
                        backgroundColor: isFAQ ? '#ffc107' : '#007bff',
                        color: isFAQ ? '#000' : '#fff',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontWeight: 'bold',
                        marginRight: '10px'
                      }}
                    >
                      詳細を調査
                    </button>
                    
                    {block.view_ids.length > 0 && (
                      <button
                        onClick={() => fetchCollectionData(block.collection_id, block.view_ids[0])}
                        style={{
                          padding: '8px 16px',
                          backgroundColor: '#17a2b8',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontWeight: 'bold'
                        }}
                      >
                        データを確認
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {data.target_block_detail && (
            <div style={{ 
              marginTop: '40px',
              padding: '20px',
              backgroundColor: '#e7f3ff',
              border: '2px solid #0066cc',
              borderRadius: '8px'
            }}>
              <h2>ブロック詳細調査結果</h2>
              <pre style={{ 
                backgroundColor: '#f5f5f5', 
                padding: '15px', 
                borderRadius: '5px',
                overflow: 'auto',
                fontSize: '13px'
              }}>
                {JSON.stringify(data.target_block_detail, null, 2)}
              </pre>
              
              {data.target_block_detail.query_result && (
                <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#d4edda', borderRadius: '5px' }}>
                  <h3>クエリ結果サマリー</h3>
                  <p><strong>総アイテム数:</strong> {data.target_block_detail.query_result.total}</p>
                  <p><strong>取得済みアイテム数:</strong> {data.target_block_detail.query_result.block_count}</p>
                  <p><strong>さらにデータあり:</strong> {data.target_block_detail.query_result.has_more ? 'はい' : 'いいえ'}</p>
                </div>
              )}
            </div>
          )}

          {collectionData && (
            <div style={{ 
              marginTop: '40px',
              padding: '20px',
              backgroundColor: '#f0fff4',
              border: '2px solid #28a745',
              borderRadius: '8px'
            }}>
              <h2>コレクションデータ詳細</h2>
              
              <div style={{ marginBottom: '20px' }}>
                <h3>コレクション情報</h3>
                <p><strong>名前:</strong> {collectionData.collection.name}</p>
                <p><strong>ID:</strong> <code>{collectionData.collection.id}</code></p>
                {collectionData.collection.description && (
                  <p><strong>説明:</strong> {collectionData.collection.description}</p>
                )}
              </div>

              <div style={{ marginBottom: '20px' }}>
                <h3>ビュー情報</h3>
                <p><strong>名前:</strong> {collectionData.view.name}</p>
                <p><strong>タイプ:</strong> {collectionData.view.type}</p>
                <p><strong>フィルター:</strong> {collectionData.view.format?.property_filters ? 'あり' : 'なし'}</p>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <h3>クエリ結果</h3>
                <p><strong>総件数:</strong> {collectionData.query_result.total}</p>
                <p><strong>取得件数:</strong> {collectionData.query_result.block_ids_count}</p>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <h3>スキーマ</h3>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f8f9fa' }}>
                      <th style={{ padding: '8px', border: '1px solid #dee2e6', textAlign: 'left' }}>プロパティ名</th>
                      <th style={{ padding: '8px', border: '1px solid #dee2e6', textAlign: 'left' }}>タイプ</th>
                      <th style={{ padding: '8px', border: '1px solid #dee2e6', textAlign: 'left' }}>ID</th>
                    </tr>
                  </thead>
                  <tbody>
                    {collectionData.schema.map((prop: any) => (
                      <tr key={prop.id}>
                        <td style={{ padding: '8px', border: '1px solid #dee2e6' }}>{prop.name}</td>
                        <td style={{ padding: '8px', border: '1px solid #dee2e6' }}>{prop.type}</td>
                        <td style={{ padding: '8px', border: '1px solid #dee2e6', fontFamily: 'monospace', fontSize: '12px' }}>{prop.id}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <h3>サンプルデータ（最初の5件）</h3>
                {collectionData.sample_blocks.map((block: any, index: number) => (
                  <div key={block.id} style={{ 
                    marginBottom: '15px', 
                    padding: '10px', 
                    backgroundColor: '#ffffff',
                    border: '1px solid #dee2e6',
                    borderRadius: '4px'
                  }}>
                    <h4>{index + 1}. {block.title}</h4>
                    <div style={{ fontSize: '14px' }}>
                      {Object.entries(block.properties).map(([propName, propValue]: [string, any]) => (
                        <div key={propName} style={{ marginBottom: '5px' }}>
                          <strong>{propName}:</strong> {propValue.formatted || '(空)'}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <details style={{ marginTop: '20px' }}>
                <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>生データ（デバッグ用）</summary>
                <pre style={{ 
                  backgroundColor: '#f5f5f5', 
                  padding: '15px', 
                  borderRadius: '5px',
                  overflow: 'auto',
                  fontSize: '12px',
                  marginTop: '10px'
                }}>
                  {JSON.stringify(collectionData.raw_data, null, 2)}
                </pre>
              </details>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default DebugFAQMasterPage;