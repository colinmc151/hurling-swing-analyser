import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mode, setMode] = useState('signin')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { data, error } = mode === 'signin'
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password })
      if (error) setError(error.message)
      else if (data?.session) navigate('/')
      else setError('Check your email to confirm your account.')
    } catch (err) {
      setError(err?.message || 'Something went wrong. Try again.')
    } finally {
      setLoading(false)
    }
  }

  const signInWithGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    })
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white px-4">
      <div className="w-full max-w-sm bg-slate-800 p-6 rounded-2xl shadow-xl">
        <h1 className="text-2xl font-bold mb-1">SwingCoach Hurling</h1>
        <p className="text-slate-400 mb-6 text-sm">
          {mode === 'signin' ? 'Sign in to your account' : 'Create an account'}
        </p>

        <button
          onClick={signInWithGoogle}
          className="w-full py-2 mb-4 bg-white text-slate-900 rounded-lg font-medium hover:bg-slate-100"
        >
          Continue with Google
        </button>

        <div className="flex items-center gap-2 my-4 text-slate-500 text-xs">
          <div className="flex-1 h-px bg-slate-700" /> OR <div className="flex-1 h-px bg-slate-700" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="email"
            required
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 bg-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <input
            type="password"
            required
            minLength={6}
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 bg-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500"
          />
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 rounded-lg font-medium"
          >
            {loading ? '…' : mode === 'signin' ? 'Sign in' : 'Sign up'}
          </button>
        </form>

        <button
          onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
          className="mt-4 text-sm text-slate-400 hover:text-white w-full text-center"
        >
          {mode === 'signin' ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
        </button>
      </div>
    </div>
  )
}
