const TIER_COLORS = {
  quick_win: '#4f46e5',
  plan_now: '#0891b2',
  backlog: '#9ca3af',
}

const TIER_LABELS = {
  quick_win: 'Quick Win',
  plan_now: 'Plan Now',
  backlog: 'Backlog',
}

export default function ScoreMatrix({ results }) {
  const W = 520
  const H = 380
  const PAD = 48

  return (
    <div>
      <div className="flex gap-4 mb-3">
        {Object.entries(TIER_LABELS).map(([tier, label]) => (
          <div key={tier} className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full" style={{ background: TIER_COLORS[tier] }} />
            <span className="text-xs text-gray-600">{label}</span>
          </div>
        ))}
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full border border-gray-200 rounded-xl bg-white">
        {/* quadrant shading */}
        <rect x={PAD} y={PAD} width={(W - PAD * 2) / 2} height={(H - PAD * 2) / 2} fill="#fef3c7" opacity="0.5" />
        <rect x={(W + PAD * 2) / 2} y={PAD} width={(W - PAD * 2) / 2} height={(H - PAD * 2) / 2} fill="#d1fae5" opacity="0.5" />
        <rect x={PAD} y={(H + PAD * 2) / 2} width={(W - PAD * 2) / 2} height={(H - PAD * 2) / 2} fill="#fee2e2" opacity="0.4" />
        <rect x={(W + PAD * 2) / 2} y={(H + PAD * 2) / 2} width={(W - PAD * 2) / 2} height={(H - PAD * 2) / 2} fill="#ede9fe" opacity="0.5" />

        {/* axes */}
        <line x1={PAD} y1={PAD} x2={PAD} y2={H - PAD} stroke="#d1d5db" strokeWidth="1.5" />
        <line x1={PAD} y1={H - PAD} x2={W - PAD} y2={H - PAD} stroke="#d1d5db" strokeWidth="1.5" />
        <line x1={(W) / 2} y1={PAD} x2={(W) / 2} y2={H - PAD} stroke="#e5e7eb" strokeWidth="1" strokeDasharray="4,4" />
        <line x1={PAD} y1={(H) / 2} x2={W - PAD} y2={(H) / 2} stroke="#e5e7eb" strokeWidth="1" strokeDasharray="4,4" />

        {/* axis labels */}
        <text x={(W) / 2} y={H - 8} textAnchor="middle" fontSize="12" fill="#6b7280" fontFamily="sans-serif">Readiness Score →</text>
        <text x={10} y={(H) / 2} textAnchor="middle" fontSize="12" fill="#6b7280" fontFamily="sans-serif" transform={`rotate(-90, 10, ${H / 2})`}>Value Score →</text>

        {/* quadrant labels */}
        <text x={PAD + 8} y={PAD + 16} fontSize="10" fill="#92400e" fontFamily="sans-serif">Low readiness</text>
        <text x={(W + PAD * 2) / 2 + 8} y={PAD + 16} fontSize="10" fill="#065f46" fontFamily="sans-serif">Quick Wins</text>
        <text x={PAD + 8} y={H / 2 + 24} fontSize="10" fill="#991b1b" fontFamily="sans-serif">Avoid / Revisit</text>
        <text x={(W + PAD * 2) / 2 + 8} y={H / 2 + 24} fontSize="10" fill="#4338ca" fontFamily="sans-serif">Plan Now</text>

        {/* points */}
        {results.map((r, i) => {
          const cx = PAD + r.readinessScore * (W - PAD * 2)
          const cy = H - PAD - r.valueScore * (H - PAD * 2)
          const color = TIER_COLORS[r.tier]
          return (
            <g key={r.processId}>
              <circle cx={cx} cy={cy} r={10} fill={color} opacity="0.85" />
              <text x={cx} y={cy + 4} textAnchor="middle" fontSize="8" fill="white" fontFamily="sans-serif" fontWeight="bold">
                {i + 1}
              </text>
              <title>{r.label} — Value: {(r.valueScore * 100).toFixed(0)} | Readiness: {(r.readinessScore * 100).toFixed(0)}</title>
            </g>
          )
        })}
      </svg>
      <div className="mt-3 space-y-1">
        {results.map((r, i) => (
          <div key={r.processId} className="flex items-center gap-2 text-xs text-gray-600">
            <div className="w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
              style={{ background: TIER_COLORS[r.tier] }}>
              {i + 1}
            </div>
            {r.label}
          </div>
        ))}
      </div>
    </div>
  )
}
