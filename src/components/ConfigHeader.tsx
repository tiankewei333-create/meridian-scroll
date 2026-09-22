import { useState } from 'react'
import { buildShareUrl, downloadQuote } from '../data/share'
import { useConfiguratorStore } from '../stores'

export function ConfigHeader() {
  const model = useConfiguratorStore((s) => s.config.model)
  const config = useConfiguratorStore((s) => s.config)
  const saveConfig = useConfiguratorStore((s) => s.saveConfig)
  const [shareHint, setShareHint] = useState<string | null>(null)

  const onShare = async () => {
    const url = buildShareUrl(config)

    try {
      await navigator.clipboard.writeText(url)
      setShareHint('链接已复制')
    } catch {
      window.prompt('复制分享链接：', url)
      setShareHint('请手动复制链接')
    }

    window.setTimeout(() => setShareHint(null), 2000)
  }

  const onExport = () => {
    downloadQuote(config)
    setShareHint('报价已下载')
    window.setTimeout(() => setShareHint(null), 2000)
  }

  return (
    <header className="relative flex h-14 shrink-0 items-center justify-between border-b border-line bg-white px-6">
      <p className="text-sm font-semibold tracking-wide text-ink uppercase">
        OceanCraft
      </p>
      <h1 className="absolute left-1/2 -translate-x-1/2 text-sm font-medium tracking-[0.2em] text-ink uppercase">
        {model}
      </h1>

      <div className="flex items-center gap-4">
        {shareHint ? (
          <span className="text-[11px] text-brand">{shareHint}</span>
        ) : null}
        <button
          type="button"
          onClick={onShare}
          className="text-xs font-semibold tracking-widest text-muted uppercase transition-colors hover:text-ink"
        >
          分享
        </button>
        <button
          type="button"
          onClick={onExport}
          className="text-xs font-semibold tracking-widest text-muted uppercase transition-colors hover:text-ink"
        >
          导出报价
        </button>
        <button
          type="button"
          onClick={saveConfig}
          className="text-xs font-semibold tracking-widest text-brand uppercase transition-colors hover:text-brand-dark"
        >
          保存配置
        </button>
      </div>
    </header>
  )
}
