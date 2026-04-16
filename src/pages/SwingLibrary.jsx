import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

export default function SwingLibrary() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [athletes, setAthletes] = useState([])
  const [selectedAthlete, setSelectedAthlete] = useState('all')
  const [swings, setSwings] = useState([])
  const [notes, setNotes] = useState({})

  useEffect(() => {
    if (!user) return
    loadAthletes()
  }, [user])

  useEffect(() => {
    if (athletes.length > 0) loadSwings()
  }, [athletes, selectedAthlete])

  async function loadAthletes() {
    const { data } = await supabase
      .from('athletes')
      .select('id, name, is_self')
      .eq('owner_user_id', user.id)
    setAthletes(data || [])
    const self = (data || []).find(a => a.is_self)
    if (self) setSelectedAthlete(self.id)
  }

  async function loadSwings() {
    setLoading(true)
    let query = supabase
      .from('swings')
      .select('*')
      .order('created_at', { ascending: false })

    if (selectedAthlete === 'all') {
      const ids = athletes.map(a => a.id)
      query = query.in('athlete_id', ids)
    } else {
      query = query.eq('athlete_id', selectedAthlete)
    }

    const { data: sw } = await query
    setSwings(sw || [])

    // Load notes for these swings
    if (sw && sw.length > 0) {
      const swingIds = sw.map(s => s.id)
      const { data: ns } = await supabase
        .from('swing_notes')
        .select('*')
        .in('swing_id', swingIds)
        .order('created_at', { ascending: false })

      const grouped = {}
      ;(ns || []).forEach(n => {
        if (!grouped[n.swing_id]) grouped[n.swing_id] = []
        grouped[n.swing_id].push(n)
      })
      setNotes(grouped)
    } else {
      setNotes({})
    }

    setLoading(false)
  }

  function athleteName(athleteId) {
    const a = athletes.find(x => x.id === athleteId)
    return a ? a.name : 'Unknown'
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white p-6">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Swing Library</h1>
          <button onClick={() => navigate('/upload')}
            className="bg-emerald-600 hover:bg-emerald-500 px-4 py-2 rounded text-sm font-medium">
            New Swing
          </button>
        </div>

        {athletes.length > 1 && (
          <select value={selectedAthlete} onChange={e => setSelectedAthlete(e.target.value)}
            className="bg-slate-800 border border-slate-600 rounded px-3 py-2 text-sm w-full">
            <option value="all">All athletes</option>
            {athletes.map(a => (
              <option key={a.id} value={a.id}>{a.name}{a.is_self ? ' (me)' : ''}</option>
            ))}
          </select>
        )}

        {loading ? (
          <p className="text-slate-400">Loading swings…</p>
        ) : swings.length === 0 ? (
          <div className="bg-slate-800 rounded-lg p-8 text-center">
            <p className="text-slate-400 mb-4">No swings recorded yet.</p>
            <button onClick={() => navigate('/upload')}
              className="bg-emerald-600 hover:bg-emerald-500 px-4 py-2 rounded text-sm font-medium">
              Record your first swing
            </button>
          </div>
        ) : (
          <ul className="space-y-3">
            {swings.map(s => {
              const swingNotes = notes[s.id] || []
              const metrics = s.metrics || {}
              return (
                <li key={s.id}>
                  <button onClick={() => navigate(`/swing/${s.id}`)}
                    className="bg-slate-800 hover:bg-slate-750 rounded-lg p-4 text-left w-full">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium">
                          {s.swing_type || 'Swing'}
                          {selectedAthlete === 'all' && (
                            <span className="text-slate-400 font-normal ml-2">— {athleteName(s.athlete_id)}</span>
                          )}
                        </div>
                        <div className="text-xs text-slate-400 mt-1">
                          {new Date(s.created_at).toLocaleDateString()} · {new Date(s.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                      {s.video_path && (
                        <span className="text-xs bg-slate-700 px-2 py-1 rounded text-slate-300">Video</span>
                      )}
                    </div>

                    {Object.keys(metrics).length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-300">
                        {Object.entries(metrics).slice(0, 4).map(([k, v]) => (
                          <span key={k} className="bg-slate-700 px-2 py-1 rounded">
                            {k.replace(/_/g, ' ')}: {typeof v === 'number' ? v.toFixed(1) : typeof v === 'object' ? '…' : String(v)}
                          </span>
                        ))}
                      </div>
                    )}

                    {swingNotes.length > 0 && (
                      <div className="mt-2 text-xs text-amber-400">
                        {swingNotes.length} coach note{swingNotes.length !== 1 ? 's' : ''}
                      </div>
                    )}
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}
