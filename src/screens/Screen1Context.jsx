import { useState } from 'react'
import { useApp } from '../context/AppContext'
import ProgressBar from '../components/ProgressBar'
import RadioGroup from '../components/RadioGroup'

const INDUSTRIES = [
  { value: 'fintech', label: 'FinTech' },
  { value: 'saas', label: 'SaaS' },
  { value: 'enterprise', label: 'Enterprise' },
  { value: 'ecommerce', label: 'E-Commerce' },
]

const SIZES = [
  { value: 'startup', label: 'Startup (<50)' },
  { value: 'midmarket', label: 'Mid-market (50–500)' },
  { value: 'enterprise', label: 'Enterprise (500+)' },
]

const DOMAINS = [
  { value: 'finops', label: 'FinOps / Cloud Finance' },
  { value: 'devops', label: 'DevOps / Platform' },
  { value: 'finance', label: 'Corporate Finance' },
  { value: 'engineering', label: 'Engineering Leadership' },
]

const CLOUDS = [
  { value: 'aws', label: 'AWS' },
  { value: 'gcp', label: 'GCP' },
  { value: 'azure', label: 'Azure' },
  { value: 'multi', label: 'Multi-cloud' },
]

const PAIN_POINTS = [
  { value: 'cost_visibility', label: 'Cost visibility' },
  { value: 'waste_reduction', label: 'Waste reduction' },
  { value: 'forecasting', label: 'Forecasting accuracy' },
  { value: 'chargeback', label: 'Chargeback / showback' },
]

const RISK_TOLERANCE = [
  { value: 'conservative', label: 'Conservative' },
  { value: 'moderate', label: 'Moderate' },
  { value: 'aggressive', label: 'Aggressive' },
]

const QUESTIONS = [
  { key: 'industry', label: 'What industry are you in?', options: INDUSTRIES },
  { key: 'size', label: 'Company size?', options: SIZES },
  { key: 'domain', label: 'Your primary domain?', options: DOMAINS },
  { key: 'cloud', label: 'Primary cloud platform?', options: CLOUDS },
  { key: 'pain_point', label: 'Biggest FinOps pain point?', options: PAIN_POINTS },
  { key: 'risk_tolerance', label: 'Your organization\'s risk tolerance for automation?', options: RISK_TOLERANCE },
]

export default function Screen1Context() {
  const { setOrgContext, setStep } = useApp()
  const [answers, setAnswers] = useState({})

  const allAnswered = QUESTIONS.every((q) => answers[q.key] != null)

  function handleNext() {
    setOrgContext(answers)
    setStep(2)
  }

  return (
    <div className="min-h-screen bg-white flex">
      {/* Sidebar */}
      <aside className="w-56 shrink-0 border-r border-gray-100 px-6 py-10 sticky top-0 h-screen overflow-y-auto">
        <ProgressBar step={1} />
      </aside>

      {/* Main */}
      <main className="flex-1 px-12 py-10">
        <div className="max-w-xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-1">Organizational Context</h1>
          <p className="text-sm text-gray-400 mb-10">Help us understand your environment so we can tailor recommendations.</p>

          <div className="space-y-8">
            {QUESTIONS.map((q) => (
              <div key={q.key}>
                <p className="text-sm font-semibold text-gray-700 mb-3">{q.label}</p>
                <RadioGroup
                  name={q.key}
                  options={q.options}
                  value={answers[q.key]}
                  onChange={(val) => setAnswers((prev) => ({ ...prev, [q.key]: val }))}
                />
              </div>
            ))}
          </div>

          <div className="mt-10 pt-8 border-t border-gray-100 flex justify-end">
            <button
              onClick={handleNext}
              disabled={!allAnswered}
              className="px-6 py-3 bg-sage-600 text-white rounded-xl font-semibold text-sm hover:bg-sage-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Next: Process Survey →
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}
