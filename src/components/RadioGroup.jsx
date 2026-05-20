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
                  ? 'bg-sage-100 border-sage-300 text-sage-700'
                  : 'bg-sage-600 border-sage-600 text-white'
                : 'bg-white border-gray-300 text-gray-600 hover:border-sage-400 hover:text-sage-600'
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
