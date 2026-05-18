const API_KEY = import.meta.env.VITE_GEMINI_API_KEY
const BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent'

async function callGemini(prompt, timeoutMs = 20000, retries = 2) {
  if (!API_KEY) {
    console.error('[Gemini] No API key found — set VITE_GEMINI_API_KEY in .env')
    return null
  }
  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeoutMs)
    try {
      console.log(`[Gemini] Calling API (attempt ${attempt + 1})...`)
      const res = await fetch(`${BASE_URL}?key=${API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: 'application/json' },
        }),
      })
      clearTimeout(timer)
      if (res.status === 429) {
        const retryAfter = parseInt(res.headers.get('Retry-After') ?? '5', 10)
        const wait = (retryAfter || 5) * 1000
        console.warn(`[Gemini] Rate limited — waiting ${wait / 1000}s before retry`)
        if (attempt < retries) { await new Promise((r) => setTimeout(r, wait)); continue }
        return null
      }
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        console.error('[Gemini] API error', res.status, err)
        return null
      }
      const data = await res.json()
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text
      if (!text) { console.error('[Gemini] Empty response', data); return null }
      const parsed = JSON.parse(text)
      console.log('[Gemini] Response:', parsed)
      return parsed
    } catch (e) {
      clearTimeout(timer)
      console.error('[Gemini] Fetch error:', e)
      if (attempt < retries) { await new Promise((r) => setTimeout(r, 3000)); continue }
      return null
    }
  }
  return null
}

export async function generateSummary(scoredResults, orgContext) {
  const prompt = `You are a FinOps consulting expert. Based on the following assessment data, produce a JSON executive summary.

Org context: ${JSON.stringify(orgContext)}

Scored processes (sorted by priority): ${JSON.stringify(scoredResults)}

Return ONLY valid JSON with this exact shape:
{
  "executive_summary": "2-3 sentence paragraph",
  "quick_wins": [{"process": "label", "rationale": "one sentence", "effort": "S|M|L"}],
  "plan_now": [{"process": "label", "rationale": "one sentence", "effort": "S|M|L"}],
  "readiness_recommendations": ["one sentence recommendation", ...]
}

Include only quick_win and plan_now tier processes. Keep it concise and actionable.`

  const result = await callGemini(prompt)
  if (isValidSummary(result)) return { ...result, source: 'api' }
  return { ...buildFallbackSummary(scoredResults), source: 'fallback' }
}

function isValidSummary(obj) {
  return (
    obj &&
    typeof obj.executive_summary === 'string' &&
    Array.isArray(obj.quick_wins) &&
    Array.isArray(obj.plan_now) &&
    Array.isArray(obj.readiness_recommendations)
  )
}

function buildFallbackSummary(scoredResults) {
  const quickWins = scoredResults.filter((r) => r.tier === 'quick_win')
  const planNow = scoredResults.filter((r) => r.tier === 'plan_now')
  const topProcess = scoredResults[0]
  return {
    executive_summary: `Your assessment identified ${scoredResults.length} FinOps processes for potential automation, with ${quickWins.length} quick wins and ${planNow.length} near-term opportunities. ${topProcess ? `"${topProcess.label}" scored highest for automation priority based on value and feasibility.` : ''} Focusing on high-rule-clarity, high-volume processes first will deliver the fastest ROI.`,
    quick_wins: quickWins.map((r) => ({
      process: r.label,
      rationale: `High priority score (${(r.priorityScore * 100).toFixed(0)}/100) with ${r.effort === 'S' ? 'low' : r.effort === 'M' ? 'medium' : 'high'} implementation effort.`,
      effort: r.effort,
    })),
    plan_now: planNow.map((r) => ({
      process: r.label,
      rationale: `Solid automation candidate requiring structured implementation due to ${r.risk_level} risk level.`,
      effort: r.effort,
    })),
    readiness_recommendations: [
      'Improve data availability by centralizing cloud billing exports into a single data warehouse.',
      'Establish process documentation and ownership before automating high-risk workflows.',
      'Evaluate tooling gaps — consider a FinOps platform to accelerate implementation.',
    ],
  }
}

export async function parseDocument(extractedText, processLibrary) {
  const prompt = `You are a FinOps expert. Analyze the following document text and map its content to FinOps processes.

Document text (truncated to 4000 chars):
${extractedText}

Available processes:
${JSON.stringify(processLibrary.map((p) => ({ id: p.id, label: p.label })))}

For each process mentioned or implied in the document, return a JSON array with this shape:
[{
  "id": "process_id",
  "confidence": "high|inferred",
  "frequency": 1|2|3,
  "volume": 1|2|3,
  "rule_clarity": 1|2|3,
  "error_cost": 1|2|3,
  "input_consistency": 1|2|3
}]

Only include processes you can map to the document. Use "high" confidence when the document explicitly mentions the process, "inferred" when implied. You MUST return all five dimension scores for every process you include. Return ONLY valid JSON array.`

  const DIMS = ['frequency', 'volume', 'rule_clarity', 'error_cost', 'input_consistency']
  console.log('[parseDocument] Sending to Gemini, text length:', extractedText.length)
  const result = await callGemini(prompt)
  console.log('[parseDocument] Raw result:', result)
  if (!Array.isArray(result)) return []
  return result.map((p) => {
    const normalized = { ...p }
    DIMS.forEach((d) => {
      if (normalized[d] == null) normalized[d] = 2
    })
    return normalized
  })
}
