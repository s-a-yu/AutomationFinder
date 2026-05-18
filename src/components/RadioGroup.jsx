export default function RadioGroup({ name, options, value, onChange, muted = false }) {
  return (
    <div className="flex gap-2">
      {options.map((opt) => {
        const selected = value === opt.value
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`px-4 py-2 rounded-full text-sm font-medium border transition-all
              ${selected
                ? muted
                  ? 'bg-indigo-100 border-indigo-300 text-indigo-700'
                  : 'bg-indigo-600 border-indigo-600 text-white'
                : 'bg-white border-gray-300 text-gray-600 hover:border-indigo-400 hover:text-indigo-600'
              }
              ${muted && !selected ? 'opacity-60' : ''}
            `}
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}
