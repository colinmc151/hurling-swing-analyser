import { useNavigate, useLocation } from 'react-router-dom'
import NavBar from '../components/NavBar'
import MetricBar from '../components/MetricBar'
import TipCard from '../components/TipCard'

const labels = {
  hip_rotation: 'Hip rotation',
  shoulder_tilt: 'Shoulder tilt',
  elbow_angle: 'Elbow angle',
  backswing_height: 'Backswing height',
  follow_through: 'Follow-through',
  wrist_snap: 'Wrist snap',
}

export default function Results() {
  const navigate = useNavigate()
  const location = useLocation()
  const result = location.state?.result

  if (!result) {
    return (
      <div className="min-h-screen bg-white">
        <NavBar title="Swing analysis" backTo="/" />
        <div className="p-5 text-sm text-gray-500">
          No analysis yet. Upload a swing first.
        </div>
      </div>
    )
  }

  const metrics = Object.entries(result.metrics).map(([key, m]) => ({
    label: labels[key] || key,
    value: m.your_score,
  }))

  const tips = result.tips.map((t) => ({
    title: t.title,
    body: t.body,
    tag: t.tag,
    tagType: t.tag_type,
  }))

  const score = result.overall_score
  const dashLength = (score / 100) * 251

  return (
    <div className="min-h-screen bg-white">
      <div className="bg-gray-900 px-5 pt-6 pb-5">
        <div className="flex items-center gap-3 mb-5">
          <button
            onClick={() => navigate('/')}
            className="w-8 h-8 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white text-sm"
          >
            ←
          </button>
          <h1 className="text-lg font-medium text-white">Swing analysis</h1>
          <span className="ml-auto text-xs text-white/60">vs {result.player_compared}</span>
        </div>
        <div className="flex items-center gap-6">
          <div className="relative w-24 h-24 shrink-0">
            <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
              <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="8" />
              <circle cx="50" cy="50" r="40" fill="none" stroke="#FBBF24" strokeWidth="8"
                strokeDasharray={`${dashLength} 251`} strokeLinecap="round" />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-medium text-white">{score}</span>
              <span className="text-xs text-white/60">/100</span>
            </div>
          </div>
          <div>
            <p className="text-white/70 text-sm">Swing score</p>
            <p className="text-amber-400 font-medium mt-1">
              {score >= 80 ? 'Excellent' : score >= 60 ? 'Good progress' : 'Keep practising'}
            </p>
          </div>
        </div>
      </div>

      <div className="px-5 py-5 flex flex-col gap-6">
        <div>
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">
            Metrics vs {result.player_compared}
          </p>
          <div className="border border-gray-100 rounded-2xl px-4 py-1">
            {metrics.map((m) => <MetricBar key={m.label} {...m} />)}
          </div>
        </div>

        <div>
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">
            Key improvements
          </p>
          <div className="flex flex-col gap-3">
            {tips.map((t) => <TipCard key={t.title} {...t} />)}
          </div>
        </div>

        <button
          onClick={() => navigate('/upload')}
          className="w-full py-4 bg-gray-900 text-white rounded-2xl font-medium hover:bg-gray-800 transition-all"
        >
          Analyse another swing
        </button>
      </div>
    </div>
  )
}