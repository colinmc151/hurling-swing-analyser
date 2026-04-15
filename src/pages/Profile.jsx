import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import NavBar from '../components/NavBar'

const ROLES = [
  { key: 'individual', label: 'Individual', desc: 'I train and analyse my own swings' },
  { key: 'parent', label: 'Parent', desc: 'I manage my kids\' accounts' },
  { key: 'coach', label: 'Coach', desc: 'I coach a team or athletes' },
]

export default function Profile() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [profile, setProfile] = useState(null)
  const [athletes, setAthletes] = useState([])
  const [connections, setConnections] = useState([])
  const [clubs, setClubs] = useState([])
  const [showAdd, setShowAdd] = useState(false)
  const [showConnect, setShowConnect] = useState(false)
  const [saving, setSaving] = useState(false)

  const loadAll = async () => {
    if (!user) return
    const [{ data: prof }, { data: ath }, { data: cons }, { data: cl }] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).single(),
      supabase.from('athletes').select('*, clubs(name, county)').eq('owner_user_id', user.id).order('created_at'),
      supabase.from('coach_connections').select('*, athletes(name), profiles!coach_connections_coach_user_id_fkey(name, coach_code)').order('created_at', { ascending: false }),
      supabase.from('clubs').select('*').order('county').order('name'),
    ])
    setProfile(prof || {})
    setAthletes(ath || [])
    setConnections(cons || [])
    setClubs(cl || [])
  }

  useEffect(() => { loadAll() }, [user])

  const toggleRole = async (key) => {
    const roles = profile.roles?.includes(key)
      ? profile.roles.filter((r) => r !== key)
      : [...(profile.roles || []), key]
    if (roles.length === 0) return
    const active_role = roles.includes(profile.active_role) ? profile.active_role : roles[0]
    setProfile({ ...profile, roles, active_role })
    await supabase.from('profiles').update({ roles, active_role }).eq('id', user.id)
  }

  const setActiveRole = async (role) => {
    setProfile({ ...profile, active_role: role })
    await supabase.from('profiles').update({ active_role: role }).eq('id', user.id)
  }

  const saveBasic = async () => {
    setSaving(true)
    await supabase.from('profiles').update({
      name: profile.name, club_id: profile.club_id,
    }).eq('id', user.id)
    setSaving(false)
  }

  const deleteAthlete = async (id) => {
    if (!confirm('Remove this athlete? Their swings will be kept.')) return
    await supabase.from('athletes').delete().eq('id', id)
    loadAll()
  }

  const logout = async () => {
    await supabase.auth.signOut()
    navigate('/login')
  }

  if (!profile) return <div className="min-h-screen grid place-items-center bg-slate-900 text-white">Loading…</div>

  const roles = profile.roles || []
  const isCoach = roles.includes('coach')
  const isParent = roles.includes('parent')

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <NavBar title="Profile" backTo="/" />
      <div className="max-w-xl mx-auto px-4 py-5 space-y-6">

        <section className="bg-slate-800 rounded-2xl p-5">
          <p className="text-sm text-slate-400">{user.email}</p>
          <input
            placeholder="Your name"
            value={profile.name || ''}
            onChange={(e) => setProfile({ ...profile, name: e.target.value })}
            className="mt-3 w-full px-3 py-2 bg-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <button
            onClick={saveBasic}
            disabled={saving}
            className="mt-3 w-full py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 rounded-lg font-medium"
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
        </section>

        <section className="bg-slate-800 rounded-2xl p-5">
          <h2 className="font-semibold mb-3">Your roles</h2>
          <div className="grid gap-2">
            {ROLES.map((r) => {
              const on = roles.includes(r.key)
              return (
                <button
                  key={r.key}
                  onClick={() => toggleRole(r.key)}
                  className={`text-left p-3 rounded-lg border ${on ? 'border-emerald-500 bg-emerald-500/10' : 'border-slate-700 hover:border-slate-600'}`}
                >
                  <div className="flex justify-between">
                    <span className="font-medium">{r.label}</span>
                    {on && profile.active_role === r.key && <span className="text-xs text-emerald-400">Active</span>}
                  </div>
                  <div className="text-xs text-slate-400">{r.desc}</div>
                </button>
              )
            })}
          </div>
          {roles.length > 1 && (
            <div className="mt-3 flex gap-2 text-xs">
              <span className="text-slate-400 py-1.5">Current mode:</span>
              {roles.map((r) => (
                <button
                  key={r}
                  onClick={() => setActiveRole(r)}
                  className={`px-2 py-1 rounded ${profile.active_role === r ? 'bg-emerald-600' : 'bg-slate-700 hover:bg-slate-600'}`}
                >{r}</button>
              ))}
            </div>
          )}
          {isCoach && profile.coach_code && (
            <div className="mt-4 p-3 bg-slate-700 rounded-lg text-sm">
              <div className="text-slate-400 mb-1">Your coach code (share with athletes):</div>
              <div className="font-mono text-lg">{profile.coach_code}</div>
            </div>
          )}
        </section>

        <section className="bg-slate-800 rounded-2xl p-5">
          <div className="flex justify-between items-center mb-3">
            <h2 className="font-semibold">{isParent ? 'Your kids' : 'Athletes'}</h2>
            <button
              onClick={() => setShowAdd(true)}
              className="text-sm px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 rounded-lg"
            >+ Add</button>
          </div>
          {athletes.length === 0 ? (
            <p className="text-slate-400 text-sm">No athletes yet. Add one to start tracking swings.</p>
          ) : (
            <ul className="space-y-2">
              {athletes.map((a) => (
                <li key={a.id} className="bg-slate-700 rounded-lg p-3">
                  <div className="flex justify-between">
                    <div>
                      <div className="font-medium">{a.name}{a.is_self && <span className="text-xs text-emerald-400 ml-2">you</span>}</div>
                      <div className="text-xs text-slate-400">
                        {[a.clubs?.name, a.county, a.position, a.handedness].filter(Boolean).join(' · ') || '—'}
                      </div>
                    </div>
                    <button onClick={() => deleteAthlete(a.id)} className="text-slate-400 hover:text-red-400 text-sm">Remove</button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="bg-slate-800 rounded-2xl p-5">
          <div className="flex justify-between items-center mb-3">
            <h2 className="font-semibold">Coaches</h2>
            <button
              onClick={() => setShowConnect(true)}
              className="text-sm px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 rounded-lg"
            >+ Connect</button>
          </div>
          {connections.length === 0 ? (
            <p className="text-slate-400 text-sm">No coaches connected yet.</p>
          ) : (
            <ul className="space-y-2">
              {connections.map((c) => (
                <li key={c.id} className="bg-slate-700 rounded-lg p-3 flex justify-between text-sm">
                  <span>{c.profiles?.name || 'Coach'} · {c.athletes?.name}</span>
                  <span className={`text-xs ${c.status === 'active' ? 'text-emerald-400' : 'text-slate-400'}`}>{c.status}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        {isCoach && (
          <button
            onClick={() => navigate('/coach')}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-medium"
          >Go to coach dashboard →</button>
        )}

        <button onClick={logout} className="w-full py-2 text-slate-400 hover:text-white text-sm">Log out</button>
      </div>

      {showAdd && (
        <AddAthleteModal
          user={user}
          clubs={clubs}
          onClose={() => setShowAdd(false)}
          onSaved={() => { setShowAdd(false); loadAll() }}
        />
      )}
      {showConnect && (
        <ConnectCoachModal
          user={user}
          athletes={athletes}
          onClose={() => setShowConnect(false)}
          onSaved={() => { setShowConnect(false); loadAll() }}
        />
      )}
    </div>
  )
}

function AddAthleteModal({ user, clubs, onClose, onSaved }) {
  const [form, setForm] = useState({ name: '', age: '', position: '', handedness: '', club_id: '', county: '', is_self: false })
  const [clubQuery, setClubQuery] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const filtered = clubQuery
    ? clubs.filter((c) => (c.name + ' ' + c.county).toLowerCase().includes(clubQuery.toLowerCase())).slice(0, 8)
    : []

  const save = async () => {
    if (!form.name) return setError('Name required')
    if (!form.club_id) return setError('Club required')
    if (!form.county) return setError('County required')
    setSaving(true)
    const { error } = await supabase.from('athletes').insert({
      owner_user_id: user.id,
      name: form.name,
      age: form.age ? parseInt(form.age) : null,
      position: form.position || null,
      handedness: form.handedness || null,
      club_id: form.club_id,
      county: form.county,
      is_self: form.is_self,
    })
    setSaving(false)
    if (error) setError(error.message)
    else onSaved()
  }

  const addNewClub = async () => {
    const name = prompt('New club name:')
    if (!name) return
    const county = prompt('County:')
    if (!county) return
    const { data, error } = await supabase.from('clubs').insert({ name, county }).select().single()
    if (!error && data) {
      setForm({ ...form, club_id: data.id, county: data.county })
      setClubQuery(data.name)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 grid place-items-center p-4 z-50">
      <div className="w-full max-w-md bg-slate-800 rounded-2xl p-5 space-y-3">
        <h3 className="font-semibold text-lg">Add athlete</h3>
        <input placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="w-full px-3 py-2 bg-slate-700 rounded-lg outline-none" />
        <div className="grid grid-cols-2 gap-2">
          <input placeholder="Age" type="number" value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value })}
            className="px-3 py-2 bg-slate-700 rounded-lg outline-none" />
          <select value={form.handedness} onChange={(e) => setForm({ ...form, handedness: e.target.value })}
            className="px-3 py-2 bg-slate-700 rounded-lg outline-none">
            <option value="">Handedness</option>
            <option>Right</option><option>Left</option>
          </select>
        </div>
        <input placeholder="Position (forward, back…)" value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })}
          className="w-full px-3 py-2 bg-slate-700 rounded-lg outline-none" />

        <div>
          <input
            placeholder="Search for your club…"
            value={clubQuery}
            onChange={(e) => { setClubQuery(e.target.value); setForm({ ...form, club_id: '' }) }}
            className="w-full px-3 py-2 bg-slate-700 rounded-lg outline-none"
          />
          {filtered.length > 0 && !form.club_id && (
            <ul className="mt-1 bg-slate-900 rounded-lg max-h-40 overflow-y-auto">
              {filtered.map((c) => (
                <li key={c.id}>
                  <button
                    onClick={() => { setForm({ ...form, club_id: c.id, county: c.county }); setClubQuery(c.name) }}
                    className="w-full text-left px-3 py-2 hover:bg-slate-700 text-sm"
                  >{c.name} <span className="text-slate-400">· {c.county}</span></button>
                </li>
              ))}
            </ul>
          )}
          {clubQuery && filtered.length === 0 && !form.club_id && (
            <button onClick={addNewClub} className="mt-1 text-sm text-emerald-400 hover:text-emerald-300">+ Add "{clubQuery}" as new club</button>
          )}
        </div>

        <input placeholder="County team allegiance" value={form.county} onChange={(e) => setForm({ ...form, county: e.target.value })}
          className="w-full px-3 py-2 bg-slate-700 rounded-lg outline-none" />

        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.is_self} onChange={(e) => setForm({ ...form, is_self: e.target.checked })} />
          This is me
        </label>

        {error && <p className="text-red-400 text-sm">{error}</p>}
        <div className="flex gap-2 pt-2">
          <button onClick={onClose} className="flex-1 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg">Cancel</button>
          <button onClick={save} disabled={saving} className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 rounded-lg">
            {saving ? 'Saving…' : 'Add'}
          </button>
        </div>
      </div>
    </div>
  )
}

function ConnectCoachModal({ user, athletes, onClose, onSaved }) {
  const [code, setCode] = useState('')
  const [athleteId, setAthleteId] = useState(athletes[0]?.id || '')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const connect = async () => {
    if (!code || !athleteId) return setError('Code and athlete required')
    setSaving(true)
    setError('')
    const { data: coach, error: cErr } = await supabase.from('profiles').select('id').eq('coach_code', code.trim().toUpperCase()).single()
    if (cErr || !coach) { setSaving(false); return setError('Coach code not found') }
    const { error: iErr } = await supabase.from('coach_connections').insert({
      coach_user_id: coach.id, athlete_id: athleteId, initiated_by: 'athlete', status: 'pending',
    })
    setSaving(false)
    if (iErr) setError(iErr.message)
    else onSaved()
  }

  return (
    <div className="fixed inset-0 bg-black/60 grid place-items-center p-4 z-50">
      <div className="w-full max-w-md bg-slate-800 rounded-2xl p-5 space-y-3">
        <h3 className="font-semibold text-lg">Connect with a coach</h3>
        <p className="text-sm text-slate-400">Ask your coach for their 6-character code.</p>
        <select value={athleteId} onChange={(e) => setAthleteId(e.target.value)}
          className="w-full px-3 py-2 bg-slate-700 rounded-lg outline-none">
          <option value="">Who is this for?</option>
          {athletes.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
        </select>
        <input placeholder="Coach code" value={code} onChange={(e) => setCode(e.target.value)}
          className="w-full px-3 py-2 bg-slate-700 rounded-lg outline-none font-mono uppercase" />
        {error && <p className="text-red-400 text-sm">{error}</p>}
        <div className="flex gap-2 pt-2">
          <button onClick={onClose} className="flex-1 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg">Cancel</button>
          <button onClick={connect} disabled={saving} className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 rounded-lg">
            {saving ? 'Connecting…' : 'Connect'}
          </button>
        </div>
      </div>
    </div>
  )
}
