import { STEPS, type StepId } from '../data'
import { useConfiguratorStore } from '../stores'

export function StepNav() {
  const activeModule = useConfiguratorStore((s) => s.activeModule)
  const setActiveModule = useConfiguratorStore((s) => s.setActiveModule)

  return (
    <nav
      aria-label="配置步骤"
      className="flex w-28 shrink-0 flex-col gap-1 border-l border-line bg-white py-4"
    >
      {STEPS.map((step, index) => {
        const active = activeModule === step.id

        return (
          <button
            key={step.id}
            type="button"
            onClick={() => setActiveModule(step.id as StepId)}
            className={`mx-2 flex flex-col items-center gap-1 rounded-xl px-2 py-3 text-center transition-colors ${
              active
                ? 'bg-stage text-ink'
                : 'text-muted hover:bg-stage/60 hover:text-ink'
            }`}
          >
            <span
              className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold ${
                active
                  ? 'bg-ink text-white'
                  : 'border border-line bg-white text-muted'
              }`}
            >
              {index + 1}
            </span>
            <span className="text-[11px] font-medium leading-tight">
              {step.title}
            </span>
          </button>
        )
      })}
    </nav>
  )
}
