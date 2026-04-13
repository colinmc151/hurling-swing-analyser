export default function TipCard({ title, body, tag, tagType }) {
  const tagColors = {
    good: 'bg-green-100 text-green-800',
    warn: 'bg-amber-100 text-amber-800',
    bad: 'bg-red-100 text-red-800',
  }
  return (
    <div className="border-l-4 border-gray-900 bg-gray-50 rounded-r-xl p-4">
      <div className="flex items-center gap-2 mb-1">
        <p className="text-sm font-medium text-gray-900">{title}</p>
        {tag && (
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${tagColors[tagType]}`}>
            {tag}
          </span>
        )}
      </div>
      <p className="text-sm text-gray-500 leading-relaxed">{body}</p>
    </div>
  )
}