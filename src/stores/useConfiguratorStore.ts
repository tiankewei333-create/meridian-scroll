import { create } from 'zustand'
import { DEFAULT_CONFIGURATION } from '../data/defaults'
import type { YachtConfiguration } from '../types/sharedTypes'

const STORAGE_KEY = 'ocean-craft-config-v3'

function readSavedConfig(): YachtConfiguration {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return {
        ...DEFAULT_CONFIGURATION,
        details: [...DEFAULT_CONFIGURATION.details],
      }
    }

    const parsed = JSON.parse(raw) as Partial<YachtConfiguration>
    return {
      ...DEFAULT_CONFIGURATION,
      ...parsed,
      details: Array.isArray(parsed.details)
        ? parsed.details
        : [...DEFAULT_CONFIGURATION.details],
    }
  } catch {
    return {
      ...DEFAULT_CONFIGURATION,
      details: [...DEFAULT_CONFIGURATION.details],
    }
  }
}

type ActiveModule =
  | keyof Pick<
      YachtConfiguration,
      | 'hullColor'
      | 'accentStripe'
      | 'sunpad'
      | 'deck'
      | 'upholstery'
      | 'details'
    >
  | null

interface ConfiguratorState {
  config: YachtConfiguration
  activeModule: ActiveModule
}

interface ConfiguratorActions {
  selectHull: (hullColor: string) => void
  selectAccent: (accentStripe: string) => void
  selectSunpad: (sunpad: string) => void
  selectDeck: (deck: string) => void
  selectUpholstery: (upholstery: string) => void
  toggleDetail: (detailId: string) => void
  setActiveModule: (module: ActiveModule) => void
  applyConfig: (config: YachtConfiguration) => void
  saveConfig: () => void
  resetConfig: () => void
}

export type ConfiguratorStore = ConfiguratorState & ConfiguratorActions

export const useConfiguratorStore = create<ConfiguratorStore>((set, get) => ({
  config: readSavedConfig(),
  activeModule: 'hullColor',

  selectHull: (hullColor) =>
    set((s) => ({
      config: { ...s.config, hullColor },
      activeModule: 'hullColor',
    })),

  selectAccent: (accentStripe) =>
    set((s) => ({
      config: { ...s.config, accentStripe },
      activeModule: 'accentStripe',
    })),

  selectSunpad: (sunpad) =>
    set((s) => ({
      config: { ...s.config, sunpad },
      activeModule: 'sunpad',
    })),

  selectDeck: (deck) =>
    set((s) => ({
      config: { ...s.config, deck },
      activeModule: 'deck',
    })),

  selectUpholstery: (upholstery) =>
    set((s) => ({
      config: { ...s.config, upholstery },
      activeModule: 'upholstery',
    })),

  toggleDetail: (detailId) =>
    set((s) => {
      const has = s.config.details.includes(detailId)
      const details = has
        ? s.config.details.filter((id) => id !== detailId)
        : [...s.config.details, detailId]

      return {
        config: { ...s.config, details },
        activeModule: 'details',
      }
    }),

  setActiveModule: (activeModule) => set({ activeModule }),

  applyConfig: (config) =>
    set({
      config: {
        ...DEFAULT_CONFIGURATION,
        ...config,
        details: [...config.details],
      },
    }),

  saveConfig: () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(get().config))
  },

  resetConfig: () =>
    set({
      config: {
        ...DEFAULT_CONFIGURATION,
        details: [...DEFAULT_CONFIGURATION.details],
      },
      activeModule: 'hullColor',
    }),
}))
