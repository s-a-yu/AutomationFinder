import { useRef, useState } from 'react'
import { useApp } from '../context/AppContext'
import ProgressBar from '../components/ProgressBar'
import ProcessCard from '../components/ProcessCard'
import ConnectEnvironment from '../components/ConnectEnvironment'
import processLibrary from '../data/processLibrary.json'
import { parseDocument } from '../lib/aiClient'
import * as mammoth from 'mammoth'

const DIMENSIONS = ['frequency', 'volume', 'rule_clarity', 'error_cost', 'input_consistency']

async function extractText(file) {
  if (file.type === 'text/plain') {
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = (e) => resolve(e.target.result.slice(0, 4000))
      reader.readAsText(file)
    })
  }
  if (file.name.endsWith('.docx')) {
    const buf = await file.arrayBuffer()
    const { value } = await mammoth.extractRawText({ arrayBuffer: buf })
    return value.slice(0, 4000)
  }
  if (file.type === 'application/pdf') {
    const pdfjsLib = await import('pdfjs-dist')
    pdfjsLib.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).href
    const buf = await file.arrayBuffer()
    const pdf = await pdfjsLib.getDocument({ data: buf }).promise
    let text = ''
    for (let i = 1; i <= pdf.numPages && text.length < 4000; i++) {
      const page = await pdf.getPage(i)
      const content = await page.getTextContent()
      text += content.items.map((s) => s.str).join(' ') + '\n'
    }
    return text.slice(0, 8000)
  }
  return ''
}

export default function Screen2Processes() {
  const { selectedProcesses, setSelectedProcesses, processAnswers, updateProcessAnswer, updateReadinessAnswer, setConnectionSource, setStep } = useApp()
  const [prefillMap, setPrefillMap] = useState({})
  const [userEditedMap, setUserEditedMap] = useState({})
  const [uploadState, setUploadState] = useState('idle') // idle | loading | done | error
  const fileRef = useRef()

  function handleAnswer(processId, dim, val) {
    updateProcessAnswer(processId, dim, val)
    setUserEditedMap((prev) => ({
      ...prev,
      [processId]: [...new Set([...(prev[processId] ?? []), dim])],
    }))
  }

  const readyCount = selectedProcesses.filter((id) =>
    DIMENSIONS.every((d) => processAnswers[id]?.[d] != null)
  ).length

  const canProceed = selectedProcesses.length > 0 && readyCount === selectedProcesses.length

  function toggleProcess(id) {
    setSelectedProcesses((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  function handleConnected(scan) {
    const newSelected = [...new Set([...selectedProcesses, ...scan.detectedProcesses.map((p) => p.id)])]
    setSelectedProcesses(newSelected)

    const newPrefill = {}
    scan.detectedProcesses.forEach((p) => {
      newPrefill[p.id] = { confidence: p.confidence, dims: DIMENSIONS.filter((d) => p[d] != null) }
      DIMENSIONS.forEach((d) => { if (p[d] != null) updateProcessAnswer(p.id, d, p[d]) })
    })
    setPrefillMap((prev) => ({ ...prev, ...newPrefill }))

    Object.entries(scan.readinessSignals).forEach(([dim, val]) => updateReadinessAnswer(dim, val))
    setConnectionSource({ provider: scan.provider })
  }

  async function handleUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadState('loading')
    try {
      const text = await extractText(file)
      if (!text) { setUploadState('error'); return }
      const parsed = await parseDocument(text, processLibrary)
      if (!parsed.length) { setUploadState('done'); return }

      const newSelected = [...new Set([...selectedProcesses, ...parsed.map((p) => p.id)])]
      setSelectedProcesses(newSelected)

      const newPrefill = {}
      parsed.forEach((p) => {
        newPrefill[p.id] = { confidence: p.confidence, dims: DIMENSIONS.filter((d) => p[d] != null) }
        DIMENSIONS.forEach((d) => {
          if (p[d] != null) updateProcessAnswer(p.id, d, p[d])
        })
      })
      setPrefillMap((prev) => ({ ...prev, ...newPrefill }))
      setUploadState('done')
    } catch {
      setUploadState('error')
    }
  }

  return (
    <div className="min-h-screen bg-white flex">
      {/* Sidebar */}
      <aside className="w-56 shrink-0 border-r border-gray-100 px-6 py-10 sticky top-0 h-screen overflow-y-auto">
        <ProgressBar step={2} />
      </aside>

      {/* Main */}
      <main className="flex-1 px-12 py-10">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-1">Process Survey</h1>
          <p className="text-sm text-gray-400 mb-8">Select the FinOps processes your team handles and rate each on five dimensions.</p>

          <ConnectEnvironment onConnected={handleConnected} />

          {/* Upload section */}
          <div className="border border-dashed border-gray-200 rounded-xl p-5 mb-6 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-gray-700">Optional: Upload a process document</p>
              <p className="text-xs text-gray-400 mt-0.5">PDF, DOCX, or TXT — AI will pre-fill the checklist from your document.</p>
            </div>
            <div className="flex items-center gap-3">
              {uploadState === 'loading' && <span className="text-xs text-sage-600 animate-pulse">Analyzing…</span>}
              {uploadState === 'done' && <span className="text-xs text-green-600">✓ Pre-filled</span>}
              {uploadState === 'error' && <span className="text-xs text-red-500">Upload failed</span>}
              <button
                onClick={() => fileRef.current?.click()}
                disabled={uploadState === 'loading'}
                className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:border-sage-400 hover:text-sage-600 transition-colors disabled:opacity-50"
              >
                Choose file
              </button>
              <input ref={fileRef} type="file" accept=".pdf,.docx,.txt" className="hidden" onChange={handleUpload} />
            </div>
          </div>

          <div className="space-y-3">
            {processLibrary.map((process) => (
              <ProcessCard
                key={process.id}
                process={process}
                checked={selectedProcesses.includes(process.id)}
                onCheck={toggleProcess}
                answers={processAnswers[process.id]}
                onAnswer={handleAnswer}
                prefilled={prefillMap[process.id]?.dims}
                userEdited={userEditedMap[process.id] ?? []}
              />
            ))}
          </div>

          <div className="mt-8 pt-8 border-t border-gray-100 flex items-center justify-between">
            <button onClick={() => setStep(1)} className="text-sm text-gray-400 hover:text-gray-600 transition-colors">← Back</button>
            <div className="flex items-center gap-4">
              {selectedProcesses.length > 0 && (
                <span className="text-xs text-gray-400">
                  {readyCount}/{selectedProcesses.length} processes fully scored
                </span>
              )}
              <button
                onClick={() => setStep(3)}
                disabled={!canProceed}
                className="px-6 py-3 bg-sage-600 text-white rounded-xl font-semibold text-sm hover:bg-sage-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Next: Readiness Check →
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
