import { useEffect, useState } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'

const NAV = [
  { to: '/', label: '홈', icon: 'home', end: true },
  { to: '/create', label: '콘텐츠 제작', icon: 'add_circle', end: false },
  { to: '/contents', label: '내 콘텐츠', icon: 'grid_view', end: false },
  { to: '/brand', label: '브랜드', icon: 'psychology', end: false },
]

export function Logo() {
  return <img src="/postory_logo_horizontal.png" alt="Postory" className="block h-[2.88rem] w-auto max-w-none shrink-0" />
}

export function AppHeader() {
  const navigate = useNavigate()
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-border-subtle/80 bg-canvas-base/90 backdrop-blur-xl">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-4 px-4 lg:px-8">
        <div className="flex items-center gap-6">
          <button type="button" onClick={() => navigate('/')} className="shrink-0 rounded-lg" aria-label="Postory 홈">
            <Logo />
          </button>
          <nav className="hidden items-center gap-1 md:flex" aria-label="주요">
            {NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `rounded-lg px-3 py-2 text-sm font-semibold ${
                    isActive ? 'bg-surface-container text-primary' : 'text-text-secondary hover:bg-canvas-surface'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate('/create')}
            className="hidden items-center gap-1 rounded-lg bg-[linear-gradient(to_right,#2563eb_0%,#F43F5E_100%)] px-4 py-2 text-sm font-semibold text-white sm:inline-flex"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            새 콘텐츠 만들기
          </button>
          <button
            type="button"
            onClick={() => navigate('/settings')}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white"
            aria-label="설정"
          >
            <span className="material-symbols-outlined text-[18px]">person</span>
          </button>
        </div>
      </div>
    </header>
  )
}

export function MobileTabBar() {
  const location = useLocation()
  const hide = location.pathname.startsWith('/projects/') || location.pathname.startsWith('/create')
  if (hide) return null
  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-border-subtle bg-canvas-base/95 backdrop-blur md:hidden" aria-label="모바일">
      <div className="grid grid-cols-4">
        {NAV.map((item) => {
          const active = item.end ? location.pathname === item.to : location.pathname.startsWith(item.to)
          return (
            <NavLink key={item.to} to={item.to} className={`flex flex-col items-center gap-0.5 py-2 text-[11px] font-semibold ${active ? 'text-primary' : 'text-text-secondary'}`}>
              <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
              {item.label === '콘텐츠 제작' ? '제작' : item.label}
            </NavLink>
          )
        })}
      </div>
    </nav>
  )
}

export function OfflineNotice() {
  const [online, setOnline] = useState(() => navigator.onLine)

  useEffect(() => {
    const markOnline = () => setOnline(true)
    const markOffline = () => setOnline(false)
    window.addEventListener('online', markOnline)
    window.addEventListener('offline', markOffline)
    return () => {
      window.removeEventListener('online', markOnline)
      window.removeEventListener('offline', markOffline)
    }
  }, [])

  if (online) return null
  return (
    <p className="bg-state-unknown-bg px-4 py-2 text-center text-sm text-text-display" role="status">
      오프라인입니다. 이미 만든 글은 이 기기에 남아 있고, 서버 작성과 보조 검색은 연결되면 다시 시도할 수 있습니다.
    </p>
  )
}

export function Icon({ name, className = '' }) {
  return <span className={`material-symbols-outlined ${className}`}>{name}</span>
}
