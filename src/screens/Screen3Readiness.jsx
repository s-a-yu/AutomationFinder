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
    <div className="min-h-screen bg-gray-50 px-8 py-10">
      <div className="max-w-3xl mx-auto">
        <ProgressBar step={3} />
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Readiness Check</h1>
          <p className="text-gray-500 mt-2">Four questions that determine your organization's automation readiness across all selected processes.</p>
        </div>
        <div className="space-y-8 bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
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
        <div className="mt-6 flex items-center justify-between">
          <button onClick={() => setStep(2)} className="text-sm text-gray-500 hover:text-gray-700">← Back</button>
          <button
            onClick={handleNext}
            disabled={!allAnswered}
            className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-semibold text-sm hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            See Results →
          </button>
        </div>
      </div>
    </div>
  )
}
