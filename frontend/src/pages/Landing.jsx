import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, Users, Brain, Database, Eye, Shield, HelpCircle } from 'lucide-react'

const SAMPLE_QUESTIONS = [
  "What are the current cyber threats targeting financial institutions?",
  "How will Trump's tariffs affect global supply chains?",
  "What is the state of AI regulation in the EU?",
  "Which biotech companies are closest to breakthrough treatments?",
]

export default function Landing() {
  const navigate = useNavigate()
  const [question, setQuestion] = useState('')
  const [running, setRunning] = useState(false)
  const [steps, setSteps] = useState([])
  const [error, setError] = useState(null)
  const [stats, setStats] = useState(null)
  const [recentReports, setRecentReports] = useState([])

  useEffect(() => {
    fetch('/api/stats').then(r => r.json()).then(setStats).catch(() => {})
    fetch('/api/reports').then(r => r.json()).then(d => setRecentReports(d.reports || [])).catch(() => {})
  }, [])

  async function investigate() {
    if (!question.trim() || running) return
    setRunning(true)
    setSteps([])
    setError(null)

    try {
      const res = await fetch('/api/investigate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: question.trim() }),
      })

      if (!res.ok) {
        const err = await res.json()
        setError(err.error || 'Failed')
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
              else if (eventType === 'saved' && data.id) navigate(`/report/${data.id}`)
            } catch {}
          }
        }
      }
    } catch (e) {
      setError(e.message || 'Connection failed')
    } finally {
      setRunning(false)
    }
  }

  return (
    <div style={{ minHeight: 'calc(100vh - 52px)' }}>
      <main style={{
        maxWidth: 720, margin: '0 auto', padding: '60px 24px 80px',
      }}>
        {/* Hero */}
        <h1 style={{
          fontSize: 'clamp(1.8rem, 5vw, 2.8rem)',
          fontWeight: 700, textAlign: 'center',
          letterSpacing: '-0.03em', lineHeight: 1.2, marginBottom: 16,
        }}>
          Run 10,000 AI agents
          <br />
          <span style={{ color: '#0EA5E9' }}>reading the internet.</span>
        </h1>

        <p style={{
          fontSize: '1.05rem', color: '#86868B', textAlign: 'center',
          maxWidth: 540, margin: '0 auto', lineHeight: 1.6, marginBottom: 32,
        }}>
          Open-source swarm intelligence for the open web.
          50 agents by default. Scale to 10,000+.
        </p>

        {/* Live Stats */}
        {stats && stats.beings > 0 && (
          <div style={{
            display: 'flex', flexWrap: 'wrap', gap: 20, justifyContent: 'center',
            marginBottom: 32, padding: '12px 20px', borderRadius: 12,
            background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
          }}>
            <Stat icon={Users} label="Agents" value={stats.beings.toLocaleString()} color="#0EA5E9" />
            <Stat icon={Brain} label="Beliefs" value={stats.beliefs.toLocaleString()} color="#8B5CF6" />
            <Stat icon={Database} label="Entities" value={stats.entities.toLocaleString()} color="#10B981" />
            <Stat icon={Eye} label="Beats" value={stats.beats} color="#D97706" />
          </div>
        )}

        {/* No society yet */}
        {stats && stats.beings === 0 && (
          <div style={{
            textAlign: 'center', padding: '24px', marginBottom: 32,
            background: 'rgba(14,165,233,0.04)', borderRadius: 12,
            border: '1px solid rgba(14,165,233,0.1)',
          }}>
            <p style={{ fontSize: '0.9rem', color: '#1D1D1F', marginBottom: 8 }}>
              No agents spawned yet.
            </p>
            <button onClick={() => navigate('/setup')} style={{
              padding: '8px 20px', borderRadius: 8, border: 'none',
              background: '#0EA5E9', color: '#fff', fontSize: '0.82rem',
              fontWeight: 600, cursor: 'pointer',
            }}>
              Spawn Your Society →
            </button>
          </div>
        )}

        {/* Input */}
        <div style={{
          background: '#fff', borderRadius: 16, padding: 20,
          boxShadow: '0 2px 12px rgba(0,0,0,0.06), 0 0 1px rgba(0,0,0,0.1)',
          marginBottom: 24,
        }}>
          <textarea
            value={question}
            onChange={e => setQuestion(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) investigate() }}
            placeholder="What do you want to investigate?"
            rows={3}
            style={{
              width: '100%', border: 'none', outline: 'none', resize: 'vertical',
              fontSize: '1rem', lineHeight: 1.6, color: '#1D1D1F',
              fontFamily: 'inherit', background: 'transparent',
            }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
            <span style={{ fontSize: '0.7rem', color: '#AEAEB2' }}>
              {running ? '' : 'Ctrl+Enter to investigate'}
            </span>
            <button onClick={investigate} disabled={!question.trim() || running}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '10px 24px', borderRadius: 10, border: 'none',
                cursor: !question.trim() || running ? 'default' : 'pointer',
                background: !question.trim() ? '#D2D2D7' : running ? '#86868B' : '#0EA5E9',
                color: '#fff', fontSize: '0.85rem', fontWeight: 600,
              }}>
              {running ? (
                <><div className="animate-spin" style={{ width: 14, height: 14, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff' }} /> Investigating...</>
              ) : (
                <>Investigate <ArrowRight style={{ width: 14, height: 14 }} /></>
              )}
            </button>
          </div>
        </div>

        {/* Sample questions */}
        {!running && steps.length === 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginBottom: 32 }}>
            {SAMPLE_QUESTIONS.map(q => (
              <button key={q} onClick={() => setQuestion(q)} style={{
                padding: '6px 14px', borderRadius: 20,
                border: '1px solid rgba(0,0,0,0.08)', background: '#fff',
                fontSize: '0.72rem', color: '#86868B', cursor: 'pointer',
              }}>
                {q.length > 50 ? q.slice(0, 50) + '...' : q}
              </button>
            ))}
          </div>
        )}

        {/* Progress */}
        {running && steps.length > 0 && (
          <div className="animate-fade-in" style={{
            background: '#fff', borderRadius: 16, padding: 20,
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)', marginBottom: 24,
          }}>
            {steps.map((s, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '6px 0', fontSize: '0.82rem', color: '#86868B',
              }}>
                <div style={{
                  width: 6, height: 6, borderRadius: '50%', flexShrink: 0,
                  background: s.phase === 'search' ? '#0EA5E9' : s.phase === 'extract' ? '#10B981' : s.phase === 'synthesize' ? '#8B5CF6' : '#D2D2D7',
                }} />
                {s.message}
              </div>
            ))}
          </div>
        )}

        {error && (
          <div style={{ padding: '14px 18px', borderRadius: 12, background: '#FEF2F2', color: '#DC2626', fontSize: '0.82rem' }}>
            {error}
          </div>
        )}

        {/* Features */}
        {!running && steps.length === 0 && (
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(200px, 100%), 1fr))',
            gap: 12, marginTop: 16, marginBottom: 40,
          }}>
            {[
              { icon: Users, title: 'Scale to 10,000+', desc: '50 agents by default. Configure up to 10,000+ across 31 beats.' },
              { icon: Shield, title: 'Epistemic Discipline', desc: 'Source tiers, confidence bands, claim lifecycle. Structured trust.' },
              { icon: Eye, title: 'Source Transparency', desc: 'Wire (0.9) → Trade Press (0.72) → Social (0.4). Every source scored.' },
              { icon: HelpCircle, title: 'Known Unknowns', desc: 'We tell you what we can\'t determine and why.' },
            ].map(f => (
              <div key={f.title} style={{
                padding: 24, background: '#fff', borderRadius: 16,
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
              }}>
                <f.icon style={{ width: 20, height: 20, color: '#0EA5E9', marginBottom: 12 }} />
                <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#1D1D1F', marginBottom: 6 }}>{f.title}</div>
                <div style={{ fontSize: '0.78rem', color: '#86868B', lineHeight: 1.5 }}>{f.desc}</div>
              </div>
            ))}
          </div>
        )}

        {/* Recent Reports */}
        {!running && recentReports.length > 0 && (
          <div>
            <div style={{ fontSize: '0.7rem', fontWeight: 600, color: '#AEAEB2', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
              Recent Reports
            </div>
            {recentReports.map(r => (
              <a key={r.id} href={`/report/${r.id}`} style={{
                display: 'block', padding: '14px 18px', marginBottom: 8,
                background: '#fff', borderRadius: 12, textDecoration: 'none',
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
              }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 500, color: '#1D1D1F' }}>
                  {r.question}
                </div>
                <div style={{ fontSize: '0.65rem', color: '#AEAEB2', marginTop: 4 }}>
                  {r.trust_summary?.claims_count || 0} claims · {r.trust_summary?.sources_count || 0} sources
                  {r.created_at && ` · ${new Date(r.created_at).toLocaleDateString()}`}
                </div>
              </a>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

function Stat({ icon: Icon, label, value, color }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <Icon style={{ width: 14, height: 14, color }} />
      <span style={{ fontSize: '0.72rem', color: '#86868B' }}>{label}</span>
      <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#1D1D1F' }}>{value}</span>
    </div>
  )
}
