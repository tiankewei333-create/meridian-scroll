import type { ConfigOption, YachtConfiguration } from '../types/sharedTypes'
import { BASE_PRICE } from './defaults'
import {
  ACCENT_STRIPES,
  DECKS,
  DETAILS,
  HULL_COLORS,
  SUNPADS,
  UPHOLSTERIES,
} from './options'

function optionPrice(options: readonly ConfigOption[], id: string): number {
  return options.find((option) => option.id === id)?.price ?? 0
}

export function getTotalPrice(config: YachtConfiguration): number {
  const detailsTotal = config.details.reduce(
    (sum, id) => sum + optionPrice(DETAILS, id),
    0,
  )

  return (
    BASE_PRICE +
    optionPrice(HULL_COLORS, config.hullColor) +
    optionPrice(ACCENT_STRIPES, config.accentStripe) +
    optionPrice(SUNPADS, config.sunpad) +
    optionPrice(DECKS, config.deck) +
    optionPrice(UPHOLSTERIES, config.upholstery) +
    detailsTotal
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
