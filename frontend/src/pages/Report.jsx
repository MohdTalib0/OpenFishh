import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import { ArrowLeft, Shield, AlertTriangle, Clock, FileText } from 'lucide-react'
import ClaimCard from '../components/ClaimCard'

export default function Report() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [report, setReport] = useState(null)
  const [trustSummary, setTrustSummary] = useState(null)
  const [beliefs, setBeliefs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    fetch(`/api/report/${id}`)
      .then(r => r.json())
      .then(d => {
        setReport(d.report)
        setTrustSummary(d.trust_summary)
        setBeliefs(d.beliefs || [])
      })
      .catch(() => setReport('# Report not found'))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', color: '#86868B' }}>
      Loading report...
    </div>
  )

  // Parse footnotes for interactive ClaimCards
  const lines = (report || '').split('\n')
  const segments = []
  let currentMd = ''

  for (const line of lines) {
    const match = line.match(/^\[(\d+)\]\s*\*(.+?)\*\s*[—–-]\s*\*\*(.+?)\*\*\s*\|\s*(.+)/)
    if (match) {
      if (currentMd.trim()) { segments.push({ type: 'md', content: currentMd }); currentMd = '' }
      const rest = match[4]
      const urlMatch = rest.match(/\[source\]\((.+?)\)/)
      const indepMatch = rest.match(/(\d+)\s*independent/)
      segments.push({
        type: 'claim', claim: match[2].trim(), band: match[3].trim(),
        tier: rest.split('|')[0].trim(),
        sourceUrl: urlMatch ? urlMatch[1] : null,
        independence: indepMatch ? `${indepMatch[1]} chains` : null,
      })
    } else {
      currentMd += line + '\n'
    }
  }
  if (currentMd.trim()) segments.push({ type: 'md', content: currentMd })

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '24px 16px 80px' }}>
      {/* Trust Summary */}
      {trustSummary && (
        <div style={{
          display: 'flex', flexWrap: 'wrap', gap: 16, marginBottom: 28,
          padding: '14px 18px', borderRadius: 12,
          background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        }}>
          <TrustStat icon={FileText} label="Claims" value={trustSummary.claims_count} color="#0EA5E9" />
          <TrustStat icon={Shield} label="Sources" value={trustSummary.sources_count} color="#10B981" />
          <TrustStat icon={Clock} label="Time" value={`${trustSummary.duration_seconds}s`} color="#8B5CF6" />
          {trustSummary.forecast_count > 0 && (
            <TrustStat icon={AlertTriangle} label="Forecasts" value={trustSummary.forecast_count} color="#D97706" />
          )}
          {trustSummary.known_unknowns?.length > 0 && (
            <div style={{
              width: '100%', marginTop: 8, padding: '8px 12px', borderRadius: 8,
              background: 'rgba(217,119,6,0.06)', fontSize: '0.72rem', color: '#92400E',
            }}>
              {trustSummary.known_unknowns.map((u, i) => <div key={i}>! {u}</div>)}
            </div>
          )}
        </div>
      )}

      {/* Report */}
      <div className="report-content">
        {segments.map((seg, i) => {
          if (seg.type === 'claim') return <ClaimCard key={i} {...seg} />
          return (
            <ReactMarkdown key={i} components={{
              h1: ({ children }) => <h1 style={{ fontSize: 'clamp(1.3rem, 4vw, 1.7rem)', fontWeight: 700, letterSpacing: '-0.03em', margin: '0 0 16px', lineHeight: 1.3 }}>{children}</h1>,
              h2: ({ children }) => <h2 style={{ fontSize: '1.15rem', fontWeight: 600, letterSpacing: '-0.02em', color: '#1D1D1F', margin: '40px 0 12px' }}>{children}</h2>,
              h3: ({ children }) => <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#424245', margin: '28px 0 8px' }}>{children}</h3>,
              p: ({ children }) => <p style={{ fontSize: '1rem', lineHeight: 1.75, margin: '0 0 16px', color: '#424245' }}>{children}</p>,
              strong: ({ children }) => <strong style={{ color: '#1D1D1F' }}>{children}</strong>,
              em: ({ children }) => <em style={{ color: '#86868B' }}>{children}</em>,
              a: ({ href, children }) => <a href={href} target="_blank" rel="noopener" style={{ color: '#0969DA' }}>{children}</a>,
              li: ({ children }) => <li style={{ fontSize: '0.92rem', lineHeight: 1.7, marginBottom: 6, color: '#424245' }}>{children}</li>,
              hr: () => <hr style={{ border: 'none', margin: '32px 0' }} />,
            }}>
              {seg.content}
            </ReactMarkdown>
          )
        })}
      </div>

      {/* Beliefs */}
      {beliefs.length > 0 && (
        <div style={{ marginTop: 40, padding: 24, background: '#fff', borderRadius: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <div style={{ fontSize: '0.65rem', fontWeight: 600, color: '#86868B', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16 }}>
            Extracted Claims ({beliefs.length})
          </div>
          {beliefs.map((b, i) => (
            <div key={i} style={{ padding: '8px 0', borderBottom: i < beliefs.length - 1 ? '1px solid rgba(0,0,0,0.04)' : 'none' }}>
              <div style={{ fontSize: '0.85rem', color: '#1D1D1F', lineHeight: 1.5 }}>
                <strong>{b.subject}</strong> <span style={{ color: '#86868B' }}>{b.predicate}</span> <strong>{b.object}</strong>
              </div>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 3, fontSize: '0.65rem', color: '#AEAEB2' }}>
                <BandBadge band={b.confidence_band} label={b.confidence_band_label} />
                <span>{(b.source_tier || 'unknown').replace('_', ' ')}</span>
                {b.stance === 'negative' && <span style={{ color: '#DC2626' }}>negative</span>}
                {b.temporal_type === 'forecast' && <span style={{ color: '#D97706' }}>forecast</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={{ marginTop: 40, textAlign: 'center', fontSize: '0.72rem', color: '#AEAEB2' }}>
        Generated by <a href="https://github.com/MohdTalib0/OpenFishh" style={{ color: '#86868B' }}>OpenFishh</a>
      </div>
    </div>
  )
}

function TrustStat({ icon: Icon, label, value, color }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <Icon style={{ width: 14, height: 14, color }} />
      <span style={{ fontSize: '0.72rem', color: '#86868B' }}>{label}:</span>
      <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#1D1D1F' }}>{value}</span>
    </div>
  )
}

const BAND_COLORS = { well_supported: '#059669', supported: '#0EA5E9', tentative: '#D97706', speculative: '#AEAEB2' }

function BandBadge({ band, label }) {
  const color = BAND_COLORS[band] || '#AEAEB2'
  return (
    <span style={{ padding: '1px 5px', borderRadius: 3, fontWeight: 600, fontSize: '0.58rem', background: `${color}12`, color }}>
      {(label || band || '?').replace('_', ' ')}
    </span>
  )
}
