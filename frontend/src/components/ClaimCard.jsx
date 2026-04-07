import { useState } from 'react'
import { ChevronRight, ChevronDown, Shield, ExternalLink, AlertTriangle } from 'lucide-react'

const BAND_COLORS = {
  'Well-Supported': '#059669',
  'Supported': '#0EA5E9',
  'Tentative': '#D97706',
  'Speculative': '#AEAEB2',
  'Stale': '#DC2626',
  'Disputed': '#DC2626',
}

export default function ClaimCard({ claim, band, tier, sourceUrl, independence }) {
  const [expanded, setExpanded] = useState(false)
  const color = BAND_COLORS[band] || '#AEAEB2'

  return (
    <div style={{
      margin: '8px 0', borderRadius: 10,
      background: expanded ? '#F8F9FA' : 'transparent',
      transition: 'background 0.2s',
    }}>
      <button
        onClick={() => setExpanded(v => !v)}
        style={{
          display: 'flex', alignItems: 'center', gap: 8, width: '100%',
          padding: '8px 12px', background: 'none', border: 'none',
          cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit',
        }}
      >
        {expanded ? (
          <ChevronDown style={{ width: 13, height: 13, color: '#AEAEB2', flexShrink: 0 }} />
        ) : (
          <ChevronRight style={{ width: 13, height: 13, color: '#AEAEB2', flexShrink: 0 }} />
        )}
        <span style={{ fontSize: '0.78rem', color: '#424245', fontStyle: 'italic', flex: 1, lineHeight: 1.5 }}>
          {claim}
        </span>
        <span style={{
          fontSize: '0.58rem', padding: '2px 7px', borderRadius: 4,
          fontWeight: 600, flexShrink: 0,
          background: `${color}15`, color,
        }}>
          {band}
        </span>
      </button>

      {expanded && (
        <div style={{ padding: '4px 12px 12px 33px', fontSize: '0.72rem', color: '#86868B', lineHeight: 1.7 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Shield style={{ width: 11, height: 11, color }} />
              <span><strong style={{ color: '#1D1D1F' }}>Evidence:</strong> {band}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 11, display: 'inline-block' }} />
              <span><strong style={{ color: '#1D1D1F' }}>Source tier:</strong> {tier}</span>
            </div>
            {independence && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 11, display: 'inline-block' }} />
                <span><strong style={{ color: '#1D1D1F' }}>Independence:</strong> {independence}</span>
              </div>
            )}
            {sourceUrl && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <ExternalLink style={{ width: 11, height: 11, color: '#0969DA' }} />
                <a href={sourceUrl} target="_blank" rel="noopener" style={{ color: '#0969DA' }}>
                  View source
                </a>
              </div>
            )}
            {(band === 'Tentative' || band === 'Speculative') && (
              <div style={{
                marginTop: 4, padding: '6px 10px', borderRadius: 6,
                background: 'rgba(217,119,6,0.06)',
                display: 'flex', alignItems: 'flex-start', gap: 6,
              }}>
                <AlertTriangle style={{ width: 11, height: 11, color: '#D97706', marginTop: 2, flexShrink: 0 }} />
                <span style={{ color: '#D97706', fontSize: '0.68rem' }}>
                  Limited evidence. Verify independently before acting on this.
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
