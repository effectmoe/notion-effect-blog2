import React from 'react'
import Link from 'next/link'
import styles from './JapanMap.module.css'

interface Prefecture {
  id: string
  name: string
  path: string
  d: string // SVG path data
}

interface JapanMapProps {
  prefectures: Array<{
    name: string
    url: string
  }>
}

// SVG paths for each prefecture (simplified example - you'd need complete path data)
const prefectureData: Prefecture[] = [
  { id: 'hokkaido', name: '北海道', path: '/hokkaido', d: 'M400,50 L450,50 L450,100 L400,100 Z' },
  { id: 'aomori', name: '青森県', path: '/aomori', d: 'M380,120 L420,120 L420,150 L380,150 Z' },
  // Add all 47 prefectures with proper SVG paths
]

export const JapanMap: React.FC<JapanMapProps> = ({ prefectures }) => {
  const [hoveredPrefecture, setHoveredPrefecture] = React.useState<string | null>(null)

  // Map prefecture names to URLs
  const prefectureUrlMap = prefectures.reduce((acc, pref) => {
    acc[pref.name] = pref.url
    return acc
  }, {} as Record<string, string>)

  return (
    <div className={styles.mapContainer}>
      <svg
        viewBox="0 0 600 800"
        className={styles.map}
        xmlns="http://www.w3.org/2000/svg"
      >
        {prefectureData.map((prefecture) => (
          <Link
            key={prefecture.id}
            href={prefectureUrlMap[prefecture.name] || '#'}
          >
            <path
              d={prefecture.d}
              className={`${styles.prefecture} ${
                hoveredPrefecture === prefecture.id ? styles.hovered : ''
              }`}
              onMouseEnter={() => setHoveredPrefecture(prefecture.id)}
              onMouseLeave={() => setHoveredPrefecture(null)}
            />
          </Link>
        ))}
      </svg>
      
      {hoveredPrefecture && (
        <div className={styles.tooltip}>
          {prefectureData.find(p => p.id === hoveredPrefecture)?.name}
        </div>
      )}
    </div>
  )
}