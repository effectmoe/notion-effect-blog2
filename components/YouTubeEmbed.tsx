import React, { useState } from 'react'

interface YouTubeEmbedProps {
  url: string
  title?: string
}

export const YouTubeEmbed: React.FC<YouTubeEmbedProps> = ({ url, title }) => {
  const [imageError, setImageError] = useState(false)
  const [showVideo, setShowVideo] = useState(false)
  
  // YouTube URLからビデオIDを抽出
  const getVideoId = (url: string): string | null => {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
      /youtube\.com\/v\/([^&\n?#]+)/,
      /youtube\.com\/shorts\/([^&\n?#]+)/
    ]
    
    for (const pattern of patterns) {
      const match = url.match(pattern)
      if (match) return match[1]
    }
    
    return null
  }
  
  const videoId = getVideoId(url)
  
  if (!videoId) {
    return (
      <div style={{
        padding: '2rem',
        backgroundColor: '#f3f4f6',
        borderRadius: '0.5rem',
        textAlign: 'center',
        color: '#6b7280'
      }}>
        無効なYouTube URLです
      </div>
    )
  }
  
  // サムネイル画像のURL（複数の品質を試す）
  const thumbnailUrls = [
    `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
    `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
    `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
    `https://img.youtube.com/vi/${videoId}/default.jpg`
  ]
  
  const [currentThumbIndex, setCurrentThumbIndex] = useState(0)
  
  const handleImageError = () => {
    if (currentThumbIndex < thumbnailUrls.length - 1) {
      setCurrentThumbIndex(currentThumbIndex + 1)
    } else {
      setImageError(true)
    }
  }
  
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    setShowVideo(true)
  }
  
  if (showVideo) {
    return (
      <div style={{
        position: 'relative',
        paddingBottom: '56.25%',
        height: 0,
        overflow: 'hidden',
        marginBottom: '1rem'
      }}>
        <iframe
          src={`https://www.youtube.com/embed/${videoId}?autoplay=1`}
          title={title || 'YouTube video'}
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%'
          }}
        />
      </div>
    )
  }
  
  return (
    <div style={{
      position: 'relative',
      marginBottom: '1rem',
      borderRadius: '0.5rem',
      overflow: 'hidden',
      backgroundColor: '#000'
    }}>
      {!imageError ? (
        <button
          onClick={handleClick}
          style={{
            display: 'block',
            position: 'relative',
            width: '100%',
            padding: 0,
            border: 'none',
            background: 'none',
            cursor: 'pointer'
          }}
        >
          <img
            src={`/api/youtube-thumbnail?videoId=${videoId}&quality=${['maxresdefault', 'hqdefault', 'mqdefault', 'default'][currentThumbIndex]}`}
            alt={title || 'YouTube video thumbnail'}
            style={{
              width: '100%',
              height: 'auto',
              display: 'block'
            }}
            onError={handleImageError}
            loading="lazy"
          />
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            borderRadius: '50%',
            padding: '1rem',
            transition: 'background-color 0.2s'
          }}>
            <svg
              style={{
                width: '3rem',
                height: '3rem',
                color: 'white'
              }}
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M10 8.64L15.27 12 10 15.36V8.64M8 5v14l11-7L8 5z" />
            </svg>
          </div>
        </button>
      ) : (
        <div style={{
          padding: '3rem 2rem',
          textAlign: 'center',
          backgroundColor: '#f3f4f6'
        }}>
          <p style={{ color: '#6b7280', marginBottom: '1rem' }}>
            YouTube動画のサムネイルを読み込めませんでした
          </p>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: '#3b82f6',
              textDecoration: 'underline'
            }}
          >
            動画を見る →
          </a>
        </div>
      )}
    </div>
  )
}