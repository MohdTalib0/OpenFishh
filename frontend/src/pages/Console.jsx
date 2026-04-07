import { useState, useEffect, useCallback } from 'react'
import { Github, ArrowRight, ArrowLeft } from 'lucide-react'
import SpawnStep from './steps/SpawnStep'
import CycleStep from './steps/CycleStep'
import BeliefStep from './steps/BeliefStep'
import ReportStep from './steps/ReportStep'
import ExploreStep from './steps/ExploreStep'
import demoData from '../data/demo.json'

const STEPS = [
  { num: '01', title: 'Spawn Society', desc: 'Configure agents, assign roles across 31 intelligence beats' },
  { num: '02', title: 'Daily Cycle', desc: 'Agents read RSS feeds, extract beliefs with epistemic metadata' },
  { num: '03', title: 'Belief Graph', desc: 'Browse claims with confidence bands, source tiers, known unknowns' },
  { num: '04', title: 'Intelligence Report', desc: 'Generate auditable Blueprint dossiers from accumulated knowledge' },
  { num: '05', title: 'Deep Exploration', desc: 'Explore agents, entities, contested beliefs, and epistemic scorecard' },
]

const STORAGE_KEY = 'openfishh_state'

function loadState() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw)
  } catch { return null }
}

function saveState(state) {
  try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state)) } catch {}
}

function parseHash() {
  const h = window.location.hash.replace('#', '')
  if (!h) return null
  if (h === 'demo') return { started: true, step: 0 }
  const m = h.match(/^step\/(\d)$/)
  if (m) return { started: true, step: Math.min(4, Math.max(0, parseInt(m[1]) - 1)) }
  return null
}

function setHash(started, step) {
  const hash = started ? (step > 0 ? `#step/${step + 1}` : '#demo') : ''
  if (window.location.hash !== hash) {
    window.history.replaceState(null, '', hash || window.location.pathname)
  }
}

export default function Console() {
  const saved = loadState()
  const hashState = parseHash()

  const [started, setStarted] = useState(hashState?.started ?? saved?.started ?? false)
  const [currentStep, setCurrentStep] = useState(hashState?.step ?? saved?.currentStep ?? 0)
  const [stepComplete, setStepComplete] = useState(saved?.stepComplete ?? {})

  // Persist state on change
  useEffect(() => {
    saveState({ started, currentStep, stepComplete })
    setHash(started, currentStep)
  }, [started, currentStep, stepComplete])

  // Handle browser back/forward
  useEffect(() => {
    function onHashChange() {
      const h = parseHash()
      if (h) {
        setStarted(h.started)
        setCurrentStep(h.step)
      } else {
        setStarted(false)
      }
    }
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  const nextStep = useCallback(() => {
    setStepComplete(prev => ({ ...prev, [currentStep]: true }))
    if (currentStep < 4) {
      const next = currentStep + 1
      setCurrentStep(next)
      window.history.pushState(null, '', `#step/${next + 1}`)
    }
  }, [currentStep])

  const prevStep = useCallback(() => {
    if (currentStep > 0) {
      const prev = currentStep - 1
      setCurrentStep(prev)
      window.history.pushState(null, '', prev > 0 ? `#step/${prev + 1}` : '#demo')
    }
  }, [currentStep])

  function handleStart() {
    setStarted(true)
    window.history.pushState(null, '', '#demo')
  }

  if (!started) return <HeroSection onStart={handleStart} />

  return (
    <div style={{ minHeight: '100vh', background: '#0A0A0A', color: '#E5E5E5' }}>
      {/* Header */}
      <header style={{
        padding: '12px 20px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <img src="/icon.svg" alt="" className="console-logo" onClick={() => { setStarted(false); window.history.pushState(null, '', window.location.pathname) }} style={{ width: 22, height: 22, cursor: 'pointer' }} />
          <style>{`@media (max-width: 640px) { .console-logo { width: 28px !important; height: 28px !important; } }`}</style>
          <span onClick={() => { setStarted(false); window.history.pushState(null, '', window.location.pathname) }} style={{ fontSize: '0.9rem', fontWeight: 600, color: '#fff', cursor: 'pointer' }}>OpenFishh</span>
          <span className="hide-mobile" style={{
            fontSize: '0.7rem', color: '#0EA5E9', padding: '2px 8px',
            border: '1px solid rgba(14,165,233,0.3)', borderRadius: 4,
            fontFamily: "'JetBrains Mono', monospace",
          }}>
            Step {currentStep + 1}/5
          </span>
          <span className="hide-mobile" style={{ fontSize: '0.75rem', color: '#666' }}>
            {STEPS[currentStep].title}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <StatusDot status={stepComplete[currentStep] ? 'complete' : 'processing'} />
          <a href="https://github.com/MohdTalib0/OpenFishh" target="_blank" rel="noopener"
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '5px 12px', borderRadius: 6,
              background: 'rgba(255,255,255,0.08)', color: '#ccc',
              textDecoration: 'none', fontSize: '0.72rem',
            }}>
            <Github style={{ width: 13, height: 13 }} />
            Star
          </a>
        </div>
      </header>

      {/* Main content */}
      <div style={{ display: 'flex', minHeight: 'calc(100vh - 49px)' }}>
        {/* Left: Step sidebar */}
        <aside style={{
          width: 280, flexShrink: 0, padding: '24px 20px',
          borderRight: '1px solid rgba(255,255,255,0.06)',
          display: 'flex', flexDirection: 'column',
          gap: 4,
        }}
        className="hide-mobile"
        >
          {STEPS.map((step, i) => (
            <button key={i} onClick={() => setCurrentStep(i)} style={{
              display: 'flex', gap: 12, padding: '12px 14px',
              borderRadius: 8, border: 'none', textAlign: 'left',
              cursor: 'pointer', width: '100%',
              background: i === currentStep ? 'rgba(14,165,233,0.08)' : 'transparent',
              transition: 'background 0.15s',
            }}>
              <span style={{
                fontSize: '0.65rem', fontWeight: 700, color: stepComplete[i] ? '#10B981' : i === currentStep ? '#0EA5E9' : '#555',
                fontFamily: "'JetBrains Mono', monospace",
                minWidth: 20,
              }}>
                {stepComplete[i] ? '\u2713' : step.num}
              </span>
              <div>
                <div style={{
                  fontSize: '0.78rem', fontWeight: 600,
                  color: i === currentStep ? '#fff' : '#888',
                }}>
                  {step.title}
                </div>
                <div style={{ fontSize: '0.65rem', color: '#555', marginTop: 2, lineHeight: 1.4 }}>
                  {step.desc}
                </div>
              </div>
            </button>
          ))}
        </aside>

        {/* Right: Step content */}
        <main style={{ flex: 1, overflow: 'auto' }}>
          {/* Mobile step nav -- fixed at top, hidden on desktop */}
          <div className="show-mobile" style={{
            display: 'none', /* overridden by media query */
            position: 'sticky', top: 0, zIndex: 20,
            padding: '10px 16px',
            background: '#0A0A0A',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            alignItems: 'center', justifyContent: 'space-between',
          }}>
            <button onClick={prevStep} disabled={currentStep === 0} style={{
              width: 32, height: 32, borderRadius: 8,
              border: '1px solid rgba(255,255,255,0.1)',
              background: 'transparent',
              color: currentStep === 0 ? '#333' : '#999',
              cursor: currentStep === 0 ? 'default' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <ArrowLeft style={{ width: 16, height: 16 }} />
            </button>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                {STEPS.map((step, i) => (
                  <button key={i} onClick={() => setCurrentStep(i)} style={{
                    width: i === currentStep ? 24 : 8,
                    height: 8, borderRadius: 4, border: 'none', padding: 0,
                    background: stepComplete[i] ? '#10B981' : i === currentStep ? '#0EA5E9' : '#333',
                    cursor: 'pointer',
                    transition: 'width 0.2s, background 0.2s',
                  }} />
                ))}
              </div>
              <span style={{ fontSize: '0.58rem', color: '#666', fontFamily: "'JetBrains Mono', monospace" }}>
                {currentStep + 1}/5 {STEPS[currentStep].title}
              </span>
            </div>

            <button onClick={currentStep < 4 ? nextStep : undefined} disabled={currentStep >= 4} style={{
              width: 32, height: 32, borderRadius: 8,
              border: 'none',
              background: currentStep < 4 ? '#0EA5E9' : 'transparent',
              color: currentStep < 4 ? '#fff' : '#333',
              cursor: currentStep < 4 ? 'pointer' : 'default',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <ArrowRight style={{ width: 16, height: 16 }} />
            </button>
          </div>

          <style>{`
            @media (max-width: 640px) {
              .show-mobile { display: flex !important; }
            }
          `}</style>

          {currentStep === 0 && <SpawnStep data={demoData} onComplete={nextStep} completed={!!stepComplete[0]} />}
          {currentStep === 1 && <CycleStep data={demoData} onComplete={nextStep} completed={!!stepComplete[1]} />}
          {currentStep === 2 && <BeliefStep data={demoData} onComplete={nextStep} completed={!!stepComplete[2]} />}
          {currentStep === 3 && <ReportStep data={demoData} onComplete={nextStep} completed={!!stepComplete[3]} />}
          {currentStep === 4 && <ExploreStep data={demoData} />}

          {/* Bottom nav -- desktop only */}
          <div className="hide-mobile" style={{
            padding: '16px 24px', borderTop: '1px solid rgba(255,255,255,0.06)',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <button onClick={prevStep} disabled={currentStep === 0} style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '8px 16px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.1)',
              background: 'transparent', color: currentStep === 0 ? '#333' : '#999',
              fontSize: '0.78rem', cursor: currentStep === 0 ? 'default' : 'pointer',
            }}>
              <ArrowLeft style={{ width: 14, height: 14 }} /> Previous
            </button>
            {currentStep < 4 && (
              <button onClick={nextStep} style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '8px 20px', borderRadius: 6, border: 'none',
                background: '#0EA5E9', color: '#fff',
                fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer',
              }}>
                Next Step <ArrowRight style={{ width: 14, height: 14 }} />
              </button>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}


function useGitHubStars() {
  const [stars, setStars] = useState(null)
  useEffect(() => {
    fetch('https://api.github.com/repos/MohdTalib0/OpenFishh')
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.stargazers_count != null) setStars(d.stargazers_count) })
      .catch(() => {})
  }, [])
  return stars
}

function HeroSection({ onStart }) {
  const stars = useGitHubStars()
  return (
    <div style={{ background: '#0A0A0A', color: '#E5E5E5', fontFamily: "'Inter', system-ui, sans-serif" }}>
      {/* Navbar */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 50,
        height: 56, background: 'rgba(10,10,10,0.92)', backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        display: 'flex', justifyContent: 'center',
      }}>
      <div style={{
        width: '80%', maxWidth: 1100,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        height: '100%', position: 'relative',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <img src="/icon.svg" alt="OpenFishh logo" style={{ width: 30, height: 30 }} />
          <span style={{ fontWeight: 700, fontSize: '1rem', color: '#fff' }}>OpenFishh</span>
        </div>

        {/* Center links */}
        <div className="nav-links" style={{
          position: 'absolute', left: '50%', transform: 'translateX(-50%)',
          display: 'flex', alignItems: 'center', gap: 28,
        }}>
          {[
            { label: 'How It Works', href: '#how-it-works' },
            { label: 'Use Cases', href: '#use-cases' },
            { label: 'About', href: '#about' },
          ].map((link, i) => (
            <a key={i} href={link.href} style={{
              color: '#888', textDecoration: 'none', fontSize: '0.82rem', fontWeight: 500,
              transition: 'color 0.15s',
            }}
            onMouseOver={e => e.currentTarget.style.color = '#fff'}
            onMouseOut={e => e.currentTarget.style.color = '#888'}
            >{link.label}</a>
          ))}
        </div>

        {/* Right: GitHub */}
        <a href="https://github.com/MohdTalib0/OpenFishh" target="_blank" rel="noopener"
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '6px 16px', borderRadius: 8,
            border: '1px solid rgba(255,255,255,0.15)', background: 'transparent',
            color: '#fff', textDecoration: 'none', fontSize: '0.8rem', fontWeight: 500,
          }}>
          <Github style={{ width: 15, height: 15 }} /> GitHub
        </a>
      </div>
      </nav>

      {/* ========== HERO ========== */}
      <section style={{
        textAlign: 'center', padding: 'clamp(48px, 10vh, 100px) 24px 48px',
        width: '78%', maxWidth: 1100, margin: '0 auto',
      }}>
        <h1 style={{
          fontSize: 'clamp(2.4rem, 6.5vw, 4.2rem)',
          fontWeight: 700, lineHeight: 1.08,
          margin: '0 0 20px', letterSpacing: '-0.03em', color: '#fff',
        }}>
          Your AI Research Team<br />That <em style={{ fontStyle: 'italic', textDecoration: 'underline', textDecorationColor: '#0EA5E9', textUnderlineOffset: 6 }}>Never Sleeps</em>
        </h1>

        <p style={{
          fontSize: 'clamp(0.95rem, 2.2vw, 1.15rem)',
          color: '#777', maxWidth: 580, margin: '0 auto 40px', lineHeight: 1.65,
        }}>
          10,000 AI agents read the open internet daily, form evidence-backed beliefs, debate contested claims, and deliver auditable intelligence across 31 beats.
        </p>

        {/* CTAs */}
        <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 48 }}>
          <button onClick={onStart} className="cta-demo" style={{
            padding: '16px 40px', borderRadius: 50, border: 'none',
            background: 'linear-gradient(135deg, #fff 0%, #e0e7ff 100%)',
            color: '#0A0A0A', fontSize: '1.05rem', fontWeight: 700,
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10,
            boxShadow: '0 0 30px rgba(255,255,255,0.1), 0 2px 8px rgba(0,0,0,0.3)',
            transition: 'transform 0.2s, box-shadow 0.2s',
            letterSpacing: '-0.01em',
          }}
          onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-2px) scale(1.04)'; e.currentTarget.style.boxShadow = '0 0 50px rgba(255,255,255,0.18), 0 8px 24px rgba(0,0,0,0.3)' }}
          onMouseOut={e => { e.currentTarget.style.transform = 'translateY(0) scale(1)'; e.currentTarget.style.boxShadow = '0 0 30px rgba(255,255,255,0.1), 0 2px 8px rgba(0,0,0,0.3)' }}
          >
            Try Live Demo
            <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 24, height: 24, borderRadius: '50%', background: '#0A0A0A', color: '#fff', fontSize: '0.82rem' }}>&rarr;</span>
          </button>
          <a href="https://github.com/MohdTalib0/OpenFishh" target="_blank" rel="noopener" className="cta-star"
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '16px 36px', borderRadius: 50,
              border: '1px solid rgba(255,255,255,0.12)',
              background: 'rgba(255,255,255,0.04)',
              color: '#fff', textDecoration: 'none', fontSize: '1.05rem', fontWeight: 700,
              transition: 'transform 0.2s, border-color 0.2s, background 0.2s',
              letterSpacing: '-0.01em',
            }}
            onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.borderColor = 'rgba(245,158,11,0.4)'; e.currentTarget.style.background = 'rgba(245,158,11,0.06)' }}
            onMouseOut={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; e.currentTarget.style.background = 'rgba(255,255,255,0.04)' }}
          >
            <span style={{ color: '#F59E0B', fontSize: '1.1rem' }}>&#9733;</span> Star on GitHub {stars != null && <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.82rem', color: '#888', fontWeight: 500 }}>{stars >= 1000 ? (stars / 1000).toFixed(1) + 'k' : stars}</span>}
          </a>
        </div>

        {/* Mini belief card preview */}
        <div style={{
          maxWidth: 480, margin: '0 auto 0', padding: '16px 20px', borderRadius: 12,
          border: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)',
          textAlign: 'left',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#10B981' }} />
            <span style={{ fontSize: '0.62rem', color: '#555', fontFamily: "'JetBrains Mono', monospace" }}>LIVE BELIEF</span>
            <span style={{ fontSize: '0.55rem', padding: '1px 6px', borderRadius: 3, background: 'rgba(16,185,129,0.1)', color: '#10B981', fontWeight: 600, marginLeft: 'auto' }}>supported</span>
          </div>
          <div style={{ fontSize: '0.85rem', color: '#ddd', lineHeight: 1.5 }}>
            <strong style={{ color: '#fff' }}>IRGC cyber units</strong>{' '}
            <span style={{ color: '#888' }}>have expanded targeting to include</span>{' '}
            <strong style={{ color: '#fff' }}>US financial technology firms</strong>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 8, fontSize: '0.58rem', color: '#444', fontFamily: "'JetBrains Mono', monospace" }}>
            <span>Kenji-Core</span>
            <span>cybersecurity</span>
            <span>krebsonsecurity.com</span>
            <span>conf: 0.91</span>
          </div>
        </div>

        {/* Waitlist */}
        <div style={{ textAlign: 'center', marginTop: 48 }}>
          <h3 style={{
            fontStyle: 'italic', fontSize: 'clamp(1.1rem, 3vw, 1.5rem)',
            fontWeight: 600, color: '#fff', margin: '0 0 12px',
            fontFamily: "'Georgia', 'Times New Roman', serif",
          }}>
            Join the waitlist to get notified at launch!
          </h3>
          <p style={{ fontSize: '0.85rem', color: '#666', margin: '0 0 20px', lineHeight: 1.5 }}>
            The hosted edition is on its way.<br />
            Thousands of intelligent agents reading the open web and delivering intelligence to your inbox.
          </p>
          <WaitlistForm />
        </div>
      </section>

      {/* ========== SOCIAL PROOF BAR ========== */}
      <section style={{
        display: 'flex', justifyContent: 'center', gap: 'clamp(20px, 4vw, 56px)',
        padding: '32px 24px', borderTop: '1px solid rgba(255,255,255,0.04)',
        borderBottom: '1px solid rgba(255,255,255,0.04)',
        flexWrap: 'wrap',
      }}>
        {[
          { v: '37,563', l: 'Beliefs formed' },
          { v: '16,824', l: 'Entities tracked' },
          { v: '10,247', l: 'Agents deployed' },
          { v: '31', l: 'Intelligence beats' },
        ].map((s, i) => (
          <div key={i} style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 600, fontSize: 'clamp(0.95rem, 2vw, 1.2rem)', color: '#fff' }}>{s.v}</div>
            <div style={{ fontSize: '0.68rem', color: '#555', marginTop: 2 }}>{s.l}</div>
          </div>
        ))}
      </section>

      {/* ========== HOW IT WORKS -- horizontal timeline ========== */}
      <section id="how-it-works" style={{ width: '78%', maxWidth: 1100, margin: '0 auto', padding: '64px 24px', textAlign: 'center', scrollMarginTop: 64 }}>
        <div style={{ fontSize: '0.68rem', fontWeight: 600, color: '#555', letterSpacing: '0.12em', marginBottom: 10 }}>HOW IT WORKS</div>
        <h2 style={{ fontSize: 'clamp(1.5rem, 3.5vw, 2.2rem)', fontWeight: 700, color: '#fff', margin: '0 0 48px', letterSpacing: '-0.02em' }}>
          Five Steps to Intelligence
        </h2>

        {/* Desktop: horizontal row */}
        <div className="steps-desktop" style={{ display: 'flex', gap: 0, textAlign: 'center' }}>
          {STEPS.map((step, i) => (
            <div key={i} style={{ flex: 1, position: 'relative', padding: '0 8px' }}>
              {i < STEPS.length - 1 && (
                <div style={{ position: 'absolute', top: 15, left: '50%', right: '-50%', height: 1, background: 'rgba(255,255,255,0.08)', zIndex: 0 }} />
              )}
              <div style={{
                width: 32, height: 32, borderRadius: '50%', margin: '0 auto 12px',
                background: 'rgba(14,165,233,0.1)', border: '1px solid rgba(14,165,233,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: "'JetBrains Mono', monospace", fontSize: '0.68rem', fontWeight: 700, color: '#0EA5E9',
                position: 'relative', zIndex: 1,
              }}>
                {step.num}
              </div>
              <div style={{ fontWeight: 600, fontSize: '0.82rem', color: '#fff', marginBottom: 4 }}>{step.title}</div>
              <div style={{ fontSize: '0.72rem', color: '#555', lineHeight: 1.4 }}>{step.desc}</div>
            </div>
          ))}
        </div>

        {/* Mobile: vertical timeline with connector lines */}
        <div className="steps-mobile" style={{ display: 'none', flexDirection: 'column', alignItems: 'flex-start', gap: 0, textAlign: 'left', maxWidth: 320, margin: '0 auto' }}>
          {STEPS.map((step, i) => (
            <div key={i} style={{ display: 'flex', gap: 14 }}>
              {/* Left: dot + vertical line */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 28 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                  background: 'rgba(14,165,233,0.1)', border: '1px solid rgba(14,165,233,0.3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: "'JetBrains Mono', monospace", fontSize: '0.62rem', fontWeight: 700, color: '#0EA5E9',
                }}>
                  {step.num}
                </div>
                {i < STEPS.length - 1 && (
                  <div style={{ width: 1, flex: 1, minHeight: 24, background: 'rgba(14,165,233,0.15)' }} />
                )}
              </div>
              {/* Right: text */}
              <div style={{ paddingBottom: 20 }}>
                <div style={{ fontWeight: 600, fontSize: '0.88rem', color: '#fff', marginBottom: 3 }}>{step.title}</div>
                <div style={{ fontSize: '0.75rem', color: '#555', lineHeight: 1.5 }}>{step.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ========== USE CASES (3, not 6) ========== */}
      <section id="use-cases" style={{ width: '78%', maxWidth: 1100, margin: '0 auto', padding: '0 24px 64px', textAlign: 'center', scrollMarginTop: 64 }}>
        <div style={{ fontSize: '0.68rem', fontWeight: 600, color: '#555', letterSpacing: '0.12em', marginBottom: 10 }}>USE CASES</div>
        <h2 style={{ fontSize: 'clamp(1.5rem, 3.5vw, 2.2rem)', fontWeight: 700, color: '#fff', margin: '0 0 40px', letterSpacing: '-0.02em' }}>
          Built for Every Scenario
        </h2>

        <div className="use-case-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, textAlign: 'left' }}>
          {[
            { tag: 'CYBERSECURITY', title: 'Threat Intelligence', desc: 'Track emerging CVEs, APT campaigns, and zero-days with source-tier credibility scoring. Know before you\'re targeted.' },
            { tag: 'FINANCE / STRATEGY', title: 'Market Research', desc: 'Monitor sentiment shifts, earnings signals, and macro trends across markets, crypto, and VC funding -- daily, automatically.' },
            { tag: 'JOURNALISM / OSINT', title: 'Open-Source Intelligence', desc: 'Build auditable dossiers where every claim traces to a source, every uncertainty is surfaced, every bias is flagged.' },
          ].map((uc, i) => (
            <div key={i} style={{
              padding: '28px', borderRadius: 12,
              border: '1px solid rgba(255,255,255,0.08)',
              background: 'rgba(255,255,255,0.02)',
            }}>
              <div style={{ fontSize: '0.6rem', fontWeight: 600, color: '#555', letterSpacing: '0.1em', marginBottom: 12 }}>{uc.tag}</div>
              <div style={{ fontSize: '1.05rem', fontWeight: 600, color: '#fff', marginBottom: 8 }}>{uc.title}</div>
              <div style={{ fontSize: '0.85rem', color: '#666', lineHeight: 1.6 }}>{uc.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ========== WHAT MAKES IT DIFFERENT ========== */}
      <section style={{ width: '78%', maxWidth: 1100, margin: '0 auto', padding: '0 24px 64px', textAlign: 'center' }}>
        <div style={{ fontSize: '0.68rem', fontWeight: 600, color: '#555', letterSpacing: '0.12em', marginBottom: 10 }}>WHY OPENFISHH</div>
        <h2 style={{ fontSize: 'clamp(1.5rem, 3.5vw, 2.2rem)', fontWeight: 700, color: '#fff', margin: '0 0 40px', letterSpacing: '-0.02em' }}>
          Not Another AI Chatbot
        </h2>

        <div className="compare-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, textAlign: 'left' }}>
          {[
            { vs: 'vs ChatGPT / Perplexity', title: 'Persistent, not one-shot', desc: 'Chatbots answer one question and forget. OpenFishh runs 10,000 agents 24/7 that build cumulative knowledge -- beliefs compound, sources are re-evaluated, contradictions are debated.' },
            { vs: 'vs MiroFish', title: 'Open web, not closed world', desc: 'MiroFish simulates opinions in a closed society. OpenFishh reads the real internet -- RSS feeds, news, research, social -- and forms beliefs grounded in actual sources.' },
            { vs: 'vs Manual Research', title: '10,000 agents vs your 2 tabs', desc: 'A human analyst reads 20 articles/day. Our swarm reads 10,000+ across 31 beats simultaneously, with epistemic metadata you can\'t produce manually.' },
          ].map((c, i) => (
            <div key={i} style={{
              padding: '28px', borderRadius: 12,
              border: '1px solid rgba(255,255,255,0.06)',
              background: 'rgba(255,255,255,0.015)',
            }}>
              <div style={{ fontSize: '0.6rem', fontWeight: 600, color: '#0EA5E9', letterSpacing: '0.08em', marginBottom: 10 }}>{c.vs}</div>
              <div style={{ fontSize: '1.05rem', fontWeight: 600, color: '#fff', marginBottom: 8 }}>{c.title}</div>
              <div style={{ fontSize: '0.85rem', color: '#666', lineHeight: 1.6 }}>{c.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ========== OPEN SOURCE TRUST ========== */}
      <section id="about" style={{
        width: '78%', maxWidth: 1100, margin: '0 auto', padding: '0 24px 64px', textAlign: 'center', scrollMarginTop: 64,
      }}>
        <div style={{ fontSize: '0.68rem', fontWeight: 600, color: '#555', letterSpacing: '0.12em', marginBottom: 10 }}>TRUST & TRANSPARENCY</div>
        <h2 style={{ fontSize: 'clamp(1.3rem, 3vw, 1.8rem)', fontWeight: 700, color: '#fff', margin: '0 0 16px', letterSpacing: '-0.02em' }}>
          Every Claim is Auditable
        </h2>
        <p style={{ color: '#666', fontSize: '0.92rem', lineHeight: 1.65, margin: '0 0 32px' }}>
          Built on an epistemic framework with 5 claim types, 10 source tiers, confidence decomposition, known unknowns, and falsification criteria. The system tells you what it doesn't know.
        </p>

        <div style={{ display: 'flex', justifyContent: 'center', gap: 16, flexWrap: 'wrap' }}>
          {[
            'MIT License',
            '100% Open Source',
            'Self-Hostable',
            'Zero API Keys Required',
          ].map((badge, i) => (
            <span key={i} style={{
              padding: '6px 14px', borderRadius: 6, fontSize: '0.72rem', fontWeight: 500,
              border: '1px solid rgba(255,255,255,0.08)', color: '#888',
            }}>
              {badge}
            </span>
          ))}
        </div>
      </section>

      {/* ========== BOTTOM CTA ========== */}
      <section style={{
        textAlign: 'center', padding: '48px 24px 72px',
        borderTop: '1px solid rgba(255,255,255,0.04)',
      }}>
        <h3 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#fff', margin: '0 0 20px' }}>
          See it in action
        </h3>

        <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button onClick={onStart} style={{
            padding: '14px 40px', borderRadius: 10, border: 'none',
            background: '#0EA5E9', color: '#fff',
            fontSize: '1rem', fontWeight: 600, cursor: 'pointer',
            transition: 'transform 0.15s, box-shadow 0.15s',
            boxShadow: '0 0 30px rgba(14,165,233,0.25)',
          }}
          onMouseOver={e => { e.currentTarget.style.transform = 'scale(1.03)'; e.currentTarget.style.boxShadow = '0 0 50px rgba(14,165,233,0.45)' }}
          onMouseOut={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 0 30px rgba(14,165,233,0.25)' }}
          >
            Try Live Demo
          </button>
          <a href="https://github.com/MohdTalib0/OpenFishh" target="_blank" rel="noopener"
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '14px 36px', borderRadius: 10,
              border: '1px solid rgba(255,255,255,0.15)', background: 'transparent',
              color: '#ccc', textDecoration: 'none', fontSize: '1rem', fontWeight: 600,
            }}>
            <Github style={{ width: 18, height: 18 }} /> Star on GitHub
          </a>
        </div>
        <div style={{ marginTop: 14, fontSize: '0.75rem', color: '#444' }}>No login required. No API key. Fully interactive.</div>
      </section>

      {/* ========== FOOTER ========== */}
      <footer style={{
        borderTop: '1px solid rgba(255,255,255,0.06)',
        padding: '48px clamp(16px, 4vw, 40px) 32px',
        width: '78%', maxWidth: 1100, margin: '0 auto',
      }}>
        <div className="footer-grid" style={{ display: 'flex', justifyContent: 'space-between', gap: 40, marginBottom: 40 }}>
          {/* Brand */}
          <div style={{ maxWidth: 320 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <img src="/icon.svg" alt="OpenFishh" style={{ width: 28, height: 28 }} />
              <span style={{ fontWeight: 700, fontSize: '1rem', color: '#fff' }}>OpenFishh</span>
            </div>
            <p style={{ fontSize: '0.82rem', color: '#555', lineHeight: 1.6, margin: 0 }}>
              Open-source collective intelligence powered by multi-agent technology. Thousands of AI agents read the open internet, form evidence-backed beliefs, and deliver auditable intelligence.
            </p>
          </div>

          {/* Links */}
          <div style={{ display: 'flex', gap: 48 }}>
            <div>
              <div style={{ fontSize: '0.68rem', fontWeight: 600, color: '#666', letterSpacing: '0.1em', marginBottom: 14 }}>PRODUCT</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <a href="#how-it-works" style={{ color: '#777', textDecoration: 'none', fontSize: '0.82rem' }}>How It Works</a>
                <a href="#use-cases" style={{ color: '#777', textDecoration: 'none', fontSize: '0.82rem' }}>Use Cases</a>
                <a onClick={onStart} style={{ color: '#777', textDecoration: 'none', fontSize: '0.82rem', cursor: 'pointer' }}>Live Demo</a>
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.68rem', fontWeight: 600, color: '#666', letterSpacing: '0.1em', marginBottom: 14 }}>COMMUNITY</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <a href="https://github.com/MohdTalib0/OpenFishh" target="_blank" rel="noopener" style={{ color: '#777', textDecoration: 'none', fontSize: '0.82rem' }}>GitHub</a>
                <a href="https://discord.gg/jMwfepkD" target="_blank" rel="noopener" style={{ color: '#777', textDecoration: 'none', fontSize: '0.82rem' }}>Discord</a>
                <a href="https://github.com/MohdTalib0/OpenFishh/issues" target="_blank" rel="noopener" style={{ color: '#777', textDecoration: 'none', fontSize: '0.82rem' }}>Issues</a>
                <a href="https://deepwiki.com/MohdTalib0/OpenFishh" target="_blank" rel="noopener" style={{ color: '#777', textDecoration: 'none', fontSize: '0.82rem' }}>Docs</a>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          paddingTop: 20, borderTop: '1px solid rgba(255,255,255,0.04)',
          flexWrap: 'wrap', gap: 12,
        }}>
          <span style={{ fontSize: '0.72rem', color: '#444' }}>
            MIT License. Built by <a href="https://github.com/MohdTalib0" target="_blank" rel="noopener" style={{ color: '#666', textDecoration: 'none' }}>@MohdTalib0</a>
          </span>
          <a href="https://github.com/MohdTalib0/OpenFishh" target="_blank" rel="noopener"
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '5px 14px', borderRadius: 6,
              border: '1px solid rgba(255,255,255,0.1)', background: 'transparent',
              color: '#aaa', textDecoration: 'none', fontSize: '0.75rem', fontWeight: 500,
            }}>
            <Github style={{ width: 14, height: 14 }} /> Star on GitHub {stars != null && <span style={{ color: '#F59E0B', fontWeight: 700 }}>{stars >= 1000 ? (stars / 1000).toFixed(1) + 'k' : stars}</span>}
          </a>
        </div>
      </footer>

      <style>{`
        @media (max-width: 768px) {
          /* Layout */
          section { width: 92% !important; padding-left: 16px !important; padding-right: 16px !important; }
          footer { width: 92% !important; }

          /* Nav: hide center links, widen inner container */
          .nav-links { display: none !important; }
          nav > div { width: 92% !important; }

          /* Grids stack */
          .use-case-grid, .compare-grid { grid-template-columns: 1fr !important; }

          /* Steps: swap to vertical timeline on mobile */
          .steps-desktop { display: none !important; }
          .steps-mobile { display: flex !important; }

          /* CTAs: full width stack */
          .cta-demo, .cta-star { width: 100% !important; justify-content: center !important; padding: 14px 20px !important; font-size: 0.95rem !important; }

          /* Footer */
          .footer-grid { flex-direction: column !important; gap: 32px !important; }
        }
        @media (min-width: 769px) and (max-width: 1024px) {
          .use-case-grid, .compare-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
      `}</style>
    </div>
  )
}


const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || ''
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

function WaitlistForm() {
  const [status, setStatus] = useState('idle') // idle | sending | done | error
  const [email, setEmail] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    if (!email || status === 'sending') return

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      // Fallback: just show success (for dev/preview without env vars)
      setStatus('done')
      setEmail('')
      return
    }

    setStatus('sending')
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/waitlist`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Prefer': 'return=minimal',
        },
        body: JSON.stringify({ email }),
      })
      if (res.ok || res.status === 201) {
        setStatus('done')
        setEmail('')
      } else if (res.status === 409) {
        // duplicate
        setStatus('done')
        setEmail('')
      } else {
        setStatus('error')
      }
    } catch {
      setStatus('error')
    }
  }

  if (status === 'done') {
    return (
      <div style={{ textAlign: 'center', padding: '12px 0' }}>
        <span style={{ fontSize: '0.88rem', color: '#10B981', fontWeight: 600 }}>You're on the list!</span>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} style={{
      display: 'flex', gap: 10, justifyContent: 'center', maxWidth: 420, margin: '0 auto',
    }}>
      <input
        type="email" value={email} onChange={e => setEmail(e.target.value)}
        placeholder="Enter your email" required
        style={{
          flex: 1, padding: '12px 16px', borderRadius: 8,
          border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.05)',
          color: '#fff', fontSize: '0.88rem', outline: 'none',
          fontFamily: "'Inter', system-ui, sans-serif",
        }}
      />
      <button type="submit" disabled={status === 'sending'} style={{
        padding: '12px 24px', borderRadius: 8,
        border: '1px solid rgba(255,255,255,0.2)', background: 'transparent',
        color: '#fff', fontSize: '0.88rem', fontWeight: 600, cursor: 'pointer',
        transition: 'background 0.15s, border-color 0.15s',
        opacity: status === 'sending' ? 0.5 : 1,
      }}
      onMouseOver={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)' }}
      onMouseOut={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)' }}
      >
        {status === 'sending' ? '...' : 'Send'}
      </button>
      {status === 'error' && <div style={{ fontSize: '0.72rem', color: '#EF4444', marginTop: 8 }}>Something went wrong. Try again.</div>}
    </form>
  )
}

function StatusDot({ status }) {
  const colors = {
    processing: '#F59E0B',
    complete: '#10B981',
    error: '#EF4444',
  }
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <div style={{
        width: 8, height: 8, borderRadius: '50%',
        background: colors[status] || '#666',
        boxShadow: status === 'processing' ? `0 0 8px ${colors.processing}` : 'none',
        animation: status === 'processing' ? 'pulse 2s infinite' : 'none',
      }} />
      <span style={{ fontSize: '0.68rem', color: '#666', fontFamily: "'JetBrains Mono', monospace" }}>
        {status === 'complete' ? 'Complete' : status === 'processing' ? 'Processing' : 'Ready'}
      </span>
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  )
}
