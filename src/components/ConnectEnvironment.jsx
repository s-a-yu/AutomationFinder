import { useState, useRef, useEffect } from 'react'
import { scanEnvironment } from '../lib/connectorClient'
import { MOCK_SCANS } from '../data/mockConnectorData'

const PROVIDERS = {
  aws:   { label: 'AWS',   badgeCls: 'bg-orange-50 text-orange-700 border-orange-200' },
  azure: { label: 'Azure', badgeCls: 'bg-blue-50 text-blue-700 border-blue-200' },
  gcp:   { label: 'GCP',   badgeCls: 'bg-red-50 text-red-600 border-red-200' },
}

const CREDENTIAL_FIELDS = {
  aws: [
    { key: 'roleArn', label: 'Read-only Role ARN', placeholder: 'arn:aws:iam::123456789012:role/AutomationFinderReadOnly' },
    {
      key: 'region', label: 'Region', type: 'select',
      options: ['us-east-1', 'us-west-2', 'eu-west-1', 'ap-southeast-1', 'ap-northeast-1'],
    },
  ],
  azure: [
    { key: 'subscriptionId', label: 'Subscription ID', placeholder: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx' },
    { key: 'tenantId',       label: 'Tenant ID',        placeholder: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx' },
  ],
  gcp: [
    { key: 'projectId', label: 'Project ID', placeholder: 'my-gcp-project-id' },
  ],
}

const PERMISSION_NOTES = {
  aws:   'Requires Cost Explorer:Read, CloudTrail:LookupEvents, Config:Describe, and TrustedAdvisor:Describe. No write access.',
  azure: 'Requires Cost Management Reader and Reader roles on the target subscription. No write access.',
  gcp:   'Requires Billing Account Viewer and Cloud Asset Viewer roles. No write access.',
}

const READINESS_LABELS = {
  data_availability: 'Data availability',
  process_maturity:  'Process maturity',
  tooling:           'Tooling',
  risk_compliance:   'Compliance',
}

const DOT = { 1: '●○○', 2: '●●○', 3: '●●●' }

export default function ConnectEnvironment({ onConnected }) {
  const [stage, setStage] = useState('idle')     // idle | credentials | scanning | connected
  const [provider, setProvider] = useState(null)
  const [revealedCount, setRevealedCount] = useState(0)
  const [scanResult, setScanResult] = useState(null)
  const intervalRef = useRef(null)

  useEffect(() => () => clearInterval(intervalRef.current), [])

  function handleSelectProvider(p) {
    setProvider(p)
    setStage('credentials')
  }

  async function handleScan() {
    setStage('scanning')
    setRevealedCount(0)

    const scan = MOCK_SCANS[provider]
    const intervalMs = Math.floor(scan.scanDuration / (scan.signals.length + 1))

    let count = 0
    intervalRef.current = setInterval(() => {
      count++
      setRevealedCount(count)
      if (count >= scan.signals.length) clearInterval(intervalRef.current)
    }, intervalMs)

    const result = await scanEnvironment(provider)
    clearInterval(intervalRef.current)
    setRevealedCount(scan.signals.length)
    setScanResult(result)
    setTimeout(() => setStage('connected'), 500)
  }

  function handleReset() {
    clearInterval(intervalRef.current)
    setScanResult(null)
    setProvider(null)
    setRevealedCount(0)
    setStage('idle')
  }

  // ── Idle ──────────────────────────────────────────────────────────────────
  if (stage === 'idle') {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-5 mb-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-sm font-semibold text-gray-700">Connect your cloud environment</p>
            <p className="text-xs text-gray-400 mt-0.5">
              Auto-detect FinOps processes and readiness signals from live billing data.
            </p>
          </div>
          <span className="text-xs bg-sage-50 text-sage-600 border border-sage-100 px-2 py-0.5 rounded-full font-medium">
            Preview
          </span>
        </div>
        <div className="flex gap-3">
          {Object.entries(PROVIDERS).map(([key, p]) => (
            <button
              key={key}
              onClick={() => handleSelectProvider(key)}
              className={`flex-1 py-2.5 text-sm font-semibold border rounded-lg transition-all hover:shadow-sm ${p.badgeCls}`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>
    )
  }

  // ── Credentials ───────────────────────────────────────────────────────────
  if (stage === 'credentials') {
    const fields = CREDENTIAL_FIELDS[provider] ?? []
    const p = PROVIDERS[provider]
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-5 mb-6">
        <button onClick={() => setStage('idle')} className="text-xs text-gray-400 hover:text-gray-600 mb-3 flex items-center gap-1">
          ← Back
        </button>
        <div className="flex items-center gap-2 mb-4">
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${p.badgeCls}`}>{p.label}</span>
          <p className="text-sm font-semibold text-gray-700">Connection</p>
        </div>
        <div className="space-y-3 mb-4">
          {fields.map((f) => (
            <div key={f.key}>
              <label className="block text-xs font-medium text-gray-600 mb-1">{f.label}</label>
              {f.type === 'select' ? (
                <select className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 text-gray-700 bg-white focus:outline-none focus:border-sage-300">
                  {f.options.map((o) => <option key={o}>{o}</option>)}
                </select>
              ) : (
                <input
                  type="text"
                  placeholder={f.placeholder}
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 bg-gray-50 text-gray-700 placeholder:text-gray-300 focus:outline-none focus:border-sage-300"
                />
              )}
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-400 italic mb-5">{PERMISSION_NOTES[provider]}</p>
        <div className="flex items-center justify-between">
          <button onClick={() => setStage('idle')} className="text-sm text-gray-400 hover:text-gray-600">
            Cancel
          </button>
          <button
            onClick={handleScan}
            className="px-5 py-2 bg-sage-600 text-white text-sm font-semibold rounded-lg hover:bg-sage-700 transition-colors"
          >
            Connect &amp; Scan →
          </button>
        </div>
      </div>
    )
  }

  // ── Scanning ──────────────────────────────────────────────────────────────
  if (stage === 'scanning') {
    const scan = MOCK_SCANS[provider]
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-5 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <span className="w-2 h-2 rounded-full bg-sage-500 animate-pulse flex-shrink-0" />
          <p className="text-sm font-semibold text-gray-700">
            Scanning your {PROVIDERS[provider].label} environment…
          </p>
        </div>
        <div className="space-y-2">
          {scan.signals.slice(0, revealedCount).map((s, i) => (
            <div key={i} className="flex items-start gap-2 text-xs text-gray-600">
              <span className="text-green-500 flex-shrink-0 mt-px">✓</span>
              {s}
            </div>
          ))}
          {revealedCount < scan.signals.length && (
            <div className="flex items-start gap-2 text-xs text-gray-400">
              <span className="flex-shrink-0 mt-px animate-spin inline-block">⟳</span>
              {scan.signals[revealedCount]}
            </div>
          )}
        </div>
      </div>
    )
  }

  // ── Connected ─────────────────────────────────────────────────────────────
  if (stage === 'connected' && scanResult) {
    const highConf = scanResult.detectedProcesses.filter((p) => p.confidence === 'high').length
    return (
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 mb-6">
        <div className="flex items-start justify-between mb-3">
          <div>
            <p className="text-sm font-semibold text-emerald-800">
              ✓ {PROVIDERS[provider].label} environment scanned
            </p>
            <p className="text-xs text-emerald-600 mt-0.5">
              {scanResult.detectedProcesses.length} processes detected · {highConf} high confidence
            </p>
          </div>
          <button onClick={handleReset} className="text-xs text-emerald-500 hover:text-emerald-700">
            Disconnect
          </button>
        </div>

        <div className="grid grid-cols-2 gap-x-8 gap-y-1.5 mb-4">
          {Object.entries(READINESS_LABELS).map(([key, label]) => (
            <div key={key} className="flex items-center justify-between text-xs">
              <span className="text-emerald-700">{label}</span>
              <span className="font-mono text-emerald-500">{DOT[scanResult.readinessSignals[key]]}</span>
            </div>
          ))}
        </div>

        <p className="text-xs text-emerald-600 mb-3">
          Processes and readiness check will be pre-filled below.
        </p>
        <button
          onClick={() => onConnected(scanResult)}
          className="w-full py-2 bg-emerald-600 text-white text-sm font-semibold rounded-lg hover:bg-emerald-700 transition-colors"
        >
          Apply to survey →
        </button>
      </div>
    )
  }

  return null
}
