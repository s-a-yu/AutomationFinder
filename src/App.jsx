import { AppProvider, useApp } from './context/AppContext'
import Screen1Context from './screens/Screen1Context'
import Screen2Processes from './screens/Screen2Processes'
import Screen3Readiness from './screens/Screen3Readiness'
import Screen4Results from './screens/Screen4Results'

function Router() {
  const { step } = useApp()
  if (step === 1) return <Screen1Context />
  if (step === 2) return <Screen2Processes />
  if (step === 3) return <Screen3Readiness />
  return <Screen4Results />
}

export default function App() {
  return (
    <AppProvider>
      <Router />
    </AppProvider>
  )
}
