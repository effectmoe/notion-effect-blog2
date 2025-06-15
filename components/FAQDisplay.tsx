import React, { useState, useEffect } from 'react';
import styles from './FAQDisplay.module.css';

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category?: string;
  isPublic?: boolean;
}

export const FAQDisplay: React.FC = () => {
  const [faqItems, setFaqItems] = useState<FAQItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchFAQData();
  }, []);

  const fetchFAQData = async () => {
    try {
      // FAQマスターデータベースのコレクションID
      const databaseId = '212b802c-b0c6-8046-b4ee-000b2833619c';
      const response = await fetch(`/api/fetch-faq-database?databaseId=${databaseId}`);
      const data = await response.json();

      if (data.success && data.items) {
        setFaqItems(data.items);
      }
    } catch (error) {
      console.error('FAQ取得エラー:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleItem = (id: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedItems(newExpanded);
  };

  if (loading) {
    return (
      <div className={styles.loading}>
        <p>FAQを読み込み中...</p>
      </div>
    );
  }

  if (faqItems.length === 0) {
    return null; // FAQがない場合は何も表示しない
  }

  return (
    <div className={styles.faqSection}>
      <h2 className={styles.title}>よくある質問</h2>
      <div className={styles.faqGrid}>
        {faqItems.map((item) => (
          <div key={item.id} className={styles.faqCard}>
            <button
              className={styles.questionButton}
              onClick={() => toggleItem(item.id)}
              aria-expanded={expandedItems.has(item.id)}
            >
              <h3 className={styles.questionText}>{item.question}</h3>
              <span className={styles.toggleIcon}>
                {expandedItems.has(item.id) ? '−' : '＋'}
              </span>
            </button>
            {expandedItems.has(item.id) && (
              <div className={styles.answerSection}>
                <p className={styles.answerText}>{item.answer}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};