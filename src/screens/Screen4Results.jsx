import { useApp } from '../context/AppContext'
import ProgressBar from '../components/ProgressBar'
import ScoreMatrix from '../components/ScoreMatrix'
import RoadmapTable from '../components/RoadmapTable'
import SummaryCard from '../components/SummaryCard'

export default function Screen4Results() {
  const { scoredResults, summary, summaryLoading, setStep, setSelectedProcesses, setProcessAnswers, setScoredResults, setSummary, orgContext } = useApp()

  function handleRestart() {
    setSelectedProcesses([])
    setProcessAnswers({})
    setScoredResults([])
    setSummary(null)
    setStep(1)
  }

  const quickWins = scoredResults.filter((r) => r.tier === 'quick_win')
  const planNow = scoredResults.filter((r) => r.tier === 'plan_now')
  const backlog = scoredResults.filter((r) => r.tier === 'backlog')

  return (
    <div className="min-h-screen bg-gray-50 px-8 py-10">
      <div className="max-w-4xl mx-auto">
        <ProgressBar step={4} />
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Your Automation Roadmap</h1>
            <p className="text-gray-500 mt-2">
              {scoredResults.length} processes scored — {quickWins.length} quick win{quickWins.length !== 1 ? 's' : ''}, {planNow.length} plan now, {backlog.length} backlog.
            </p>
          </div>
          <button
            onClick={handleRestart}
            className="text-sm text-gray-500 hover:text-indigo-600 border border-gray-200 rounded-lg px-4 py-2 hover:border-indigo-300 transition-colors"
          >
            Start over
          </button>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-white border border-gray-200 rounded-xl p-5 text-center shadow-sm">
            <div className="text-3xl font-bold text-green-600">{quickWins.length}</div>
            <div className="text-sm text-gray-500 mt-1">Quick Wins</div>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-5 text-center shadow-sm">
            <div className="text-3xl font-bold text-blue-600">{planNow.length}</div>
            <div className="text-sm text-gray-500 mt-1">Plan Now</div>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-5 text-center shadow-sm">
            <div className="text-3xl font-bold text-gray-400">{backlog.length}</div>
            <div className="text-sm text-gray-500 mt-1">Backlog</div>
          </div>
        </div>

        <div className="space-y-8">
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Opportunity Matrix</h2>
            <ScoreMatrix results={scoredResults} />
          </div>

          <SummaryCard summary={summary} loading={summaryLoading} />

          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Prioritized Roadmap</h2>
            <RoadmapTable results={scoredResults} />
          </div>
        </div>

        <div className="mt-8 text-center">
          <button onClick={() => setStep(3)} className="text-sm text-gray-400 hover:text-gray-600 mr-6">← Back to readiness</button>
          <button
            onClick={handleRestart}
            className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-semibold text-sm hover:bg-indigo-700 transition-colors"
          >
            Run a new assessment
          </button>
        </div>
      </div>
    </div>
  )
}
