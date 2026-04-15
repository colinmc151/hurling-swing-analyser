import Header from '../components/Header'
import { useNavigate } from 'react-router-dom'

export default function Home() {
  const navigate = useNavigate()
  return (
    <div className="min-h-screen bg-gray-950"><Header />
      <div className="px-5 pt-12 pb-8 text-white">
        <div className="flex items-center gap-3 mb-2">
          <svg className="h-8 w-8" viewBox="0 0 32 32">
            <rect x="15" y="4" width="2.5" height="22" rx="1.2" fill="white"/>
            <path d="M12 3C12 3 16.5 1 21 3C21 3 22 7 16.5 7C11 7 12 3 12 3Z" fill="white"/>
            <circle cx="24" cy="24" r="5" fill="#FBBF24"/>
          </svg>
          <p className="text-2xl font-medium">SwingCoach</p>
        </div>
        <p className="text-sm text-white/60 mt-1">
          AI-powered hurling swing analysis. Compare your technique against the greats.
        </p>
      </div>
      <div className="px-5 flex flex-col gap-4">
        <button
          onClick={() => navigate('/upload')}
          className="w-full bg-amber-400 text-gray-900 rounded-2xl p-6 flex items-center gap-4 hover:bg-amber-300 transition-all"
        >
          <div className="w-12 h-12 bg-gray-900 rounded-full flex items-center justify-center text-xl shrink-0">
            🏑
          </div>
          <div className="text-left">
            <p className="font-semibold">Analyse a swing</p>
            <p className="text-sm text-gray-900/60 mt-0.5">Upload video and get AI coaching tips</p>
          </div>
        </button>
        <div className="bg-white/5 rounded-2xl p-5">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-4">How it works</p>
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-amber-400/20 flex items-center justify-center text-amber-400 text-sm font-bold shrink-0">1</div>
              <p className="text-sm text-gray-300">Record your swing or pick from camera roll</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-amber-400/20 flex items-center justify-center text-amber-400 text-sm font-bold shrink-0">2</div>
              <p className="text-sm text-gray-300">AI analyses your pose frame by frame</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-amber-400/20 flex items-center justify-center text-amber-400 text-sm font-bold shrink-0">3</div>
              <p className="text-sm text-gray-300">Get a score and personalised coaching tips</p>
            </div>
          </div>
        </div>
        <div className="bg-white/5 rounded-2xl p-5">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">Compare against</p>
          <div className="grid grid-cols-2 gap-2">
            {[
              { initials: 'HS', name: 'Henry Shefflin', county: 'Kilkenny' },
              { initials: 'JC', name: 'Joe Canning', county: 'Galway' },
              { initials: 'CL', name: 'Cian Lynch', county: 'Limerick' },
              { initials: 'DJ', name: 'D.J. Carey', county: 'Kilkenny' },
            ].map((p) => (
              <div key={p.initials} className="flex items-center gap-2 p-2 rounded-xl bg-white/5">
                <div className="w-9 h-9 rounded-full bg-purple-900/50 flex items-center justify-center text-xs font-medium text-purple-300">
                  {p.initials}
                </div>
                <div>
                  <p className="text-xs font-medium text-white">{p.name}</p>
                  <p className="text-xs text-gray-500">{p.county}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white/5 rounded-2xl p-5 mb-8">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Powered by</p>
          <p className="text-sm text-gray-400">MediaPipe pose detection + Claude AI coaching tips</p>
        </div>
      </div>
    </div>
  )
}
