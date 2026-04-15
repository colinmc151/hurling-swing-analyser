import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

export default function Header() {
  const { user } = useAuth()
  const navigate = useNavigate()

  if (!user) return null

  const logout = async () => {
    await supabase.auth.signOut()
    navigate('/login')
  }

  return (
    <header className="flex items-center justify-between px-4 py-3 bg-slate-900 text-white border-b border-slate-800">
      <Link to="/" className="font-bold">SwingCoach</Link>
      <div className="flex items-center gap-3 text-sm">
        <Link to="/profile" className="text-slate-300 hover:text-white">Profile</Link>
        <button onClick={logout} className="text-slate-300 hover:text-white">Log out</button>
      </div>
    </header>
  )
}
