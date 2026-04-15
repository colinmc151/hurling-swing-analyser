import { useRef, useEffect, useState } from 'react'

const TABS = [
  { key: 'hip_rotation', label: 'Hip rotation', metricKey: 'hip_rotation' },
  { key: 'shoulder_tilt', label: 'Shoulder tilt', metricKey: 'shoulder_tilt' },
  { key: 'backswing', label: 'Backswing', metricKey: 'backswing_height' },
  { key: 'follow_through', label: 'Follow-through', metricKey: 'follow_through' },
]

function findFrameIdx(track, t) {
  let lo = 0, hi = track.length - 1
  while (lo < hi) {
    const mid = (lo + hi) >> 1
    if (track[mid].t < t) lo = mid + 1
    else hi = mid
  }
  return lo
}

function drawLabel(ctx, text, x, y) {
  ctx.font = 'bold 12px -apple-system, system-ui, sans-serif'
  const m = ctx.measureText(text)
  const pad = 6
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillStyle = 'rgba(0, 0, 0, 0.78)'
  ctx.fillRect(x - m.width/2 - pad, y - 11, m.width + pad*2, 22)
  ctx.fillStyle = '#fbbf24'
  ctx.fillText(text, x, y)
}

function drawDot(ctx, p, r = 5) {
  ctx.beginPath()
  ctx.arc(p[0], p[1], r, 0, Math.PI * 2)
  ctx.fill()
}

export default function SwingOverlay({ videoUrl, track, metrics, player }) {
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const rafRef = useRef(null)
  const [tab, setTab] = useState('hip_rotation')
  const tabRef = useRef(tab)
  useEffect(() => { tabRef.current = tab }, [tab])

  const proName = (player || 'Pro').split(' ').pop()
  const yourScore = (k) => metrics?.[k]?.your_score ?? null
  const proScore = (k) => metrics?.[k]?.pro_score ?? null

  useEffect(() => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas || !track?.length) return
    const dpr = window.devicePixelRatio || 1

    let peakIdx = 0, peakY = Infinity, peakSide = 'right_wrist'
    for (let i = 0; i < track.length; i++) {
      const p = track[i]?.pts
      if (!p) continue
      const r = p.right_wrist, l = p.left_wrist
      if (r && r[1] < peakY) { peakY = r[1]; peakIdx = i; peakSide = 'right_wrist' }
      if (l && l[1] < peakY) { peakY = l[1]; peakIdx = i; peakSide = 'left_wrist' }
    }

    function resize() {
      const rect = video.getBoundingClientRect()
      if (!rect.width) return
      canvas.width = rect.width * dpr
      canvas.height = rect.height * dpr
      canvas.style.width = rect.width + 'px'
      canvas.style.height = rect.height + 'px'
    }

    function drawHipOrShoulder(ctx, w, h, pts, leftKey, rightKey, titleKey, unitLabel) {
      const l = pts[leftKey], r = pts[rightKey]
      if (!l || !r) return
      const lp = [l[0]*w, l[1]*h], rp = [r[0]*w, r[1]*h]
      const mid = [(lp[0]+rp[0])/2, (lp[1]+rp[1])/2]

      ctx.strokeStyle = 'rgba(255,255,255,0.4)'
      ctx.lineWidth = 2
      ctx.setLineDash([6,6])
      ctx.beginPath(); ctx.moveTo(mid[0]-90, mid[1]); ctx.lineTo(mid[0]+90, mid[1]); ctx.stroke()
      ctx.setLineDash([])

      ctx.strokeStyle = '#fbbf24'
      ctx.lineWidth = 4
      ctx.lineCap = 'round'
      ctx.beginPath(); ctx.moveTo(lp[0], lp[1]); ctx.lineTo(rp[0], rp[1]); ctx.stroke()
      ctx.fillStyle = '#fbbf24'; drawDot(ctx, lp); drawDot(ctx, rp)

      const deg = Math.atan2(rp[1]-lp[1], rp[0]-lp[0]) * 180 / Math.PI
      const tilt = Math.min(Math.abs(deg), 180 - Math.abs(deg))
      const you = yourScore(titleKey)
      const pro = proScore(titleKey)
      let label = `${unitLabel} ${tilt.toFixed(0)}°`
      if (you != null && pro != null) label += `  ·  You ${you} / ${proName} ${pro}`
      drawLabel(ctx, label, mid[0], Math.max(mid[1] - 24, 16))
    }

    function drawBackswing(ctx, w, h, idx) {
      const name = peakSide
      const traceTo = Math.min(idx, peakIdx)

      ctx.strokeStyle = '#fbbf24'
      ctx.lineWidth = 3
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.beginPath()
      let started = false
      for (let i = 0; i <= traceTo; i++) {
        const p = track[i]?.pts?.[name]
        if (!p) continue
        const x = p[0]*w, y = p[1]*h
        if (!started) { ctx.moveTo(x, y); started = true } else ctx.lineTo(x, y)
      }
      ctx.stroke()

      const peak = track[peakIdx]?.pts?.[name]
      if (peak) {
        const px = peak[0]*w, py = peak[1]*h
        ctx.strokeStyle = 'rgba(251,191,36,0.6)'
        ctx.lineWidth = 2
        ctx.setLineDash([5,5])
        ctx.beginPath(); ctx.moveTo(0, py); ctx.lineTo(w, py); ctx.stroke()
        ctx.setLineDash([])
        ctx.fillStyle = '#fbbf24'; drawDot(ctx, [px, py], 7)

        const pct = Math.round((1 - peak[1]) * 100)
        const you = yourScore('backswing_height')
        const pro = proScore('backswing_height')
        let label = `Peak ${pct}%`
        if (you != null && pro != null) label += `  ·  You ${you} / ${proName} ${pro}`
        drawLabel(ctx, label, Math.min(Math.max(px, 100), w-100), Math.max(py - 18, 16))
      }
    }

    function drawFollowThrough(ctx, w, h, pts) {
      const side = (pts.right_wrist && pts.left_wrist &&
                    pts.right_wrist[1] < pts.left_wrist[1]) ? 'right' : 'left'
      const hip = pts[`${side}_hip`], sh = pts[`${side}_shoulder`], wr = pts[`${side}_wrist`]
      if (!hip || !sh || !wr) return
      const hp = [hip[0]*w, hip[1]*h], sp = [sh[0]*w, sh[1]*h], wp = [wr[0]*w, wr[1]*h]

      ctx.strokeStyle = '#fbbf24'
      ctx.lineWidth = 4
      ctx.lineCap = 'round'
      ctx.beginPath(); ctx.moveTo(hp[0], hp[1]); ctx.lineTo(sp[0], sp[1]); ctx.lineTo(wp[0], wp[1]); ctx.stroke()
      ctx.fillStyle = '#fbbf24'; drawDot(ctx, hp); drawDot(ctx, sp); drawDot(ctx, wp)

      const v1 = [hp[0]-sp[0], hp[1]-sp[1]]
      const v2 = [wp[0]-sp[0], wp[1]-sp[1]]
      const dot = v1[0]*v2[0] + v1[1]*v2[1]
      const m1 = Math.hypot(...v1), m2 = Math.hypot(...v2)
      const angle = Math.acos(Math.max(-1, Math.min(1, dot/(m1*m2)))) * 180 / Math.PI

      const you = yourScore('follow_through')
      const pro = proScore('follow_through')
      let label = `Extension ${angle.toFixed(0)}°`
      if (you != null && pro != null) label += `  ·  You ${you} / ${proName} ${pro}`
      drawLabel(ctx, label, sp[0], Math.max(sp[1] - 24, 16))
    }

    function draw() {
      const ctx = canvas.getContext('2d')
      const w = canvas.width / dpr
      const h = canvas.height / dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, w, h)

      const idx = findFrameIdx(track, video.currentTime)
      const frame = track[idx]
      if (!frame) return
      const pts = frame.pts
      const t = tabRef.current

      if (t === 'hip_rotation') drawHipOrShoulder(ctx, w, h, pts, 'left_hip', 'right_hip', 'hip_rotation', 'Hip tilt')
      else if (t === 'shoulder_tilt') drawHipOrShoulder(ctx, w, h, pts, 'left_shoulder', 'right_shoulder', 'shoulder_tilt', 'Shoulder tilt')
      else if (t === 'backswing') drawBackswing(ctx, w, h, idx)
      else if (t === 'follow_through') drawFollowThrough(ctx, w, h, pts)
    }

    function tick() {
      draw()
      rafRef.current = requestAnimationFrame(tick)
    }

    video.addEventListener('loadedmetadata', resize)
    video.addEventListener('loadeddata', resize)
    window.addEventListener('resize', resize)
    resize()
    rafRef.current = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(rafRef.current)
      video.removeEventListener('loadedmetadata', resize)
      video.removeEventListener('loadeddata', resize)
      window.removeEventListener('resize', resize)
    }
  }, [track, videoUrl, metrics, player])

  if (!videoUrl || !track?.length) {
    return (
      <div>
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">Swing breakdown</p>
        <div className="bg-white/5 rounded-2xl p-4 text-sm text-gray-500">
          Video not available. Upload a new swing to see the overlay.
        </div>
      </div>
    )
  }

  return (
    <div>
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">Swing breakdown</p>
      <div className="flex gap-2 overflow-x-auto pb-2 mb-3 -mx-5 px-5">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              tab === t.key ? 'bg-amber-400 text-gray-900' : 'bg-white/10 text-gray-300'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="relative rounded-2xl overflow-hidden bg-black">
        <video
          ref={videoRef}
          src={videoUrl}
          controls
          playsInline
          muted
          className="w-full h-auto block"
        />
        <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none" />
      </div>
    </div>
  )
}