import { useState, useEffect } from 'react'
import { Shield, BarChart2 } from 'lucide-react'

export default function Scorecard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/scorecard')
      .then(r => r.json())
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', color: '#86868B' }}>Loading scorecard...</div>
  if (!data) return <div style={{ textAlign: 'center', padding: 60, color: '#AEAEB2' }}>No data. Run a daily cycle first.</div>

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: '40px 20px 80px' }}>
      {/* Grade */}
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <div style={{ fontSize: '4rem', fontWeight: 700, color: '#1D1D1F', letterSpacing: '-0.04em' }}>
          {data.grade}
        </div>
        <div style={{ fontSize: '0.85rem', color: '#86868B' }}>
          Epistemic Health · {data.total_beliefs} beliefs
        </div>
      </div>

      {/* Metrics */}
      <div style={{
        background: '#fff', borderRadius: 16, padding: 24,
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        marginBottom: 24,
      }}>
        <div style={{ fontSize: '0.65rem', fontWeight: 600, color: '#AEAEB2', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16 }}>
          Key Metrics
        </div>
        <Metric label="Support Rate" value={`${(data.support_rate * 100).toFixed(0)}%`} target="> 90%" met={data.support_rate >= 0.9} />
        <Metric label="Credible Sources" value={`${(data.credible_source_pct * 100).toFixed(0)}%`} target="> 30%" met={data.credible_source_pct >= 0.3} />
      </div>

      {/* Source Tiers */}
      {data.source_tiers && Object.keys(data.source_tiers).length > 0 && (
        <div style={{
          background: '#fff', borderRadius: 16, padding: 24,
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
          marginBottom: 24,
        }}>
          <div style={{ fontSize: '0.65rem', fontWeight: 600, color: '#AEAEB2', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16 }}>
            Source Tiers
          </div>
          {Object.entries(data.source_tiers).sort((a, b) => b[1] - a[1]).map(([tier, count]) => {
            const pct = count / data.total_beliefs
            return (
              <div key={tier} style={{ marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: 4 }}>
                  <span style={{ color: '#424245' }}>{tier.replace(/_/g, ' ')}</span>
                  <span style={{ color: '#86868B' }}>{count}</span>
                </div>
                <div style={{ height: 6, borderRadius: 3, background: '#F5F5F7', overflow: 'hidden' }}>
                  <div style={{ height: '100%', borderRadius: 3, background: '#0EA5E9', width: `${pct * 100}%`, transition: 'width 0.5s' }} />
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Confidence Bands */}
      {data.confidence_bands && Object.keys(data.confidence_bands).length > 0 && (
        <div style={{
          background: '#fff', borderRadius: 16, padding: 24,
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
          marginBottom: 24,
        }}>
          <div style={{ fontSize: '0.65rem', fontWeight: 600, color: '#AEAEB2', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16 }}>
            Confidence Bands
          </div>
          {Object.entries(data.confidence_bands).sort((a, b) => b[1] - a[1]).map(([band, count]) => {
            const COLORS = { well_supported: '#059669', supported: '#0EA5E9', tentative: '#D97706', speculative: '#AEAEB2' }
            const pct = count / data.total_beliefs
            return (
              <div key={band} style={{ marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: 4 }}>
                  <span style={{ color: '#424245' }}>{band.replace(/_/g, ' ')}</span>
                  <span style={{ color: '#86868B' }}>{count}</span>
                </div>
                <div style={{ height: 6, borderRadius: 3, background: '#F5F5F7', overflow: 'hidden' }}>
                  <div style={{ height: '100%', borderRadius: 3, background: COLORS[band] || '#86868B', width: `${pct * 100}%`, transition: 'width 0.5s' }} />
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Temporal Types */}
      {data.temporal_types && Object.keys(data.temporal_types).length > 0 && (
        <div style={{
          background: '#fff', borderRadius: 16, padding: 24,
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        }}>
          <div style={{ fontSize: '0.65rem', fontWeight: 600, color: '#AEAEB2', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16 }}>
            Claim Types
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
            {Object.entries(data.temporal_types).map(([type, count]) => (
              <div key={type} style={{
                padding: '10px 16px', borderRadius: 10, background: '#F8F9FA',
                textAlign: 'center',
              }}>
                <div style={{ fontSize: '1.1rem', fontWeight: 600, color: '#1D1D1F' }}>{count}</div>
                <div style={{ fontSize: '0.65rem', color: '#AEAEB2' }}>{type.replace(/_/g, ' ')}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function Metric({ label, value, target, met }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '10px 0', borderBottom: '1px solid rgba(0,0,0,0.04)',
    }}>
      <span style={{ fontSize: '0.85rem', color: '#1D1D1F' }}>{label}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#1D1D1F' }}>{value}</span>
        <span style={{ fontSize: '0.65rem', color: met ? '#059669' : '#D97706' }}>
          {met ? '✓' : '✗'} {target}
        </span>
      </div>
    </div>
  )
}
