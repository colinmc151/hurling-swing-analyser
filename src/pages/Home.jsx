import { useNavigate } from 'react-router-dom'

export default function Home() {
  const navigate = useNavigate()
  return (
    <div className="min-h-screen bg-white">
      <div className="bg-gray-900 px-5 pt-10 pb-6 text-white">
        <p className="text-sm opacity-70">Welcome</p>
        <p className="text-2xl font-medium mt-1 mb-5">SwingCoach Hurling</p>
      </div>
      <div className="px-5 pt-6">
        <button
          onClick={() => navigate('/upload')}
          className="w-full border-2 border-dashed border-gray-200 rounded-2xl p-8 flex flex-col items-center gap-3 hover:border-gray-300 hover:bg-gray-50 transition-all"
        >
          <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center text-2xl">
            📹
          </div>
          <p className="font-medium text-gray-900">Upload swing video</p>
          <p className="text-sm text-gray-400 text-center">
            Tap to record or select from camera roll
          </p>
        </button>
      </div>
    </div>
  )
}