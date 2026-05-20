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
  const prompt = `You are a senior FinOps consultant writing a delivery plan for a paying client. Based on the assessment data below, produce a JSON report. Every field must be specific to this client — generic filler is not acceptable.

Client org context (cloud platform, existing tools, team size, industry, risk tolerance):
${JSON.stringify(orgContext)}

Scored FinOps processes (sorted by priority, includes effort and risk level):
${JSON.stringify(scoredResults)}

Return ONLY valid JSON matching this exact shape:
{
  "executive_summary": "2-3 sentence paragraph referencing the client's specific cloud platform and top-priority process",
  "quick_wins": [{
    "process": "exact process label from scored list",
    "rationale": "one sentence citing the specific scores and why this is a quick win for this client",
    "effort": "S|M|L",
    "value_proposition": {
      "headline": "One sentence — the core business case for automating this specific process for this client",
      "benefits": [
        "Concrete, specific benefit quantifying time or cost impact where possible (e.g. 'Eliminates ~6 hrs/month of manual tagging audits across 3 cloud accounts')",
        "A second specific improvement this automation delivers over the current manual approach",
        "A third benefit — risk reduction, visibility gain, or downstream process improvement"
      ]
    },
    "industry_standards": [
      "FinOps Foundation capability name or CNCF/cloud-provider best practice — specific to this process"
    ],
    "recommended_tools": [
      {
        "name": "Specific tool name",
        "license": "Open Source|Commercial|Freemium",
        "notes": "One sentence on fit: why this tool for this process given the client's existing stack"
      }
    ],
    "cost_estimate": {
      "implementation": "$X,000–$X,000 one-time",
      "licensing": "$X/month or Free/Open Source",
      "notes": "State which recommended tools are already in the client's stack (zero net-new cost) and which are new — e.g. 'AWS Cost Explorer already licensed; Datadog is net-new at $X/month'"
    },
    "action_steps": [
      {
        "phase": "Short descriptive name for what this phase actually does for THIS process — not a generic label like 'Phase 1: Discovery'",
        "duration": "X–Y weeks",
        "tasks": [
          "Concrete step naming the specific tool from recommended_tools and the exact operation to perform — not generic",
          "Another step tailored to the client's cloud platform and this specific FinOps process",
          "A step that references an industry standard or governance requirement relevant to this client"
        ]
      }
    ],
    "success_metrics": ["Quantified metric tied to this specific process, not a generic KPI"]
  }],
  "plan_now": [{
    "process": "exact process label from scored list",
    "rationale": "one sentence citing the specific scores and why this requires a structured plan for this client",
    "effort": "S|M|L",
    "value_proposition": {
      "headline": "One sentence — the core business case for automating this specific process for this client",
      "benefits": [
        "Concrete, specific benefit quantifying time or cost impact where possible",
        "A second specific improvement this automation delivers over the current manual approach",
        "A third benefit — risk reduction, visibility gain, or downstream process improvement"
      ]
    },
    "industry_standards": [
      "FinOps Foundation capability name or CNCF/cloud-provider best practice — specific to this process"
    ],
    "recommended_tools": [
      {
        "name": "Specific tool name",
        "license": "Open Source|Commercial|Freemium",
        "notes": "One sentence on fit: why this tool for this process given the client's existing stack"
      }
    ],
    "cost_estimate": {
      "implementation": "$X,000–$X,000 one-time",
      "licensing": "$X/month or Free/Open Source",
      "notes": "State which recommended tools are already in the client's stack (zero net-new cost) and which are new — e.g. 'AWS Cost Explorer already licensed; Datadog is net-new at $X/month'"
    },
    "action_steps": [
      {
        "phase": "Short descriptive name for what this phase actually does for THIS process — not a generic label like 'Phase 1: Assessment'",
        "duration": "X–Y weeks",
        "tasks": [
          "Concrete step naming the specific tool from recommended_tools and the exact operation to perform — not generic",
          "Another step tailored to the client's cloud platform and this specific FinOps process",
          "A step that references an industry standard or governance requirement relevant to this client"
        ]
      }
    ],
    "success_metrics": ["Quantified metric tied to this specific process, not a generic KPI"]
  }],
  "readiness_recommendations": ["Specific recommendation referencing the client's actual readiness gaps"]
}

CRITICAL rules for action_steps — read carefully before writing any tasks:

1. Every task must name a specific tool from that process's recommended_tools list. Never write a task without a tool name.
   BAD: "Configure tooling and build automation logic."
   GOOD: "In Terraform, create a data.aws_cost_explorer resource querying the last 90 days of spend grouped by the team and cost-center tags — this becomes the baseline for anomaly thresholds."

2. Phase names must describe the actual work for this specific FinOps process. Do NOT use generic names.
   BAD: "Phase 1: Discovery & Design", "Phase 2: Build & Test"
   GOOD (for Spend Anomaly Detection): "Baseline & Threshold Design", "Alert Pipeline Build", "Triage Workflow & Runbook"
   GOOD (for Cost Allocation & Tagging): "Tag Taxonomy Audit", "Enforcement Rule Deployment", "Allocation Report Automation"

3. Tasks must be tailored to the client's cloud platform from org context. An AWS client and an Azure client should get completely different tasks for the same process.

4. Tasks must differ between processes. Anomaly Detection tasks must look nothing like Rightsizing tasks.

5. Reference the org's industry, size, or risk tolerance where it changes what the practitioner should do (e.g. a regulated industry needs audit-trail steps; a small team needs steps that don't require a dedicated FinOps platform).

6. Each task should be something a practitioner can actually execute — a specific console action, a script, a meeting with a named output, a configuration change in a named tool.

Additional field guidelines:
- value_proposition: The headline is the one-line business case — why this specific process, for this specific client, right now. Benefits must be process-specific and org-specific. Quantify wherever the org context gives you signal (e.g. if the org runs daily cost reviews on AWS across multiple accounts, estimate the manual hours). Do NOT write generic benefits like "saves time" or "improves accuracy" — say exactly what changes, how much, and for whom. The third benefit should address a downstream or strategic impact (e.g. "gives finance teams real-time chargeback data, removing the 2-week delay in monthly showback reports").
- industry_standards: cite specific FinOps Foundation capability names, CNCF OpenCost practices, or cloud-provider best practice docs. Include 2-3 per process.
- recommended_tools: prefer tools the client already uses (visible in org context) before suggesting new ones. Include 3-5 tools. Label license type accurately.
- cost_estimate: ONLY count net-new costs. Cross-reference recommended_tools against the client's existing stack in org context. Any tool the client already uses has $0 net-new licensing cost — do not include it in the licensing figure. Implementation covers labor/setup only. The notes field must explicitly state which tools are already covered (e.g. "AWS Cost Explorer and Terraform already in existing contracts — net-new licensing is $0; only labor cost applies") and which are new. If all recommended tools are already in the client's stack, licensing should be "Free / already licensed".
- Include only quick_win and plan_now processes. Number of phases should match the effort tier: S=3 phases, M=3-4 phases, L=4 phases.`

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
      value_proposition: {
        headline: `Automating ${r.label} reduces manual overhead and improves consistency across your cloud cost operations.`,
        benefits: [
          'Eliminates repetitive manual work, freeing engineering time for higher-value analysis',
          'Reduces human error and improves data consistency across billing cycles',
          'Provides faster feedback loops, enabling the team to act on cost signals in near real-time',
        ],
      },
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
      value_proposition: {
        headline: `Automating ${r.label} strengthens cost governance and reduces the operational burden on your FinOps team.`,
        benefits: [
          'Removes manual bottlenecks that delay cost visibility and reporting',
          'Standardizes the process across teams, reducing variance and audit risk',
          'Scales with cloud footprint growth without requiring proportional headcount increases',
        ],
      },
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
