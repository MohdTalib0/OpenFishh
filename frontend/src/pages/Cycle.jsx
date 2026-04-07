import { useState } from 'react'
import { Play, CheckCircle, AlertCircle } from 'lucide-react'

export default function Cycle() {
  const [running, setRunning] = useState(false)
  const [steps, setSteps] = useState([])
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  async function runCycle() {
    setRunning(true)
    setSteps([])
    setResult(null)
    setError(null)

    try {
      const res = await fetch('/api/cycle/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })

      if (!res.ok) {
        const err = await res.json()
        setError(err.error || 'Failed to run cycle')
        setRunning(false)
        return
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const events = buffer.split('\n\n')
        buffer = events.pop() || ''

        for (const block of events) {
          const lines = block.split('\n')
          let eventType = '', dataStr = ''
          for (const line of lines) {
            if (line.startsWith('event: ')) eventType = line.slice(7).trim()
            else if (line.startsWith('data: ')) dataStr = line.slice(6).trim()
          }
          if (eventType && dataStr) {
            try {
              const data = JSON.parse(dataStr)
              if (eventType === 'step') setSteps(prev => [...prev, data])
              else if (eventType === 'complete') setResult(data)
              else if (eventType === 'error') setError(data.message)
            } catch {}
          }
        }
      }
    } catch (e) {
      setError(e.message)
    } finally {
      setRunning(false)
    }
  }

  const PHASE_COLORS = {
    start: '#1D1D1F', read: '#0EA5E9', extract: '#10B981',
    write: '#8B5CF6', corroborate: '#D97706', consolidate: '#86868B',
  }

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: '40px 20px 80px' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, letterSpacing: '-0.03em', marginBottom: 8 }}>
        Daily Cycle
      </h1>
      <p style={{ fontSize: '0.85rem', color: '#86868B', lineHeight: 1.6, marginBottom: 32 }}>
        Run the society's daily intelligence cycle. Agents read RSS feeds, extract beliefs with epistemic metadata, corroborate matching claims, and consolidate old beliefs.
      </p>

      <button onClick={runCycle} disabled={running} style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '12px 28px', borderRadius: 12, border: 'none',
        background: running ? '#86868B' : '#0EA5E9', color: '#fff',
        fontSize: '0.9rem', fontWeight: 600, cursor: running ? 'default' : 'pointer',
        marginBottom: 32, transition: 'background 0.2s',
      }}>
        {running ? (
          <><div className="animate-spin" style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff' }} /> Running cycle...</>
        ) : (
          <><Play style={{ width: 16, height: 16 }} /> Run Cycle Now</>
        )}
      </button>

      {/* Progress */}
      {steps.length > 0 && (
        <div style={{
          background: '#fff', borderRadius: 16, padding: 24,
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
          marginBottom: 24,
        }}>
          {steps.map((s, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '8px 0', fontSize: '0.85rem',
            }}>
              <div style={{
                width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                background: PHASE_COLORS[s.phase] || '#D2D2D7',
              }} />
              <span style={{ color: '#1D1D1F', fontWeight: 500 }}>
                {s.phase?.replace(/_/g, ' ')}
              </span>
              <span style={{ color: '#86868B', flex: 1 }}>{s.message}</span>
            </div>
          ))}
        </div>
      )}

      {/* Result */}
      {result && (
        <div style={{
          background: '#fff', borderRadius: 16, padding: 24,
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
          border: '1px solid rgba(5,150,105,0.1)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <CheckCircle style={{ width: 18, height: 18, color: '#059669' }} />
            <span style={{ fontSize: '1rem', fontWeight: 600, color: '#1D1D1F' }}>Cycle Complete</span>
            <span style={{ fontSize: '0.75rem', color: '#86868B', marginLeft: 'auto' }}>{result.duration}s</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
            {[
              { label: 'Agents', value: result.agents },
              { label: 'Articles', value: result.articles },
              { label: 'Beliefs', value: result.beliefs },
              { label: 'Corroborations', value: result.corroborations },
            ].map(s => (
              <div key={s.label}>
                <div style={{ fontSize: '1.3rem', fontWeight: 600, color: '#1D1D1F' }}>{s.value}</div>
                <div style={{ fontSize: '0.72rem', color: '#AEAEB2' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '14px 18px', borderRadius: 12,
          background: '#FEF2F2', color: '#DC2626', fontSize: '0.82rem',
        }}>
          <AlertCircle style={{ width: 16, height: 16, flexShrink: 0 }} />
          {error}
        </div>
      )}
    </div>
  )
}
