export default function MetricBar({ label, value }) {
  const color =
    value >= 80 ? 'bg-green-500' :
    value >= 60 ? 'bg-amber-400' : 'bg-red-400'

  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-white/10 last:border-0">
      <span className="text-sm text-gray-400 w-36 shrink-0">{label}</span>
      <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${color} transition-all duration-700`}
          style={{ width: `${value}%` }}
        />
      </div>
      <span className="text-sm font-medium text-white w-8 text-right">{value}</span>
    </div>
  )
}
