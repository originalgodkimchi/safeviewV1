import { useState } from 'react'
import { NavLink } from 'react-router-dom'

const navItems = [
  {
    to: '/', end: true, label: '대시보드',
    icon: <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>,
  },
  {
    to: '/monitoring', label: '모니터링',
    icon: <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.069A1 1 0 0121 8.87v6.26a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" /></svg>,
  },
  {
    to: '/roi', label: 'ROI 설정',
    icon: <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" /></svg>,
  },
  {
    to: '/events', label: '이벤트',
    icon: <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>,
  },
]

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <aside
      className={`relative flex flex-col shrink-0 bg-sv-green transition-all duration-300 ease-in-out ${collapsed ? 'w-16' : 'w-52'}`}
    >
      {/* 로고 */}
      <div className="h-14 px-3 border-b border-white/20 flex items-center gap-2.5 overflow-hidden">
        <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center shrink-0">
          <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
              d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        </div>
        <div
          className={`transition-all duration-200 overflow-hidden whitespace-nowrap ${collapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'}`}
        >
          <div className="font-bold text-white text-sm tracking-wider">SAFEVIEW</div>
          <div className="text-white/60 text-xs">안전 감시 시스템</div>
        </div>
      </div>

      {/* 네비게이션 */}
      <nav className="flex-1 px-2 py-4 space-y-0.5">
        {!collapsed && (
          <p className="text-white/40 text-xs font-semibold px-3 mb-2 uppercase tracking-widest">메뉴</p>
        )}
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            title={collapsed ? item.label : undefined}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ` +
              (isActive
                ? 'bg-white/25 text-white shadow-sm'
                : 'text-white/75 hover:bg-white/15 hover:text-white')
            }
          >
            {item.icon}
            <span
              className={`whitespace-nowrap transition-all duration-200 overflow-hidden ${collapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'}`}
            >
              {item.label}
            </span>
          </NavLink>
        ))}
      </nav>

      {/* 하단 */}
      <div className="px-3 py-4 border-t border-white/20 overflow-hidden">
        <div className={`flex items-center gap-2 ${collapsed ? 'justify-center' : ''}`}>
          <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse shrink-0"></span>
          <span
            className={`text-white/70 text-xs font-medium whitespace-nowrap transition-all duration-200 overflow-hidden ${collapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'}`}
          >
            온라인 · v1.0
          </span>
        </div>
      </div>

      {/* 토글 버튼 — 오른쪽 엣지 돌출 탭 */}
      <button
        onClick={() => setCollapsed(s => !s)}
        className="absolute -right-3 top-1/2 -translate-y-1/2 w-3 h-14 bg-sv-green hover:bg-green-600 rounded-r-lg flex items-center justify-center text-white/80 hover:text-white transition-colors z-20 shadow-md"
        title={collapsed ? '사이드바 펼치기' : '사이드바 접기'}
      >
        <svg
          className={`w-2.5 h-2.5 transition-transform duration-300 ${collapsed ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
      </button>
    </aside>
  )
}
