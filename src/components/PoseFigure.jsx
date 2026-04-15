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

function normalizePose(pose, panelW, panelH) {
  if (!pose) return null
  const ls = pose.left_shoulder, rs = pose.right_shoulder
  const lh = pose.left_hip, rh = pose.right_hip
  if (!ls || !rs || !lh || !rh) return null

  const hipMid = [(lh[0] + rh[0]) / 2, (lh[1] + rh[1]) / 2]
  const shoulderMid = [(ls[0] + rs[0]) / 2, (ls[1] + rs[1]) / 2]

  // Force torso vertical: rotate so hip -> shoulder points up (negative Y in SVG)
  const tdx = shoulderMid[0] - hipMid[0]
  const tdy = shoulderMid[1] - hipMid[1]
  const torsoLen = Math.hypot(tdx, tdy) || 0.1
  const rot = -Math.PI / 2 - Math.atan2(tdy, tdx)
  const cos = Math.cos(rot), sin = Math.sin(rot)

  const rotated = {}
  for (const [name, p] of Object.entries(pose)) {
    const dx = p[0] - hipMid[0]
    const dy = p[1] - hipMid[1]
    rotated[name] = [dx * cos - dy * sin, dx * sin + dy * cos]
  }

  // Consistent scale: torso = 22% of panel height
  const scale = (panelH * 0.22) / torsoLen
  const centerX = panelW / 2
  const centerY = panelH * 0.62

  const out = {}
  for (const [name, p] of Object.entries(rotated)) {
    out[name] = [centerX + p[0] * scale, centerY + p[1] * scale]
  }
  return out
}

function Figure({ pose, color, label, panelW, panelH, xOffset = 0 }) {
  const pts = useMemo(() => normalizePose(pose, panelW, panelH), [pose, panelW, panelH])
  const labelY = 20

  if (!pts) {
    return (
      <g transform={`translate(${xOffset}, 0)`}>
        <text x={panelW / 2} y={labelY} textAnchor="middle" fill={color} fontSize={12} fontWeight={700}>{label}</text>
        <text x={panelW / 2} y={panelH / 2} textAnchor="middle" fill="#6b7280" fontSize={11}>no pose</text>
      </g>
    )
  }

  const ls = pts.left_shoulder, rs = pts.right_shoulder
  const smx = (ls[0] + rs[0]) / 2
  const smy = (ls[1] + rs[1]) / 2
  const headR = panelH * 0.05
  const head = { cx: smx, cy: smy - headR * 1.4, r: headR }

  return (
    <g transform={`translate(${xOffset}, 0)`}>
      <text x={panelW / 2} y={labelY} textAnchor="middle" fill={color} fontSize={12} fontWeight={700}>{label}</text>
      {EDGES.map(([a, b], i) =>
        pts[a] && pts[b] ? (
          <line key={i} x1={pts[a][0]} y1={pts[a][1]} x2={pts[b][0]} y2={pts[b][1]}
            stroke={color} strokeWidth={5} strokeLinecap="round" strokeOpacity={0.9} />
        ) : null
      )}
      {JOINTS.map(name =>
        pts[name] ? (
          <circle key={name} cx={pts[name][0]} cy={pts[name][1]} r={3.5} fill={color} />
        ) : null
      )}
      <circle cx={head.cx} cy={head.cy} r={head.r} fill="none" stroke={color} strokeWidth={4} />
    </g>
  )
}

export default function PoseFigure({ userPose, proPose, proLabel = 'Pro' }) {
  const panelW = 300
  const panelH = 340
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