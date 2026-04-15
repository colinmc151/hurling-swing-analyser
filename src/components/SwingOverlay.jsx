import { useRef, useEffect } from 'react'

const EDGES = [
  ['left_shoulder', 'right_shoulder'],
  ['left_shoulder', 'left_hip'],
  ['right_shoulder', 'right_hip'],
  ['left_hip', 'right_hip'],
  ['left_shoulder', 'left_elbow'],
  ['left_elbow', 'left_wrist'],
  ['right_shoulder', 'right_elbow'],
  ['right_elbow', 'right_wrist'],
  ['left_hip', 'left_knee'],
  ['left_knee', 'left_ankle'],
  ['right_hip', 'right_knee'],
  ['right_knee', 'right_ankle'],
]

const JOINTS = [
  'left_shoulder','right_shoulder','left_elbow','right_elbow',
  'left_wrist','right_wrist','left_hip','right_hip',
  'left_knee','right_knee','left_ankle','right_ankle',
]

export default function SwingOverlay({ videoUrl, track }) {
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const rafRef = useRef(null)

  useEffect(() => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas || !track?.length) return

    const dpr = window.devicePixelRatio || 1

    function resize() {
      const rect = video.getBoundingClientRect()
      if (!rect.width) return
      canvas.width = rect.width * dpr
      canvas.height = rect.height * dpr
      canvas.style.width = rect.width + 'px'
      canvas.style.height = rect.height + 'px'
    }

    function findFrame(t) {
      let lo = 0, hi = track.length - 1
      while (lo < hi) {
        const mid = (lo + hi) >> 1
        if (track[mid].t < t) lo = mid + 1
        else hi = mid
      }
      return lo
    }

    function draw() {
      const ctx = canvas.getContext('2d')
      const w = canvas.width / dpr
      const h = canvas.height / dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, w, h)

      const idx = findFrame(video.currentTime)
      const frame = track[idx]
      if (!frame) return

      // Wrist arc trail (from start to current frame)
      ctx.strokeStyle = 'rgba(251, 191, 36, 0.85)'
      ctx.lineWidth = 3
      ctx.lineCap = 'round'
      ctx.beginPath()
      let started = false
      for (let i = 0; i <= idx; i++) {
        const p = track[i]?.pts?.right_wrist
        if (!p) continue
        const x = p[0] * w
        const y = p[1] * h
        if (!started) { ctx.moveTo(x, y); started = true }
        else ctx.lineTo(x, y)
      }
      ctx.stroke()

      // Skeleton bones
      const pts = frame.pts
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)'
      ctx.lineWidth = 3
      for (const [a, b] of EDGES) {
        if (!pts[a] || !pts[b]) continue
        ctx.beginPath()
        ctx.moveTo(pts[a][0] * w, pts[a][1] * h)
        ctx.lineTo(pts[b][0] * w, pts[b][1] * h)
        ctx.stroke()
      }

      // Joints
      ctx.fillStyle = '#fbbf24'
      for (const name of JOINTS) {
        const p = pts[name]
        if (!p) continue
        ctx.beginPath()
        ctx.arc(p[0] * w, p[1] * h, 4, 0, Math.PI * 2)
        ctx.fill()
      }
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
  }, [track, videoUrl])

  if (!videoUrl || !track?.length) {
    return (
      <div>
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">
          Swing breakdown
        </p>
        <div className="bg-white/5 rounded-2xl p-4 text-sm text-gray-500">
          Video not available. Upload a new swing to see the overlay.
        </div>
      </div>
    )
  }

  return (
    <div>
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">
        Swing breakdown
      </p>
      <div className="relative rounded-2xl overflow-hidden bg-black">
        <video
          ref={videoRef}
          src={videoUrl}
          controls
          playsInline
          muted
          className="w-full h-auto block"
        />
        <canvas
          ref={canvasRef}
          className="absolute inset-0 pointer-events-none"
        />
      </div>
      <p className="text-xs text-gray-500 mt-2">
        Play the video — the skeleton tracks your body and the amber curve is your wrist arc.
      </p>
    </div>
  )
}