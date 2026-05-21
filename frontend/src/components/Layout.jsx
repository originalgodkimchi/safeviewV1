import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'

const PAGE_TITLES = {
  '/': '대시보드',
  '/monitoring': '실시간 모니터링',
  '/roi': 'ROI 영역 설정',
  '/events': '이벤트 기록',
}

export default function Layout() {
  const { pathname } = useLocation()
  const title = PAGE_TITLES[pathname] || 'SAFEVIEW'

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar />
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between shrink-0">
          <span className="font-semibold text-gray-800 text-base">{title}</span>
          <div className="flex items-center gap-1.5 bg-green-50 text-green-700 border border-green-200 text-xs font-medium px-3 py-1.5 rounded-full">
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
            시스템 정상
          </div>
        </header>
        <div className="flex-1 p-5 overflow-auto">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
