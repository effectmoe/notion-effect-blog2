import React, { useState } from 'react'
import styles from './FAQ.module.css'
import StructuredData from './StructuredData'

interface FAQItem {
  question: string
  answer: string
  category?: string
}

interface FAQProps {
  items: FAQItem[]
  title?: string
  showStructuredData?: boolean
  expandedByDefault?: boolean
}

/**
 * FAQコンポーネント
 * アコーディオン形式でよくある質問を表示
 * SEO/LLMO対策として構造化データも出力
 */
const FAQ: React.FC<FAQProps> = ({ 
  items, 
  title = 'よくあるご質問',
  showStructuredData = true,
  expandedByDefault = false
}) => {
  const [expandedItems, setExpandedItems] = useState<number[]>(
    expandedByDefault ? items.map((_, index) => index) : []
  )

  const toggleItem = (index: number) => {
    setExpandedItems(prev => 
      prev.includes(index) 
        ? prev.filter(i => i !== index)
        : [...prev, index]
    )
  }

  // カテゴリー別にグループ化
  const groupedItems = items.reduce((acc, item, index) => {
    const category = item.category || 'その他'
    if (!acc[category]) {
      acc[category] = []
    }
    acc[category].push({ ...item, originalIndex: index })
    return acc
  }, {} as Record<string, (FAQItem & { originalIndex: number })[]>)

  return (
    <>
      {showStructuredData && (
        <StructuredData 
          pageType="FAQPage" 
          data={{ faqs: items }}
        />
      )}
      
      <section className={styles.faqSection}>
        <h2 className={styles.faqTitle}>{title}</h2>
        
        {Object.keys(groupedItems).length > 1 ? (
          // カテゴリーがある場合
          Object.entries(groupedItems).map(([category, categoryItems]) => (
            <div key={category} className={styles.faqCategory}>
              <h3 className={styles.categoryTitle}>{category}</h3>
              <div className={styles.faqList}>
                {categoryItems.map((item) => (
                  <div 
                    key={item.originalIndex}
                    className={`${styles.faqItem} ${
                      expandedItems.includes(item.originalIndex) ? styles.expanded : ''
                    }`}
                  >
                    <button
                      className={styles.faqQuestion}
                      onClick={() => toggleItem(item.originalIndex)}
                      aria-expanded={expandedItems.includes(item.originalIndex)}
                    >
                      <span className={styles.questionText}>
                        Q. {item.question}
                      </span>
                      <span className={styles.toggleIcon}>
                        {expandedItems.includes(item.originalIndex) ? '−' : '+'}
                      </span>
                    </button>
                    
                    <div 
                      className={styles.faqAnswer}
                      style={{
                        maxHeight: expandedItems.includes(item.originalIndex) ? '500px' : '0'
                      }}
                    >
                      <div className={styles.answerContent}>
                        A. {item.answer}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        ) : (
          // カテゴリーがない場合
          <div className={styles.faqList}>
            {items.map((item, index) => (
              <div 
                key={index}
                className={`${styles.faqItem} ${
                  expandedItems.includes(index) ? styles.expanded : ''
                }`}
              >
                <button
                  className={styles.faqQuestion}
                  onClick={() => toggleItem(index)}
                  aria-expanded={expandedItems.includes(index)}
                >
                  <span className={styles.questionText}>
                    Q. {item.question}
                  </span>
                  <span className={styles.toggleIcon}>
                    {expandedItems.includes(index) ? '−' : '+'}
                  </span>
                </button>
                
                <div 
                  className={styles.faqAnswer}
                  style={{
                    maxHeight: expandedItems.includes(index) ? '500px' : '0'
                  }}
                >
                  <div className={styles.answerContent}>
                    A. {item.answer}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  )
}

// デフォルトのFAQ項目（B2Bアロマメーカー向け）
export const defaultFAQItems: FAQItem[] = [
  {
    question: '最小ロットはどのくらいですか？',
    answer: '製品により異なりますが、一般的には1L〜承っております。初回お取引の場合は、お試しいただきやすい小ロットからのご注文も可能です。詳細はお問い合わせください。',
    category: 'ご注文について'
  },
  {
    question: 'サンプルは提供していますか？',
    answer: 'はい、法人様向けに無料サンプルをご用意しております。お問い合わせフォームより、ご希望の製品と用途をお知らせください。通常3営業日以内に発送いたします。',
    category: 'ご注文について'
  },
  {
    question: 'OEM製造の納期はどのくらいですか？',
    answer: '通常、ご発注から2-3ヶ月程度です。数量や仕様により変動しますが、お急ぎの場合は特急対応も可能です。まずはご相談ください。',
    category: 'OEM・カスタマイズ'
  },
  {
    question: 'オリジナルブレンドの開発は可能ですか？',
    answer: 'はい、お客様のブランドコンセプトやターゲット層に合わせたオリジナルブレンドの開発が可能です。専属の調香師がご要望をお伺いし、最適な香りをご提案いたします。',
    category: 'OEM・カスタマイズ'
  },
  {
    question: '品質保証について教えてください',
    answer: 'ISO9001認証を取得し、全ロット検査を実施しています。成分分析表、安全データシート(SDS)、品質証明書の提供も可能です。また、トレーサビリティシステムにより原料の産地から製造工程まで追跡可能です。',
    category: '品質・安全性'
  },
  {
    question: '使用している原料の産地を教えてください',
    answer: '主要原料は、フランス・プロヴァンス地方、イタリア・カラブリア州、オーストラリア・タスマニア島など、各精油の最適産地から直接輸入しています。すべて契約農家による有機栽培または野生種を使用しています。',
    category: '品質・安全性'
  },
  {
    question: '支払い条件を教えてください',
    answer: '初回お取引は前払い、継続取引の場合は月末締め翌月末払いなど、柔軟に対応いたします。与信審査により、売掛取引も可能です。',
    category: 'お支払い・契約'
  },
  {
    question: '代理店契約は可能ですか？',
    answer: 'はい、エリアや業界に応じた代理店契約が可能です。独占販売権の付与、特別価格の設定、販促支援など、パートナー様のビジネス拡大をサポートする制度をご用意しています。',
    category: 'お支払い・契約'
  },
  {
    question: 'アフターサポートはありますか？',
    answer: '導入後も安心してご利用いただけるよう、使用方法のレクチャー、メンテナンス指導、追加注文の簡易化など、充実したアフターサポートを提供しています。',
    category: 'サポート'
  },
  {
    question: '導入事例を教えてください',
    answer: '高級ホテル、スパ施設、医療機関、オフィスビルなど、500社以上の導入実績があります。守秘義務の範囲内で、類似業界の成功事例をご紹介することも可能です。',
    category: 'サポート'
  }
]

export default FAQ