import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Users, Brain, Database, Eye, Search, X } from 'lucide-react'

const BAND_COLORS = { well_supported: '#059669', supported: '#0EA5E9', tentative: '#D97706', speculative: '#AEAEB2', stale: '#DC2626', disputed: '#DC2626' }
const ROLE_COLORS = { scout: '#F59E0B', researcher: '#3B82F6', cartographer: '#8B5CF6', infiltrator: '#EF4444', tracker: '#0EA5E9', analyst: '#10B981', qualifier: '#6366F1' }

export default function Society() {
  const [tab, setTab] = useState('brief')
  const [stats, setStats] = useState(null)
  const [beliefs, setBeliefs] = useState([])
  const [contested, setContested] = useState([])
  const [beings, setBeings] = useState([])
  const [entities, setEntities] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch('/api/stats').then(r => r.json()),
      fetch('/api/beliefs?limit=100').then(r => r.json()),
      fetch('/api/beings?limit=200').then(r => r.json()),
      fetch('/api/entities?limit=100').then(r => r.json()),
      fetch('/api/beliefs/contested').then(r => r.json()),
    ]).then(([s, b, bg, e, c]) => {
      setStats(s)
      setBeliefs(b.beliefs || [])
      setBeings(bg.beings || [])
      setEntities(e.entities || [])
      setContested(c.contested || [])
    }).catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', color: '#86868B' }}>Loading society...</div>

  const tabs = [
    { key: 'brief', label: 'The Brief', count: beliefs.length },
    { key: 'contested', label: 'Contested', count: contested.length },
    { key: 'agents', label: 'Agents', count: beings.length },
    { key: 'entities', label: 'Entities', count: entities.length },
  ]

  // Group beliefs by beat
  const byBeat = {}
  beliefs.forEach(b => {
    const beat = b.beat || 'general'
    if (!byBeat[beat]) byBeat[beat] = []
    if (byBeat[beat].length < 8) byBeat[beat].push(b)
  })

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '24px 20px 80px' }}>
      {/* Stats Bar */}
      {stats && (
        <div style={{
          display: 'flex', flexWrap: 'wrap', gap: 20, marginBottom: 24,
          padding: '14px 20px', borderRadius: 12,
          background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        }}>
          <Stat icon={Users} label="Agents" value={stats.beings} color="#0EA5E9" />
          <Stat icon={Brain} label="Beliefs" value={stats.beliefs} color="#8B5CF6" />
          <Stat icon={Database} label="Entities" value={stats.entities} color="#10B981" />
          <Stat icon={Eye} label="Beats" value={stats.beats} color="#D97706" />
        </div>
      )}

      {/* Tabs */}
      <div style={{
        display: 'flex', gap: 4, marginBottom: 24, padding: '4px',
        background: '#F5F5F7', borderRadius: 10,
        overflowX: 'auto', WebkitOverflowScrolling: 'touch',
      }}>
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{
            flex: '0 0 auto', padding: '8px 16px', borderRadius: 8, border: 'none',
            background: tab === t.key ? '#fff' : 'transparent',
            boxShadow: tab === t.key ? '0 1px 3px rgba(0,0,0,0.06)' : 'none',
            color: tab === t.key ? '#1D1D1F' : '#86868B',
            fontSize: '0.8rem', fontWeight: tab === t.key ? 600 : 400,
            cursor: 'pointer', transition: 'all 0.15s',
            whiteSpace: 'nowrap',
          }}>
            {t.label} <span style={{ fontSize: '0.65rem', color: '#AEAEB2', marginLeft: 4 }}>{t.count}</span>
          </button>
        ))}
      </div>

      {/* Brief Tab */}
      {tab === 'brief' && (
        <div>
          <div style={{ fontSize: '0.65rem', color: '#AEAEB2', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600, marginBottom: 6 }}>
            Intelligence Brief
          </div>
          <div style={{ fontSize: '0.8rem', color: '#86868B', marginBottom: 24 }}>
            {new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </div>

          {Object.entries(byBeat).map(([beat, beatBeliefs]) => (
            <div key={beat} style={{ marginBottom: 24 }}>
              <div style={{
                fontSize: '0.6rem', fontWeight: 700, color: '#86868B',
                textTransform: 'uppercase', letterSpacing: '0.08em',
                padding: '8px 0 6px', borderBottom: '1px solid rgba(0,0,0,0.06)', marginBottom: 4,
              }}>
                {beat.replace(/_/g, ' ')} <span style={{ color: '#AEAEB2', fontWeight: 400, marginLeft: 8 }}>{beatBeliefs.length}</span>
              </div>
              {beatBeliefs.map((b, i) => (
                <div key={i} style={{ padding: '10px 0', opacity: Math.max(0.4, b.confidence) }}>
                  <p style={{ fontSize: '0.95rem', lineHeight: 1.6, margin: 0, color: '#1D1D1F' }}>
                    <strong>{b.subject}</strong> <span style={{ color: '#86868B' }}>{b.predicate}</span> <strong>{b.object}</strong>
                  </p>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 4, fontSize: '0.65rem', color: '#AEAEB2' }}>
                    <span>{b.being}</span>
                    <BandBadge band={b.confidence_band} />
                    {b.temporal_type === 'forecast' && <span style={{ color: '#D97706' }}>forecast</span>}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* Contested Tab */}
      {tab === 'contested' && (
        <div>
          <div style={{ fontSize: '0.65rem', color: '#D97706', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600, marginBottom: 6 }}>
            Where Agents Disagree
          </div>
          <div style={{ fontSize: '0.8rem', color: '#86868B', marginBottom: 24, maxWidth: 500, lineHeight: 1.6 }}>
            When agents read the same news and reach different conclusions, that friction is signal.
          </div>

          {contested.length === 0 && (
            <div style={{ color: '#AEAEB2', fontSize: '0.85rem', padding: '60px 0', textAlign: 'center' }}>
              No disputes yet. Run more daily cycles to surface disagreements.
            </div>
          )}

          {contested.map((c, ci) => (
            <div key={ci} style={{
              marginBottom: 24, padding: 24, background: '#fff', borderRadius: 16,
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            }}>
              <div style={{ fontSize: '0.65rem', color: '#D97706', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {c.disagreement_type} · {c.total_beings} agents disagree
              </div>
              <div style={{ fontSize: '1.1rem', fontWeight: 600, color: '#1D1D1F', marginTop: 6 }}>
                {c.subject} ↔ {c.object}
              </div>
              <div style={{ display: 'flex', gap: 12, marginTop: 16, flexWrap: 'wrap' }}>
                {c.sides.map((side, si) => (
                  <div key={si} style={{
                    flex: '1 1 min(240px, 100%)', padding: 16, borderRadius: 12,
                    background: si === 0 ? 'rgba(14,165,233,0.04)' : 'rgba(139,92,246,0.04)',
                    borderLeft: `3px solid ${si === 0 ? '#0EA5E9' : '#8B5CF6'}`,
                  }}>
                    <div style={{ fontSize: '0.58rem', padding: '2px 6px', borderRadius: 3, display: 'inline-block', fontWeight: 600, background: side.stance === 'negative' ? 'rgba(220,38,38,0.08)' : 'rgba(5,150,105,0.08)', color: side.stance === 'negative' ? '#DC2626' : '#059669', marginBottom: 8 }}>
                      {side.stance}
                    </div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 500, color: '#1D1D1F', marginBottom: 8, lineHeight: 1.4 }}>
                      "{side.predicate}"
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#86868B' }}>
                      {side.beings.length} agents · evidence: {side.evidence_score}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Agents Tab */}
      {tab === 'agents' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(200px, 100%), 1fr))', gap: 12 }}>
          {beings.map(b => {
            const roleColor = ROLE_COLORS[b.role] || '#86868B'
            return (
              <div key={b.id} style={{
                padding: 18, background: '#fff', borderRadius: 14,
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: '50%',
                    background: `${roleColor}12`, display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.75rem', fontWeight: 700, color: roleColor,
                  }}>
                    {b.name.charAt(0)}
                  </div>
                  <div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#1D1D1F' }}>{b.name}</div>
                    <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                      <span style={{ fontSize: '0.58rem', padding: '1px 5px', borderRadius: 3, background: `${roleColor}12`, color: roleColor, fontWeight: 600 }}>{b.role}</span>
                      <span style={{ fontSize: '0.6rem', color: '#AEAEB2' }}>{b.beat?.replace(/_/g, ' ')}</span>
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 12, fontSize: '0.68rem', color: '#86868B' }}>
                  <span>{b.beliefs_formed} beliefs</span>
                  <span>{b.articles_read} read</span>
                  <span>{b.cycles_completed} cycles</span>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Entities Tab */}
      {tab === 'entities' && (
        <div>
          {entities.map((e, i) => (
            <div key={e.id} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '12px 0', borderBottom: i < entities.length - 1 ? '1px solid rgba(0,0,0,0.04)' : 'none',
            }}>
              <div>
                <span style={{ fontSize: '0.65rem', color: '#AEAEB2', fontFamily: "'JetBrains Mono', monospace", marginRight: 10 }}>
                  {i + 1}
                </span>
                <span style={{ fontSize: '0.92rem', fontWeight: 500, color: '#1D1D1F' }}>{e.name}</span>
              </div>
              <span style={{ fontSize: '0.72rem', color: '#86868B' }}>{e.mention_count} mentions</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function Stat({ icon: Icon, label, value, color }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <Icon style={{ width: 14, height: 14, color }} />
      <span style={{ fontSize: '0.72rem', color: '#86868B' }}>{label}</span>
      <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#1D1D1F' }}>{typeof value === 'number' ? value.toLocaleString() : value}</span>
    </div>
  )
}

function BandBadge({ band }) {
  const color = BAND_COLORS[band] || '#AEAEB2'
  return (
    <span style={{ padding: '1px 5px', borderRadius: 3, fontWeight: 600, fontSize: '0.55rem', background: `${color}12`, color }}>
      {(band || '?').replace('_', ' ')}
    </span>
  )
}
