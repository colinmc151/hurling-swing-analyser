import { useNavigate, useLocation } from 'react-router-dom'
import NavBar from '../components/NavBar'
import MetricBar from '../components/MetricBar'
import TipCard from '../components/TipCard'
import SwingOverlay from '../components/SwingOverlay'

const labels = {
  hip_rotation: 'Hip rotation',
  shoulder_tilt: 'Shoulder tilt',
  elbow_angle: 'Elbow angle',
  backswing_height: 'Backswing height',
  follow_through: 'Follow-through',
  wrist_snap: 'Wrist snap',
}

const playerInitials = {
  'Henry Shefflin': 'HS',
  'Joe Canning': 'JC',
  'Cian Lynch': 'CL',
  'D.J. Carey': 'DJ',
}

const playerCounty = {
  'Henry Shefflin': 'Kilkenny',
  'Joe Canning': 'Galway',
  'Cian Lynch': 'Limerick',
  'D.J. Carey': 'Kilkenny',
}

export default function Results() {
  const navigate = useNavigate()
  const location = useLocation()
  const result = location.state?.result
  const swingType = location.state?.swingType

  if (!result) {
    return (
      <div className="min-h-screen bg-gray-950">
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
  const player = result.player_compared
  const initials = playerInitials[player] || '??'
  const county = playerCounty[player] || ''

  async function handleShare() {
    const text = `SwingCoach Hurling\nSwing score: ${score}/100 vs ${player}\n${score >= 80 ? 'Excellent!' : score >= 60 ? 'Good progress!' : 'Keep practising!'}`
    if (navigator.share) {
      try {
        await navigator.share({ title: 'SwingCoach Hurling', text })
      } catch (e) {}
    } else {
      await navigator.clipboard.writeText(text)
      alert('Score copied to clipboard!')
    }
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <div className="bg-gray-900 px-5 pt-6 pb-5">
        <div className="flex items-center gap-3 mb-5">
          <button
            onClick={() => navigate('/')}
            className="w-8 h-8 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white text-sm"
          >
            ←
          </button>
          <h1 className="text-lg font-medium text-white">Swing analysis</h1>
          <button
            onClick={handleShare}
            className="ml-auto w-8 h-8 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white text-sm"
          >
            ↗
          </button>
        </div>
        <div className="flex items-center gap-4 mb-5 bg-white/5 rounded-2xl p-3">
          <div className="w-11 h-11 rounded-full bg-purple-900/50 flex items-center justify-center text-sm font-medium text-purple-300 shrink-0">
            {initials}
          </div>
          <div>
            <p className="text-sm font-medium text-white">vs {player}</p>
            <p className="text-xs text-white/50">{county} {swingType ? `· ${swingType}` : ''}</p>
          </div>
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
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">
            Metrics vs {player}
          </p>
          <div className="bg-white/5 rounded-2xl px-4 py-1">
            {metrics.map((m) => <MetricBar key={m.label} {...m} />)}
          </div>
        </div>

        <SwingOverlay videoUrl={location.state?.videoUrl} track={result.track} metrics={result.metrics} player={player} />

        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">
            Key improvements
          </p>
          <div className="flex flex-col gap-3">
            {tips.map((t) => <TipCard key={t.title} {...t} />)}
          </div>
        </div>
        <button
          onClick={() => navigate('/upload')}
          className="w-full py-4 bg-amber-400 text-gray-900 rounded-2xl font-semibold hover:bg-amber-300 transition-all"
        >
          Analyse another swing
        </button>
      </div>
    </div>
  )
}
