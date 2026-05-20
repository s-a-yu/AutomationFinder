import { MOCK_SCANS } from '../data/mockConnectorData.js'

export function scanEnvironment(provider) {
  const scan = MOCK_SCANS[provider]
  if (!scan) return Promise.reject(new Error(`Unknown provider: ${provider}`))
  return new Promise((resolve) => setTimeout(() => resolve(scan), scan.scanDuration))
}
