import React, { useState, useEffect } from 'react'
import { NextPage } from 'next'

// Disable static generation for this page
export const getServerSideProps = () => {
  return { props: {} }
}

const CacheDebugPage: NextPage = () => {
  const [cacheData, setCacheData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [autoRefresh, setAutoRefresh] = useState(false)

  const fetchCacheStatus = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/cache-status')
      const data = await response.json()
      setCacheData(data)
    } catch (error) {
      console.error('Failed to fetch cache status:', error)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchCacheStatus()
  }, [])

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(fetchCacheStatus, 5000)
      return () => clearInterval(interval)
    }
  }, [autoRefresh])

  const clearCache = async () => {
    try {
      const response = await fetch('/api/cache-clear', { method: 'POST' })
      if (response.ok) {
        alert('Cache cleared!')
        fetchCacheStatus()
      }
    } catch (error) {
      console.error('Failed to clear cache:', error)
    }
  }

  if (!cacheData) {
    return <div style={styles.container}>Loading...</div>
  }

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>🔍 Cache Debug Dashboard</h1>
      
      <div style={styles.controls}>
        <button onClick={fetchCacheStatus} disabled={loading} style={styles.button}>
          🔄 Refresh
        </button>
        <label style={styles.checkbox}>
          <input
            type="checkbox"
            checked={autoRefresh}
            onChange={(e) => setAutoRefresh(e.target.checked)}
          />
          Auto-refresh (5s)
        </label>
        <button onClick={clearCache} style={{ ...styles.button, ...styles.dangerButton }}>
          🗑️ Clear All Cache
        </button>
      </div>

      {cacheData.success && (
        <>
          <div style={styles.stats}>
            <div style={styles.statCard}>
              <h3>Total Items</h3>
              <p style={styles.bigNumber}>{cacheData.cache.totalItems}</p>
            </div>
            <div style={styles.statCard}>
              <h3>Total Size</h3>
              <p style={styles.bigNumber}>{cacheData.cache.totalSize}</p>
            </div>
            <div style={styles.statCard}>
              <h3>Hit Rate</h3>
              <p style={styles.bigNumber}>{cacheData.cache.hitRate || '0%'}</p>
              <p style={styles.subText}>
                {cacheData.cache.hits || 0} hits / {cacheData.cache.misses || 0} misses
              </p>
            </div>
            <div style={styles.statCard}>
              <h3>Total Sets</h3>
              <p style={styles.bigNumber}>{cacheData.cache.sets || 0}</p>
            </div>
          </div>

          <div style={styles.items}>
            <h2>Cached Items</h2>
            {cacheData.cache.items.length === 0 ? (
              <p style={styles.emptyMessage}>No items in cache</p>
            ) : (
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th>Key</th>
                    <th>Size</th>
                    <th>Age</th>
                    <th>Remaining TTL</th>
                  </tr>
                </thead>
                <tbody>
                  {cacheData.cache.items.map((item: any, index: number) => (
                    <tr key={index}>
                      <td style={styles.keyCell}>{item.key}</td>
                      <td>{item.size}</td>
                      <td>{item.age}</td>
                      <td>{item.remainingTTL}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '20px',
    fontFamily: 'Arial, sans-serif'
  },
  title: {
    textAlign: 'center',
    marginBottom: '30px'
  },
  controls: {
    display: 'flex',
    gap: '20px',
    marginBottom: '30px',
    alignItems: 'center'
  },
  button: {
    padding: '10px 20px',
    fontSize: '16px',
    cursor: 'pointer',
    border: '1px solid #ddd',
    borderRadius: '5px',
    background: '#fff'
  },
  dangerButton: {
    background: '#ff4444',
    color: 'white',
    border: 'none'
  },
  checkbox: {
    display: 'flex',
    alignItems: 'center',
    gap: '5px'
  },
  stats: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '20px',
    marginBottom: '40px'
  },
  statCard: {
    padding: '20px',
    border: '1px solid #ddd',
    borderRadius: '10px',
    textAlign: 'center',
    background: '#f9f9f9'
  },
  bigNumber: {
    fontSize: '2em',
    fontWeight: 'bold',
    color: '#333'
  },
  subText: {
    fontSize: '0.9em',
    color: '#666',
    marginTop: '5px'
  },
  items: {
    marginTop: '40px'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    marginTop: '20px'
  },
  keyCell: {
    wordBreak: 'break-all',
    maxWidth: '400px'
  },
  emptyMessage: {
    textAlign: 'center',
    color: '#666',
    padding: '40px'
  }
}

export default CacheDebugPage