import { useEffect, useState } from 'react'
import PoseFigure from './PoseFigure'

const PHASES = [
  { key: 'setup', label: 'Setup', desc: 'Starting stance' },
  { key: 'backswing', label: 'Backswing', desc: 'Hurl at peak height' },
  { key: 'contact', label: 'Contact', desc: 'Striking the sliotar' },
  { key: 'follow_through', label: 'Follow-through', desc: 'After release' },
]

const playerFile = {
  'Henry Shefflin': 'Henry_Shefflin',
  'Joe Canning': 'Joe_Canning',
  'Cian Lynch': 'Cian_Lynch',
  'D.J. Carey': 'DJ_Carey',
}

export default function PhaseBreakdown({ userPhases, player }) {
  const [proPhases, setProPhases] = useState(null)
  const [activePhase, setActivePhase] = useState('setup')

  useEffect(() => {
    const fileName = playerFile[player]
    if (!fileName) return
    fetch(`/pro-poses/${fileName}.json`)
      .then((r) => r.json())
      .then(setProPhases)
      .catch(() => setProPhases(null))
  }, [player])

  if (!userPhases) return null

  return (
    <div>
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">
        Swing breakdown
      </p>
      <div className="bg-white/5 rounded-2xl p-4">
        <div className="flex gap-2 mb-4 overflow-x-auto">
          {PHASES.map((p) => (
            <button
              key={p.key}
              onClick={() => setActivePhase(p.key)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                activePhase === p.key
                  ? 'bg-amber-400 text-gray-900'
                  : 'bg-white/5 text-gray-400 hover:bg-white/10'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        <div className="aspect-square bg-gray-900 rounded-xl overflow-hidden">
          <PoseFigure proLabel={player}
            userPose={userPhases[activePhase]}
            proPose={proPhases?.[activePhase]}
          />
        </div>

        <p className="text-xs text-gray-500 mt-3 text-center">
          {PHASES.find((p) => p.key === activePhase)?.desc}
        </p>

        <div className="flex items-center justify-center gap-4 mt-3 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-white"></span>
            <span className="text-gray-400">You</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-amber-400"></span>
            <span className="text-gray-400">{player}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
