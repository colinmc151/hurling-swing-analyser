import { useMemo } from 'react'

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

function normalizePose(pose, panelW, panelH, padTop = 40, padSide = 20, padBot = 20) {
  if (!pose) return null
  const pts = Object.values(pose).map(p => ({ x: p[0], y: p[1] }))
  if (!pts.length) return null
  const minX = Math.min(...pts.map(p => p.x))
  const maxX = Math.max(...pts.map(p => p.x))
  const minY = Math.min(...pts.map(p => p.y))
  const maxY = Math.max(...pts.map(p => p.y))
  const w = maxX - minX || 1
  const h = maxY - minY || 1
  const availW = panelW - padSide * 2
  const availH = panelH - padTop - padBot
  const scale = Math.min(availW / w, availH / h)
  const offsetX = padSide + (availW - w * scale) / 2 - minX * scale
  const offsetY = padTop + (availH - h * scale) / 2 - minY * scale
  const out = {}
  for (const [name, p] of Object.entries(pose)) {
    out[name] = [p[0] * scale + offsetX, p[1] * scale + offsetY]
  }
  return out
}

function Figure({ pose, color, label, panelW, panelH, xOffset = 0 }) {
  const pts = useMemo(() => normalizePose(pose, panelW, panelH), [pose, panelW, panelH])
  if (!pts) {
    return (
      <g transform={`translate(${xOffset}, 0)`}>
        <text x={panelW / 2} y={20} textAnchor="middle" fill={color} fontSize={13} fontWeight={600}>{label}</text>
        <text x={panelW / 2} y={panelH / 2} textAnchor="middle" fill="#6b7280" fontSize={11}>no pose</text>
      </g>
    )
  }
  const ls = pts.left_shoulder, rs = pts.right_shoulder
  const lh = pts.left_hip, rh = pts.right_hip
  let head = null
  if (ls && rs && lh && rh) {
    const smx = (ls[0] + rs[0]) / 2
    const smy = (ls[1] + rs[1]) / 2
    const hmx = (lh[0] + rh[0]) / 2
    const hmy = (lh[1] + rh[1]) / 2
    const torso = Math.hypot(smx - hmx, smy - hmy) || 40
    const r = torso * 0.28
    const dx = smx - hmx, dy = smy - hmy
    const len = Math.hypot(dx, dy) || 1
    head = { cx: smx + (dx/len) * r * 1.2, cy: smy + (dy/len) * r * 1.2, r }
  }
  return (
    <g transform={`translate(${xOffset}, 0)`}>
      <text x={panelW / 2} y={20} textAnchor="middle" fill={color} fontSize={13} fontWeight={700}>{label}</text>
      {EDGES.map(([a, b], i) =>
        pts[a] && pts[b] ? (
          <line key={i} x1={pts[a][0]} y1={pts[a][1]} x2={pts[b][0]} y2={pts[b][1]}
            stroke={color} strokeWidth={5} strokeLinecap="round" strokeOpacity={0.9} />
        ) : null
      )}
      {JOINTS.map(name =>
        pts[name] ? (
          <circle key={name} cx={pts[name][0]} cy={pts[name][1]} r={4} fill={color} />
        ) : null
      )}
      {head && <circle cx={head.cx} cy={head.cy} r={head.r} fill="none" stroke={color} strokeWidth={4} />}
    </g>
  )
}

export default function PoseFigure({ userPose, proPose, proLabel = 'Pro' }) {
  const panelW = 300
  const panelH = 320
  const gap = 16
  const totalW = panelW * 2 + gap
  return (
    <svg viewBox={`0 0 ${totalW} ${panelH}`} className="w-full h-auto" style={{ maxHeight: '55vh' }}>
      <rect x={0} y={0} width={panelW} height={panelH} fill="rgba(255,255,255,0.03)" rx={10} />
      <rect x={panelW + gap} y={0} width={panelW} height={panelH} fill="rgba(251,191,36,0.05)" rx={10} />
      <Figure pose={userPose} color="#ffffff" label="You" panelW={panelW} panelH={panelH} xOffset={0} />
      <Figure pose={proPose} color="#fbbf24" label={proLabel} panelW={panelW} panelH={panelH} xOffset={panelW + gap} />
    </svg>
  )
}