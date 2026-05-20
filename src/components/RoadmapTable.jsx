const TIER_BADGE = {
  quick_win: { label: 'Quick Win', cls: 'bg-green-100 text-green-800' },
  plan_now: { label: 'Plan Now', cls: 'bg-blue-100 text-blue-800' },
  backlog: { label: 'Backlog', cls: 'bg-gray-100 text-gray-600' },
}

const EFFORT_BADGE = {
  S: { label: 'Low effort', cls: 'bg-green-50 text-green-700 border border-green-200' },
  M: { label: 'Medium effort', cls: 'bg-yellow-50 text-yellow-700 border border-yellow-200' },
  L: { label: 'High effort', cls: 'bg-red-50 text-red-700 border border-red-200' },
}

function rationaleFor(r) {
  const value = (r.valueScore * 100).toFixed(0)
  const readiness = (r.readinessScore * 100).toFixed(0)
  const riskNote = r.risk_level !== 'low' ? ` ${r.risk_level.charAt(0).toUpperCase() + r.risk_level.slice(1)} risk requires governance guardrails.` : ''
  return `Value score ${value}/100, readiness ${readiness}/100.${riskNote}`
}

export default function RoadmapTable({ results }) {
  const tiers = ['quick_win', 'plan_now', 'backlog']
  const grouped = tiers.map((t) => ({ tier: t, items: results.filter((r) => r.tier === t) }))
    .filter((g) => g.items.length > 0)

  return (
    <div className="space-y-6">
      {grouped.map(({ tier, items }) => (
        <div key={tier}>
          <div className={`inline-block px-3 py-1 rounded-full text-sm font-semibold mb-3 ${TIER_BADGE[tier].cls}`}>
            {TIER_BADGE[tier].label}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-gray-200 text-left text-gray-500 text-xs uppercase tracking-wide">
                  <th className="pb-2 pr-4 font-medium w-8">#</th>
                  <th className="pb-2 pr-4 font-medium">Process</th>
                  <th className="pb-2 pr-4 font-medium">Effort</th>
                  <th className="pb-2 pr-4 font-medium">Priority</th>
                  <th className="pb-2 font-medium">Rationale</th>
                </tr>
              </thead>
              <tbody>
                {items.map((r, i) => (
                  <tr key={r.processId} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 pr-4 text-gray-400 font-medium">{i + 1}</td>
                    <td className="py-3 pr-4 font-semibold text-gray-800">{r.label}</td>
                    <td className="py-3 pr-4 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium whitespace-nowrap ${EFFORT_BADGE[r.effort].cls}`}>
                        {EFFORT_BADGE[r.effort].label}
                      </span>
                    </td>
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-gray-200 rounded-full">
                          <div
                            className="h-1.5 bg-sage-600 rounded-full"
                            style={{ width: `${r.priorityScore * 100}%` }}
                          />
                        </div>
                        <span className="text-gray-600 text-xs">{(r.priorityScore * 100).toFixed(0)}</span>
                      </div>
                    </td>
                    <td className="py-3 text-gray-500 text-xs leading-relaxed">{rationaleFor(r)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  )
}
