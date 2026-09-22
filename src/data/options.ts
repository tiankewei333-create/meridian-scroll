import type { ConfigOption } from '../types/sharedTypes'

/** Gelcoat-style hull paints. */
export const HULL_COLORS: ConfigOption[] = [
  { id: 'hull-pearl', label: 'Pearl White', price: 0, color: '#f3f1ea' },
  { id: 'hull-ivory', label: 'Ivory Cream', price: 1800, color: '#ebe3d2' },
  { id: 'hull-navy', label: 'Navy Blue', price: 3200, color: '#1a2f4a' },
  { id: 'hull-flag', label: 'Flag Blue', price: 3600, color: '#243f66' },
  { id: 'hull-silver', label: 'Silver Gray', price: 2800, color: '#8a9098' },
  { id: 'hull-black', label: 'Jet Black', price: 4200, color: '#1c1e22' },
]

/** Classic hull accent / boot stripes. */
export const ACCENT_STRIPES: ConfigOption[] = [
  { id: 'stripe-navy', label: 'Navy', price: 0, color: '#0c2340' },
  { id: 'stripe-red', label: 'Signal Red', price: 600, color: '#8e1d1d' },
  { id: 'stripe-black', label: 'Black', price: 400, color: '#141414' },
  { id: 'stripe-gold', label: 'Gold', price: 900, color: '#b0894d' },
  { id: 'stripe-teal', label: 'Ocean Teal', price: 800, color: '#1a6b6a' },
]

/** Bow sunpad vinyl / fabric. */
export const SUNPADS: ConfigOption[] = [
  { id: 'sunpad-ivory', label: 'Ivory', price: 0, color: '#f2ebe0' },
  { id: 'sunpad-sand', label: 'Sand', price: 900, color: '#d2c0a2' },
  { id: 'sunpad-taupe', label: 'Taupe', price: 1100, color: '#a89886' },
  { id: 'sunpad-navy', label: 'Navy', price: 1400, color: '#1d2c44' },
  { id: 'sunpad-charcoal', label: 'Charcoal', price: 1200, color: '#454a52' },
]

/** Teak deck finishes — tint keeps wood grain when map exists. */
export const DECKS: ConfigOption[] = [
  { id: 'deck-teak', label: 'Natural Teak', price: 0, color: '#b08956' },
  { id: 'deck-honey', label: 'Honey Teak', price: 1500, color: '#c9a06a' },
  { id: 'deck-aged', label: 'Aged Teak', price: 1800, color: '#8d7354' },
  { id: 'deck-dark', label: 'Dark Teak', price: 2200, color: '#6a4e32' },
]

/** Cockpit / dash / vinyl soft goods. */
export const UPHOLSTERIES: ConfigOption[] = [
  { id: 'upholstery-white', label: 'Arctic White', price: 0, color: '#f4f2ed' },
  { id: 'upholstery-beige', label: 'Warm Beige', price: 1600, color: '#d8ccba' },
  { id: 'upholstery-cognac', label: 'Cognac', price: 2400, color: '#8a5a36' },
  { id: 'upholstery-navy', label: 'Navy Leather', price: 2600, color: '#1b2a3c' },
  { id: 'upholstery-graphite', label: 'Graphite', price: 2000, color: '#4b5058' },
]

export const DETAILS: ConfigOption[] = [
  { id: 'logo', label: 'Brand Logo', price: 0, mesh: 'Detail_Logo' },
  { id: 'mfd', label: 'MFD Display', price: 2200, mesh: 'Detail_MFD' },
  { id: 'vent', label: 'Deck Vent', price: 400, mesh: 'Detail_Vent' },
]

export const OPTIONS_BY_MODULE = {
  hull: HULL_COLORS,
  accent: ACCENT_STRIPES,
  sunpad: SUNPADS,
  deck: DECKS,
  upholstery: UPHOLSTERIES,
  details: DETAILS,
} as const
