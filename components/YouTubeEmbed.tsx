import React, { useState } from 'react'

interface YouTubeEmbedProps {
  url: string
  title?: string
  className?: string
}

export const YouTubeEmbed: React.FC<YouTubeEmbedProps> = ({ 
  url, 
  title = 'YouTube video',
  className = ''
}) => {
  const [imageError, setImageError] = useState(false)
  const [currentThumbIndex, setCurrentThumbIndex] = useState(0)
  
  // YouTube URLからビデオIDを抽出
  const getVideoId = (url: string): string | null => {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
      /youtube\.com\/v\/([^&\n?#]+)/,
      /youtube\.com\/shorts\/([^&\n?#]+)/
    ]
    
    for (const pattern of patterns) {
      const match = url.match(pattern)
      if (match && match[1]) {
        return match[1]
      }
    }
    return null
  }
  
  const videoId = getVideoId(url)
  
  console.log('[YouTubeEmbed] Processing URL:', { url, videoId })
  
  if (!videoId) {
    console.error('[YouTubeEmbed] Failed to extract video ID from URL:', url)
    return (
      <div className={`bg-gray-100 rounded-lg p-8 text-center ${className}`}>
        <p className="text-gray-600">無効なYouTube URLです</p>
        <a 
          href={url} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-blue-600 hover:underline text-sm mt-2 inline-block"
        >
          元のリンクを開く →
        </a>
      </div>
    )
  }
  
  // サムネイル画像のURL（品質の高い順）
  const thumbnailUrls = [
    `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
    `https://img.youtube.com/vi/${videoId}/sddefault.jpg`,
    `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
    `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
    `https://img.youtube.com/vi/${videoId}/default.jpg`
  ]
  
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const failedUrl = thumbnailUrls[currentThumbIndex]
    const imgElement = e.currentTarget
    
    console.error(`[YouTubeEmbed] Failed to load thumbnail for video ${videoId}:`, {
      failedUrl,
      attemptNumber: currentThumbIndex + 1,
      totalAttempts: thumbnailUrls.length,
      originalUrl: url,
      errorType: 'image_load_error',
      imgSrc: imgElement.src,
      imgComplete: imgElement.complete,
      imgNaturalWidth: imgElement.naturalWidth,
      imgNaturalHeight: imgElement.naturalHeight
    })
    
    // Check if this might be a WebP URL that got through somehow
    if (failedUrl.includes('webp') || imgElement.src.includes('webp')) {
      console.error('[YouTubeEmbed] WARNING: WebP format detected in URL!', {
        failedUrl,
        imgSrc: imgElement.src
      })
    }
    
    if (currentThumbIndex < thumbnailUrls.length - 1) {
      setCurrentThumbIndex(currentThumbIndex + 1)
    } else {
      console.error(`[YouTubeEmbed] All thumbnail attempts failed for video ${videoId}`)
      setImageError(true)
    }
  }
  
  const handleImageLoad = () => {
    console.log(`[YouTubeEmbed] Successfully loaded thumbnail for video ${videoId}:`, {
      quality: ['maxresdefault', 'sddefault', 'hqdefault', 'mqdefault', 'default'][currentThumbIndex],
      url: thumbnailUrls[currentThumbIndex]
    })
  }
  
  return (
    <div className={`youtube-embed ${className}`}>
      {!imageError ? (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="block relative group overflow-hidden rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300"
        >
          <div className="relative aspect-video">
            <img
              src={thumbnailUrls[currentThumbIndex]}
              alt={title}
              className="w-full h-full object-cover"
              onError={handleImageError}
              onLoad={handleImageLoad}
              loading="lazy"
              onLoadStart={() => {
                console.log(`[YouTubeEmbed] Starting to load image:`, {
                  videoId,
                  url: thumbnailUrls[currentThumbIndex],
                  attemptNumber: currentThumbIndex + 1
                })
              }}
            />
            {/* プレイボタンオーバーレイ */}
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-300">
              <div className="bg-red-600 rounded-full p-4 shadow-lg transform group-hover:scale-110 transition-transform duration-300">
                <svg
                  className="w-10 h-10 text-white ml-1"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
            </div>
          </div>
          {/* タイトル表示（オプション） */}
          {title && title !== 'YouTube video' && (
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-4">
              <p className="text-white text-sm font-medium truncate">{title}</p>
            </div>
          )}
        </a>
      ) : (
        <div className="bg-gray-100 rounded-lg p-8 text-center">
          <div className="mb-4">
            <svg 
              className="w-16 h-16 text-gray-400 mx-auto"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
            </svg>
          </div>
          <p className="text-gray-600 mb-3">YouTube動画のサムネイルを読み込めませんでした</p>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
            </svg>
            YouTubeで視聴
          </a>
        </div>
      )}
    </div>
  )
}

// デフォルトエクスポート
export default YouTubeEmbed