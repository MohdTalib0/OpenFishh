import { useState } from 'react'
import BeliefGraph from '../../components/BeliefGraph'

const BAND_COLORS = { well_supported: '#10B981', supported: '#0EA5E9', tentative: '#F59E0B', speculative: '#666' }
const TIER_LABELS = { wire: 'Wire', major_news: 'Major News', specialist_trade: 'Trade Press', research_preprint: 'Preprint', institutional: 'Institutional', social: 'Social', reference: 'Reference', aggregator: 'Aggregator', unknown: 'Unknown' }

export default function BeliefStep({ data, onComplete }) {
  const [tab, setTab] = useState('graph')

  const byBeat = {}
  data.beliefs.forEach(b => {
    const beat = b.beat || 'general'
    if (!byBeat[beat]) byBeat[beat] = []
    if (byBeat[beat].length < 5) byBeat[beat].push(b)
  })

  return (
    <div style={{ padding: 24 }}>
      {/* Stats */}
      <div style={{
        display: 'flex', flexWrap: 'wrap', gap: 20, marginBottom: 20,
        padding: '14px 20px', borderRadius: 10,
        border: '1px solid rgba(255,255,255,0.06)',
        background: 'rgba(255,255,255,0.02)',
      }}>
        <BStat label="Total Beliefs" value={data.stats.beliefs.toLocaleString()} />
        <BStat label="Entities" value={data.stats.entities.toLocaleString()} />
        <BStat label="Beats" value={data.stats.beats} />
        <BStat label="Source Tiers" value={data.source_tiers.length} />
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, overflowX: 'auto' }}>
        {['graph', 'beliefs', 'entities', 'sources', 'bands'].map(t => (
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

      {/* Knowledge Graph */}
      {tab === 'graph' && (
        <div style={{
          height: 'calc(100vh - 300px)', minHeight: 500, borderRadius: 10,
          border: '1px solid rgba(0,0,0,0.08)',
          background: '#fff',
          position: 'relative', overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute', top: 12, left: 16, zIndex: 10,
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <span style={{
              fontSize: '0.6rem', fontWeight: 700, color: '#0EA5E9',
              textTransform: 'uppercase', letterSpacing: '0.08em',
            }}>
              Knowledge Graph
            </span>
            <span style={{
              fontSize: '0.55rem', color: '#aaa',
              fontFamily: "'JetBrains Mono', monospace",
            }}>
              {data.entities.length} entities &middot; {data.beliefs.length} connections
            </span>
          </div>
          <div style={{
            position: 'absolute', bottom: 12, right: 16, zIndex: 10,
            fontSize: '0.5rem', color: '#bbb',
            fontFamily: "'JetBrains Mono', monospace",
          }}>
            scroll to zoom &middot; drag to move
          </div>
          <BeliefGraph entities={data.entities} beliefs={data.beliefs} />
        </div>
      )}

      {/* Beliefs tab */}
      {tab === 'beliefs' && (
        <div style={{ maxHeight: 'calc(100vh - 320px)', overflow: 'auto', minHeight: 300 }}>
          {Object.entries(byBeat).map(([beat, beliefs]) => (
            <div key={beat} style={{ marginBottom: 16 }}>
              <div style={{
                fontSize: '0.6rem', fontWeight: 700, color: '#555',
                textTransform: 'uppercase', letterSpacing: '0.08em',
                padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.04)',
              }}>
                {beat.replace(/_/g, ' ')}
              </div>
              {beliefs.map((b, i) => (
                <div key={i} style={{
                  padding: '8px 0',
                  opacity: Math.max(0.5, b.confidence),
                }}>
                  <div style={{ fontSize: '0.85rem', color: '#ddd', lineHeight: 1.5 }}>
                    <strong style={{ color: '#fff' }}>{b.subject}</strong>
                    {' '}<span style={{ color: '#888' }}>{b.predicate}</span>{' '}
                    <strong style={{ color: '#fff' }}>{b.object}</strong>
                  </div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 3, fontSize: '0.62rem', color: '#555' }}>
                    <span>{b.being}</span>
                    <span style={{
                      padding: '1px 5px', borderRadius: 3, fontWeight: 600,
                      background: `${BAND_COLORS[b.band] || '#444'}22`,
                      color: BAND_COLORS[b.band] || '#444',
                    }}>
                      {(b.band || '?').replace('_', ' ')}
                    </span>
                    <span>{TIER_LABELS[b.tier] || b.tier}</span>
                    {b.temporal === 'forecast' && <span style={{ color: '#F59E0B' }}>forecast</span>}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* Entities tab */}
      {tab === 'entities' && (
        <div style={{ maxHeight: 'calc(100vh - 320px)', overflow: 'auto', minHeight: 300 }}>
          {data.entities.map((e, i) => (
            <div key={i} style={{
              display: 'flex', justifyContent: 'space-between',
              padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.03)',
            }}>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <span style={{ fontSize: '0.62rem', color: '#444', fontFamily: "'JetBrains Mono', monospace", width: 20, textAlign: 'right' }}>{i + 1}</span>
                <span style={{ fontSize: '0.85rem', color: '#ddd' }}>{e.name}</span>
              </div>
              <span style={{ fontSize: '0.72rem', color: '#555', fontFamily: "'JetBrains Mono', monospace" }}>{e.mentions}</span>
            </div>
          ))}
        </div>
      )}

      {/* Sources tab */}
      {tab === 'sources' && (
        <div style={{ maxHeight: 'calc(100vh - 320px)', overflow: 'auto', minHeight: 300 }}>
          {data.source_tiers.map((t, i) => {
            const pct = t.count / data.stats.beliefs
            return (
              <div key={i} style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: 4 }}>
                  <span style={{ color: '#ccc' }}>{TIER_LABELS[t.tier] || t.tier}</span>
                  <span style={{ color: '#666', fontFamily: "'JetBrains Mono', monospace" }}>{t.count.toLocaleString()} ({(pct * 100).toFixed(1)}%)</span>
                </div>
                <div style={{ height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.04)' }}>
                  <div style={{ height: '100%', borderRadius: 2, background: '#0EA5E9', width: `${pct * 100}%` }} />
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Bands tab */}
      {tab === 'bands' && (
        <div style={{ maxHeight: 'calc(100vh - 320px)', overflow: 'auto', minHeight: 300 }}>
          {data.confidence_bands.map((b, i) => {
            const pct = b.count / data.stats.beliefs
            const color = BAND_COLORS[b.band] || '#666'
            return (
              <div key={i} style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: 4 }}>
                  <span style={{ color: '#ccc' }}>{(b.band || '?').replace('_', ' ')}</span>
                  <span style={{ color: '#666', fontFamily: "'JetBrains Mono', monospace" }}>{b.count.toLocaleString()} ({(pct * 100).toFixed(1)}%)</span>
                </div>
                <div style={{ height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.04)' }}>
                  <div style={{ height: '100%', borderRadius: 2, background: color, width: `${pct * 100}%` }} />
                </div>
              </div>
            )
          })}
        </div>
      )}

      <div style={{ marginTop: 20 }}>
        <button onClick={onComplete} style={{
          padding: '10px 24px', borderRadius: 8, border: 'none',
          background: '#0EA5E9', color: '#fff',
          fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer',
        }}>
          Continue to Report Generation
        </button>
      </div>
    </div>
  )
}

function BStat({ label, value }) {
  return (
    <div>
      <div style={{ fontSize: '1.1rem', fontWeight: 600, color: '#fff', fontFamily: "'JetBrains Mono', monospace" }}>{value}</div>
      <div style={{ fontSize: '0.6rem', color: '#555' }}>{label}</div>
    </div>
  )
}
