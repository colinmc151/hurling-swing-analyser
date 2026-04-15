import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

export default function ShareAndNotes({ swingId }) {
  const { user } = useAuth()
  const [coaches, setCoaches] = useState([])
  const [shares, setShares] = useState([])
  const [notes, setNotes] = useState([])
  const [saving, setSaving] = useState(false)

  const load = async () => {
    if (!swingId || !user) return
    const { data: swing } = await supabase.from('swings').select('athlete_id').eq('id', swingId).single()
    if (!swing) return
    const { data: cons } = await supabase
      .from('coach_connections')
      .select('coach_user_id, profiles!coach_connections_coach_user_id_fkey(name, coach_code)')
      .eq('athlete_id', swing.athlete_id).eq('status', 'active')
    setCoaches(cons || [])
    const { data: sh } = await supabase.from('swing_shares').select('*').eq('swing_id', swingId)
    setShares(sh || [])
    const { data: n } = await supabase.from('swing_notes').select('*, profiles!swing_notes_author_user_id_fkey(name)').eq('swing_id', swingId).order('created_at')
    setNotes(n || [])
  }

  useEffect(() => { load() }, [swingId, user])

  const toggleShare = async (coachId) => {
    setSaving(true)
    const existing = shares.find((s) => s.coach_user_id === coachId)
    if (existing) await supabase.from('swing_shares').delete().eq('id', existing.id)
    else await supabase.from('swing_shares').insert({ swing_id: swingId, coach_user_id: coachId })
    await load()
    setSaving(false)
  }

  if (!swingId) return null

  return (
    <div className="mt-6 bg-white/5 border border-white/10 rounded-2xl p-4 text-white">
      <h3 className="font-semibold mb-3">Share with coach</h3>
      {coaches.length === 0 ? (
        <p className="text-slate-400 text-sm">No active coaches connected.</p>
      ) : (
        <ul className="space-y-2">
          {coaches.map((c) => {
            const shared = shares.some((s) => s.coach_user_id === c.coach_user_id)
            return (
              <li key={c.coach_user_id} className="flex justify-between items-center bg-white/5 rounded-lg p-2 text-sm">
                <span>{c.profiles?.name || 'Coach'}</span>
                <button onClick={() => toggleShare(c.coach_user_id)} disabled={saving}
                  className={`text-xs px-3 py-1 rounded ${shared ? 'bg-emerald-600' : 'bg-slate-600 hover:bg-slate-500'}`}>
                  {shared ? 'Shared ✓' : 'Share'}
                </button>
              </li>
            )
          })}
        </ul>
      )}

      {notes.length > 0 && (
        <>
          <h3 className="font-semibold mt-5 mb-2">Coach notes</h3>
          <ul className="space-y-2">
            {notes.map((n) => (
              <li key={n.id} className="bg-white/5 rounded-lg p-3 text-sm">
                <div className="text-slate-400 text-xs mb-1">{n.profiles?.name || 'Coach'} · {new Date(n.created_at).toLocaleDateString()}</div>
                <div>{n.body}</div>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  )
}
