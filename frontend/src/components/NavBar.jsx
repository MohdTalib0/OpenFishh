import { Link, useLocation } from 'react-router-dom'
import { Github, Star, Users, RefreshCw, BarChart2, Home } from 'lucide-react'

const LINKS = [
  { to: '/society', label: 'Society', icon: Users },
  { to: '/cycle', label: 'Cycle', icon: RefreshCw },
  { to: '/scorecard', label: 'Scorecard', icon: BarChart2 },
]

const MOBILE_LINKS = [
  { to: '/', label: 'Home', icon: Home },
  { to: '/society', label: 'Society', icon: Users },
  { to: '/cycle', label: 'Cycle', icon: RefreshCw },
  { to: '/scorecard', label: 'Score', icon: BarChart2 },
]

export default function NavBar() {
  const location = useLocation()

  return (
    <>
      <header style={{
        padding: '10px 16px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        borderBottom: '1px solid rgba(0,0,0,0.04)',
        background: '#fff',
        position: 'sticky', top: 0, zIndex: 50,
      }}>
        {/* Left: Logo + Desktop Nav */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Link to="/" style={{
            display: 'flex', alignItems: 'center', gap: 6,
            textDecoration: 'none', color: '#1D1D1F',
          }}>
            <img src="/icon.svg" alt="OpenFishh" style={{ width: 26, height: 26 }} />
            <span style={{ fontSize: '1rem', fontWeight: 700, letterSpacing: '-0.02em' }}>
              OpenFishh
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hide-mobile" style={{ display: 'flex', gap: 2 }}>
            {LINKS.map(l => {
              const active = location.pathname === l.to
              return (
                <Link key={l.to} to={l.to} style={{
                  display: 'flex', alignItems: 'center', gap: 4,
                  padding: '5px 10px', borderRadius: 7,
                  textDecoration: 'none',
                  fontSize: '0.78rem', fontWeight: 500,
                  color: active ? '#0EA5E9' : '#86868B',
                  background: active ? 'rgba(14,165,233,0.06)' : 'transparent',
                }}>
                  <l.icon style={{ width: 13, height: 13 }} />
                  {l.label}
                </Link>
              )
            })}
          </nav>
        </div>

        {/* Right: GitHub star */}
        <a href="https://github.com/MohdTalib0/OpenFishh" target="_blank" rel="noopener"
          style={{
            display: 'flex', alignItems: 'center', gap: 5,
            padding: '5px 12px', borderRadius: 7,
            background: '#1D1D1F', color: '#fff',
            textDecoration: 'none', fontSize: '0.75rem', fontWeight: 500,
          }}>
          <Github style={{ width: 13, height: 13 }} />
          <span className="hide-mobile">Star</span>
        </a>
      </header>

      {/* Mobile bottom nav */}
      <style>{`
        .mobile-bottom-nav {
          display: none;
          position: fixed;
          bottom: 0; left: 0; right: 0;
          background: #fff;
          border-top: 1px solid rgba(0,0,0,0.06);
          padding: 6px 0;
          padding-bottom: max(6px, env(safe-area-inset-bottom));
          z-index: 50;
          justify-content: space-around;
        }
        @media (max-width: 640px) {
          .mobile-bottom-nav { display: flex; }
          .hide-mobile { display: none !important; }
          body { padding-bottom: 60px; }
        }
      `}</style>
      <nav className="mobile-bottom-nav">
        {MOBILE_LINKS.map(l => {
          const active = location.pathname === l.to
          return (
            <Link key={l.to} to={l.to} style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
              textDecoration: 'none', padding: '4px 12px',
              color: active ? '#0EA5E9' : '#AEAEB2',
              fontSize: '0.6rem', fontWeight: active ? 600 : 400,
            }}>
              <l.icon style={{ width: 18, height: 18 }} />
              {l.label}
            </Link>
          )
        })}
      </nav>
    </>
  )
}
