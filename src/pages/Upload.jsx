import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import NavBar from '../components/NavBar'

const players = [
  { id: 1, initials: 'HS', name: 'Henry Shefflin', role: 'Kilkenny · All-Ireland × 10' },
  { id: 2, initials: 'JC', name: 'Joe Canning', role: 'Galway · All-Ireland × 1' },
  { id: 3, initials: 'CL', name: 'Cian Lynch', role: 'Limerick · All-Ireland × 5' },
  { id: 4, initials: 'DJ', name: 'D.J. Carey', role: 'Kilkenny · All-Ireland × 5' },
]

const swingTypes = ['Ground stroke', 'Overhead', 'Puck out', 'Sideline cut']

export default function Upload() {
  const navigate = useNavigate()
  const [selectedPlayer, setSelectedPlayer] = useState(1)
  const [selectedSwing, setSelectedSwing] = useState('Ground stroke')
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  function handleFile(e) {
    if (e.target.files[0]) setFile(e.target.files[0])
  }

  async function handleAnalyse() {
    if (!file) {
      setError('Please select a video first.')
      return
    }
    setLoading(true)
    setError(null)
    const playerName = players.find((p) => p.id === selectedPlayer).name
    const formData = new FormData()
    formData.append('video', file)
    formData.append('player', playerName)

    try {
      const res = await fetch('https://hurling-swing-analyser.onrender.com/analyse', {
        method: 'POST',
        body: formData,
      })
      const data = await res.json()
      if (data.error) {
        setError(data.error)
        setLoading(false)
        return
      }
      navigate('/results', { state: { result: data, swingType: selectedSwing } })
    } catch (err) {
      setError('Could not reach the backend. Please wait 30s and try again.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <NavBar title="New analysis" backTo="/" />
      <div className="px-5 py-5 flex flex-col gap-6">
        <div>
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">Your video</p>
          <label className="w-full border-2 border-dashed border-gray-200 rounded-2xl p-6 flex flex-col items-center gap-3 cursor-pointer hover:border-gray-300 hover:bg-gray-50 transition-all">
            <input type="file" accept="video/*" className="hidden" onChange={handleFile} />
            {file ? (
              <>
                <div className="w-16 h-11 bg-gray-900 rounded-lg flex items-center justify-center text-white text-xl">▶</div>
                <p className="text-sm font-medium text-gray-900">{file.name}</p>
                <p className="text-xs text-gray-400">{(file.size / 1024 / 1024).toFixed(1)} MB</p>
              </>
            ) : (
              <>
                <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center text-2xl">📹</div>
                <p className="text-sm font-medium text-gray-900">Tap to select video</p>
                <p className="text-xs text-gray-400">MP4, MOV up to 200MB</p>
              </>
            )}
          </label>
        </div>

        <div>
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">Swing type</p>
          <div className="grid grid-cols-2 gap-2">
            {swingTypes.map((t) => (
              <button
                key={t}
                onClick={() => setSelectedSwing(t)}
                className={`p-3 rounded-xl border text-sm font-medium transition-all ${
                  selectedSwing === t
                    ? 'border-gray-900 bg-gray-900 text-white'
                    : 'border-gray-200 text-gray-500 hover:border-gray-300'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">Compare against</p>
          <div className="flex flex-col gap-2">
            {players.map((p) => (
              <button
                key={p.id}
                onClick={() => setSelectedPlayer(p.id)}
                className={`flex items-center gap-3 p-3 rounded-2xl border transition-all text-left ${
                  selectedPlayer === p.id ? 'border-gray-900 border-2' : 'border-gray-100 hover:border-gray-200'
                }`}
              >
                <div className="w-11 h-11 rounded-full bg-purple-100 flex items-center justify-center text-sm font-medium text-purple-800 shrink-0">
                  {p.initials}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{p.name}</p>
                  <p className="text-xs text-gray-400">{p.role}</p>
                </div>
                <div className={`w-5 h-5 rounded-full border flex items-center justify-center text-xs ${
                  selectedPlayer === p.id ? 'bg-gray-900 border-gray-900 text-white' : 'border-gray-300'
                }`}>
                  {selectedPlayer === p.id && '✓'}
                </div>
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">{error}</div>
        )}

        <button
          onClick={handleAnalyse}
          disabled={loading}
          className="w-full py-4 bg-gray-900 text-white rounded-2xl font-medium hover:bg-gray-800 transition-all disabled:opacity-50"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="h-6 w-6" viewBox="0 0 32 32" style={{animation: 'hurlSwing 0.8s ease-in-out infinite alternate', transformOrigin: '16px 28px'}}>
                <rect x="15" y="2" width="2" height="24" rx="1" fill="currentColor"/>
                <path d="M11 2 C11 2 16 0 21 2 C21 2 22 6 16 6 C10 6 11 2 11 2Z" fill="currentColor"/>
              </svg>
              Analysing…
            </span>
          ) : 'Analyse swing'}
        </button>
      </div>
    </div>
  )
}