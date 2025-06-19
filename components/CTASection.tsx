import React from 'react'
import Link from 'next/link'
import styles from './CTASection.module.css'

interface CTAButton {
  text: string
  href: string
  variant?: 'primary' | 'secondary' | 'outline'
  icon?: React.ReactNode
}

interface CTASectionProps {
  title: string
  subtitle?: string
  buttons: CTAButton[]
  variant?: 'default' | 'centered' | 'split'
  backgroundImage?: string
  backgroundColor?: string
  className?: string
}

/**
 * CTA（Call to Action）セクションコンポーネント
 * B2Bサイトのコンバージョン促進用
 */
const CTASection: React.FC<CTASectionProps> = ({
  title,
  subtitle,
  buttons,
  variant = 'default',
  backgroundImage,
  backgroundColor,
  className = ''
}) => {
  const renderButton = (button: CTAButton, index: number) => {
    const buttonClass = `${styles.ctaButton} ${styles[button.variant || 'primary']}`
    
    return (
      <Link
        key={index}
        href={button.href}
        className={buttonClass}
      >
        {button.icon && <span className={styles.buttonIcon}>{button.icon}</span>}
        <span>{button.text}</span>
      </Link>
    )
  }

  return (
    <section 
      className={`${styles.ctaSection} ${styles[variant]} ${className}`}
      style={{
        backgroundImage: backgroundImage ? `url(${backgroundImage})` : undefined,
        backgroundColor: backgroundColor || undefined
      }}
    >
      <div className={styles.ctaContainer}>
        <div className={styles.ctaContent}>
          <h2 className={styles.ctaTitle}>{title}</h2>
          {subtitle && <p className={styles.ctaSubtitle}>{subtitle}</p>}
          
          <div className={styles.ctaButtons}>
            {buttons.map((button, index) => renderButton(button, index))}
          </div>
        </div>
      </div>
    </section>
  )
}

// よく使うCTAパターンをプリセットとして提供
export const CTAPresets = {
  // 資料請求CTA
  catalogRequest: {
    title: 'ビジネスに最適なアロマソリューションをご提案します',
    subtitle: '製品カタログ・導入事例集を無料でお送りします',
    buttons: [
      {
        text: '製品カタログをダウンロード',
        href: '/contact/catalog',
        variant: 'primary' as const
      },
      {
        text: '導入事例を見る',
        href: '/cases',
        variant: 'outline' as const
      }
    ]
  },
  
  // 無料相談CTA
  consultation: {
    title: 'アロマ空間演出のプロがご相談に応じます',
    subtitle: 'お客様のビジネスに最適なアロマソリューションをご提案',
    buttons: [
      {
        text: '無料相談を申し込む',
        href: '/contact/consultation',
        variant: 'primary' as const
      },
      {
        text: 'よくあるご質問',
        href: '#faq',
        variant: 'secondary' as const
      }
    ]
  },
  
  // サンプル請求CTA
  sampleRequest: {
    title: '実際の香りをお試しください',
    subtitle: '法人様限定で無料サンプルをご提供しています',
    buttons: [
      {
        text: 'サンプルを請求する',
        href: '/contact/sample',
        variant: 'primary' as const
      }
    ]
  },
  
  // パートナー募集CTA
  partnerRecruit: {
    title: '一緒にアロマビジネスを拡大しませんか？',
    subtitle: '代理店・パートナー企業を募集しています',
    buttons: [
      {
        text: 'パートナー募集要項を見る',
        href: '/partners',
        variant: 'primary' as const
      },
      {
        text: '説明会に参加する',
        href: '/contact/partner-seminar',
        variant: 'secondary' as const
      }
    ]
  },
  
  // OEM相談CTA
  oemInquiry: {
    title: 'オリジナルアロマ製品を作りませんか？',
    subtitle: '小ロットから対応可能。企画から製造まで一貫サポート',
    buttons: [
      {
        text: 'OEM製造について相談する',
        href: '/contact/oem',
        variant: 'primary' as const
      },
      {
        text: 'OEM実績を見る',
        href: '/oem/cases',
        variant: 'outline' as const
      }
    ]
  }
}

export default CTASection