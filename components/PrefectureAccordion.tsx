import React, { useState } from 'react'
import Link from 'next/link'
import styles from './PrefectureAccordion.module.css'

interface Region {
  name: string
  prefectures: Array<{
    name: string
    url: string
  }>
}

interface PrefectureAccordionProps {
  prefectures: Array<{
    name: string
    url: string
  }>
}

const regions: Record<string, string[]> = {
  '北海道・東北': ['北海道', '青森県', '岩手県', '宮城県', '秋田県', '山形県', '福島県'],
  '関東': ['茨城県', '栃木県', '群馬県', '埼玉県', '千葉県', '東京都', '神奈川県'],
  '中部': ['新潟県', '富山県', '石川県', '福井県', '山梨県', '長野県', '岐阜県', '静岡県', '愛知県'],
  '近畿': ['三重県', '滋賀県', '京都府', '大阪府', '兵庫県', '奈良県', '和歌山県'],
  '中国': ['鳥取県', '島根県', '岡山県', '広島県', '山口県'],
  '四国': ['徳島県', '香川県', '愛媛県', '高知県'],
  '九州・沖縄': ['福岡県', '佐賀県', '長崎県', '熊本県', '大分県', '宮崎県', '鹿児島県', '沖縄県']
}

export const PrefectureAccordion: React.FC<PrefectureAccordionProps> = ({ prefectures }) => {
  const [openRegions, setOpenRegions] = useState<Set<string>>(new Set(['関東']))

  const toggleRegion = (regionName: string) => {
    setOpenRegions(prev => {
      const newSet = new Set(prev)
      if (newSet.has(regionName)) {
        newSet.delete(regionName)
      } else {
        newSet.add(regionName)
      }
      return newSet
    })
  }

  // Group prefectures by region
  const groupedPrefectures: Region[] = Object.entries(regions).map(([regionName, prefectureNames]) => ({
    name: regionName,
    prefectures: prefectures.filter(p => prefectureNames.includes(p.name))
  }))

  return (
    <div className={styles.accordion}>
      <h3 className={styles.title}>公認インストラクター＆ナビゲーター紹介</h3>
      
      {groupedPrefectures.map((region) => (
        <div key={region.name} className={styles.region}>
          <button
            className={styles.regionHeader}
            onClick={() => toggleRegion(region.name)}
            aria-expanded={openRegions.has(region.name)}
          >
            <span className={styles.regionName}>{region.name}</span>
            <span className={styles.chevron}>
              {openRegions.has(region.name) ? '▼' : '▶'}
            </span>
          </button>
          
          {openRegions.has(region.name) && (
            <div className={styles.prefectureList}>
              {region.prefectures.map((prefecture) => (
                <Link
                  key={prefecture.name}
                  href={prefecture.url}
                  className={styles.prefectureLink}
                >
                  {prefecture.name}
                </Link>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}