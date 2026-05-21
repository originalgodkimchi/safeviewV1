import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../config'

const dangerRules = [
  { condition: '사람 + 차량 동시 감지', area: 'ROI 영역 내', result: '위험', severity: 'high' },
  { condition: '사람만 감지', area: 'ROI 영역 내/외', result: '정상', severity: 'low' },
  { condition: '차량만 감지', area: 'ROI 영역 내/외', result: '정상', severity: 'low' },
  { condition: 'ROI 미설정', area: '-', result: '판단 불가', severity: 'medium' },
]

const steps = [
  { step: '01', title: 'ROI 설정', desc: '위험 감시 구역을 영상 위에 직접 그려 저장합니다.', link: '/roi', linkLabel: 'ROI 설정하기' },
  { step: '02', title: '모니터링 시작', desc: '파일 또는 RTSP 카메라를 선택하고 감지를 시작합니다.', link: '/monitoring', linkLabel: '모니터링 시작' },
  { step: '03', title: '이벤트 확인', desc: '감지된 위험 이벤트 사진·클립·상세 정보를 확인합니다.', link: '/events', linkLabel: '이벤트 보기' },
]

export default function Home() {
  const navigate = useNavigate()
  const [stats, setStats] = useState(null)

  useEffect(() => {
    api.get('/api/events/stats').then(r => setStats(r.data)).catch(() => {})
  }, [])

  return (
    <div className="w-full space-y-5">
      {/* 상단 스탯 카드 3개 */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard
          label="저장된 ROI"
          value={stats?.roi_count ?? '—'}
          unit="개"
          icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />}
          accent="green"
          onClick={() => navigate('/roi')}
        />
        <StatCard
          label="전체 이벤트"
          value={stats?.total ?? '—'}
          unit="건"
          icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />}
          accent="red"
          onClick={() => navigate('/events')}
        />
        <StatCard
          label="샘플 영상"
          value={stats?.sample_videos ?? '—'}
          unit="개"
          icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.069A1 1 0 0121 8.87v6.26a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />}
          accent="blue"
          onClick={() => navigate('/monitoring')}
        />
      </div>

      <div className="grid grid-cols-5 gap-4">
        {/* 위험 판단 규칙 */}
        <div className="col-span-3 bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-5 py-3.5 border-b border-gray-100 flex items-center gap-2">
            <div className="w-1 h-4 bg-sv-green rounded-full"></div>
            <h2 className="font-semibold text-gray-800 text-sm">위험 판단 규칙</h2>
            <span className="text-xs text-gray-400 ml-1">ROI 영역 내 감지 조건 기준</span>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                {['감지 조건', '적용 영역', '판단 결과'].map(h => (
                  <th key={h} className="px-5 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {dangerRules.map((rule, i) => (
                <tr key={i} className="hover:bg-gray-50/80 transition-colors">
                  <td className="px-5 py-3 text-gray-700 font-medium">{rule.condition}</td>
                  <td className="px-5 py-3 text-gray-500">{rule.area}</td>
                  <td className="px-5 py-3">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                      rule.severity === 'high' ? 'bg-red-100 text-red-700' :
                      rule.severity === 'medium' ? 'bg-amber-100 text-amber-700' :
                      'bg-green-100 text-green-700'
                    }`}>
                      <span className={`w-1 h-1 rounded-full ${
                        rule.severity === 'high' ? 'bg-red-500' :
                        rule.severity === 'medium' ? 'bg-amber-500' : 'bg-green-500'
                      }`}></span>
                      {rule.result}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 시작 가이드 */}
        <div className="col-span-2 bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-5 py-3.5 border-b border-gray-100 flex items-center gap-2">
            <div className="w-1 h-4 bg-sv-green rounded-full"></div>
            <h2 className="font-semibold text-gray-800 text-sm">시작하기</h2>
          </div>
          <div className="p-4 space-y-3">
            {steps.map((s) => (
              <button
                key={s.step}
                onClick={() => navigate(s.link)}
                className="w-full text-left flex items-start gap-3.5 p-3.5 rounded-xl border border-gray-100 hover:border-sv-green hover:bg-sv-mint transition-all group"
              >
                <div className="w-8 h-8 bg-sv-dark rounded-lg flex items-center justify-center shrink-0 group-hover:bg-sv-green transition-colors">
                  <span className="text-white text-xs font-bold">{s.step}</span>
                </div>
                <div>
                  <div className="font-semibold text-gray-800 text-sm group-hover:text-sv-green transition-colors">{s.title}</div>
                  <div className="text-xs text-gray-400 mt-0.5 leading-relaxed">{s.desc}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value, unit, icon, accent, onClick }) {
  const accents = {
    green: { bg: 'bg-green-50', icon: 'text-sv-green', border: 'border-green-100', num: 'text-sv-green' },
    red:   { bg: 'bg-red-50',   icon: 'text-red-500',  border: 'border-red-100',   num: 'text-red-600' },
    blue:  { bg: 'bg-blue-50',  icon: 'text-blue-500', border: 'border-blue-100',  num: 'text-blue-600' },
  }
  const a = accents[accent]
  return (
    <button
      onClick={onClick}
      className={`w-full text-left bg-white rounded-2xl border ${a.border} p-5 shadow-sm hover:shadow-md transition-all group`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">{label}</p>
          <div className={`text-4xl font-bold ${a.num} leading-none`}>
            {value}
            <span className="text-base font-normal text-gray-400 ml-1.5">{unit}</span>
          </div>
        </div>
        <div className={`w-11 h-11 ${a.bg} rounded-xl flex items-center justify-center`}>
          <svg className={`w-6 h-6 ${a.icon}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">{icon}</svg>
        </div>
      </div>
      <div className="mt-3 text-xs text-gray-400 group-hover:text-sv-green transition-colors flex items-center gap-1">
        바로가기 <span>→</span>
      </div>
    </button>
  )
}
