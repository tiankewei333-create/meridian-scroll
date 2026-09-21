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
    <footer className="flex h-16 shrink-0 items-center justify-between border-t border-line bg-white px-6">
      <div>
        <p className="text-[11px] tracking-widest text-muted uppercase">总价</p>
        <p className="text-xl font-bold text-ink">{formatPrice(total)}</p>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          disabled={isFirst}
          onClick={goPrev}
          className="rounded-lg border border-line px-4 py-2 text-sm font-medium text-ink transition-colors hover:bg-stage disabled:cursor-not-allowed disabled:opacity-40"
        >
          上一步
        </button>
        <button
          type="button"
          onClick={goNext}
          className="rounded-lg bg-brand px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-dark"
        >
          {isDone ? '重新配置' : isLast ? '完成配置' : '下一步'}
        </button>
      </div>
    </footer>
  )
}
