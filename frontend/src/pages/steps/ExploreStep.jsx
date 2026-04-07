import { useState } from 'react'

const ROLE_COLORS = { scout: '#F59E0B', researcher: '#3B82F6', cartographer: '#8B5CF6', infiltrator: '#EF4444', tracker: '#0EA5E9', analyst: '#10B981', qualifier: '#6366F1' }
const BAND_COLORS = { well_supported: '#10B981', supported: '#0EA5E9', tentative: '#F59E0B', speculative: '#666' }

export default function ExploreStep({ data }) {
  const [tab, setTab] = useState('agents')

  return (
    <div style={{ padding: 24 }}>
      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, overflowX: 'auto' }}>
        {['agents', 'scorecard', 'beats'].map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: '6px 14px', borderRadius: 6, border: 'none',
            background: tab === t ? 'rgba(14,165,233,0.15)' : 'rgba(255,255,255,0.03)',
            color: tab === t ? '#0EA5E9' : '#666',
            fontSize: '0.75rem', fontWeight: 500, cursor: 'pointer',
            textTransform: 'capitalize', whiteSpace: 'nowrap',
          }}>
            {t}
          </button>
        ))}
      </div>

      {/* Agents */}
      {tab === 'agents' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(220px, 100%), 1fr))', gap: 10 }}>
          {data.agents.map((a, i) => {
            const color = ROLE_COLORS[a.role] || '#666'
            return (
              <div key={i} style={{
                padding: 16, borderRadius: 10,
                border: '1px solid rgba(255,255,255,0.06)',
                background: 'rgba(255,255,255,0.02)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <div style={{
                    width: 30, height: 30, borderRadius: '50%',
                    background: `${color}18`, display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.7rem', fontWeight: 700, color,
                  }}>
                    {a.name.charAt(0)}
                  </div>
                  <div>
                    <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#fff' }}>{a.name}</div>
                    <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                      <span style={{ fontSize: '0.55rem', padding: '1px 4px', borderRadius: 3, background: `${color}18`, color, fontWeight: 600 }}>{a.role}</span>
                      <span style={{ fontSize: '0.58rem', color: '#555' }}>{a.beat?.replace(/_/g, ' ')}</span>
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 12, fontSize: '0.65rem', color: '#555' }}>
                  <span>{a.beliefs} beliefs</span>
                  <span>{a.articles} read</span>
                  <span style={{ color: a.mood === 'excited' ? '#F59E0B' : a.mood === 'confident' ? '#10B981' : '#555' }}>{a.mood}</span>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Scorecard */}
      {tab === 'scorecard' && (
        <div>
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <div style={{ fontSize: '3.5rem', fontWeight: 700, color: '#fff', letterSpacing: '-0.04em' }}>B</div>
            <div style={{ fontSize: '0.78rem', color: '#666' }}>Epistemic Health Grade</div>
            <div style={{ fontSize: '0.65rem', color: '#444', marginTop: 4 }}>{data.stats.beliefs.toLocaleString()} beliefs evaluated</div>
          </div>

          <div style={{
            padding: 20, borderRadius: 10,
            border: '1px solid rgba(255,255,255,0.06)',
            background: 'rgba(255,255,255,0.02)',
          }}>
            <Metric label="Support Rate" value="99.8%" target="> 90%" met={true} />
            <Metric label="Credible Sources" value="31.7%" target="> 30%" met={true} />
            <Metric label="Independence" value="1.06" target=">= 1.5" met={false} />
            <Metric label="Staleness" value="0.0%" target="< 20%" met={true} />
          </div>

          <div style={{
            marginTop: 16, padding: '12px 16px', borderRadius: 8,
            border: '1px solid rgba(245,158,11,0.15)',
            background: 'rgba(245,158,11,0.04)',
            fontSize: '0.7rem', color: '#B45309',
          }}>
            Maturity cap: Grade capped at B until calibration is fully exercised and forecasts are scored.
          </div>
        </div>
      )}

      {/* Beats */}
      {tab === 'beats' && (
        <div>
          {data.beats.map((b, i) => {
            const maxCount = data.beats[0]?.count || 1
            const pct = b.count / maxCount
            return (
              <div key={i} style={{ marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: 3 }}>
                  <span style={{ color: '#ccc' }}>{b.beat.replace(/_/g, ' ')}</span>
                  <span style={{ color: '#555', fontFamily: "'JetBrains Mono', monospace" }}>{b.count} agents</span>
                </div>
                <div style={{ height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.04)' }}>
                  <div style={{ height: '100%', borderRadius: 2, background: '#0EA5E9', width: `${pct * 100}%`, opacity: 0.6 + pct * 0.4 }} />
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* CTA */}
      <div style={{
        marginTop: 32, padding: 24, borderRadius: 10, textAlign: 'center',
        border: '1px solid rgba(14,165,233,0.15)',
        background: 'rgba(14,165,233,0.04)',
      }}>
        <div style={{ fontSize: '1rem', fontWeight: 600, color: '#fff', marginBottom: 8 }}>
          Ready to run your own society?
        </div>
        <div style={{ fontSize: '0.78rem', color: '#888', marginBottom: 16, lineHeight: 1.5 }}>
          Clone the repo. One command to start. Scale to 10,000+ agents.
        </div>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <a href="https://github.com/MohdTalib0/OpenFishh" target="_blank" rel="noopener" style={{
            padding: '10px 24px', borderRadius: 8,
            background: '#fff', color: '#0A0A0A',
            textDecoration: 'none', fontSize: '0.85rem', fontWeight: 600,
          }}>
            Clone on GitHub
          </a>
          <div style={{
            padding: '10px 20px', borderRadius: 8,
            border: '1px solid rgba(255,255,255,0.1)',
            fontFamily: "'JetBrains Mono', monospace", fontSize: '0.75rem', color: '#0EA5E9',
          }}>
            git clone github.com/MohdTalib0/OpenFishh
          </div>
        </div>
      </div>
    </div>
  )
}

function Metric({ label, value, target, met }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.04)',
    }}>
      <span style={{ fontSize: '0.82rem', color: '#ccc' }}>{label}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#fff', fontFamily: "'JetBrains Mono', monospace" }}>{value}</span>
        <span style={{ fontSize: '0.62rem', color: met ? '#10B981' : '#F59E0B' }}>
          {met ? '\u2713' : '\u2717'} {target}
        </span>
      </div>
    </div>
  )
}
