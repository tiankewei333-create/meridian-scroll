import {
  formatDelta,
  STEPS,
  type ConfigStep,
  type StepId,
} from '../data'
import { useConfiguratorStore } from '../stores'
import type { ConfigOption } from '../types/sharedTypes'

function isSelected(step: ConfigStep, optionId: string, selectedId: string | string[]) {
  if (step.multiple) {
    return Array.isArray(selectedId) && selectedId.includes(optionId)
  }
  return selectedId === optionId
}

function SwatchOptions({
  step,
  selectedId,
  onSelect,
}: {
  step: ConfigStep
  selectedId: string
  onSelect: (id: string) => void
}) {
  return (
    <div className="flex flex-wrap gap-3">
      {step.options.map((option) => {
        const selected = isSelected(step, option.id, selectedId)

        return (
          <button
            key={option.id}
            type="button"
            title={option.label}
            aria-pressed={selected}
            onClick={() => onSelect(option.id)}
            className={`rounded-full p-1 transition-shadow ${
              selected ? 'ring-2 ring-ink ring-offset-2' : 'hover:ring-1 hover:ring-line'
            }`}
          >
            <span
              className="block h-10 w-10 rounded-full border border-black/10"
              style={{ backgroundColor: option.color ?? '#d1d5db' }}
            />
          </button>
        )
      })}
    </div>
  )
}

function MaterialOptions({
  step,
  selectedId,
  onSelect,
}: {
  step: ConfigStep
  selectedId: string
  onSelect: (id: string) => void
}) {
  return (
    <div className="grid grid-cols-3 gap-3">
      {step.options.map((option) => {
        const selected = isSelected(step, option.id, selectedId)

        return (
          <button
            key={option.id}
            type="button"
            aria-pressed={selected}
            onClick={() => onSelect(option.id)}
            className={`flex flex-col gap-2 rounded-xl border p-2 text-left transition-colors ${
              selected
                ? 'border-brand bg-brand/5'
                : 'border-line bg-white hover:border-brand/40'
            }`}
          >
            <span
              className="block aspect-square rounded-lg border border-black/5"
              style={{ backgroundColor: option.color ?? '#d1d5db' }}
            />
            <span className="text-xs font-medium text-ink">{option.label}</span>
          </button>
        )
      })}
    </div>
  )
}

function ListOptions({
  step,
  selectedId,
  onSelect,
}: {
  step: ConfigStep
  selectedId: string | string[]
  onSelect: (id: string) => void
}) {
  return (
    <ul className="divide-y divide-line border-y border-line">
      {step.options.map((option: ConfigOption) => {
        const selected = isSelected(step, option.id, selectedId)

        return (
          <li key={option.id}>
            <button
              type="button"
              aria-pressed={selected}
              onClick={() => onSelect(option.id)}
              className="flex w-full items-start gap-3 py-4 text-left transition-colors hover:bg-stage/50"
            >
              <span
                className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
                  selected ? 'border-brand bg-brand' : 'border-muted bg-white'
                }`}
              >
                {selected && (
                  <span className="h-1.5 w-1.5 rounded-full bg-white" />
                )}
              </span>
              <span className="min-w-0 flex-1">
                <span
                  className={`block text-sm ${
                    selected ? 'font-semibold text-ink' : 'font-medium text-ink'
                  }`}
                >
                  {option.label}
                </span>
              </span>
              <span
                className={`shrink-0 text-sm ${
                  selected ? 'font-semibold text-brand' : 'text-muted'
                }`}
              >
                {formatDelta(option.price)}
              </span>
            </button>
          </li>
        )
      })}
    </ul>
  )
}

export function OptionPanel() {
  const activeModule = useConfiguratorStore((s) => s.activeModule)
  const config = useConfiguratorStore((s) => s.config)
  const selectHull = useConfiguratorStore((s) => s.selectHull)
  const selectAccent = useConfiguratorStore((s) => s.selectAccent)
  const selectSunpad = useConfiguratorStore((s) => s.selectSunpad)
  const selectDeck = useConfiguratorStore((s) => s.selectDeck)
  const selectUpholstery = useConfiguratorStore((s) => s.selectUpholstery)
  const toggleDetail = useConfiguratorStore((s) => s.toggleDetail)

  if (!activeModule) {
    return (
      <aside className="flex w-80 shrink-0 flex-col border-l border-line bg-white">
        <div className="border-b border-line px-5 py-4">
          <p className="text-xs font-semibold tracking-widest text-muted uppercase">
            完成
          </p>
        </div>
        <div className="flex flex-1 items-center px-5 py-5">
          <p className="text-sm text-muted">
            配置已完成。可点「保存配置」保留当前选择，或从步骤栏继续修改。
          </p>
        </div>
      </aside>
    )
  }

  const stepIndex = STEPS.findIndex((step) => step.id === activeModule)
  const step = STEPS[stepIndex]!

  const actions = {
    selectHull,
    selectAccent,
    selectSunpad,
    selectDeck,
    selectUpholstery,
    toggleDetail,
  } as const

  const selectedId =
    step.id === 'details'
      ? config.details
      : config[step.id as Exclude<StepId, 'details'>]

  const onSelect = (id: string) => {
    actions[step.action](id)
  }

  return (
    <aside className="flex w-80 shrink-0 flex-col border-l border-line bg-white">
      <div className="border-b border-line px-5 py-4">
        <p className="text-xs font-semibold tracking-widest text-muted uppercase">
          {stepIndex + 1}. {step.title}
        </p>
        <p className="mt-1 text-xs text-muted">{step.description}</p>
        <p className="mt-1 text-[11px] text-muted/80">{step.meshHint}</p>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
        {step.control === 'swatch' && (
          <SwatchOptions
            step={step}
            selectedId={selectedId as string}
            onSelect={onSelect}
          />
        )}
        {step.control === 'material' && (
          <MaterialOptions
            step={step}
            selectedId={selectedId as string}
            onSelect={onSelect}
          />
        )}
        {(step.control === 'radio' || step.control === 'checkbox') && (
          <ListOptions step={step} selectedId={selectedId} onSelect={onSelect} />
        )}
      </div>
    </aside>
  )
}
