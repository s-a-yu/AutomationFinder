import { useState } from 'react'

const TIER_COLORS = {
  quick_win: '#384959',
  plan_now:  '#0891b2',
  backlog:   '#9ca3af',
}

const TIER_LABELS = {
  quick_win: 'Quick Win',
  plan_now:  'Plan Now',
  backlog:   'Backlog',
}

const TIER_BADGE = {
  quick_win: 'bg-green-100 text-green-800',
  plan_now:  'bg-blue-100 text-blue-800',
  backlog:   'bg-gray-100 text-gray-600',
}

const HAS_PLAN = new Set(['quick_win', 'plan_now'])

export default function ScoreMatrix({ results, onDotClick }) {
  const W = 520
  const H = 380
  const PAD = 48
  const [hovered, setHovered] = useState(null)

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

      <div className="relative">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="w-full border border-gray-200 rounded-xl bg-white"
          onMouseLeave={() => setHovered(null)}
        >
          {/* quadrant shading */}
          <rect x={PAD} y={PAD} width={(W - PAD * 2) / 2} height={(H - PAD * 2) / 2} fill="#fef3c7" opacity="0.5" />
          <rect x={W / 2} y={PAD} width={(W - PAD * 2) / 2} height={(H - PAD * 2) / 2} fill="#d1fae5" opacity="0.5" />
          <rect x={PAD} y={H / 2} width={(W - PAD * 2) / 2} height={(H - PAD * 2) / 2} fill="#fee2e2" opacity="0.4" />
          <rect x={W / 2} y={H / 2} width={(W - PAD * 2) / 2} height={(H - PAD * 2) / 2} fill="#ede9fe" opacity="0.5" />

          {/* axes */}
          <line x1={PAD} y1={PAD} x2={PAD} y2={H - PAD} stroke="#d1d5db" strokeWidth="1.5" />
          <line x1={PAD} y1={H - PAD} x2={W - PAD} y2={H - PAD} stroke="#d1d5db" strokeWidth="1.5" />
          <line x1={W / 2} y1={PAD} x2={W / 2} y2={H - PAD} stroke="#e5e7eb" strokeWidth="1" strokeDasharray="4,4" />
          <line x1={PAD} y1={H / 2} x2={W - PAD} y2={H / 2} stroke="#e5e7eb" strokeWidth="1" strokeDasharray="4,4" />

          {/* axis labels */}
          <text x={W / 2} y={H - 8} textAnchor="middle" fontSize="12" fill="#6b7280" fontFamily="sans-serif">Readiness Score →</text>
          <text x={10} y={H / 2} textAnchor="middle" fontSize="12" fill="#6b7280" fontFamily="sans-serif" transform={`rotate(-90, 10, ${H / 2})`}>Value Score →</text>

          {/* quadrant labels */}
          <text x={PAD + 8} y={PAD + 16} fontSize="10" fill="#92400e" fontFamily="sans-serif">Low readiness</text>
          <text x={W / 2 + 8} y={PAD + 16} fontSize="10" fill="#065f46" fontFamily="sans-serif">Quick Wins</text>
          <text x={PAD + 8} y={H / 2 + 24} fontSize="10" fill="#991b1b" fontFamily="sans-serif">Avoid / Revisit</text>
          <text x={W / 2 + 8} y={H / 2 + 24} fontSize="10" fill="#384959" fontFamily="sans-serif">Plan Now</text>

          {/* points */}
          {results.map((r, i) => {
            const cx = PAD + r.readinessScore * (W - PAD * 2)
            const cy = H - PAD - r.valueScore * (H - PAD * 2)
            const isHovered = hovered?.processId === r.processId
            const clickable = HAS_PLAN.has(r.tier)
            return (
              <g
                key={r.processId}
                style={{ cursor: clickable ? 'pointer' : 'default' }}
                onMouseEnter={() => setHovered({ processId: r.processId, label: r.label, cx, cy, tier: r.tier, valueScore: r.valueScore, readinessScore: r.readinessScore })}
                onClick={() => clickable && onDotClick?.(r.label)}
              >
                <circle cx={cx} cy={cy} r={isHovered ? 13 : 10} fill={TIER_COLORS[r.tier]} opacity={isHovered ? 1 : 0.85} />
                <text x={cx} y={cy + 4} textAnchor="middle" fontSize="8" fill="white" fontFamily="sans-serif" fontWeight="bold">
                  {i + 1}
                </text>
              </g>
            )
          })}
        </svg>

        {/* Tooltip */}
        {hovered && (
          <div
            className="absolute pointer-events-none z-10 bg-white border border-gray-200 rounded-xl px-3 py-2.5 shadow-lg text-xs w-48"
            style={{
              left: `${(hovered.cx / W) * 100}%`,
              top: `${(hovered.cy / H) * 100}%`,
              transform: hovered.cy < H * 0.3
                ? 'translate(-50%, 16px)'
                : 'translate(-50%, calc(-100% - 14px))',
            }}
          >
            <p className="font-semibold text-gray-800 mb-1 leading-snug">{hovered.label}</p>
            <span className={`inline-block px-1.5 py-0.5 rounded-full font-medium mb-1.5 ${TIER_BADGE[hovered.tier]}`}>
              {TIER_LABELS[hovered.tier]}
            </span>
            <p className="text-gray-500">
              Value {(hovered.valueScore * 100).toFixed(0)} · Readiness {(hovered.readinessScore * 100).toFixed(0)}
            </p>
            {HAS_PLAN.has(hovered.tier) && (
              <p className="text-sage-600 mt-1.5">↓ Click to jump to plan</p>
            )}
          </div>
        )}
      </div>

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
