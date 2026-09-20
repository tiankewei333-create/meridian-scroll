import type { ConfigOption } from '../types/sharedTypes'

export const HULL_COLORS: ConfigOption[] = [
  {
    id: 'navy',
    label: 'Ocean Navy',
    price: 0,
    color: '#1a2a4a',
    asset: '/textures/hull/navy.png',
  },
  {
    id: 'pearl',
    label: 'Pearl White',
    price: 2500,
    color: '#f5f5f0',
    asset: '/textures/hull/pearl.png',
  },
  {
    id: 'graphite',
    label: 'Graphite',
    price: 3200,
    color: '#3a3d42',
    asset: '/textures/hull/graphite.png',
  },
]

export const INTERIORS: ConfigOption[] = [
  { id: 'teak', label: 'Teak Classic', price: 0 },
  { id: 'oak', label: 'Light Oak', price: 1800 },
  { id: 'walnut', label: 'Dark Walnut', price: 2400 },
]

export const KITCHENS: ConfigOption[] = [
  {
    id: 'galley-a',
    label: 'Galley A',
    price: 12000,
    asset: '/models/kitchen/galley-a.glb',
  },
  {
    id: 'galley-b',
    label: 'Galley B',
    price: 18000,
    asset: '/models/kitchen/galley-b.glb',
  },
]

export const BEDROOMS: ConfigOption[] = [
  {
    id: 'cabin-double',
    label: 'Double Cabin',
    price: 8000,
    asset: '/models/bedroom/cabin-double.glb',
  },
  {
    id: 'cabin-suite',
    label: 'Owner Suite',
    price: 15000,
    asset: '/models/bedroom/cabin-suite.glb',
  },
]

export const WORKSHOPS: ConfigOption[] = [
  {
    id: 'bench-standard',
    label: 'Standard Bench',
    price: 5000,
    asset: '/models/workshop/bench-standard.glb',
  },
  {
    id: 'bench-pro',
    label: 'Pro Workshop',
    price: 9500,
    asset: '/models/workshop/bench-pro.glb',
  },
]

export const ENGINES: ConfigOption[] = [
  {
    id: 'diesel-300',
    label: 'Diesel 300hp',
    price: 42000,
    asset: '/models/yacht/engine-diesel-300.glb',
  },
  {
    id: 'diesel-450',
    label: 'Diesel 450hp',
    price: 68000,
    asset: '/models/yacht/engine-diesel-450.glb',
  },
]

export const EQUIPMENT: ConfigOption[] = [
  { id: 'gps', label: 'GPS Suite', price: 2200 },
  { id: 'autopilot', label: 'Autopilot', price: 4800 },
  { id: 'solar', label: 'Solar Pack', price: 6100 },
]

export const OPTIONS_BY_MODULE = {
  hull: HULL_COLORS,
  interior: INTERIORS,
  kitchen: KITCHENS,
  bedroom: BEDROOMS,
  workshop: WORKSHOPS,
  engine: ENGINES,
  equipment: EQUIPMENT,
} as const
