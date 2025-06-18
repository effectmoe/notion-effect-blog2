import React from 'react'

export default function FontSettings() {
  if (typeof window === 'undefined') {
    return null // Don't render on server side
  }
  
  // Dynamic import the actual component to avoid SSG issues
  const [Component, setComponent] = React.useState(null)
  
  React.useEffect(() => {
    import('./font-settings.jsx').then(mod => {
      setComponent(() => mod.default)
    })
  }, [])
  
  if (!Component) return <div>Loading...</div>
  
  return <Component />
}

// Disable static generation for this page
export const getServerSideProps = () => {
  return { props: {} }
}