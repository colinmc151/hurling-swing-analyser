import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

export default function NavBar({ title, backTo }) {
  const navigate = useNavigate()
  const { user } = useAuth()

  const logout = async () => {
    await supabase.auth.signOut()
    navigate('/login')
  }

  return (
    <div className="flex items-center gap-3 px-5 py-4 border-b border-white/10">
      {backTo && (
        <button
          onClick={() => navigate(backTo)}
          className="w-8 h-8 rounded-full border border-white/20 bg-white/10 flex items-center justify-center text-sm text-white hover:bg-white/20"
        >
          ←
        </button>
      )}
      <h1 className="text-lg font-medium text-white flex-1">{title}</h1>
      {user && (
        <div className="flex items-center gap-3 text-sm">
          <Link to="/profile" className="text-slate-300 hover:text-white">Profile</Link>
          <button onClick={logout} className="text-slate-300 hover:text-white">Log out</button>
        </div>
      )}
    </div>
  )
}
