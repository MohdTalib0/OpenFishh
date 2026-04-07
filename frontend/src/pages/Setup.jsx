import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Users, Zap } from 'lucide-react'

const PRESETS = [
  { agents: 50, beats: 10, label: 'Starter', desc: '~$0.01/cycle, runs on any laptop', time: '~1 min' },
  { agents: 200, beats: 20, label: 'Medium', desc: '~$0.02/cycle, good for exploration', time: '~2 min' },
  { agents: 500, beats: 31, label: 'Large', desc: '~$0.03/cycle, full beat coverage', time: '~3 min' },
  { agents: 2000, beats: 31, label: 'XL', desc: '~$0.03/cycle, deep coverage per beat', time: '~3 min' },
  { agents: 10000, beats: 31, label: 'Maximum', desc: '~$0.03/cycle, massive scale', time: '~4 min' },
]

export default function Setup() {
  const navigate = useNavigate()
  const [agents, setAgents] = useState(50)
  const [beats, setBeats] = useState(10)
  const [spawning, setSpawning] = useState(false)
  const [error, setError] = useState(null)

  async function spawn() {
    setSpawning(true)
    setError(null)
    try {
      const res = await fetch('/api/spawn', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agents, beats }),
      })
      const data = await res.json()
      if (data.success) {
        navigate('/')
      } else {
        setError(data.error || 'Failed to spawn')
      }
    } catch (e) {
      setError(e.message)
    } finally {
      setSpawning(false)
    }
  }

  return (
    <div style={{ maxWidth: 520, margin: '0 auto', padding: '60px 20px 80px' }}>
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <img src="/icon.svg" alt="OpenFishh" style={{ width: 56, height: 56 }} />
        <h1 style={{ fontSize: '1.8rem', fontWeight: 700, letterSpacing: '-0.03em', margin: '12px 0 8px' }}>
          Spawn Your Society
        </h1>
        <p style={{ fontSize: '0.9rem', color: '#86868B', lineHeight: 1.6 }}>
          Choose your scale. More agents = more perspectives, same LLM cost.
        </p>
      </div>

      {/* Presets */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 32 }}>
        {PRESETS.map(p => (
          <button key={p.label} onClick={() => { setAgents(p.agents); setBeats(p.beats) }}
            style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '14px 18px', borderRadius: 12,
              border: agents === p.agents ? '2px solid #0EA5E9' : '1px solid rgba(0,0,0,0.08)',
              background: agents === p.agents ? 'rgba(14,165,233,0.04)' : '#fff',
              cursor: 'pointer', textAlign: 'left', width: '100%',
              fontFamily: 'inherit',
            }}>
            <div>
              <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#1D1D1F' }}>
                {p.label}: {p.agents.toLocaleString()} agents, {p.beats} beats
              </div>
              <div style={{ fontSize: '0.72rem', color: '#86868B', marginTop: 2 }}>
                {p.desc}
              </div>
            </div>
            <div style={{ fontSize: '0.7rem', color: '#AEAEB2', flexShrink: 0 }}>
              {p.time}
            </div>
          </button>
        ))}
      </div>

      {/* Custom */}
      <div style={{
        padding: 20, background: '#fff', borderRadius: 16,
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)', marginBottom: 24,
      }}>
        <div style={{ fontSize: '0.7rem', fontWeight: 600, color: '#AEAEB2', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
          Custom Configuration
        </div>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 120px' }}>
            <label style={{ fontSize: '0.75rem', color: '#86868B', display: 'block', marginBottom: 6 }}>Agents</label>
            <input type="number" value={agents} onChange={e => setAgents(Math.max(1, parseInt(e.target.value) || 50))}
              style={{
                width: '100%', padding: '10px 14px', borderRadius: 10,
                border: '1px solid rgba(0,0,0,0.08)', fontSize: '1rem',
                fontFamily: "'JetBrains Mono', monospace", outline: 'none',
              }} />
          </div>
          <div style={{ flex: '1 1 120px' }}>
            <label style={{ fontSize: '0.75rem', color: '#86868B', display: 'block', marginBottom: 6 }}>Beats (max 31)</label>
            <input type="number" value={beats} onChange={e => setBeats(Math.min(31, Math.max(1, parseInt(e.target.value) || 10)))}
              style={{
                width: '100%', padding: '10px 14px', borderRadius: 10,
                border: '1px solid rgba(0,0,0,0.08)', fontSize: '1rem',
                fontFamily: "'JetBrains Mono', monospace", outline: 'none',
              }} />
          </div>
        </div>
      </div>

      {/* Spawn Button */}
      <button onClick={spawn} disabled={spawning} style={{
        width: '100%', padding: '14px', borderRadius: 12, border: 'none',
        background: spawning ? '#86868B' : '#0EA5E9', color: '#fff',
        fontSize: '1rem', fontWeight: 600, cursor: spawning ? 'default' : 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
      }}>
        {spawning ? (
          <><div className="animate-spin" style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff' }} /> Spawning...</>
        ) : (
          <><Zap style={{ width: 18, height: 18 }} /> Spawn {agents.toLocaleString()} Agents</>
        )}
      </button>

      {error && (
        <div style={{ marginTop: 16, padding: '12px 16px', borderRadius: 10, background: '#FEF2F2', color: '#DC2626', fontSize: '0.82rem' }}>
          {error}
        </div>
      )}

      {/* CLI alternative */}
      <div style={{ marginTop: 32, padding: 18, background: '#1D1D1F', borderRadius: 12 }}>
        <div style={{ fontSize: '0.65rem', color: '#86868B', marginBottom: 8 }}>Or use the CLI:</div>
        <code style={{ fontSize: '0.78rem', color: '#0EA5E9', fontFamily: "'JetBrains Mono', monospace" }}>
          python -m scripts.spawn_society --agents {agents} --beats {beats}
        </code>
      </div>
    </div>
  )
}
