import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

const CATEGORIES = ['Drill', 'Technique', 'Match clip', 'Warm-up', 'General']
const MAX_SIZE = 50 * 1024 * 1024

export default function CoachVideoLibrary() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [videos, setVideos] = useState([])
  const [showUpload, setShowUpload] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('General')
  const [file, setFile] = useState(null)
  const [playingId, setPlayingId] = useState(null)
  const [signedUrls, setSignedUrls] = useState({})
  const [error, setError] = useState('')

  useEffect(() => { if (user) loadVideos() }, [user])

  async function loadVideos() {
    setLoading(true)
    const { data } = await supabase
      .from('coach_videos').select('*')
      .eq('coach_user_id', user.id)
      .order('created_at', { ascending: false })
    setVideos(data || [])
    setLoading(false)
  }

  async function handleUpload(e) {
    e.preventDefault()
    if (!file || !title.trim()) return
    if (file.size > MAX_SIZE) {
      setError('File too large (' + (file.size / 1024 / 1024).toFixed(1) + 'MB). Max is 50MB.')
      return
    }
    setError('')
    setUploading(true)
    try {
      const ext = file.name.split('.').pop()
      const path = user.id + '/' + Date.now() + '.' + ext

      const { error: upErr } = await supabase.storage
        .from('coach-videos').upload(path, file, { contentType: file.type })
      if (upErr) throw upErr

      const { error: dbErr } = await supabase.from('coach_videos').insert({
        coach_user_id: user.id,
        title: title.trim(),
        description: description.trim() || null,
        category,
        video_path: path,
        file_size: file.size,
      })
      if (dbErr) throw dbErr

      setTitle(''); setDescription(''); setCategory('General'); setFile(null)
      setShowUpload(false)
      await loadVideos()
    } catch (err) {
      setError(err.message || 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  async function playVideo(video) {
    if (playingId === video.id) { setPlayingId(null); return }
    if (!signedUrls[video.id]) {
      const { data, error } = await supabase.storage
        .from('coach-videos').createSignedUrl(video.video_path, 3600)
      if (error) { alert('Could not load video: ' + error.message); return }
      setSignedUrls(prev => ({ ...prev, [video.id]: data.signedUrl }))
    }
    setPlayingId(video.id)
  }

  async function deleteVideo(video) {
    if (!confirm('Delete "' + video.title + '"? This cannot be undone.')) return
    await supabase.storage.from('coach-videos').remove([video.video_path])
    await supabase.from('coach_videos').delete().eq('id', video.id)
    setVideos(prev => prev.filter(v => v.id !== video.id))
    if (playingId === video.id) setPlayingId(null)
  }

  function formatSize(bytes) {
    if (!bytes) return ''
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(0) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white p-6">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Coaching Videos</h1>
          <button onClick={() => setShowUpload(!showUpload)}
            className="bg-emerald-600 hover:bg-emerald-500 px-4 py-2 rounded text-sm font-medium">
            {showUpload ? 'Cancel' : 'Upload Video'}
          </button>
        </div>

        {showUpload && (
          <form onSubmit={handleUpload} className="bg-slate-800 rounded-lg p-4 space-y-3">
            <div>
              <label className="block text-sm text-slate-300 mb-1">Title *</label>
              <input value={title} onChange={e => setTitle(e.target.value)}
                className="w-full bg-slate-700 rounded px-3 py-2 text-sm" placeholder="e.g. Ground strike drill" />
            </div>
            <div>
              <label className="block text-sm text-slate-300 mb-1">Category</label>
              <select value={category} onChange={e => setCategory(e.target.value)}
                className="w-full bg-slate-700 rounded px-3 py-2 text-sm">
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm text-slate-300 mb-1">Description</label>
              <textarea value={description} onChange={e => setDescription(e.target.value)}
                className="w-full bg-slate-700 rounded px-3 py-2 text-sm resize-none" rows={2}
                placeholder="Optional notes about this video" />
            </div>
            <div>
              <label className="block text-sm text-slate-300 mb-1">Video file (max 50MB)</label>
              <input type="file" accept="video/*" onChange={e => setFile(e.target.files?.[0] || null)}
                className="w-full text-sm text-slate-300 file:mr-3 file:py-2 file:px-4 file:rounded file:border-0 file:bg-slate-700 file:text-white file:cursor-pointer" />
            </div>
            {error && <div className="text-red-400 text-sm">{error}</div>}
            <button type="submit" disabled={uploading || !file || !title.trim()}
              className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 px-4 py-2 rounded text-sm font-medium w-full">
              {uploading ? 'Uploading…' : 'Upload'}
            </button>
          </form>
        )}

        {loading ? (
          <p className="text-slate-400">Loading videos…</p>
        ) : videos.length === 0 ? (
          <div className="bg-slate-800 rounded-lg p-8 text-center">
            <p className="text-slate-400 mb-2">No coaching videos yet.</p>
            <p className="text-slate-500 text-sm">Upload drills, technique demos, and match clips to share with your athletes.</p>
          </div>
        ) : (
          <ul className="space-y-3">
            {videos.map(v => (
              <li key={v.id} className="bg-slate-800 rounded-lg overflow-hidden">
                <div className="p-4">
                  <div className="flex justify-between items-start">
                    <button onClick={() => playVideo(v)} className="text-left flex-1">
                      <div className="font-medium">{v.title}</div>
                      <div className="text-xs text-slate-400 mt-1">
                        <span className="bg-slate-700 px-2 py-0.5 rounded mr-2">{v.category}</span>
                        {formatSize(v.file_size)} · {new Date(v.created_at).toLocaleDateString()}
                      </div>
                      {v.description && <p className="text-sm text-slate-400 mt-2">{v.description}</p>}
                    </button>
                    <button onClick={() => deleteVideo(v)}
                      className="text-slate-500 hover:text-red-400 text-xs ml-3">Delete</button>
                  </div>
                </div>
                {playingId === v.id && signedUrls[v.id] && (
                  <video src={signedUrls[v.id]} controls autoPlay className="w-full bg-black" />
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
