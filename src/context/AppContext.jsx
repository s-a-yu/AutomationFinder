import { createContext, useContext, useState } from 'react'

const AppContext = createContext(null)

export function AppProvider({ children }) {
  const [step, setStep] = useState(1)
  const [orgContext, setOrgContext] = useState({})
  const [selectedProcesses, setSelectedProcesses] = useState([])
  const [processAnswers, setProcessAnswers] = useState({})
  const [readinessAnswers, setReadinessAnswers] = useState({})
  const [scoredResults, setScoredResults] = useState([])
  const [summary, setSummary] = useState(null)
  const [summaryLoading, setSummaryLoading] = useState(false)

  function updateProcessAnswer(processId, dimension, value) {
    setProcessAnswers((prev) => ({
      ...prev,
      [processId]: { ...(prev[processId] ?? {}), [dimension]: value },
    }))
  }

  function updateReadinessAnswer(dimension, value) {
    setReadinessAnswers((prev) => ({ ...prev, [dimension]: value }))
  }

  return (
    <AppContext.Provider value={{
      step, setStep,
      orgContext, setOrgContext,
      selectedProcesses, setSelectedProcesses,
      processAnswers, setProcessAnswers, updateProcessAnswer,
      readinessAnswers, updateReadinessAnswer,
      scoredResults, setScoredResults,
      summary, setSummary,
      summaryLoading, setSummaryLoading,
    }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  return useContext(AppContext)
}
