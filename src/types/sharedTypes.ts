/** Current yacht build selection (ids map to entries in `src/data`). */
export interface YachtConfiguration {
  model: string
  hullColor: string
  interior: string
  kitchen: string
  bedroom: string
  workshop: string
  engine: string
  equipment: string[]
}

/** Catalog option shown in UI / resolved for 3D assets. */
export interface ConfigOption {
  id: string
  label: string
  price: number
  /** Path under `/models/...` or `/textures/...` when applicable */
  asset?: string
  /** Hex color for hull / material previews */
  color?: string
}

export type ConfigModule =
  | 'hull'
  | 'interior'
  | 'kitchen'
  | 'bedroom'
  | 'workshop'
  | 'engine'
  | 'equipment'
