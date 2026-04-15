import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

export default function ShareAndNotes({ swingId }) {
  const { user } = useAuth()
  const [athleteId, setAthleteId] = useState(null)
  const [coaches, setCoaches] = useState([])
  const [shares, setShares] = useState([])
  const [notes, setNotes] = useState([])
  const [saving, setSaving] = useState(false)
  const [debug, setDebug] = useState('')

  const load = async () => {
    if (!user) return
    if (!swingId) { setDebug('No swing ID — the swing may not have saved.'); return }
    const { data: swing, error: sErr } = await supabase.from('swings').select('athlete_id').eq('id', swingId).single()
    if (sErr || !swing) { setDebug('Could not load swing: ' + (sErr?.message || 'not found')); return }
    setAthleteId(swing.athlete_id)

    const { data: cons, error: cErr } = await supabase
      .from('coach_connections')
      .select('coach_user_id, status')
      .eq('athlete_id', swing.athlete_id)
      .eq('status', 'active')
    if (cErr) { setDebug('Connections error: ' + cErr.message); return }

    let coachProfiles = []
    if (cons && cons.length > 0) {
      const ids = cons.map((c) => c.coach_user_id)
      const { data: profs } = await supabase.from('profiles').select('id, name, coach_code').in('id', ids)
      coachProfiles = (cons || []).map((c) => ({
        coach_user_id: c.coach_user_id,
        profile: profs?.find((p) => p.id === c.coach_user_id),
      }))
    }
    setCoaches(coachProfiles)

    const { data: sh } = await supabase.from('swing_shares').select('*').eq('swing_id', swingId)
    setShares(sh || [])

    const { data: n } = await supabase.from('swing_notes').select('*').eq('swing_id', swingId).order('created_at')
    if (n && n.length > 0) {
      const authorIds = [...new Set(n.map((x) => x.author_user_id))]
      const { data: authors } = await supabase.from('profiles').select('id, name').in('id', authorIds)
      setNotes(n.map((x) => ({ ...x, author: authors?.find((a) => a.id === x.author_user_id) })))
    } else {
      setNotes([])
    }
    setDebug('')
  }

  useEffect(() => { load() }, [swingId, user])

  const toggleShare = async (coachId) => {
    setSaving(true)
    const existing = shares.find((s) => s.coach_user_id === coachId)
    if (existing) await supabase.from('swing_shares').delete().eq('id', existing.id)
    else await supabase.from('swing_shares').insert({ swing_id: swingId, coach_user_id: coachId, athlete_id: athleteId })
    await load()
    setSaving(false)
  }

  return (
    <div className="mt-6 bg-white/5 border border-white/10 rounded-2xl p-4 text-white">
      <h3 className="font-semibold mb-3">Share with coach</h3>
      {debug && <p className="text-amber-400 text-xs mb-2">{debug}</p>}
      {coaches.length === 0 ? (
        <p className="text-slate-400 text-sm">No active coaches connected to this athlete.</p>
      ) : (
        <ul className="space-y-2">
          {coaches.map((c) => {
            const shared = shares.some((s) => s.coach_user_id === c.coach_user_id)
            return (
              <li key={c.coach_user_id} className="flex justify-between items-center bg-white/5 rounded-lg p-2 text-sm">
                <span>{c.profile?.name || 'Coach'}</span>
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
                <div className="text-slate-400 text-xs mb-1">{n.author?.name || 'Coach'} · {new Date(n.created_at).toLocaleDateString()}</div>
                <div>{n.body}</div>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  )
}
