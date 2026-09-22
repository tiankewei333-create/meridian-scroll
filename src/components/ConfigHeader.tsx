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
      if (navigator.share) {
        await navigator.share({ title: 'OceanCraft 配置', url })
        setShareHint('已调起分享')
      } else {
        await navigator.clipboard.writeText(url)
        setShareHint('链接已复制')
      }
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
    <header className="relative flex h-12 shrink-0 items-center justify-between gap-2 border-b border-line bg-white px-3 md:h-14 md:px-6">
      <p className="shrink-0 text-xs font-semibold tracking-wide text-ink uppercase md:text-sm">
        OceanCraft
      </p>
      <h1 className="min-w-0 truncate text-center text-[10px] font-medium tracking-[0.12em] text-ink uppercase md:absolute md:left-1/2 md:max-w-none md:-translate-x-1/2 md:text-sm md:tracking-[0.2em]">
        {model}
      </h1>

      <div className="flex shrink-0 items-center gap-2 md:gap-4">
        {shareHint ? (
          <span className="hidden text-[11px] text-brand sm:inline">{shareHint}</span>
        ) : null}
        <button
          type="button"
          onClick={onShare}
          className="text-[10px] font-semibold tracking-wider text-muted uppercase transition-colors hover:text-ink md:text-xs md:tracking-widest"
        >
          分享
        </button>
        <button
          type="button"
          onClick={onExport}
          className="hidden text-[10px] font-semibold tracking-wider text-muted uppercase transition-colors hover:text-ink sm:inline md:text-xs md:tracking-widest"
        >
          导出报价
        </button>
        <button
          type="button"
          onClick={saveConfig}
          className="text-[10px] font-semibold tracking-wider text-brand uppercase transition-colors hover:text-brand-dark md:text-xs md:tracking-widest"
        >
          保存
        </button>
      </div>
    </header>
  )
}
