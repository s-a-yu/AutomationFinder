import { useApp } from '../context/AppContext'
import ProgressBar from '../components/ProgressBar'
import RadioGroup from '../components/RadioGroup'
import { scoreAll } from '../lib/scoringEngine'
import { generateSummary } from '../lib/aiClient'

const QUESTIONS = [
  {
    key: 'data_availability',
    label: 'How available and accessible is your cloud cost data?',
    options: [
      { value: 1, label: 'Fragmented' },
      { value: 2, label: 'Centralized but manual' },
      { value: 3, label: 'Automated pipelines' },
    ],
  },
  {
    key: 'process_maturity',
    label: 'How mature and documented are your current FinOps processes?',
    options: [
      { value: 1, label: 'Ad hoc' },
      { value: 2, label: 'Partially documented' },
      { value: 3, label: 'Well documented' },
    ],
  },
  {
    key: 'tooling',
    label: 'What is your current FinOps tooling maturity?',
    options: [
      { value: 1, label: 'Spreadsheets only' },
      { value: 2, label: 'Some tools' },
      { value: 3, label: 'Integrated platform' },
    ],
  },
  {
    key: 'risk_compliance',
    label: 'How strict are your compliance and change-management requirements?',
    options: [
      { value: 1, label: 'Very flexible' },
      { value: 2, label: 'Moderate controls' },
      { value: 3, label: 'Strict / regulated' },
    ],
  },
]

export default function Screen3Readiness() {
  const {
    readinessAnswers, updateReadinessAnswer,
    setStep, selectedProcesses, processAnswers, orgContext,
    setScoredResults, setSummary, setSummaryLoading,
    connectionSource,
  } = useApp()

  const allAnswered = QUESTIONS.every((q) => readinessAnswers[q.key] != null)

  async function handleNext() {
    const results = scoreAll(selectedProcesses, processAnswers, readinessAnswers, orgContext.risk_tolerance)
    setScoredResults(results)
    setStep(4)
    setSummaryLoading(true)
    const summary = await generateSummary(results, orgContext)
    setSummary(summary)
    setSummaryLoading(false)
  }

  return (
    <div className="min-h-screen bg-white flex">
      {/* Sidebar */}
      <aside className="w-56 shrink-0 border-r border-gray-100 px-6 py-10 sticky top-0 h-screen overflow-y-auto">
        <ProgressBar step={3} />
      </aside>

      {/* Main */}
      <main className="flex-1 px-12 py-10">
        <div className="max-w-xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-1">Readiness Check</h1>
          <p className="text-sm text-gray-400 mb-8">Four questions that determine your organization's automation readiness across all selected processes.</p>

          {connectionSource && (
            <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 mb-6 text-sm text-emerald-700">
              <span className="flex-shrink-0">✓</span>
              <span>
                Readiness signals pre-filled from your <strong>{connectionSource.provider}</strong> environment scan.
                You can adjust any answer below.
              </span>
            </div>
          )}

          <div className="space-y-8">
            {QUESTIONS.map((q) => (
              <div key={q.key}>
                <p className="text-sm font-semibold text-gray-700 mb-3">{q.label}</p>
                <RadioGroup
                  name={q.key}
                  options={q.options}
                  value={readinessAnswers[q.key]}
                  onChange={(val) => updateReadinessAnswer(q.key, val)}
                />
              </div>
            ))}
          </div>

          <div className="mt-10 pt-8 border-t border-gray-100 flex items-center justify-between">
            <button onClick={() => setStep(2)} className="text-sm text-gray-400 hover:text-gray-600 transition-colors">← Back</button>
            <button
              onClick={handleNext}
              disabled={!allAnswered}
              className="px-6 py-3 bg-sage-600 text-white rounded-xl font-semibold text-sm hover:bg-sage-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              See Results →
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}
