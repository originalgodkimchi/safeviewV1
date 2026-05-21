import { useState, useEffect, useRef, useCallback } from 'react'
import { api } from '../config'

const RTSP_STORAGE_KEY = 'safeview_rtsp_history'

function loadRtspHistory() {
  try { return JSON.parse(localStorage.getItem(RTSP_STORAGE_KEY)) || [] } catch { return [] }
}
function saveRtspHistory(list) {
  localStorage.setItem(RTSP_STORAGE_KEY, JSON.stringify(list))
}

export default function ROISettings() {
  const [videos, setVideos] = useState([])
  const [selectedFile, setSelectedFile] = useState('')
  const [sourceType, setSourceType] = useState('file')
  const [rtspHistory, setRtspHistory] = useState(loadRtspHistory)
  const [rtspUrl, setRtspUrl] = useState(() => loadRtspHistory()[0]?.url || '')
  const [rtspAddingNew, setRtspAddingNew] = useState(false)
  const [roiName, setRoiName] = useState('')
  const [points, setPoints] = useState([])
  const [imageData, setImageData] = useState(null)  // { image: base64, width, height }
  const [loading, setLoading] = useState(false)
  const [saveMsg, setSaveMsg] = useState('')
  const [savedRois, setSavedRois] = useState([])

  const canvasRef = useRef(null)
  const imgRef = useRef(null)

  // 영상 목록 & ROI 목록 로드
  useEffect(() => {
    api.get('/api/roi/videos/list').then(r => {
      setVideos(r.data.videos || [])
      if (r.data.videos?.length > 0) {
        setSelectedFile(r.data.videos[0])
        setRoiName(r.data.videos[0])
      }
    }).catch(() => {})

    api.get('/api/roi').then(r => setSavedRois(r.data.rois || [])).catch(() => {})
  }, [])

  // Canvas 그리기
  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas || !imageData) return
    const ctx = canvas.getContext('2d')

    const img = imgRef.current
    if (!img || !img.complete) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

    if (points.length === 0) return

    // 스케일 계산
    const scaleX = canvas.width / imageData.width
    const scaleY = canvas.height / imageData.height

    // 폴리곤 그리기
    ctx.beginPath()
    ctx.moveTo(points[0][0] * scaleX, points[0][1] * scaleY)
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i][0] * scaleX, points[i][1] * scaleY)
    }
    if (points.length >= 3) {
      ctx.closePath()
      ctx.fillStyle = 'rgba(22, 163, 74, 0.25)'
      ctx.fill()
    }
    ctx.strokeStyle = '#16a34a'
    ctx.lineWidth = 2.5
    ctx.stroke()

    // 꼭짓점 점
    points.forEach((p, i) => {
      ctx.beginPath()
      ctx.arc(p[0] * scaleX, p[1] * scaleY, 6, 0, Math.PI * 2)
      ctx.fillStyle = '#16a34a'
      ctx.fill()
      ctx.strokeStyle = 'white'
      ctx.lineWidth = 2
      ctx.stroke()

      // 번호
      ctx.fillStyle = 'white'
      ctx.font = 'bold 11px sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(i + 1, p[0] * scaleX, p[1] * scaleY)
    })
  }, [points, imageData])

  useEffect(() => {
    drawCanvas()
  }, [drawCanvas])

  const handleRtspSelect = (url) => {
    const found = rtspHistory.find(h => h.url === url)
    setRtspUrl(url)
    if (found) setRoiName(found.label)
  }

  const handleRtspDelete = (url, e) => {
    e.stopPropagation()
    const updated = rtspHistory.filter(h => h.url !== url)
    setRtspHistory(updated)
    saveRtspHistory(updated)
    if (rtspUrl === url) { setRtspUrl(''); setRtspAddingNew(true) }
  }

  const handleLoadFrame = async () => {
    const sourcePath = sourceType === 'file' ? selectedFile : rtspUrl
    if (!sourcePath) return

    // RTSP 주소 히스토리 저장
    if (sourceType === 'rtsp' && sourcePath) {
      const label = roiName.trim() || sourcePath
      const updated = [
        { url: sourcePath, label },
        ...rtspHistory.filter(h => h.url !== sourcePath),
      ].slice(0, 10)
      setRtspHistory(updated)
      saveRtspHistory(updated)
      setRtspAddingNew(false)
    }

    setLoading(true)
    try {
      const res = await api.post('/api/roi/frame/capture', { source_path: sourcePath })
      setImageData(res.data)
      setPoints([])
      setSaveMsg('')

      // 이미지 프리로드
      const img = new Image()
      img.onload = () => {
        imgRef.current = img
        drawCanvas()
      }
      img.src = `data:image/jpeg;base64,${res.data.image}`
      imgRef.current = img
    } catch (e) {
      alert('프레임 로드 실패: ' + (e.response?.data?.detail || e.message))
    } finally {
      setLoading(false)
    }
  }

  const handleCanvasClick = (e) => {
    if (!imageData) return
    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()

    // rect.width/height = CSS 렌더링 크기, imageData = 원본 해상도
    // 클릭 위치(CSS픽셀) → 원본 이미지 좌표로 변환
    const scaleX = imageData.width  / rect.width
    const scaleY = imageData.height / rect.height

    const x = Math.round((e.clientX - rect.left) * scaleX)
    const y = Math.round((e.clientY - rect.top)  * scaleY)

    setPoints(prev => [...prev, [x, y]])
  }

  const handleUndo = () => setPoints(prev => prev.slice(0, -1))
  const handleReset = () => setPoints([])

  const handleSave = async () => {
    if (points.length < 3) {
      alert('최소 3개의 꼭짓점이 필요합니다')
      return
    }
    if (!roiName.trim()) {
      alert('ROI 이름을 입력하세요')
      return
    }
    try {
      await api.post(`/api/roi/${encodeURIComponent(roiName.trim())}`, { points })
      setSaveMsg(`"${roiName}" ROI가 저장되었습니다`)
      // ROI 목록 갱신
      const r = await api.get('/api/roi')
      setSavedRois(r.data.rois || [])
    } catch (e) {
      alert('저장 실패: ' + (e.response?.data?.detail || e.message))
    }
  }

  return (
    <div className="w-full">
      <div className="grid grid-cols-12 gap-4">
        {/* 좌측 컨트롤 */}
        <div className="col-span-3 space-y-3">
          {/* 소스 선택 */}
          <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
            <h2 className="font-semibold text-gray-700 mb-4">소스 선택</h2>

            <div className="flex rounded-lg overflow-hidden border border-gray-200 mb-4">
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
              <select
                value={selectedFile}
                onChange={e => { setSelectedFile(e.target.value); setRoiName(e.target.value) }}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-3 focus:outline-none focus:border-sv-green"
              >
                {videos.length === 0 && <option value="">영상 없음</option>}
                {videos.map(v => <option key={v} value={v}>{v}</option>)}
              </select>
            ) : (
              <div className="mb-3">
                {/* 저장된 주소 목록 */}
                {rtspHistory.length > 0 && !rtspAddingNew && (
                  <div className="space-y-1 mb-2">
                    {rtspHistory.map(h => (
                      <div
                        key={h.url}
                        onClick={() => handleRtspSelect(h.url)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm cursor-pointer transition-colors ${
                          rtspUrl === h.url
                            ? 'border-sv-green bg-green-50 text-sv-green'
                            : 'border-gray-200 bg-white hover:border-gray-300 text-gray-700'
                        }`}
                      >
                        <span className="flex-1 truncate">{h.label}</span>
                        <button
                          type="button"
                          onClick={(e) => handleRtspDelete(h.url, e)}
                          className="text-gray-300 hover:text-red-400 shrink-0 transition-colors"
                          title="삭제"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => { setRtspAddingNew(true); setRtspUrl('') }}
                      className="w-full border border-dashed border-gray-300 rounded-lg py-1.5 text-xs text-gray-400 hover:border-sv-green hover:text-sv-green transition-colors"
                    >
                      + 새 주소 추가
                    </button>
                  </div>
                )}

                {/* 새 주소 직접 입력 */}
                {(rtspHistory.length === 0 || rtspAddingNew) && (
                  <div>
                    <input
                      type="text"
                      value={rtspUrl}
                      onChange={e => { setRtspUrl(e.target.value); setRoiName(e.target.value) }}
                      placeholder="rtsp://..."
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-sv-green"
                      autoFocus
                    />
                    {rtspHistory.length > 0 && (
                      <button
                        type="button"
                        onClick={() => { setRtspAddingNew(false); setRtspUrl(rtspHistory[0].url) }}
                        className="mt-1.5 text-xs text-gray-400 hover:text-gray-600"
                      >
                        ← 저장된 주소로 돌아가기
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

            <button
              onClick={handleLoadFrame}
              disabled={loading}
              className="w-full bg-sv-green hover:bg-green-700 text-white font-medium py-2 rounded-lg text-sm transition-colors disabled:opacity-60"
            >
              {loading ? '불러오는 중...' : '기준 프레임 불러오기'}
            </button>
          </div>

          {/* ROI 이름 & 저장 */}
          <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
            <h2 className="font-semibold text-gray-700 mb-3">ROI 저장</h2>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">ROI 이름</label>
            <input
              type="text"
              value={roiName}
              onChange={e => setRoiName(e.target.value)}
              placeholder="예: sample_video"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-3 focus:outline-none focus:border-sv-green"
            />

            <div className="flex gap-2 mb-3">
              <button
                onClick={handleUndo}
                disabled={points.length === 0}
                className="flex-1 border border-gray-200 text-gray-600 hover:bg-gray-50 py-1.5 rounded-lg text-xs font-medium disabled:opacity-40"
              >
                마지막 취소
              </button>
              <button
                onClick={handleReset}
                disabled={points.length === 0}
                className="flex-1 border border-red-200 text-red-500 hover:bg-red-50 py-1.5 rounded-lg text-xs font-medium disabled:opacity-40"
              >
                전체 초기화
              </button>
            </div>

            <button
              onClick={handleSave}
              disabled={points.length < 3}
              className="w-full bg-sv-green hover:bg-green-700 text-white font-medium py-2 rounded-lg text-sm transition-colors disabled:opacity-50"
            >
              ROI 저장 ({points.length}개 꼭짓점)
            </button>

            {saveMsg && (
              <p className="text-xs text-sv-green mt-2 bg-green-50 p-2 rounded">{saveMsg}</p>
            )}
          </div>

          {/* 꼭짓점 좌표 */}
          {points.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
              <h2 className="font-semibold text-gray-700 mb-3">꼭짓점 좌표</h2>
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {points.map((p, i) => (
                  <div key={i} className="flex items-center justify-between text-xs bg-sv-mint rounded px-3 py-1.5">
                    <span className="w-5 h-5 bg-sv-green text-white rounded-full flex items-center justify-center font-bold text-xs">
                      {i + 1}
                    </span>
                    <span className="text-gray-600 font-mono">({p[0]}, {p[1]})</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 저장된 ROI 목록 */}
          {savedRois.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
              <h2 className="font-semibold text-gray-700 mb-3">저장된 ROI</h2>
              <div className="space-y-1">
                {savedRois.map((name, i) => (
                  <div key={i} className="flex items-center gap-2 bg-sv-mint rounded px-3 py-2 text-xs text-gray-600">
                    <span className="w-2 h-2 bg-sv-green rounded-full"></span>
                    {name}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 우측: Canvas */}
        <div className="col-span-9">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-200 flex items-center justify-between">
              <span className="font-medium text-gray-700 text-sm">
                {imageData ? '클릭하여 꼭짓점 추가' : '기준 프레임을 불러오세요'}
              </span>
              {imageData && (
                <span className="text-xs text-gray-400">{imageData.width} × {imageData.height}</span>
              )}
            </div>

            <div className="p-4">
              {imageData ? (
                <canvas
                  ref={canvasRef}
                  width={imageData.width > 960 ? 960 : imageData.width}
                  height={imageData.width > 960
                    ? Math.round(imageData.height * (960 / imageData.width))
                    : imageData.height
                  }
                  onClick={handleCanvasClick}
                  className="roi-canvas w-full rounded-lg border border-gray-200"
                  style={{ display: 'block' }}
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-80 text-gray-400">
                  <svg className="w-16 h-16 mb-3 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="text-sm">좌측에서 소스를 선택하고 프레임을 불러오세요</p>
                  <p className="text-xs text-gray-300 mt-1">프레임 위를 클릭해 ROI 꼭짓점을 지정합니다</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
