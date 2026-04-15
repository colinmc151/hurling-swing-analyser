import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

export default function Profile() {
  const { user } = useAuth()
  const [profile, setProfile] = useState(null)
  const [saving, setSaving] = useState(false)
  const [swings, setSwings] = useState([])
  const navigate = useNavigate()

  useEffect(() => {
    if (!user) return
    supabase.from('profiles').select('*').eq('id', user.id).single().then(({ data }) => setProfile(data || {}))
    supabase.from('swings').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).then(({ data }) => setSwings(data || []))
  }, [user])

  const save = async () => {
    setSaving(true)
    await supabase.from('profiles').update({
      name: profile.name,
      club: profile.club,
      position: profile.position,
      handedness: profile.handedness,
    }).eq('id', user.id)
    setSaving(false)
  }

  const logout = async () => {
    await supabase.auth.signOut()
    navigate('/login')
  }

  if (!profile) return <div className="min-h-screen grid place-items-center bg-slate-900 text-white">Loading…</div>

  return (
    <div className="min-h-screen bg-slate-900 text-white px-4 py-6">
      <div className="max-w-xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Profile</h1>
          <button onClick={logout} className="text-sm text-slate-400 hover:text-white">Log out</button>
        </div>

        <div className="bg-slate-800 rounded-2xl p-5 space-y-3 mb-6">
          <p className="text-sm text-slate-400">{user.email}</p>
          {['name', 'club', 'position', 'handedness'].map((k) => (
            <input
              key={k}
              placeholder={k.charAt(0).toUpperCase() + k.slice(1)}
              value={profile[k] || ''}
              onChange={(e) => setProfile({ ...profile, [k]: e.target.value })}
              className="w-full px-3 py-2 bg-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500"
            />
          ))}
          <button
            onClick={save}
            disabled={saving}
            className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 rounded-lg font-medium"
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>

        <h2 className="text-lg font-semibold mb-3">Swing history</h2>
        {swings.length === 0 ? (
          <p className="text-slate-400 text-sm">No swings yet. Upload one to get started.</p>
        ) : (
          <ul className="space-y-2">
            {swings.map((s) => (
              <li key={s.id} className="bg-slate-800 rounded-xl p-3 flex justify-between">
                <span>{s.swing_type || 'Swing'}</span>
                <span className="text-slate-400 text-sm">{new Date(s.created_at).toLocaleDateString()}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
