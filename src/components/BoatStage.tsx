import { useConfiguratorStore } from '../stores'

export function BoatStage() {
  const model = useConfiguratorStore((s) => s.config.model)

  return (
    <section className="relative flex min-h-0 flex-1 flex-col bg-stage">
      <div className="flex flex-1 flex-col items-center justify-center gap-3 px-8">
        <div className="flex h-64 w-full max-w-3xl items-center justify-center rounded-2xl border border-dashed border-line bg-white/60">
          <p className="text-sm text-muted">预览将在这里显示</p>
        </div>
        <p className="text-2xl font-semibold tracking-wide text-ink uppercase">
          {model}
        </p>
      </div>
    </section>
  )
}
