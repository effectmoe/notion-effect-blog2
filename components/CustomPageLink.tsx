import React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'

// Custom PageLink component to fix hydration error caused by div-in-anchor nesting
export const CustomPageLink: React.FC<{
  href: string
  className?: string
  children: React.ReactNode
}> = ({ href, className, children }) => {
  const router = useRouter()
  
  // Handle click programmatically to avoid div-in-anchor issue
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    
    // Handle both internal and external links
    if (href.startsWith('http://') || href.startsWith('https://')) {
      window.open(href, '_blank', 'noopener,noreferrer')
    } else {
      router.push(href)
    }
  }
  
  // Use a div with role="link" instead of an anchor to allow block-level children
  return (
    <div
      className={className}
      onClick={handleClick}
      role="link"
      tabIndex={0}
      style={{ cursor: 'pointer' }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          handleClick(e as any)
        }
      }}
    >
      {children}
    </div>
  )
}

export default CustomPageLink