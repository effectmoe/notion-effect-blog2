import React, { useEffect, useState } from 'react';
import styles from './PublicFAQ.module.css';

interface FAQ {
  id: string;
  title: string;
  answer: string;
  category: string;
  isPublic: boolean;
  lastEdited: string | null;
}

export const PublicFAQ: React.FC = () => {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFAQs = async () => {
      try {
        const response = await fetch('/api/get-public-faqs');
        const data = await response.json();
        
        if (data.success) {
          setFaqs(data.faqs);
        } else {
          setError(data.error || 'FAQの取得に失敗しました');
        }
      } catch (err) {
        setError('FAQの取得中にエラーが発生しました');
      } finally {
        setLoading(false);
      }
    };

    fetchFAQs();
  }, []);

  if (loading) {
    return <div className={styles.loading}>読み込み中...</div>;
  }

  if (error) {
    return <div className={styles.error}>{error}</div>;
  }

  if (faqs.length === 0) {
    return <div className={styles.empty}>公開されているFAQはありません</div>;
  }

  // カテゴリ別にグループ化
  const groupedFaqs = faqs.reduce((acc, faq) => {
    const category = faq.category || 'その他';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(faq);
    return acc;
  }, {} as Record<string, FAQ[]>);

  return (
    <div className={styles.faqContainer}>
      <h2 className={styles.title}>よくある質問</h2>
      
      {Object.entries(groupedFaqs).map(([category, categoryFaqs]) => (
        <div key={category} className={styles.categorySection}>
          <h3 className={styles.categoryTitle}>{category}</h3>
          
          <div className={styles.faqList}>
            {categoryFaqs.map((faq) => (
              <details key={faq.id} className={styles.faqItem}>
                <summary className={styles.question}>{faq.title}</summary>
                <div className={styles.answer}>{faq.answer}</div>
              </details>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};