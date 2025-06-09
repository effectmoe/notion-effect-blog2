import React, { useState } from 'react'
import Link from 'next/link'
import styles from './PrefectureGrid.module.css'

interface PrefectureGridProps {
  prefectures: Array<{
    name: string
    url: string
  }>
}

export const PrefectureGrid: React.FC<PrefectureGridProps> = ({ prefectures }) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedRegion, setSelectedRegion] = useState('all')

  const regions: Record<string, string[]> = {
    '北海道・東北': ['北海道', '青森県', '岩手県', '宮城県', '秋田県', '山形県', '福島県'],
    '関東': ['茨城県', '栃木県', '群馬県', '埼玉県', '千葉県', '東京都', '神奈川県'],
    '中部': ['新潟県', '富山県', '石川県', '福井県', '山梨県', '長野県', '岐阜県', '静岡県', '愛知県'],
    '近畿': ['三重県', '滋賀県', '京都府', '大阪府', '兵庫県', '奈良県', '和歌山県'],
    '中国': ['鳥取県', '島根県', '岡山県', '広島県', '山口県'],
    '四国': ['徳島県', '香川県', '愛媛県', '高知県'],
    '九州・沖縄': ['福岡県', '佐賀県', '長崎県', '熊本県', '大分県', '宮崎県', '鹿児島県', '沖縄県']
  }

  const filteredPrefectures = prefectures.filter(prefecture => {
    const matchesSearch = prefecture.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRegion = selectedRegion === 'all' || 
      Object.entries(regions).some(([regionName, prefectureNames]) => 
        regionName === selectedRegion && prefectureNames.includes(prefecture.name)
      )
    return matchesSearch && matchesRegion
  })

  return (
    <div className={styles.container}>
      <h3 className={styles.title}>公認インストラクター＆ナビゲーター紹介</h3>
      
      <div className={styles.controls}>
        <input
          type="text"
          placeholder="都道府県を検索..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={styles.searchInput}
        />
        
        <select
          value={selectedRegion}
          onChange={(e) => setSelectedRegion(e.target.value)}
          className={styles.regionSelect}
        >
          <option value="all">すべての地域</option>
          {Object.keys(regions).map(region => (
            <option key={region} value={region}>{region}</option>
          ))}
        </select>
      </div>

      <div className={styles.grid}>
        {filteredPrefectures.map((prefecture) => (
          <Link
            key={prefecture.name}
            href={prefecture.url}
            className={styles.prefectureCard}
          >
            <span className={styles.prefectureName}>{prefecture.name}</span>
          </Link>
        ))}
      </div>

      {filteredPrefectures.length === 0 && (
        <p className={styles.noResults}>該当する都道府県が見つかりません</p>
      )}
    </div>
  )
}