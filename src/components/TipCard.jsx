export default function TipCard({ title, body, tag, tagType }) {
  const tagColors = {
    good: 'bg-green-900/50 text-green-400',
    warn: 'bg-amber-900/50 text-amber-400',
    bad: 'bg-red-900/50 text-red-400',
  }
  const borderColors = {
    good: 'border-green-500',
    warn: 'border-amber-400',
    bad: 'border-red-400',
  }
  return (
    <div className={`border-l-4 ${borderColors[tagType] || 'border-white/20'} bg-white/5 rounded-r-xl p-4`}>
      <div className="flex items-center gap-2 mb-1">
        <p className="text-sm font-medium text-white">{title}</p>
        {tag && (
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${tagColors[tagType]}`}>
            {tag}
          </span>
        )}
      </div>
      <p className="text-sm text-gray-400 leading-relaxed">{body}</p>
    </div>
  )
}
