import React, { useEffect, useState } from 'react';

export function FAQDatabaseEmbed() {
  const [faqs, setFaqs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetch('/api/get-public-faqs')
      .then(res => res.json())
      .then(data => {
        setFaqs(data.items || []);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch FAQs:', err);
        setLoading(false);
      });
  }, []);
  
  if (loading) {
    return <div className={styles.faqLoading}>読み込み中...</div>;
  }
  
  if (faqs.length === 0) {
    return null;
  }
  
  return (
    <div className={styles.faqDatabase}>
      <h2>よくある質問</h2>
      <div className={styles.faqGrid}>
        {faqs.map((faq, index) => (
          <details key={index} className={styles.faqItem}>
            <summary className={styles.faqQuestion}>{faq.question}</summary>
            <div className={styles.faqAnswer}>{faq.answer}</div>
          </details>
        ))}
      </div>
    </div>
  );
}