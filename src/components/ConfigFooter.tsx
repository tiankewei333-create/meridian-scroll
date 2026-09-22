import { formatPrice, getTotalPrice, STEPS, type StepId } from '../data'
import { useConfiguratorStore } from '../stores'

export function ConfigFooter() {
  const config = useConfiguratorStore((s) => s.config)
  const activeModule = useConfiguratorStore((s) => s.activeModule)
  const setActiveModule = useConfiguratorStore((s) => s.setActiveModule)

  const stepIndex = activeModule
    ? STEPS.findIndex((step) => step.id === activeModule)
    : -1
  const isDone = activeModule === null
  const isFirst = stepIndex === 0
  const isLast = stepIndex === STEPS.length - 1
  const total = getTotalPrice(config)

  const goPrev = () => {
    if (isDone) {
      setActiveModule(STEPS[STEPS.length - 1]!.id as StepId)
      return
    }
    if (isFirst) return
    setActiveModule(STEPS[stepIndex - 1]!.id as StepId)
  }

  const goNext = () => {
    if (isDone) {
      setActiveModule(STEPS[0]!.id as StepId)
      return
    }
    if (isLast) {
      setActiveModule(null)
      return
    }
    setActiveModule(STEPS[stepIndex + 1]!.id as StepId)
  }

  return (
    <footer className="flex h-14 shrink-0 items-center justify-between gap-3 border-t border-line bg-white px-3 pb-[env(safe-area-inset-bottom)] md:h-16 md:px-6">
      <div className="min-w-0">
        <p className="text-[10px] tracking-widest text-muted uppercase md:text-[11px]">
          总价
        </p>
        <p className="truncate text-lg font-bold text-ink md:text-xl">
          {formatPrice(total)}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-2 md:gap-3">
        <button
          type="button"
          disabled={isFirst}
          onClick={goPrev}
          className="rounded-lg border border-line px-3 py-2 text-sm font-medium text-ink transition-colors hover:bg-stage disabled:cursor-not-allowed disabled:opacity-40 md:px-4"
        >
          上一步
        </button>
        <button
          type="button"
          onClick={goNext}
          className="rounded-lg bg-brand px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-dark md:px-5"
        >
          {isDone ? '重新配置' : isLast ? '完成配置' : '下一步'}
        </button>
      </div>
    </footer>
  )
}
