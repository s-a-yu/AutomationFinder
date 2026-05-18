import config from '../data/scoringConfig.json'
import processLibrary from '../data/processLibrary.json'

const { value_weights, readiness_weights, effort_modifiers, risk_penalty, risk_tolerance_map, tier_thresholds, score_max, score_min } = config

function normalize(val) {
  return (val - score_min) / (score_max - score_min)
}

export function computeReadinessScore(readinessAnswers) {
  const { data_availability, process_maturity, tooling, risk_compliance } = readinessAnswers
  const scores = {
    data_availability: normalize(data_availability),
    process_maturity: normalize(process_maturity),
    tooling: normalize(tooling),
    risk_compliance: normalize(score_max + score_min - risk_compliance), // inverted
  }
  return Object.entries(readiness_weights).reduce((sum, [k, w]) => sum + scores[k] * w, 0)
}

export function computeValueScore(dimensions) {
  return Object.entries(value_weights).reduce((sum, [k, w]) => sum + normalize(dimensions[k]) * w, 0)
}

function computeFeasibility(readinessAnswers, effort) {
  const base = computeReadinessScore(readinessAnswers)
  return base * (effort_modifiers[effort] ?? 1.0)
}

function computeRiskModifier(processRiskLevel, riskTolerance) {
  const toleranceLevel = risk_tolerance_map[riskTolerance] ?? 'moderate'
  const levels = ['low', 'medium', 'high']
  const processIdx = levels.indexOf(processRiskLevel)
  const toleranceIdx = levels.indexOf(toleranceLevel)
  if (processIdx > toleranceIdx) {
    return risk_penalty[processRiskLevel]
  }
  return 0
}

function assignTier(priorityScore, readinessScore) {
  const { quick_win, plan_now } = tier_thresholds
  if (priorityScore >= quick_win.priority_min && readinessScore >= quick_win.readiness_min) {
    return 'quick_win'
  }
  if (priorityScore >= plan_now.priority_min) {
    return 'plan_now'
  }
  return 'backlog'
}

export function scoreAll(selectedProcesses, processAnswers, readinessAnswers, riskTolerance) {
  return selectedProcesses.map((processId) => {
    const meta = processLibrary.find((p) => p.id === processId)
    const dimensions = processAnswers[processId] ?? {}
    const valueScore = computeValueScore(dimensions)
    const readinessScore = computeReadinessScore(readinessAnswers)
    const feasibility = computeFeasibility(readinessAnswers, meta.effort)
    const riskMod = computeRiskModifier(meta.risk_level, riskTolerance)
    const priorityScore = (valueScore * 0.5 + feasibility * 0.5) - riskMod
    const tier = assignTier(priorityScore, readinessScore)
    return {
      processId,
      label: meta.label,
      description: meta.description,
      effort: meta.effort,
      risk_level: meta.risk_level,
      valueScore,
      readinessScore,
      feasibility,
      priorityScore: Math.max(0, priorityScore),
      tier,
    }
  }).sort((a, b) => b.priorityScore - a.priorityScore)
}
