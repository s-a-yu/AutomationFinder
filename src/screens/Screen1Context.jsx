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
    <div className="min-h-screen bg-gray-50 px-8 py-10">
      <div className="max-w-3xl mx-auto">
        <ProgressBar step={1} />
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Organizational Context</h1>
          <p className="text-gray-500 mt-2">Help us understand your environment so we can tailor recommendations.</p>
        </div>
        <div className="space-y-8 bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
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
        <div className="mt-6 flex justify-end">
          <button
            onClick={handleNext}
            disabled={!allAnswered}
            className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-semibold text-sm hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Next: Process Survey →
          </button>
        </div>
      </div>
    </div>
  )
}
