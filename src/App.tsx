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
    <div className="flex h-dvh max-h-dvh flex-col overflow-hidden bg-white text-ink">
      <ConfigHeader />

      {/* Desktop: stage | steps | options. Mobile: stage on top, steps + options below. */}
      <div className="flex min-h-0 flex-1 flex-col md:flex-row">
        <BoatStage />

        <div className="flex h-[min(44vh,24rem)] shrink-0 flex-col border-t border-line md:h-auto md:min-h-0 md:w-auto md:flex-row md:border-t-0">
          <StepNav />
          <OptionPanel />
        </div>
      </div>

      <ConfigFooter />
    </div>
  )
}
