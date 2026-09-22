import { STEPS, type StepId } from '../data'
import { useConfiguratorStore } from '../stores'

export function StepNav() {
  const activeModule = useConfiguratorStore((s) => s.activeModule)
  const setActiveModule = useConfiguratorStore((s) => s.setActiveModule)

  return (
    <nav
      aria-label="配置步骤"
      className="flex shrink-0 gap-1 overflow-x-auto border-b border-line bg-white px-2 py-2 md:w-28 md:flex-col md:overflow-x-visible md:overflow-y-auto md:border-b-0 md:border-l md:px-0 md:py-4"
    >
      {STEPS.map((step, index) => {
        const active = activeModule === step.id

        return (
          <button
            key={step.id}
            type="button"
            onClick={() => setActiveModule(step.id as StepId)}
            className={`flex shrink-0 flex-row items-center gap-2 rounded-xl px-3 py-2 text-left transition-colors md:mx-2 md:flex-col md:px-2 md:py-3 md:text-center ${
              active
                ? 'bg-stage text-ink'
                : 'text-muted hover:bg-stage/60 hover:text-ink'
            }`}
          >
            <span
              className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold md:h-8 md:w-8 ${
                active
                  ? 'bg-ink text-white'
                  : 'border border-line bg-white text-muted'
              }`}
            >
              {index + 1}
            </span>
            <span className="whitespace-nowrap text-xs font-medium leading-tight md:text-[11px]">
              {step.title}
            </span>
          </button>
        )
      })}
    </nav>
  )
}
