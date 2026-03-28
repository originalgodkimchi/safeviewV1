import { useState, useEffect, useRef } from 'react'
import { api, API_BASE, getWsUrl } from '../config'

export default function Monitoring() {
  const [videos, setVideos] = useState([])
  const [sourceType, setSourceType] = useState('file')
  const [selectedFile, setSelectedFile] = useState('')
  const [rtspUrl, setRtspUrl] = useState('')
  const [conf, setConf] = useState(0.4)
  const [running, setRunning] = useState(false)
  const [status, setStatus] = useState(null)
  const [recentEvents, setRecentEvents] = useState([])
  const [isFullscreen, setIsFullscreen] = useState(false)
  const wsRef = useRef(null)
  const imgRef = useRef(null)
  const videoContainerRef = useRef(null)

  // 영상 목록 로드
  useEffect(() => {
    api.get('/api/roi/videos/list')
      .then(r => {
        setVideos(r.data.videos || [])
        if (r.data.videos?.length > 0) setSelectedFile(r.data.videos[0])
      })
      .catch(() => {})
  }, [])

  // WebSocket 연결
  useEffect(() => {
    const connect = () => {
      const ws = new WebSocket(getWsUrl())
      wsRef.current = ws

      ws.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data)
          setStatus(data)
          setRunning(data.running)
          if (data.recent_events) setRecentEvents(data.recent_events)
        } catch {}
      }

      ws.onclose = () => {
        // 3초 후 재연결
        setTimeout(connect, 3000)
      }
    }
    connect()
    return () => wsRef.current?.close()
  }, [])

  const handleStart = async () => {
    const sourcePath = sourceType === 'file' ? selectedFile : rtspUrl
    const sourceName = sourceType === 'file' ? selectedFile : rtspUrl
    if (!sourcePath) return

    try {
      await api.post('/api/monitoring/start', {
        source_type: sourceType,
        source_path: sourcePath,
        source_name: sourceName,
        conf,
      })
      setRunning(true)
    } catch (e) {
      alert('시작 실패: ' + (e.response?.data?.detail || e.message))
    }
  }

  const handleStop = async () => {
    await api.post('/api/monitoring/stop')
    setRunning(false)
  }

  // 전체화면 이벤트 감지
  useEffect(() => {
    const onChange = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', onChange)
    return () => document.removeEventListener('fullscreenchange', onChange)
  }, [])

  const toggleFullscreen = () => {
    if (!isFullscreen) {
      videoContainerRef.current?.requestFullscreen()
    } else {
      document.exitFullscreen()
    }
  }

  const isDanger = status?.is_danger

  return (
    <div className="max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">실시간 모니터링</h1>

      <div className="grid grid-cols-12 gap-5">
        {/* 좌측 컨트롤 패널 */}
        <div className="col-span-3 space-y-4">
          <div className="bg-white rounded-2xl border border-sv-border p-5 shadow-sm">
            <h2 className="font-semibold text-gray-700 mb-4">영상 소스 설정</h2>

            {/* 소스 타입 */}
            <div className="flex rounded-lg overflow-hidden border border-sv-border mb-4">
              <button
                onClick={() => setSourceType('file')}
                className={`flex-1 py-2 text-sm font-medium transition-colors ${
                  sourceType === 'file' ? 'bg-sv-green text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                파일
              </button>
              <button
                onClick={() => setSourceType('rtsp')}
                className={`flex-1 py-2 text-sm font-medium transition-colors ${
                  sourceType === 'rtsp' ? 'bg-sv-green text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                RTSP
              </button>
            </div>

            {sourceType === 'file' ? (
              <div className="mb-4">
                <label className="block text-xs font-medium text-gray-500 mb-1.5">영상 파일 선택</label>
                {videos.length > 0 ? (
                  <select
                    value={selectedFile}
                    onChange={e => setSelectedFile(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-sv-green"
                  >
                    {videos.map(v => (
                      <option key={v} value={v}>{v}</option>
                    ))}
                  </select>
                ) : (
                  <p className="text-xs text-gray-400 bg-gray-50 rounded-lg p-3">
                    data/ 폴더에 영상 파일이 없습니다
                  </p>
                )}
              </div>
            ) : (
              <div className="mb-4">
                <label className="block text-xs font-medium text-gray-500 mb-1.5">RTSP 주소</label>
                <input
                  type="text"
                  value={rtspUrl}
                  onChange={e => setRtspUrl(e.target.value)}
                  placeholder="rtsp://user:pass@ip:port/path"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-sv-green"
                />
              </div>
            )}

            {/* 신뢰도 슬라이더 */}
            <div className="mb-5">
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-medium text-gray-500">감지 신뢰도</label>
                <span className="text-xs font-bold text-sv-green">{conf.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0.1" max="0.9" step="0.05"
                value={conf}
                onChange={e => setConf(parseFloat(e.target.value))}
                className="w-full accent-sv-green"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-0.5">
                <span>0.1 (민감)</span>
                <span>0.9 (정밀)</span>
              </div>
            </div>

            {/* 시작/정지 버튼 */}
            {!running ? (
              <button
                onClick={handleStart}
                disabled={sourceType === 'file' && !selectedFile}
                className="w-full bg-sv-green hover:bg-green-700 text-white font-semibold py-2.5 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                모니터링 시작
              </button>
            ) : (
              <button
                onClick={handleStop}
                className="w-full bg-red-500 hover:bg-red-600 text-white font-semibold py-2.5 rounded-xl transition-colors"
              >
                정지
              </button>
            )}
          </div>

          {/* 상태 패널 */}
          {status && (
            <div className="bg-white rounded-2xl border border-sv-border p-5 shadow-sm">
              <h2 className="font-semibold text-gray-700 mb-3">시스템 상태</h2>
              <div className="space-y-2 text-sm">
                <StatRow label="FPS" value={status.fps} />
                <StatRow label="프레임" value={status.frame_idx} />
                <StatRow label="ROI" value={status.roi_loaded ? '로드됨' : '미설정'} />
                {status.error && (
                  <p className="text-red-500 text-xs mt-2 bg-red-50 p-2 rounded">{status.error}</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* 중앙: 영상 스트림 */}
        <div className="col-span-6 space-y-4">
          <div
            ref={videoContainerRef}
            className="bg-black rounded-2xl overflow-hidden border border-gray-800 shadow-lg aspect-video flex items-center justify-center relative group"
          >
            {running ? (
              <img
                ref={imgRef}
                src={`${API_BASE}/api/stream`}
                alt="MJPEG Stream"
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="flex flex-col items-center gap-3 text-gray-500">
                <svg className="w-16 h-16 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
                    d="M15 10l4.553-2.069A1 1 0 0121 8.87v6.26a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
                </svg>
                <p className="text-sm">모니터링 대기 중</p>
                <p className="text-xs text-gray-600">좌측 패널에서 소스를 선택하고 시작하세요</p>
              </div>
            )}

            {/* 위험 오버레이 */}
            {isDanger && (
              <div className="absolute inset-0 border-4 border-red-500 rounded-2xl pointer-events-none animate-pulse" />
            )}

            {/* 전체화면 버튼 */}
            <button
              onClick={toggleFullscreen}
              title={isFullscreen ? '전체화면 종료 (ESC)' : '전체화면'}
              className="absolute top-3 right-3 bg-black/50 hover:bg-black/80 text-white rounded-lg p-2
                         opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10"
            >
              {isFullscreen ? (
                // 축소 아이콘
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round"
                    d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M15 9h4.5M15 9V4.5M15 9l5.25-5.25M9 15H4.5M9 15v4.5M9 15l-5.25 5.25M15 15h4.5M15 15v4.5M15 15l5.25 5.25" />
                </svg>
              ) : (
                // 확대 아이콘
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round"
                    d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
                </svg>
              )}
            </button>
          </div>

          {/* 정보바 */}
          <div className="bg-white rounded-xl border border-sv-border px-5 py-3 flex items-center gap-6 shadow-sm">
            <InfoBadge
              label="사람"
              value={status?.persons ?? 0}
              color={status?.persons > 0 ? 'text-amber-600' : 'text-gray-500'}
            />
            <InfoBadge
              label="차량"
              value={status?.cars ?? 0}
              color={status?.cars > 0 ? 'text-blue-600' : 'text-gray-500'}
            />
            <InfoBadge
              label="ROI"
              value={status?.roi_loaded ? '설정됨' : '미설정'}
              color={status?.roi_loaded ? 'text-sv-green' : 'text-gray-400'}
            />
            <InfoBadge
              label="소스"
              value={status?.source_name || '-'}
              color="text-gray-600"
            />
          </div>
        </div>

        {/* 우측: 위험/정상 상태 + 최근 이벤트 */}
        <div className="col-span-3 space-y-4">
          {/* 위험/정상 상태 */}
          <div className={`rounded-2xl border p-5 shadow-sm transition-all ${
            isDanger
              ? 'bg-sv-danger-bg border-red-200'
              : 'bg-sv-mint border-sv-border'
          }`}>
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white text-2xl ${
                isDanger ? 'bg-red-500' : 'bg-sv-green'
              }`}>
                {isDanger ? '!' : '✓'}
              </div>
              <div>
                <div className={`text-lg font-bold ${isDanger ? 'text-red-700' : 'text-sv-green'}`}>
                  {isDanger ? '위험 감지' : '정상'}
                </div>
                <div className="text-xs text-gray-500">
                  {isDanger ? 'ROI 내 사람+차량 감지됨' : '이상 없음'}
                </div>
              </div>
            </div>
          </div>

          {/* 최근 이벤트 */}
          <div className="bg-white rounded-2xl border border-sv-border p-5 shadow-sm">
            <h2 className="font-semibold text-gray-700 mb-3">최근 이벤트</h2>
            {recentEvents.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-4">이벤트 없음</p>
            ) : (
              <div className="space-y-2">
                {recentEvents.map((ev, i) => (
                  <div key={i} className="bg-red-50 border border-red-100 rounded-lg p-3">
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span>
                      <span className="text-xs font-medium text-red-700">위험 감지</span>
                    </div>
                    <p className="text-xs text-gray-600">{ev.timestamp}</p>
                    <p className="text-xs text-gray-500 truncate">{ev.source}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function StatRow({ label, value }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-gray-500">{label}</span>
      <span className="font-medium text-gray-800">{value}</span>
    </div>
  )
}

function InfoBadge({ label, value, color }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-xs text-gray-400">{label}</span>
      <span className={`text-sm font-semibold ${color}`}>{value}</span>
    </div>
  )
}
