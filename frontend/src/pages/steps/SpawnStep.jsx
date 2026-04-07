import { useState, useEffect, useRef } from 'react'
import { Users, Zap } from 'lucide-react'

export default function SpawnStep({ data, onComplete, completed }) {
  const [spawning, setSpawning] = useState(false)
  const [spawned, setSpawned] = useState(completed ? 10247 : 0)
  const [phase, setPhase] = useState(completed ? 'done' : 'idle')
  const [logs, setLogs] = useState(completed ? [
    { ts: '--:--:--', msg: 'Society spawned: 10,247 agents across 31 beats' },
    { ts: '--:--:--', msg: '7 cognitive roles: scout, researcher, cartographer, infiltrator, tracker, analyst, qualifier' },
    { ts: '--:--:--', msg: 'Each agent has unique personality traits (boldness, creativity, patience, empathy)' },
  ] : [])
  const logsRef = useRef(null)
  const target = 10247

  const abortRef = useRef(null)

  function addLog(msg) {
    const ts = new Date().toLocaleTimeString('en-US', { hour12: false, fractionalSecondDigits: 1 })
    setLogs(prev => [...prev.slice(-30), { ts, msg }])
  }

  async function startSpawn() {
    const ctrl = new AbortController()
    abortRef.current = ctrl
    setSpawning(true)
    setPhase('spawning')
    addLog('Initializing society engine...')

    await delay(800, ctrl.signal)
    if (ctrl.signal.aborted) return
    addLog('Configuring 31 intelligence beats')

    for (const beat of data.beats.slice(0, 15)) {
      await delay(120 + Math.random() * 80, ctrl.signal)
      if (ctrl.signal.aborted) return
      const count = Math.floor(target / 31 * (0.8 + Math.random() * 0.4))
      setSpawned(prev => Math.min(prev + count, target))
      addLog(`Spawned ${count} agents on ${beat.beat.replace(/_/g, ' ')}`)
    }

    for (let i = 15; i < 31; i++) {
      await delay(60, ctrl.signal)
      if (ctrl.signal.aborted) return
      const count = Math.floor(target / 31 * (0.8 + Math.random() * 0.4))
      setSpawned(prev => Math.min(prev + count, target))
    }

    setSpawned(target)
    addLog(`Society spawned: ${target.toLocaleString()} agents across 31 beats`)
    addLog('7 cognitive roles: scout, researcher, cartographer, infiltrator, tracker, analyst, qualifier')
    addLog('Each agent has unique personality traits (boldness, creativity, patience, empathy)')
    await delay(500, ctrl.signal)
    if (ctrl.signal.aborted) return
    setPhase('done')
    setSpawning(false)
  }

  useEffect(() => {
    if (logsRef.current) logsRef.current.scrollTop = logsRef.current.scrollHeight
  }, [logs])

  useEffect(() => {
    return () => { if (abortRef.current) abortRef.current.abort() }
  }, [])

  const pct = Math.min(100, (spawned / target) * 100)

  return (
    <div style={{ padding: 24 }}>
      {/* Config panel */}
      <div style={{
        padding: 20, borderRadius: 10,
        border: '1px solid rgba(255,255,255,0.06)',
        background: 'rgba(255,255,255,0.02)',
        marginBottom: 20,
      }}>
        <div style={{ fontSize: '0.65rem', color: '#0EA5E9', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
          Society Configuration
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20 }}>
          <ConfigItem label="Agents" value="10,247" />
          <ConfigItem label="Beats" value="31" />
          <ConfigItem label="Roles" value="7" />
          <ConfigItem label="Storage" value="SQLite" />
        </div>
      </div>

      {/* Progress */}
      {phase !== 'idle' && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: '0.78rem', color: '#aaa' }}>
              {phase === 'done' ? 'Society Ready' : 'Spawning agents...'}
            </span>
            <span style={{ fontSize: '0.78rem', color: '#0EA5E9', fontFamily: "'JetBrains Mono', monospace" }}>
              {spawned.toLocaleString()} / {target.toLocaleString()}
            </span>
          </div>
          <div style={{ height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
            <div style={{
              height: '100%', borderRadius: 2, background: phase === 'done' ? '#10B981' : '#0EA5E9',
              width: `${pct}%`, transition: 'width 0.3s ease',
            }} />
          </div>
        </div>
      )}

      {/* Logs */}
      <div ref={logsRef} style={{
        height: 280, overflow: 'auto', padding: 16, borderRadius: 10,
        background: '#111', border: '1px solid rgba(255,255,255,0.04)',
        fontFamily: "'JetBrains Mono', monospace", fontSize: '0.72rem',
      }}>
        {phase === 'idle' && (
          <div style={{ color: '#444', textAlign: 'center', paddingTop: 100 }}>
            Click "Spawn Society" to begin
          </div>
        )}
        {logs.map((log, i) => (
          <div key={i} style={{ padding: '3px 0', color: '#888' }}>
            <span style={{ color: '#444', marginRight: 8 }}>{log.ts}</span>
            {log.msg}
          </div>
        ))}
        {spawning && <span style={{ color: '#0EA5E9' }}>|</span>}
      </div>

      {/* Action */}
      <div style={{ marginTop: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        {phase === 'idle' && (
          <button onClick={startSpawn} style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '10px 24px', borderRadius: 8, border: 'none',
            background: '#0EA5E9', color: '#fff',
            fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer',
          }}>
            <Zap style={{ width: 16, height: 16 }} /> Spawn Society
          </button>
        )}
        {phase === 'done' && (
          <button onClick={onComplete} style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '10px 24px', borderRadius: 8, border: 'none',
            background: '#10B981', color: '#fff',
            fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer',
          }}>
            Continue to Daily Cycle
          </button>
        )}
      </div>
    </div>
  )
}

function ConfigItem({ label, value }) {
  return (
    <div>
      <div style={{ fontSize: '0.6rem', color: '#555', marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: '0.92rem', fontWeight: 600, color: '#fff', fontFamily: "'JetBrains Mono', monospace" }}>{value}</div>
    </div>
  )
}

function delay(ms, signal) {
  return new Promise((resolve) => {
    if (signal?.aborted) { resolve(); return }
    const id = setTimeout(resolve, ms)
    signal?.addEventListener('abort', () => { clearTimeout(id); resolve() }, { once: true })
  })
}
