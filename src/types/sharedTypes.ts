/** Current yacht build selection (ids map to entries in `src/data`). */
export interface YachtConfiguration {
  model: string
  /** `Hull_Main` gelcoat */
  hullColor: string
  /** `Accent_Stripe` */
  accentStripe: string
  /** `Sunpad_Bow` */
  sunpad: string
  /** `Interior_Deck` teak / wood */
  deck: string
  /** `Interior_Cockpit` / `Interior_Dash` / `Interior_Vinyl` */
  upholstery: string
  /** Enabled detail ids → `Detail_*` */
  details: string[]
}

/** Catalog option shown in UI / resolved for 3D assets. */
export interface ConfigOption {
  id: string
  label: string
  price: number
  asset?: string
  color?: string
  mesh?: string
}

export type ConfigModule =
  | 'hull'
  | 'accent'
  | 'sunpad'
  | 'deck'
  | 'upholstery'
  | 'details'
