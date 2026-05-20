import { useApp } from '../context/AppContext'

const FEATURES = [
  {
    icon: '⬡',
    title: '12 FinOps Processes',
    body: 'Covers the full FinOps Foundation capability set — from cost allocation and anomaly detection to commitment management and policy enforcement.',
  },
  {
    icon: '◈',
    title: 'Scored Against Your Context',
    body: 'Every process is ranked using a weighted model that accounts for your cloud platform, team maturity, data readiness, and risk tolerance.',
  },
  {
    icon: '◎',
    title: 'Execution-Ready Roadmap',
    body: 'AI-generated implementation plans name the specific tools, phases, and tasks your team can follow — with net-new cost estimates built in.',
  },
]

export default function ScreenLanding() {
  const { setStep } = useApp()

  return (
    <div className="min-h-screen bg-white flex flex-col">

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-8 py-24 text-center">
        <div className="max-w-2xl mx-auto">
          <p className="text-xs font-semibold text-sage-600 uppercase tracking-widest mb-5">AI Automation Discovery</p>
          <h1 className="text-5xl font-bold text-gray-900 leading-tight tracking-tight mb-6">
            Find Your Best FinOps<br />Automation Opportunities
          </h1>
          <p className="text-lg text-gray-500 leading-relaxed mb-10 max-w-xl mx-auto">
            A structured assessment that scores your cloud cost processes against your organization's readiness and delivers a prioritized roadmap with implementation plans ready to execute.
          </p>
          <button
            onClick={() => setStep(1)}
            className="inline-flex items-center gap-2 px-8 py-4 bg-sage-600 text-white font-semibold rounded-xl hover:bg-sage-700 active:scale-95 transition-all shadow-md shadow-sage-200 text-base"
          >
            Start Assessment
            <span className="text-sage-200">→</span>
          </button>
          <p className="text-xs text-gray-400 mt-4">
            Takes ~10 minutes &nbsp;·&nbsp; No account required
          </p>
        </div>
      </main>

      {/* Feature strip */}
      <section className="border-t border-gray-100 bg-gray-50 px-8 py-12">
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          {FEATURES.map((f) => (
            <div key={f.title} className="flex flex-col gap-3">
              <span className="text-sage-500 text-xl">{f.icon}</span>
              <h3 className="text-sm font-semibold text-gray-800">{f.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{f.body}</p>
            </div>
          ))}
        </div>
      </section>


</div>
  )
}
