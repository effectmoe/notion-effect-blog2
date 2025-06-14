import React, { useState } from 'react';
import styles from './FAQSection.module.css';

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category?: string;
}

const faqData: FAQItem[] = [
  {
    id: '1',
    question: 'カフェキネシとは何ですか？',
    answer: 'カフェキネシは、キネシオロジー（筋肉反射テスト）とアロマテラピーを組み合わせた独自のヒーリングメソッドです。筋肉の反応を通じて心身の状態を読み取り、最適なアロマオイルを選んで癒しをもたらします。',
    category: '基本情報'
  },
  {
    id: '2',
    question: '講座料金はいくらですか？',
    answer: 'カフェキネシ基礎講座は33,000円（税込）です。この料金には、テキスト、実習用アロマオイル、修了証が含まれています。',
    category: '料金'
  },
  {
    id: '3',
    question: 'オンライン受講は可能ですか？',
    answer: 'はい、可能です。Zoomを使用したオンライン講座を開催しています。実技指導も画面越しに丁寧に行いますので、対面講座と同等の内容を学んでいただけます。',
    category: '受講方法'
  },
  {
    id: '4',
    question: '講座の所要時間は？',
    answer: '基礎講座は1日6時間（休憩含む）です。10:00～17:00の開催が一般的ですが、ご希望により2日間に分けての受講も可能です。',
    category: '受講方法'
  },
  {
    id: '5',
    question: '資格の有効期限は？',
    answer: 'カフェキネシの資格に有効期限はありません。一度取得されれば、生涯有効です。ただし、スキルアップのための継続学習講座もご用意しています。',
    category: '資格'
  }
];

export const FAQSection: React.FC = () => {
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const toggleItem = (id: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedItems(newExpanded);
  };

  return (
    <div className={styles.faqSection}>
      <h2 className={styles.title}>よくある質問</h2>
      <div className={styles.faqList}>
        {faqData.map((item) => (
          <div key={item.id} className={styles.faqItem}>
            <button
              className={styles.question}
              onClick={() => toggleItem(item.id)}
              aria-expanded={expandedItems.has(item.id)}
            >
              <span className={styles.questionText}>{item.question}</span>
              <span className={styles.icon}>
                {expandedItems.has(item.id) ? '−' : '＋'}
              </span>
            </button>
            {expandedItems.has(item.id) && (
              <div className={styles.answer}>
                <p>{item.answer}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};