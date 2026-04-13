import { useNavigate } from 'react-router-dom'

export default function NavBar({ title, backTo }) {
  const navigate = useNavigate()
  return (
    <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
      {backTo && (
        <button
          onClick={() => navigate(backTo)}
          className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-sm hover:bg-gray-50"
        >
          ←
        </button>
      )}
      <h1 className="text-lg font-medium text-gray-900">{title}</h1>
    </div>
  )
}