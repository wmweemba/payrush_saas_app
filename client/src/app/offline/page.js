'use client'

export default function OfflinePage() {
  return (
    <div style={{
      minHeight: '100vh',
      background: '#F0F2F5',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'Inter, sans-serif',
      padding: '24px',
    }}>
      <div style={{
        textAlign: 'center',
        maxWidth: '320px',
      }}>
        <div style={{
          width: '56px',
          height: '56px',
          background: '#E6F1FB',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 20px',
        }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
            stroke="#185FA5" strokeWidth="1.5" strokeLinecap="round"
            strokeLinejoin="round">
            <path d="M12 20h-7a2 2 0 0 1 -2 -2v-9a2 2 0 0 1 2 -2h1"/>
            <path d="M8 4h11a2 2 0 0 1 2 2v9a2 2 0 0 1 -2 2h-1"/>
            <path d="M3 3l18 18"/>
          </svg>
        </div>
        <h1 style={{
          fontSize: '18px',
          fontWeight: '500',
          color: '#111827',
          margin: '0 0 8px',
        }}>
          You're offline
        </h1>
        <p style={{
          fontSize: '14px',
          color: '#6B7280',
          lineHeight: '1.6',
          margin: '0 0 24px',
        }}>
          Check your connection and try again.
          BazaBooks needs internet access to load your invoices.
        </p>
        <button
          onClick={() => window.location.reload()}
          style={{
            background: '#185FA5',
            color: '#ffffff',
            border: 'none',
            borderRadius: '10px',
            height: '44px',
            padding: '0 24px',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer',
            width: '100%',
          }}
        >
          Try again
        </button>
      </div>
    </div>
  )
}
