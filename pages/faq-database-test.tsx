import React, { useEffect, useState } from 'react';
import { NotionAPI } from 'notion-client';
import { ExtendedRecordMap } from 'notion-types';
import { Loading } from '../components/Loading';

// FAQアイテムの型定義
interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
  isPublic: boolean;
}

const FAQDatabasePage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [faqItems, setFaqItems] = useState<FAQItem[]>([]);
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  useEffect(() => {
    fetchFAQData();
  }, []);

  const fetchFAQData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // FAQマスターデータベースのID（実際のIDに置き換えてください）
      const databaseId = 'YOUR_FAQ_DATABASE_ID_HERE';
      
      const response = await fetch(`/api/fetch-faq-database?databaseId=${databaseId}`);
      const data = await response.json();
      
      if (data.success) {
        setFaqItems(data.items);
      } else {
        setError(data.error || 'FAQデータの取得に失敗しました');
      }
    } catch (err) {
      console.error('Error fetching FAQ data:', err);
      setError('FAQデータの取得中にエラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  const toggleItem = (itemId: string) => {
    setExpandedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  // カテゴリー別にグループ化
  const groupedItems = faqItems.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, FAQItem[]>);

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <Loading />
        <p>FAQデータを読み込んでいます...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: '#e74c3c' }}>
        <h2>エラー</h2>
        <p>{error}</p>
        <button onClick={fetchFAQData} style={{ 
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
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '40px 20px' }}>
      <h1>よくあるご質問（FAQマスター）</h1>
      
      <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f0f0f0', borderRadius: '5px' }}>
        <h3>🔍 表示条件</h3>
        <p>このシステムでは、Notionデータベースの「公開」プロパティが<strong>オン（✓）</strong>になっているFAQ項目のみが表示されます。</p>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <p>表示中のFAQ: {faqItems.length}件</p>
      </div>

      {Object.entries(groupedItems).map(([category, items]) => (
        <div key={category} style={{ marginBottom: '30px' }}>
          <h2 style={{ 
            color: '#2c3e50',
            borderBottom: '2px solid #3498db',
            paddingBottom: '10px',
            marginBottom: '20px'
          }}>
            {category}
          </h2>
          
          {items.map(item => (
            <div key={item.id} style={{ 
              marginBottom: '15px',
              border: '1px solid #ddd',
              borderRadius: '5px',
              overflow: 'hidden'
            }}>
              <button
                onClick={() => toggleItem(item.id)}
                style={{
                  width: '100%',
                  padding: '15px',
                  backgroundColor: '#f8f9fa',
                  border: 'none',
                  textAlign: 'left',
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <span style={{ fontWeight: 'bold' }}>Q. {item.question}</span>
                <span style={{ fontSize: '20px' }}>
                  {expandedItems.includes(item.id) ? '−' : '+'}
                </span>
              </button>
              
              {expandedItems.includes(item.id) && (
                <div style={{
                  padding: '15px',
                  backgroundColor: 'white',
                  borderTop: '1px solid #ddd'
                }}>
                  <p style={{ margin: 0 }}>A. {item.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      ))}
      
      {faqItems.length === 0 && (
        <div style={{ 
          textAlign: 'center', 
          padding: '40px',
          backgroundColor: '#f8f9fa',
          borderRadius: '5px'
        }}>
          <p>現在、公開されているFAQはありません。</p>
        </div>
      )}
    </div>
  );
};

export default FAQDatabasePage;
