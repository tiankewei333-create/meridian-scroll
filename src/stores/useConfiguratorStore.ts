import { create } from 'zustand'
import { DEFAULT_CONFIGURATION } from '../data/defaults'
import type { YachtConfiguration } from '../types/sharedTypes'

interface ConfiguratorState {
  config: YachtConfiguration
  /** Active UI / camera focus module */
  activeModule: keyof Pick<
    YachtConfiguration,
    'hullColor' | 'interior' | 'kitchen' | 'bedroom' | 'workshop' | 'engine' | 'equipment'
  > | null
}

interface ConfiguratorActions {
  selectHull: (hullColor: string) => void
  selectInterior: (interior: string) => void
  selectKitchen: (kitchen: string) => void
  selectBedroom: (bedroom: string) => void
  selectWorkshop: (workshop: string) => void
  selectEngine: (engine: string) => void
  toggleEquipment: (equipmentId: string) => void
  setActiveModule: (module: ConfiguratorState['activeModule']) => void
  resetConfig: () => void
}

export type ConfiguratorStore = ConfiguratorState & ConfiguratorActions

export const useConfiguratorStore = create<ConfiguratorStore>((set) => ({
  config: { ...DEFAULT_CONFIGURATION },
  activeModule: null,

  selectHull: (hullColor) =>
    set((s) => ({
      config: { ...s.config, hullColor },
      activeModule: 'hullColor',
    })),

  selectInterior: (interior) =>
    set((s) => ({
      config: { ...s.config, interior },
      activeModule: 'interior',
    })),

  selectKitchen: (kitchen) =>
    set((s) => ({
      config: { ...s.config, kitchen },
      activeModule: 'kitchen',
    })),

  selectBedroom: (bedroom) =>
    set((s) => ({
      config: { ...s.config, bedroom },
      activeModule: 'bedroom',
    })),

  selectWorkshop: (workshop) =>
    set((s) => ({
      config: { ...s.config, workshop },
      activeModule: 'workshop',
    })),

  selectEngine: (engine) =>
    set((s) => ({
      config: { ...s.config, engine },
      activeModule: 'engine',
    })),

  toggleEquipment: (equipmentId) =>
    set((s) => {
      const has = s.config.equipment.includes(equipmentId)
      const equipment = has
        ? s.config.equipment.filter((id) => id !== equipmentId)
        : [...s.config.equipment, equipmentId]

      return {
        config: { ...s.config, equipment },
        activeModule: 'equipment',
      }
    }),

  setActiveModule: (activeModule) => set({ activeModule }),

  resetConfig: () =>
    set({
      config: { ...DEFAULT_CONFIGURATION },
      activeModule: null,
    }),
}))
