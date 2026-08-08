export default function Loading() {
  return (
    <div style={{
      minHeight:      '100vh',
      background:     'var(--hab-crema)',
      display:        'flex',
      alignItems:     'center',
      justifyContent: 'center',
    }}>
      {/* HAB branded skeleton */}
      <div style={{
        width:           '48px',
        height:          '48px',
        border:          '3px solid rgba(43,77,46,0.1)',
        borderTop:       '3px solid var(--hab-verde)',
        borderRadius:    '50%',
        animation:       'spin 0.8s linear infinite',
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
