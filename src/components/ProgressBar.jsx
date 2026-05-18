export default function ProgressBar({ step, total = 4 }) {
  const labels = ['Org Context', 'Processes', 'Readiness', 'Results']
  return (
    <div className="w-full max-w-3xl mx-auto mb-10">
      <div className="flex items-center justify-between mb-2">
        {labels.map((label, i) => {
          const num = i + 1
          const done = num < step
          const active = num === step
          return (
            <div key={num} className="flex flex-col items-center flex-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold mb-1 transition-colors
                ${done ? 'bg-indigo-600 text-white' : active ? 'bg-indigo-600 text-white ring-4 ring-indigo-100' : 'bg-gray-200 text-gray-500'}`}>
                {done ? '✓' : num}
              </div>
              <span className={`text-xs font-medium ${active ? 'text-indigo-700' : 'text-gray-400'}`}>{label}</span>
            </div>
          )
        })}
      </div>
      <div className="relative h-1.5 bg-gray-200 rounded-full">
        <div
          className="absolute top-0 left-0 h-1.5 bg-indigo-600 rounded-full transition-all duration-500"
          style={{ width: `${((step - 1) / (total - 1)) * 100}%` }}
        />
      </div>
    </div>
  )
}
