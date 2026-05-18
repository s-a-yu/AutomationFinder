import { useState, useEffect } from 'react'
import RadioGroup from './RadioGroup'

const DIMENSIONS = [
  { key: 'frequency', label: 'How often does this process run?', options: [{ value: 1, label: 'Rarely' }, { value: 2, label: 'Monthly' }, { value: 3, label: 'Daily/Weekly' }] },
  { key: 'volume', label: 'How many records/items are processed?', options: [{ value: 1, label: 'Low (<100)' }, { value: 2, label: 'Medium' }, { value: 3, label: 'High (1000+)' }] },
  { key: 'rule_clarity', label: 'How rule-based is this process?', options: [{ value: 1, label: 'Judgment-heavy' }, { value: 2, label: 'Mixed' }, { value: 3, label: 'Fully rule-based' }] },
  { key: 'error_cost', label: 'What is the cost of errors?', options: [{ value: 1, label: 'Low impact' }, { value: 2, label: 'Moderate' }, { value: 3, label: 'High/costly' }] },
  { key: 'input_consistency', label: 'How consistent are the inputs?', options: [{ value: 1, label: 'Unpredictable' }, { value: 2, label: 'Mostly consistent' }, { value: 3, label: 'Always consistent' }] },
]

export default function ProcessCard({ process, checked, onCheck, answers, onAnswer, prefilled, userEdited = [] }) {
  const [open, setOpen] = useState(false)
  const allAnswered = DIMENSIONS.every((d) => answers?.[d.key] != null)

  // Auto-expand when AI pre-fills this card
  useEffect(() => {
    if (prefilled?.length) setOpen(true)
  }, [prefilled])

  function handleCheck() {
    onCheck(process.id)
    if (!checked) setOpen(true)
  }

  return (
    <div className={`border rounded-xl transition-all ${checked ? 'border-indigo-400 bg-indigo-50/40' : 'border-gray-200 bg-white'}`}>
      <div className="flex items-start gap-3 p-4 cursor-pointer" onClick={handleCheck}>
        <div className={`mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors
          ${checked ? 'bg-indigo-600 border-indigo-600' : 'border-gray-300'}`}>
          {checked && <span className="text-white text-xs font-bold">✓</span>}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-gray-800">{process.label}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium
              ${process.risk_level === 'low' ? 'bg-green-100 text-green-700' :
                process.risk_level === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                'bg-red-100 text-red-700'}`}>
              {process.risk_level} risk
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 font-medium">
              Effort: {process.effort}
            </span>
            {prefilled?.length > 0 && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 font-medium">
                AI pre-filled
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500 mt-0.5">{process.description}</p>
        </div>
        {checked && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setOpen((o) => !o) }}
            className="text-gray-400 hover:text-gray-600 text-lg leading-none flex-shrink-0"
          >
            {open ? '▲' : '▼'}
          </button>
        )}
      </div>

      {checked && open && (
        <div className="border-t border-indigo-100 px-4 pb-4 pt-3 space-y-4">
          {DIMENSIONS.map((dim) => {
            const isAiFilled = prefilled?.includes(dim.key)
            const isUserConfirmed = userEdited.includes(dim.key)
            const isMuted = isAiFilled && !isUserConfirmed
            return (
              <div key={dim.key}>
                <div className="flex items-center gap-2 mb-2">
                  <p className="text-sm font-medium text-gray-700">{dim.label}</p>
                  {isMuted && (
                    <span className="text-xs px-1.5 py-0.5 rounded bg-purple-100 text-purple-600">AI suggested</span>
                  )}
                </div>
                <RadioGroup
                  name={`${process.id}_${dim.key}`}
                  options={dim.options}
                  value={answers?.[dim.key]}
                  onChange={(val) => onAnswer(process.id, dim.key, val)}
                  muted={isMuted}
                />
              </div>
            )
          })}
          {!allAnswered && (
            <p className="text-xs text-amber-600">Answer all 5 questions to score this process.</p>
          )}
        </div>
      )}
    </div>
  )
}
