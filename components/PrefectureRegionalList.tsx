import React from 'react'
import Link from 'next/link'
import styles from './PrefectureRegionalList.module.css'

interface Prefecture {
  name: string
  url: string
}

interface RegionData {
  name: string
  prefectures: Prefecture[]
}

const regions: RegionData[] = [
  {
    name: '北海道',
    prefectures: [
      { name: '北海道', url: '#' }
    ]
  },
  {
    name: '東北',
    prefectures: [
      { name: '青森', url: '#' },
      { name: '岩手', url: '#' },
      { name: '秋田', url: '#' },
      { name: '宮城', url: '#' },
      { name: '山形', url: '#' },
      { name: '福島', url: '#' }
    ]
  },
  {
    name: '関東',
    prefectures: [
      { name: '茨城', url: '#' },
      { name: '栃木', url: '#' },
      { name: '群馬', url: '#' },
      { name: '埼玉', url: '#' },
      { name: '千葉', url: '#' },
      { name: '東京', url: '#' },
      { name: '神奈川', url: '#' }
    ]
  },
  {
    name: '中部',
    prefectures: [
      { name: '新潟', url: '#' },
      { name: '富山', url: '#' },
      { name: '石川', url: '#' },
      { name: '福井', url: '#' },
      { name: '山梨', url: '#' },
      { name: '長野', url: '#' },
      { name: '岐阜', url: '#' },
      { name: '静岡', url: '#' },
      { name: '愛知', url: '#' }
    ]
  },
  {
    name: '近畿',
    prefectures: [
      { name: '三重', url: '#' },
      { name: '滋賀', url: '#' },
      { name: '京都', url: '#' },
      { name: '大阪', url: '#' },
      { name: '兵庫', url: '#' },
      { name: '奈良', url: '#' },
      { name: '和歌山', url: '#' }
    ]
  },
  {
    name: '中国',
    prefectures: [
      { name: '鳥取', url: '#' },
      { name: '島根', url: '#' },
      { name: '岡山', url: '#' },
      { name: '広島', url: '#' },
      { name: '山口', url: '#' }
    ]
  },
  {
    name: '四国',
    prefectures: [
      { name: '徳島', url: '#' },
      { name: '香川', url: '#' },
      { name: '愛媛', url: '#' },
      { name: '高知', url: '#' }
    ]
  },
  {
    name: '九州・沖縄',
    prefectures: [
      { name: '福岡', url: '#' },
      { name: '佐賀', url: '#' },
      { name: '長崎', url: '#' },
      { name: '熊本', url: '#' },
      { name: '大分', url: '#' },
      { name: '宮崎', url: '#' },
      { name: '鹿児島', url: '#' },
      { name: '沖縄', url: '#' }
    ]
  }
]

export const PrefectureRegionalList: React.FC = () => {
  return (
    <div className={styles.container}>
      <table className={styles.regionTable}>
        <tbody>
          {regions.map((region) => (
            <tr key={region.name} className={styles.regionRow}>
              <td className={styles.regionName}>{region.name}</td>
              <td className={styles.prefectureList}>
                {region.prefectures.map((prefecture, index) => (
                  <React.Fragment key={prefecture.name}>
                    <Link href={prefecture.url} className={styles.prefectureLink}>
                      {prefecture.name}
                    </Link>
                    {index < region.prefectures.length - 1 && <span className={styles.separator}> </span>}
                  </React.Fragment>
                ))}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}