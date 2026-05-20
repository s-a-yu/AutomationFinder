import { useState } from 'react'
import { useApp } from '../context/AppContext'
import { exportResultsToPdf } from '../lib/exportPdf'
import ProgressBar from '../components/ProgressBar'
import ScoreMatrix from '../components/ScoreMatrix'
import RoadmapTable from '../components/RoadmapTable'
import SummaryCard from '../components/SummaryCard'
import ActionPlan from '../components/ActionPlan'

export default function Screen4Results() {
  const {
    scoredResults, summary, summaryLoading, orgContext,
    setStep, setSelectedProcesses, setProcessAnswers,
    setScoredResults, setSummary, setConnectionSource,
  } = useApp()

  const [targetProcessLabel, setTargetProcessLabel] = useState(null)
  const [exporting, setExporting] = useState(false)

  function handleRestart() {
    setSelectedProcesses([])
    setProcessAnswers({})
    setScoredResults([])
    setSummary(null)
    setConnectionSource(null)
    setStep(0)
  }

  async function handleExport() {
    setExporting(true)
    try {
      await exportResultsToPdf({ scoredResults, summary, orgContext })
    } finally {
      setExporting(false)
    }
  }

  function handleDotClick(label) {
    setTargetProcessLabel(label)
    setTimeout(() => {
      const id = `action-${label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+$/, '')}`
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, 0)
  }

  const quickWins = scoredResults.filter((r) => r.tier === 'quick_win')
  const planNow   = scoredResults.filter((r) => r.tier === 'plan_now')
  const backlog   = scoredResults.filter((r) => r.tier === 'backlog')

  return (
    <div className="min-h-screen bg-white flex">
      {/* Sidebar */}
      <aside className="w-56 shrink-0 border-r border-gray-100 px-6 py-10 sticky top-0 h-screen overflow-y-auto">
        <ProgressBar step={4} />
      </aside>

      {/* Main */}
      <main className="flex-1 px-12 py-10 overflow-auto">
        <div className="max-w-3xl mx-auto">
        {/* Action bar */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Your Automation Roadmap</h1>
            <p className="text-sm text-gray-400 mt-1">
              {scoredResults.length} processes scored — {quickWins.length} quick win{quickWins.length !== 1 ? 's' : ''}, {planNow.length} plan now, {backlog.length} backlog.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleExport}
              disabled={exporting || !summary}
              className="text-sm text-sage-600 hover:text-sage-700 border border-sage-200 rounded-lg px-4 py-2 hover:border-sage-400 hover:bg-sage-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
            >
              {exporting ? (
                <><span className="animate-spin inline-block text-xs">⟳</span> Exporting…</>
              ) : (
                <>↓ Export PDF</>
              )}
            </button>
            <button
              onClick={handleRestart}
              className="text-sm text-gray-400 hover:text-gray-600 border border-gray-200 rounded-lg px-4 py-2 hover:border-gray-300 transition-colors"
            >
              Start over
            </button>
          </div>
        </div>

        {/* Report */}
        <div>
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="border border-gray-200 rounded-xl p-5 text-center">
              <div className="text-3xl font-bold text-green-600">{quickWins.length}</div>
              <div className="text-sm text-gray-400 mt-1">Quick Wins</div>
            </div>
            <div className="border border-gray-200 rounded-xl p-5 text-center">
              <div className="text-3xl font-bold text-blue-500">{planNow.length}</div>
              <div className="text-sm text-gray-400 mt-1">Plan Now</div>
            </div>
            <div className="border border-gray-200 rounded-xl p-5 text-center">
              <div className="text-3xl font-bold text-gray-300">{backlog.length}</div>
              <div className="text-sm text-gray-400 mt-1">Backlog</div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="border border-gray-200 rounded-2xl p-6">
              <h2 className="text-base font-semibold text-gray-800 mb-4">Opportunity Matrix</h2>
              <ScoreMatrix results={scoredResults} onDotClick={handleDotClick} />
            </div>

            <SummaryCard summary={summary} loading={summaryLoading} />

            <div className="border border-gray-200 rounded-2xl p-6">
              <h2 className="text-base font-semibold text-gray-800 mb-4">Prioritized Roadmap</h2>
              <RoadmapTable results={scoredResults} />
            </div>

            <ActionPlan summary={summary} loading={summaryLoading} targetProcessLabel={targetProcessLabel} />
          </div>
        </div>

        {/* Bottom nav */}
        <div className="mt-10 pt-8 border-t border-gray-100 flex items-center justify-between">
          <button onClick={() => setStep(3)} className="text-sm text-gray-400 hover:text-gray-600 transition-colors">← Back to readiness</button>
          <button
            onClick={handleRestart}
            className="px-6 py-3 bg-sage-600 text-white rounded-xl font-semibold text-sm hover:bg-sage-700 transition-colors"
          >
            Run a new assessment
          </button>
        </div>
        </div>{/* end centered wrapper */}
      </main>
    </div>
  )
}
