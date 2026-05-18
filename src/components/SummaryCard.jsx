export default function SummaryCard({ summary, loading }) {
  if (loading) {
    return (
      <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-6 animate-pulse">
        <div className="h-4 bg-indigo-200 rounded w-3/4 mb-3" />
        <div className="h-4 bg-indigo-200 rounded w-full mb-2" />
        <div className="h-4 bg-indigo-200 rounded w-5/6" />
      </div>
    )
  }

  if (!summary) return null

  return (
    <div className="bg-gradient-to-br from-indigo-50 to-white border border-indigo-100 rounded-xl p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-indigo-900 text-base">Executive Summary</h3>
        {summary.source === 'api' && (
          <span className="text-xs px-2 py-0.5 bg-indigo-100 text-indigo-600 rounded-full">AI generated</span>
        )}
      </div>

      <p className="text-gray-700 text-sm leading-relaxed">{summary.executive_summary}</p>

      {summary.readiness_recommendations?.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-2">Readiness Recommendations</h4>
          <ul className="space-y-1.5">
            {summary.readiness_recommendations.map((rec, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                <span className="text-indigo-400 mt-0.5">›</span>
                {rec}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
