import type { ConfigOption, YachtConfiguration } from '../types/sharedTypes'
import { BASE_PRICE } from './defaults'
import {
  BEDROOMS,
  ENGINES,
  EQUIPMENT,
  HULL_COLORS,
  INTERIORS,
  KITCHENS,
  WORKSHOPS,
} from './options'

function optionPrice(options: readonly ConfigOption[], id: string): number {
  return options.find((option) => option.id === id)?.price ?? 0
}

/** Base price plus deltas for every selected option. Unknown ids count as 0. */
export function getTotalPrice(config: YachtConfiguration): number {
  const equipmentTotal = config.equipment.reduce(
    (sum, id) => sum + optionPrice(EQUIPMENT, id),
    0,
  )

  return (
    BASE_PRICE +
    optionPrice(HULL_COLORS, config.hullColor) +
    optionPrice(INTERIORS, config.interior) +
    optionPrice(KITCHENS, config.kitchen) +
    optionPrice(BEDROOMS, config.bedroom) +
    optionPrice(WORKSHOPS, config.workshop) +
    optionPrice(ENGINES, config.engine) +
    equipmentTotal
  )
}

export function formatPrice(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatDelta(amount: number): string {
  if (amount === 0) return 'Included'
  return `+${formatPrice(amount)}`
}
