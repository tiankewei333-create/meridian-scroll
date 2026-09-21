import { useConfiguratorStore } from '../stores'

export function ConfigHeader() {
  const model = useConfiguratorStore((s) => s.config.model)
  const saveConfig = useConfiguratorStore((s) => s.saveConfig)

  return (
    <header className="relative flex h-14 shrink-0 items-center justify-between border-b border-line bg-white px-6">
      <p className="text-sm font-semibold tracking-wide text-ink uppercase">
        OceanCraft
      </p>
      <h1 className="absolute left-1/2 -translate-x-1/2 text-sm font-medium tracking-[0.2em] text-ink uppercase">
        {model}
      </h1>
      <button
        type="button"
        onClick={saveConfig}
        className="text-xs font-semibold tracking-widest text-brand uppercase transition-colors hover:text-brand-dark"
      >
        保存配置
      </button>
    </header>
  )
}
