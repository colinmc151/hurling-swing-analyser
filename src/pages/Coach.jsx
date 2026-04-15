import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import NavBar from '../components/NavBar'

export default function Coach() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [teams, setTeams] = useState([])
  const [connections, setConnections] = useState([])
  const [shares, setShares] = useState([])
  const [showNewTeam, setShowNewTeam] = useState(false)

  const load = async () => {
    if (!user) return
    const [{ data: t }, { data: c }, { data: sh }] = await Promise.all([
      supabase.from('teams').select('*, clubs(name)').eq('coach_user_id', user.id),
      supabase.from('coach_connections').select('*, athletes(name)').eq('coach_user_id', user.id).order('created_at', { ascending: false }),
      supabase.from('swing_shares').select('*, swings(created_at, swing_type, athlete_id, athletes(name))').eq('coach_user_id', user.id).order('created_at', { ascending: false }),
    ])
    setTeams(t || [])
    setConnections(c || [])
    setShares(sh || [])
  }

  useEffect(() => { load() }, [user])

  const respond = async (id, status) => {
    await supabase.from('coach_connections').update({ status }).eq('id', id)
    load()
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <NavBar title="Coach dashboard" backTo="/profile" />
      <div className="max-w-xl mx-auto px-4 py-5 space-y-6">

        <section className="bg-slate-800 rounded-2xl p-5">
          <div className="flex justify-between items-center mb-3">
            <h2 className="font-semibold">Teams</h2>
            <button onClick={() => setShowNewTeam(true)} className="text-sm px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 rounded-lg">+ New team</button>
          </div>
          {teams.length === 0 ? (
            <p className="text-slate-400 text-sm">No teams yet.</p>
          ) : (
            <ul className="space-y-2">
              {teams.map((t) => (
                <li key={t.id} className="bg-slate-700 rounded-lg p-3 flex justify-between">
                  <span>{t.name} <span className="text-slate-400 text-xs">· {t.kind === 'club' ? t.clubs?.name : t.county}</span></span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="bg-slate-800 rounded-2xl p-5">
          <h2 className="font-semibold mb-3">Athlete requests</h2>
          {connections.filter((c) => c.status === 'pending').length === 0 ? (
            <p className="text-slate-400 text-sm">No pending requests.</p>
          ) : (
            <ul className="space-y-2">
              {connections.filter((c) => c.status === 'pending').map((c) => (
                <li key={c.id} className="bg-slate-700 rounded-lg p-3 flex justify-between items-center">
                  <span className="text-sm">{c.athletes?.name}</span>
                  <div className="flex gap-2">
                    <button onClick={() => respond(c.id, 'active')} className="text-xs px-3 py-1 bg-emerald-600 hover:bg-emerald-500 rounded">Accept</button>
                    <button onClick={() => respond(c.id, 'declined')} className="text-xs px-3 py-1 bg-slate-600 hover:bg-slate-500 rounded">Decline</button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="bg-slate-800 rounded-2xl p-5">
          <h2 className="font-semibold mb-3">Active athletes</h2>
          {connections.filter((c) => c.status === 'active').length === 0 ? (
            <p className="text-slate-400 text-sm">No active athletes yet.</p>
          ) : (
            <ul className="space-y-2">
              {connections.filter((c) => c.status === 'active').map((c) => (
                <li key={c.id} className="bg-slate-700 rounded-lg p-3 text-sm">{c.athletes?.name}</li>
              ))}
            </ul>
          )}
        </section>

        <section className="bg-slate-800 rounded-2xl p-5">
          <h2 className="font-semibold mb-3">Shared swings</h2>
          {shares.length === 0 ? (
            <p className="text-slate-400 text-sm">No swings shared with you yet.</p>
          ) : (
            <ul className="space-y-2">
              {shares.map((s) => (
                <li key={s.id} className="bg-slate-700 rounded-lg p-3 text-sm">
                  <button onClick={() => navigate(`/swing/${s.swings?.id || s.swing_id}`)} className="text-left w-full">
                    <div className="font-medium">{s.swings?.athletes?.name}</div>
                    <div className="text-xs text-slate-400">{s.swings?.swing_type} · {new Date(s.swings?.created_at).toLocaleDateString()}</div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

      </div>

      {showNewTeam && (
        <NewTeamModal user={user} onClose={() => setShowNewTeam(false)} onSaved={() => { setShowNewTeam(false); load() }} />
      )}
    </div>
  )
}

function NewTeamModal({ user, onClose, onSaved }) {
  const [form, setForm] = useState({ name: '', kind: 'club', club_id: '', county: '' })
  const [clubs, setClubs] = useState([])
  const [clubQuery, setClubQuery] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    supabase.from('clubs').select('*').order('county').order('name').then(({ data }) => setClubs(data || []))
  }, [])

  const filtered = clubQuery
    ? clubs.filter((c) => (c.name + ' ' + c.county).toLowerCase().includes(clubQuery.toLowerCase())).slice(0, 8)
    : []

  const save = async () => {
    if (!form.name) return setError('Team name required')
    if (form.kind === 'club' && !form.club_id) return setError('Pick a club')
    if (form.kind === 'county' && !form.county) return setError('Pick a county')
    setSaving(true)
    const { error } = await supabase.from('teams').insert({
      name: form.name, kind: form.kind,
      club_id: form.kind === 'club' ? form.club_id : null,
      county: form.kind === 'county' ? form.county : null,
      coach_user_id: user.id,
    })
    setSaving(false)
    if (error) setError(error.message)
    else onSaved()
  }

  return (
    <div className="fixed inset-0 bg-black/60 grid place-items-center p-4 z-50">
      <div className="w-full max-w-md bg-slate-800 rounded-2xl p-5 space-y-3">
        <h3 className="font-semibold text-lg">New team</h3>
        <input placeholder="Team name (e.g. U16)" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="w-full px-3 py-2 bg-slate-700 rounded-lg outline-none" />
        <div className="flex gap-2">
          {['club','county'].map((k) => (
            <button key={k} onClick={() => setForm({ ...form, kind: k })}
              className={`flex-1 py-2 rounded-lg ${form.kind === k ? 'bg-emerald-600' : 'bg-slate-700'}`}>
              {k === 'club' ? 'Club team' : 'County team'}
            </button>
          ))}
        </div>
        {form.kind === 'club' ? (
          <div>
            <input placeholder="Search club…" value={clubQuery} onChange={(e) => { setClubQuery(e.target.value); setForm({ ...form, club_id: '' }) }}
              className="w-full px-3 py-2 bg-slate-700 rounded-lg outline-none" />
            {filtered.length > 0 && !form.club_id && (
              <ul className="mt-1 bg-slate-900 rounded-lg max-h-40 overflow-y-auto">
                {filtered.map((c) => (
                  <li key={c.id}>
                    <button onClick={() => { setForm({ ...form, club_id: c.id }); setClubQuery(c.name) }}
                      className="w-full text-left px-3 py-2 hover:bg-slate-700 text-sm">{c.name} · <span className="text-slate-400">{c.county}</span></button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : (
          <input placeholder="County" value={form.county} onChange={(e) => setForm({ ...form, county: e.target.value })}
            className="w-full px-3 py-2 bg-slate-700 rounded-lg outline-none" />
        )}
        {error && <p className="text-red-400 text-sm">{error}</p>}
        <div className="flex gap-2 pt-2">
          <button onClick={onClose} className="flex-1 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg">Cancel</button>
          <button onClick={save} disabled={saving} className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 rounded-lg">
            {saving ? 'Saving…' : 'Create'}
          </button>
        </div>
      </div>
    </div>
  )
}
