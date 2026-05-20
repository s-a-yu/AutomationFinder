import { useState } from 'react'

const TIER_STYLES = {
  quick_win: { badge: 'bg-green-100 text-green-800', dot: 'bg-green-500' },
  plan_now: { badge: 'bg-blue-100 text-blue-800', dot: 'bg-blue-500' },
}

const EFFORT_LABEL = { S: 'Low effort', M: 'Medium effort', L: 'High effort' }

const LICENSE_STYLES = {
  'Open Source': 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  'Commercial': 'bg-orange-50 text-orange-700 border border-orange-200',
  'Freemium': 'bg-sky-50 text-sky-700 border border-sky-200',
}

function ProcessPlan({ item, tier, index }) {
  const [open, setOpen] = useState(index === 0)
  const style = TIER_STYLES[tier] ?? TIER_STYLES.plan_now
  const steps = item.action_steps ?? []
  const metrics = item.success_metrics ?? []
  const standards = item.industry_standards ?? []
  const tools = item.recommended_tools ?? []
  const cost = item.cost_estimate ?? null

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-5 py-4 bg-white hover:bg-gray-50 transition-colors text-left"
      >
        <div className="flex items-center gap-3">
          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 ${style.dot}`}>
            {index + 1}
          </span>
          <div>
            <span className="font-semibold text-gray-800">{item.process}</span>
            <span className={`ml-2 text-xs px-2 py-0.5 rounded-full font-medium ${style.badge}`}>
              {tier === 'quick_win' ? 'Quick Win' : 'Plan Now'}
            </span>
            <span className="ml-2 text-xs text-gray-400 whitespace-nowrap">{EFFORT_LABEL[item.effort]}</span>
          </div>
        </div>
        <span className="text-gray-400 text-sm">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="border-t border-gray-100 px-5 py-5 bg-white space-y-6">
          {item.rationale && (
            <p className="text-sm text-gray-500 italic">{item.rationale}</p>
          )}

          {standards.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Industry Standards & Best Practices</h4>
              <ul className="space-y-1">
                {standards.map((s, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                    <span className="text-indigo-400 mt-0.5 flex-shrink-0">✦</span>
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {tools.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Recommended Tools</h4>
              <div className="space-y-2">
                {tools.map((t, i) => (
                  <div key={i} className="flex items-start gap-3 text-sm">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 mt-0.5 ${LICENSE_STYLES[t.license] ?? 'bg-gray-100 text-gray-600 border border-gray-200'}`}>
                      {t.license}
                    </span>
                    <div>
                      <span className="font-semibold text-gray-800">{t.name}</span>
                      {t.notes && <span className="text-gray-500 ml-1">— {t.notes}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {cost && (
            <div>
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Cost Estimate</h4>
              <div className="flex flex-wrap gap-3">
                <div className="flex-1 min-w-40 bg-gray-50 rounded-lg px-4 py-3 border border-gray-100">
                  <div className="text-xs text-gray-400 mb-0.5">Implementation</div>
                  <div className="text-sm font-semibold text-gray-800">{cost.implementation}</div>
                </div>
                <div className="flex-1 min-w-40 bg-gray-50 rounded-lg px-4 py-3 border border-gray-100">
                  <div className="text-xs text-gray-400 mb-0.5">Ongoing Licensing</div>
                  <div className="text-sm font-semibold text-gray-800">{cost.licensing}</div>
                </div>
              </div>
              {cost.notes && <p className="text-xs text-gray-400 mt-2 italic">{cost.notes}</p>}
            </div>
          )}

          {steps.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Implementation Plan</h4>
              <div className="relative">
                <div className="absolute left-3 top-0 bottom-0 w-px bg-gray-200" />
                <div className="space-y-5">
                  {steps.map((step, i) => (
                    <div key={i} className="relative pl-8">
                      <div className="absolute left-0 top-1 w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-bold">
                        {i + 1}
                      </div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-semibold text-gray-800">{step.phase}</span>
                        <span className="text-xs text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">{step.duration}</span>
                      </div>
                      <ul className="space-y-1">
                        {(step.tasks ?? []).map((task, j) => (
                          <li key={j} className="flex items-start gap-2 text-sm text-gray-600">
                            <span className="text-gray-300 mt-0.5 flex-shrink-0">›</span>
                            {task}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {metrics.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Success Metrics</h4>
              <div className="flex flex-wrap gap-2">
                {metrics.map((m, i) => (
                  <span key={i} className="text-xs bg-gray-100 text-gray-700 px-3 py-1.5 rounded-full">{m}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function ActionPlan({ summary, loading }) {
  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm animate-pulse space-y-3">
        <div className="h-4 bg-gray-200 rounded w-48" />
        <div className="h-16 bg-gray-100 rounded-xl" />
        <div className="h-16 bg-gray-100 rounded-xl" />
      </div>
    )
  }

  if (!summary) return null

  const quickWins = summary.quick_wins ?? []
  const planNow = summary.plan_now ?? []
  const allItems = [
    ...quickWins.map((item) => ({ item, tier: 'quick_win' })),
    ...planNow.map((item) => ({ item, tier: 'plan_now' })),
  ]

  if (!allItems.length) return null

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
      <div className="mb-5">
        <h2 className="text-lg font-semibold text-gray-800">Suggested Plan of Action</h2>
        <p className="text-sm text-gray-400 mt-1">Phase-by-phase implementation guide for each identified opportunity.</p>
      </div>
      <div className="space-y-3">
        {allItems.map(({ item, tier }, i) => (
          <ProcessPlan key={item.process} item={item} tier={tier} index={i} />
        ))}
      </div>
    </div>
  )
}
