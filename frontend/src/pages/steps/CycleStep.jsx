import { useState, useEffect, useRef } from 'react'
import { RefreshCw } from 'lucide-react'

const BEAT_ARTICLES = [
  { beat: 'geopolitics', articles: 10, source: 'UN News, Al Jazeera, Foreign Affairs' },
  { beat: 'markets', articles: 10, source: 'CNBC, MarketWatch, Yahoo Finance' },
  { beat: 'cybersecurity', articles: 10, source: 'Krebs on Security, Dark Reading, The Hacker News' },
  { beat: 'ai_startups', articles: 10, source: 'TechCrunch, VentureBeat, HackerNews' },
  { beat: 'healthcare', articles: 10, source: 'STAT News, Healthcare Dive, MedPage Today' },
  { beat: 'climate_energy', articles: 10, source: 'CleanTechnica, Electrek, Carbon Brief' },
  { beat: 'economics', articles: 10, source: 'CNBC Finance, FT Global Economy' },
  { beat: 'defense_govt', articles: 10, source: 'Defense News, Breaking Defense' },
  { beat: 'crypto_web3', articles: 10, source: 'CoinDesk, The Block, Decrypt' },
  { beat: 'biotech_pharma', articles: 10, source: 'BioPharma Dive, FiercePharma' },
  { beat: 'supply_chain', articles: 10, source: 'Supply Chain Dive, FreightWaves' },
  { beat: 'regulation', articles: 10, source: 'r/technology, r/privacy, r/law' },
  { beat: 'social_trends', articles: 10, source: 'Pew Research, Axios, Vox' },
  { beat: 'ai_research', articles: 10, source: 'ArXiv AI, Google Research, MIT Tech Review' },
  { beat: 'media_entertainment', articles: 10, source: 'Variety, Hollywood Reporter' },
]

export default function CycleStep({ data, onComplete, completed }) {
  const [phase, setPhase] = useState(completed ? 'done' : 'idle')
  const [logs, setLogs] = useState(completed ? [
    { ts: '--:--:--', msg: 'Daily cycle starting...' },
    { ts: '--:--:--', msg: 'Phase 1: Reading RSS feeds... 310 articles from 31 beats' },
    { ts: '--:--:--', msg: 'Phase 2: Extracting beliefs (7 roles x 31 beats)...' },
    { ts: '--:--:--', msg: '=== DAILY CYCLE COMPLETE ===' },
    { ts: '--:--:--', msg: 'Agents: 10,247 | Articles: 310 | Beliefs: 3,847 | Corroborations: 12,847' },
  ] : [])
  const [progress, setProgress] = useState(completed
    ? { articles: 310, beliefs: 3847, corroborations: 12847, groups: 195 }
    : { articles: 0, beliefs: 0, corroborations: 0, groups: 0 }
  )
  const logsRef = useRef(null)
  const abortRef = useRef(null)

  function addLog(msg) {
    const ts = new Date().toLocaleTimeString('en-US', { hour12: false, fractionalSecondDigits: 1 })
    setLogs(prev => [...prev.slice(-40), { ts, msg }])
  }

  async function runCycle() {
    const ctrl = new AbortController()
    abortRef.current = ctrl
    const s = ctrl.signal

    setPhase('reading')
    addLog('Daily cycle starting...')
    addLog('10,247 agents loaded across 31 beats')
    await delay(600, s); if (s.aborted) return

    addLog('Phase 1: Reading RSS feeds...')
    for (const beat of BEAT_ARTICLES) {
      await delay(100 + Math.random() * 150, s); if (s.aborted) return
      setProgress(prev => ({ ...prev, articles: prev.articles + beat.articles }))
      addLog(`  ${beat.beat.replace(/_/g, ' ').padEnd(22)} ${beat.articles} articles  (${beat.source})`)
    }
    addLog(`Morning read complete: 310 articles from 31 beats`)
    await delay(400, s); if (s.aborted) return

    setPhase('compressing')
    addLog('Phase 1.5: Compressing articles (free model)...')
    for (let i = 0; i < 4; i++) {
      await delay(600, s); if (s.aborted) return
      addLog(`  Compressed ${(i + 1) * 22}/86 articles`)
    }
    addLog('Compression complete: 86 unique articles')
    await delay(300, s); if (s.aborted) return

    setPhase('extracting')
    addLog('Phase 2: Extracting beliefs (7 roles x 31 beats)...')
    const totalGroups = 195
    for (let i = 0; i < 20; i++) {
      await delay(200 + Math.random() * 100, s); if (s.aborted) return
      const done = Math.min(totalGroups, (i + 1) * 10)
      setProgress(prev => ({ ...prev, groups: done }))
      addLog(`  ${done}/${totalGroups} role groups extracted`)
    }
    addLog(`Extraction complete: ${totalGroups} groups, 0 errors`)
    await delay(200, s); if (s.aborted) return

    setPhase('writing')
    addLog('Phase 3: Writing beliefs to database...')
    const totalBeliefs = 3847
    for (let i = 0; i < 8; i++) {
      await delay(250, s); if (s.aborted) return
      const done = Math.min(totalBeliefs, Math.floor((i + 1) / 8 * totalBeliefs))
      setProgress(prev => ({ ...prev, beliefs: done }))
    }
    setProgress(prev => ({ ...prev, beliefs: totalBeliefs }))
    addLog(`${totalBeliefs.toLocaleString()} beliefs written`)
    await delay(200, s); if (s.aborted) return

    setPhase('corroborating')
    addLog('Phase 4: Corroborating beliefs...')
    await delay(1200, s); if (s.aborted) return
    const corrPairs = 12847
    setProgress(prev => ({ ...prev, corroborations: corrPairs }))
    addLog(`${corrPairs.toLocaleString()} corroboration pairs found`)
    addLog('Beliefs promoted: observed -> supported -> well_supported')
    await delay(300, s); if (s.aborted) return

    addLog('Phase 5: Night consolidation...')
    await delay(500, s); if (s.aborted) return
    addLog('Stale beliefs decayed. Low-confidence claims invalidated.')
    addLog('')
    addLog('=== DAILY CYCLE COMPLETE ===')
    addLog(`Agents: 10,247 | Articles: 310 | Beliefs: ${totalBeliefs.toLocaleString()} | Corroborations: ${corrPairs.toLocaleString()}`)

    setPhase('done')
  }

  useEffect(() => {
    if (logsRef.current) logsRef.current.scrollTop = logsRef.current.scrollHeight
  }, [logs])

  useEffect(() => {
    return () => { if (abortRef.current) abortRef.current.abort() }
  }, [])

  return (
    <div style={{ padding: 24 }}>
      {/* Stats bar */}
      <div style={{
        display: 'flex', flexWrap: 'wrap', gap: 24, marginBottom: 20,
        padding: '14px 20px', borderRadius: 10,
        border: '1px solid rgba(255,255,255,0.06)',
        background: 'rgba(255,255,255,0.02)',
      }}>
        <CycleStat label="Articles" value={progress.articles} />
        <CycleStat label="Beliefs" value={progress.beliefs} />
        <CycleStat label="Corroborations" value={progress.corroborations} />
        <CycleStat label="Role Groups" value={progress.groups} />
      </div>

      {/* Logs */}
      <div ref={logsRef} style={{
        height: 340, overflow: 'auto', padding: 16, borderRadius: 10,
        background: '#111', border: '1px solid rgba(255,255,255,0.04)',
        fontFamily: "'JetBrains Mono', monospace", fontSize: '0.7rem',
      }}>
        {phase === 'idle' && (
          <div style={{ color: '#444', textAlign: 'center', paddingTop: 130 }}>
            Click "Run Daily Cycle" to watch agents read the internet
          </div>
        )}
        {logs.map((log, i) => (
          <div key={i} style={{ padding: '2px 0', color: log.msg.startsWith('===') ? '#0EA5E9' : log.msg.startsWith('  ') ? '#666' : '#999' }}>
            <span style={{ color: '#333', marginRight: 8 }}>{log.ts}</span>
            {log.msg}
          </div>
        ))}
        {phase !== 'idle' && phase !== 'done' && <span style={{ color: '#0EA5E9' }}>|</span>}
      </div>

      {/* Action */}
      <div style={{ marginTop: 20 }}>
        {phase === 'idle' && (
          <button onClick={runCycle} style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '10px 24px', borderRadius: 8, border: 'none',
            background: '#0EA5E9', color: '#fff',
            fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer',
          }}>
            <RefreshCw style={{ width: 16, height: 16 }} /> Run Daily Cycle
          </button>
        )}
        {phase === 'done' && (
          <button onClick={onComplete} style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '10px 24px', borderRadius: 8, border: 'none',
            background: '#10B981', color: '#fff',
            fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer',
          }}>
            Continue to Belief Graph
          </button>
        )}
      </div>
    </div>
  )
}

function CycleStat({ label, value }) {
  return (
    <div>
      <div style={{ fontSize: '1.1rem', fontWeight: 600, color: '#fff', fontFamily: "'JetBrains Mono', monospace" }}>
        {value.toLocaleString()}
      </div>
      <div style={{ fontSize: '0.6rem', color: '#555' }}>{label}</div>
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
