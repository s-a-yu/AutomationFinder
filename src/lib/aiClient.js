const API_KEY = import.meta.env.VITE_GROQ_API_KEY
const BASE_URL = 'https://api.groq.com/openai/v1/chat/completions'
const MODEL = 'llama-3.3-70b-versatile'

async function callGroq(prompt, timeoutMs = 20000, retries = 2) {
  if (!API_KEY) {
    console.error('[Groq] No API key found — set VITE_GROQ_API_KEY in .env')
    return null
  }
  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeoutMs)
    try {
      console.log(`[Groq] Calling API (attempt ${attempt + 1})...`)
      const res = await fetch(BASE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_KEY}`,
        },
        signal: controller.signal,
        body: JSON.stringify({
          model: MODEL,
          messages: [{ role: 'user', content: prompt }],
          response_format: { type: 'json_object' },
          temperature: 0.2,
        }),
      })
      clearTimeout(timer)
      if (res.status === 429) {
        const retryAfter = parseInt(res.headers.get('Retry-After') ?? '5', 10)
        const wait = (retryAfter || 5) * 1000
        console.warn(`[Groq] Rate limited — waiting ${wait / 1000}s before retry`)
        if (attempt < retries) { await new Promise((r) => setTimeout(r, wait)); continue }
        return null
      }
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        console.error('[Groq] API error', res.status, err)
        return null
      }
      const data = await res.json()
      const text = data?.choices?.[0]?.message?.content
      if (!text) { console.error('[Groq] Empty response', data); return null }
      const parsed = JSON.parse(text)
      console.log('[Groq] Response:', parsed)
      return parsed
    } catch (e) {
      clearTimeout(timer)
      console.error('[Groq] Fetch error:', e)
      if (attempt < retries) { await new Promise((r) => setTimeout(r, 3000)); continue }
      return null
    }
  }
  return null
}

export async function generateSummary(scoredResults, orgContext) {
  const prompt = `You are a FinOps consulting expert. Based on the following assessment data, produce a JSON executive summary.

Org context (includes existing tools, cloud providers, and platforms the client already uses):
${JSON.stringify(orgContext)}

Scored processes (sorted by priority): ${JSON.stringify(scoredResults)}

Return ONLY valid JSON with this exact shape:
{
  "executive_summary": "2-3 sentence paragraph",
  "quick_wins": [{
    "process": "label",
    "rationale": "one sentence",
    "effort": "S|M|L",
    "industry_standards": [
      "Relevant FinOps Foundation framework capability or industry best practice for this specific process"
    ],
    "recommended_tools": [
      {
        "name": "Tool or platform name",
        "license": "Open Source|Commercial|Freemium",
        "notes": "One sentence on why it fits this process and the client's stack"
      }
    ],
    "cost_estimate": {
      "implementation": "$X,000–$X,000 one-time",
      "licensing": "$X/month or Free/Open Source",
      "notes": "One sentence of cost context based on org size and effort"
    },
    "action_steps": [
      {"phase": "Phase 1: Discovery & Design", "duration": "1-2 weeks", "tasks": ["task", "task", "task"]},
      {"phase": "Phase 2: Build & Test", "duration": "2-3 weeks", "tasks": ["task", "task", "task"]},
      {"phase": "Phase 3: Deploy & Monitor", "duration": "1 week", "tasks": ["task", "task"]}
    ],
    "success_metrics": ["metric", "metric"]
  }],
  "plan_now": [{
    "process": "label",
    "rationale": "one sentence",
    "effort": "S|M|L",
    "industry_standards": [
      "Relevant FinOps Foundation framework capability or industry best practice for this specific process"
    ],
    "recommended_tools": [
      {
        "name": "Tool or platform name",
        "license": "Open Source|Commercial|Freemium",
        "notes": "One sentence on why it fits this process and the client's stack"
      }
    ],
    "cost_estimate": {
      "implementation": "$X,000–$X,000 one-time",
      "licensing": "$X/month or Free/Open Source",
      "notes": "One sentence of cost context based on org size and effort"
    },
    "action_steps": [
      {"phase": "Phase 1: Assessment", "duration": "2 weeks", "tasks": ["task", "task", "task"]},
      {"phase": "Phase 2: Design & Pilot", "duration": "3-4 weeks", "tasks": ["task", "task", "task"]},
      {"phase": "Phase 3: Build & Harden", "duration": "3-4 weeks", "tasks": ["task", "task", "task"]},
      {"phase": "Phase 4: Rollout", "duration": "2 weeks", "tasks": ["task", "task"]}
    ],
    "success_metrics": ["metric", "metric", "metric"]
  }],
  "readiness_recommendations": ["one sentence recommendation", ...]
}

Guidelines:
- industry_standards: cite FinOps Foundation capabilities (e.g. "FinOps Foundation: Cost Allocation"), CNCF practices, or cloud-provider best practices. Include 2-3 per process.
- recommended_tools: prefer tools compatible with the client's existing stack from org context. Include 3-5 tools per process covering automation, monitoring, and integration. Prioritize tools the client already uses before suggesting new ones. Label license type accurately.
- cost_estimate: provide realistic ranges reflecting the org size implied by org context, the effort tier (S/M/L), and the specific tools recommended. Implementation covers setup/development labor; licensing covers ongoing tool costs.
- Include only quick_win and plan_now tier processes. Make action steps specific to the FinOps process named. Keep tasks concrete and actionable.`

  const result = await callGroq(prompt)
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

const DEFAULT_INDUSTRY_STANDARDS = [
  'FinOps Foundation: Cost Allocation capability',
  'FinOps Foundation: Anomaly Detection best practice',
  'CNCF FinOps: Cloud bill normalization and tagging governance',
]

const DEFAULT_TOOLS = [
  { name: 'Terraform', license: 'Open Source', notes: 'Infrastructure-as-code for automating cloud resource provisioning and tagging.' },
  { name: 'Apptio Cloudability', license: 'Commercial', notes: 'Purpose-built FinOps platform for cost visibility and chargeback workflows.' },
  { name: 'AWS Cost Explorer / Azure Cost Management', license: 'Freemium', notes: 'Native cloud cost tooling; leverage existing entitlements before adding third-party tooling.' },
]

const DEFAULT_COST = {
  S: { implementation: '$2,000–$8,000 one-time', licensing: 'Free–$500/month', notes: 'Low-effort automation typically leverages existing tooling with minimal net-new licensing.' },
  M: { implementation: '$10,000–$30,000 one-time', licensing: '$500–$2,000/month', notes: 'Includes integration work and likely one commercial platform; ranges depend on headcount and existing tool coverage.' },
  L: { implementation: '$40,000–$120,000 one-time', licensing: '$2,000–$6,000/month', notes: 'Enterprise-scale implementation with platform licensing, change management, and multi-team rollout.' },
}

const DEFAULT_STEPS = {
  S: [
    { phase: 'Phase 1: Discovery & Design', duration: '1 week', tasks: ['Document current process inputs, outputs, and rules', 'Identify automation trigger conditions', 'Define success metrics and acceptance criteria'] },
    { phase: 'Phase 2: Build & Test', duration: '1-2 weeks', tasks: ['Configure tooling and build automation logic', 'Run parallel with manual process using historical data', 'Validate outputs against manual baseline'] },
    { phase: 'Phase 3: Deploy & Monitor', duration: '1 week', tasks: ['Deploy to production with rollback plan', 'Set up alerting for failures or anomalies', 'Document process and hand off to team'] },
  ],
  M: [
    { phase: 'Phase 1: Discovery & Design', duration: '1-2 weeks', tasks: ['Map current process and identify bottlenecks', 'Audit data sources and quality', 'Design automation architecture and select tooling'] },
    { phase: 'Phase 2: Pilot Build', duration: '2-3 weeks', tasks: ['Build MVP automation for highest-volume use case', 'Run pilot in parallel with manual process', 'Gather feedback from process owners and iterate'] },
    { phase: 'Phase 3: Hardening', duration: '1-2 weeks', tasks: ['Add error handling, logging, and alerting', 'Complete end-to-end testing and QA sign-off', 'Write runbook and operator documentation'] },
    { phase: 'Phase 4: Rollout', duration: '1 week', tasks: ['Phased rollout to production', 'Monitor KPIs and tune thresholds', 'Decommission manual process steps'] },
  ],
  L: [
    { phase: 'Phase 1: Assessment', duration: '2-3 weeks', tasks: ['Stakeholder interviews and current-state process mapping', 'Data quality audit across all source systems', 'Tool evaluation and vendor selection'] },
    { phase: 'Phase 2: Design', duration: '2-3 weeks', tasks: ['Define target-state architecture and integration points', 'Create technical specification and get stakeholder sign-off', 'Establish governance model and change-management plan'] },
    { phase: 'Phase 3: Build & Pilot', duration: '4-6 weeks', tasks: ['Build core automation with integrations', 'Run controlled pilot with limited scope', 'Iterate based on pilot findings'] },
    { phase: 'Phase 4: Rollout & Optimize', duration: '3-4 weeks', tasks: ['Phased production rollout by team or region', 'Performance monitoring, tuning, and cost validation', 'Team training, documentation, and ongoing governance'] },
  ],
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
      industry_standards: DEFAULT_INDUSTRY_STANDARDS,
      recommended_tools: DEFAULT_TOOLS,
      cost_estimate: DEFAULT_COST[r.effort] ?? DEFAULT_COST.M,
      action_steps: DEFAULT_STEPS[r.effort] ?? DEFAULT_STEPS.M,
      success_metrics: ['Time saved per month vs. manual baseline', 'Error rate reduction vs. prior quarter', 'Process cycle time improvement'],
    })),
    plan_now: planNow.map((r) => ({
      process: r.label,
      rationale: `Solid automation candidate requiring structured implementation due to ${r.risk_level} risk level.`,
      effort: r.effort,
      industry_standards: DEFAULT_INDUSTRY_STANDARDS,
      recommended_tools: DEFAULT_TOOLS,
      cost_estimate: DEFAULT_COST[r.effort] ?? DEFAULT_COST.M,
      action_steps: DEFAULT_STEPS[r.effort] ?? DEFAULT_STEPS.M,
      success_metrics: ['Time saved per month vs. manual baseline', 'Error rate reduction vs. prior quarter', 'Stakeholder satisfaction score'],
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

Return a JSON object with a single key "processes" containing an array. For each process mentioned or implied in the document include:
{
  "processes": [{
    "id": "process_id",
    "confidence": "high|inferred",
    "frequency": 1|2|3,
    "volume": 1|2|3,
    "rule_clarity": 1|2|3,
    "error_cost": 1|2|3,
    "input_consistency": 1|2|3
  }]
}

Use "high" confidence when the document explicitly mentions the process, "inferred" when implied. You MUST return all five dimension scores for every process you include. Only include processes you can map to the document.`

  const DIMS = ['frequency', 'volume', 'rule_clarity', 'error_cost', 'input_consistency']
  console.log('[parseDocument] Sending to Groq, text length:', extractedText.length)
  const result = await callGroq(prompt)
  console.log('[parseDocument] Raw result:', result)
  const list = result?.processes ?? (Array.isArray(result) ? result : [])
  if (!list.length) return []
  return list.map((p) => {
    const normalized = { ...p }
    DIMS.forEach((d) => { if (normalized[d] == null) normalized[d] = 2 })
    return normalized
  })
}
