import { useEffect } from 'react'
import { BoatStage } from './components/BoatStage'
import { ConfigFooter } from './components/ConfigFooter'
import { ConfigHeader } from './components/ConfigHeader'
import { OptionPanel } from './components/OptionPanel'
import { StepNav } from './components/StepNav'
import { readConfigFromUrl } from './data/share'
import { useConfiguratorStore } from './stores'

export default function App() {
  const applyConfig = useConfiguratorStore((s) => s.applyConfig)

  useEffect(() => {
    const shared = readConfigFromUrl()
    if (!shared) return
    applyConfig(shared)
  }, [applyConfig])

  return (
    <div className="flex h-full min-h-screen flex-col bg-white text-ink">
      <ConfigHeader />

      <div className="flex min-h-0 flex-1">
        <BoatStage />
        <StepNav />
        <OptionPanel />
      </div>

      <ConfigFooter />
    </div>
  )
}
