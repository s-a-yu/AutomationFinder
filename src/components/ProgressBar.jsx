export default function ProgressBar({ step }) {
  const items = [
    { num: 1, label: 'Org Context' },
    { num: 2, label: 'Processes' },
    { num: 3, label: 'Readiness' },
    { num: 4, label: 'Results' },
  ]

  return (
    <div>
      <div className="mb-12">
        <span className="text-xs font-semibold text-sage-600 uppercase tracking-widest">AI Automation Discovery</span>
      </div>

      <div className="space-y-0.5">
        {items.map(({ num, label }) => {
          const done = num < step
          const active = num === step
          return (
            <div
              key={num}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${active ? 'bg-sage-50' : ''}`}
            >
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-colors
                ${done || active ? 'bg-sage-600 text-white' : 'bg-gray-100 text-gray-400'}`}>
                {done ? '✓' : num}
              </div>
              <span className={`text-sm font-medium transition-colors
                ${active ? 'text-gray-900' : done ? 'text-gray-500' : 'text-gray-400'}`}>
                {label}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
