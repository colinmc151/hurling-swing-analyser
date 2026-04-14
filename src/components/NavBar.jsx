import { useNavigate } from 'react-router-dom'

export default function NavBar({ title, backTo }) {
  const navigate = useNavigate()
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
      <h1 className="text-lg font-medium text-white">{title}</h1>
    </div>
  )
}
