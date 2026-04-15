import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'


function formatVal(v) {
  if (v === null || v === undefined) return '—'
  if (typeof v === 'number') return Number.isFinite(v) ? v.toFixed(2) : String(v)
  if (typeof v === 'boolean') return v ? 'Yes' : 'No'
  if (typeof v === 'string') return v
  if (Array.isArray(v)) return v.map(formatVal).join(', ')
  return null // signal: nested object, render as sublist
}

function MetricsView({ metrics }) {
  return (
    <dl className="space-y-3 text-sm">
      {Object.entries(metrics).map(([k, v]) => {
        const flat = formatVal(v)
        if (flat !== null) {
          return (
            <div key={k} className="grid grid-cols-2 gap-3">
              <dt className="text-slate-400 capitalize">{k.replace(/_/g, ' ')}</dt>
              <dd className="font-medium">{flat}</dd>
            </div>
          )
        }
        return (
          <div key={k} className="border-t border-slate-700 pt-3">
            <dt className="text-slate-400 capitalize mb-2">{k.replace(/_/g, ' ')}</dt>
            <dd className="pl-3 space-y-1">
              {Object.entries(v).map(([ck, cv]) => {
                const cflat = formatVal(cv)
                return (
                  <div key={ck} className="grid grid-cols-2 gap-3">
                    <span className="text-slate-400 capitalize">{ck.replace(/_/g, ' ')}</span>
                    <span className="font-medium">{cflat !== null ? cflat : JSON.stringify(cv)}</span>
                  </div>
                )
              })}
            </dd>
          </div>
        )
      })}
    </dl>
  )
}

export default function SwingDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [swing, setSwing] = useState(null)
  const [athlete, setAthlete] = useState(null)
  const [videoUrl, setVideoUrl] = useState('')
  const [notes, setNotes] = useState([])
  const [newNote, setNewNote] = useState('')
  const [posting, setPosting] = useState(false)
  const videoRef = useRef(null)

  useEffect(() => {
    if (!id || !user) return
    load()
  }, [id, user])

  async function load() {
    setLoading(true)
    setError('')
    try {
      const { data: sw, error: swErr } = await supabase
        .from('swings').select('*').eq('id', id).single()
      if (swErr) throw swErr
      setSwing(sw)

      const { data: ath } = await supabase
        .from('athletes').select('*, clubs(name)').eq('id', sw.athlete_id).single()
      setAthlete(ath)

      if (sw.video_path) {
        const { data: signed, error: signErr } = await supabase
          .storage.from('swing-videos').createSignedUrl(sw.video_path, 3600)
        if (signErr) console.error('Signed URL error:', signErr)
        else setVideoUrl(signed.signedUrl)
      }

      await loadNotes()
    } catch (e) {
      console.error(e)
      setError(e.message || 'Failed to load swing')
    } finally {
      setLoading(false)
    }
  }

  async function loadNotes() {
    const { data: ns } = await supabase
      .from('swing_notes').select('*').eq('swing_id', id)
      .order('created_at', { ascending: false })

    if (ns && ns.length > 0) {
      const ids = [...new Set(ns.map((n) => n.author_user_id))]
      const { data: profs } = await supabase
        .from('profiles').select('id, name').in('id', ids)
      const byId = Object.fromEntries((profs || []).map((p) => [p.id, p.name]))
      setNotes(ns.map((n) => ({ ...n, authorName: byId[n.author_user_id] || 'Coach' })))
    } else {
      setNotes([])
    }
  }

  async function postNote(e) {
    e.preventDefault()
    if (!newNote.trim()) return
    setPosting(true)
    try {
      const { error: err } = await supabase.from('swing_notes').insert({
        swing_id: id,
        athlete_id: swing.athlete_id,
        author_user_id: user.id,
        content: newNote.trim(),
      })
      if (err) throw err
      setNewNote('')
      await loadNotes()
    } catch (e) {
      alert('Could not post note: ' + (e.message || e))
    } finally {
      setPosting(false)
    }
  }

  if (loading) {
    return <div className="min-h-screen bg-slate-900 text-white p-6"><div className="max-w-3xl mx-auto">Loading swing…</div></div>
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-900 text-white p-6">
        <div className="max-w-3xl mx-auto">
          <button onClick={() => navigate(-1)} className="text-slate-300 mb-4">← Back</button>
          <div className="bg-red-900/40 border border-red-700 text-red-200 p-4 rounded">{error}</div>
        </div>
      </div>
    )
  }

  const metrics = swing?.metrics || {}

  return (
    <div className="min-h-screen bg-slate-900 text-white p-6">
      <div className="max-w-3xl mx-auto space-y-6">
        <button onClick={() => navigate(-1)} className="text-slate-300">← Back</button>

        <div>
          <h1 className="text-2xl font-bold">{athlete?.name || 'Athlete'} · {swing?.swing_type}</h1>
          <p className="text-slate-400 text-sm">
            {athlete?.clubs?.name || 'No club'}
            {athlete?.county ? ` · ${athlete.county}` : ''}
            {swing?.created_at ? ` · ${new Date(swing.created_at).toLocaleString()}` : ''}
          </p>
        </div>

        {videoUrl ? (
          <video ref={videoRef} src={videoUrl} controls className="w-full rounded-lg bg-black" />
        ) : (
          <div className="bg-slate-800 rounded-lg p-6 text-slate-400 text-center">Video not available</div>
        )}

        <div className="bg-slate-800 rounded-lg p-4">
          <h2 className="font-semibold mb-3">Metrics</h2>
          {Object.keys(metrics).length === 0 ? (
            <p className="text-slate-400 text-sm">No metrics recorded.</p>
          ) : (
            <MetricsView metrics={metrics} />
          )}
        </div>

        <div className="bg-slate-800 rounded-lg p-4">
          <h2 className="font-semibold mb-3">Coach notes</h2>

          <form onSubmit={postNote} className="mb-4">
            <textarea
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="Leave a tip or observation…"
              rows={3}
              className="w-full bg-slate-700 rounded p-2 text-sm resize-none"
            />
            <div className="flex justify-end mt-2">
              <button type="submit" disabled={posting || !newNote.trim()}
                className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 px-4 py-2 rounded text-sm font-medium">
                {posting ? 'Posting…' : 'Post note'}
              </button>
            </div>
          </form>

          {notes.length === 0 ? (
            <p className="text-slate-400 text-sm">No notes yet.</p>
          ) : (
            <ul className="space-y-3">
              {notes.map((n) => (
                <li key={n.id} className="bg-slate-700 rounded p-3 text-sm">
                  <div className="flex justify-between text-xs text-slate-400 mb-1">
                    <span>{n.authorName}</span>
                    <span>{new Date(n.created_at).toLocaleString()}</span>
                  </div>
                  <div className="whitespace-pre-wrap">{n.content}</div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
