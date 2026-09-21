import type { ConfigOption, YachtConfiguration } from '../types/sharedTypes'
import {
  BEDROOMS,
  ENGINES,
  EQUIPMENT,
  HULL_COLORS,
  INTERIORS,
  KITCHENS,
  WORKSHOPS,
} from './options'

/** Matches `activeModule` in the configurator store (`null` means no step focused). */
export type StepId = keyof Pick<
  YachtConfiguration,
  | 'hullColor'
  | 'interior'
  | 'kitchen'
  | 'bedroom'
  | 'workshop'
  | 'engine'
  | 'equipment'
>

export type StepControl = 'swatch' | 'material' | 'radio' | 'checkbox'

/** Store action to call when an option in this step is chosen. */
export type StepAction =
  | 'selectHull'
  | 'selectInterior'
  | 'selectKitchen'
  | 'selectBedroom'
  | 'selectWorkshop'
  | 'selectEngine'
  | 'toggleEquipment'

type SingleStepId = Exclude<StepId, 'equipment'>

interface StepBase {
  title: string
  options: readonly ConfigOption[]
}

export interface SingleSelectStep extends StepBase {
  id: SingleStepId
  control: 'swatch' | 'material' | 'radio'
  action: Exclude<StepAction, 'toggleEquipment'>
  multiple: false
}

export interface MultiSelectStep extends StepBase {
  id: 'equipment'
  control: 'checkbox'
  action: 'toggleEquipment'
  multiple: true
}

export type ConfigStep = SingleSelectStep | MultiSelectStep

export const STEPS = [
  {
    id: 'hullColor',
    title: '船壳',
    options: HULL_COLORS,
    control: 'swatch',
    action: 'selectHull',
    multiple: false,
  },
  {
    id: 'interior',
    title: '内饰',
    options: INTERIORS,
    control: 'material',
    action: 'selectInterior',
    multiple: false,
  },
  {
    id: 'kitchen',
    title: '厨房',
    options: KITCHENS,
    control: 'radio',
    action: 'selectKitchen',
    multiple: false,
  },
  {
    id: 'bedroom',
    title: '卧室',
    options: BEDROOMS,
    control: 'radio',
    action: 'selectBedroom',
    multiple: false,
  },
  {
    id: 'workshop',
    title: '工作间',
    options: WORKSHOPS,
    control: 'radio',
    action: 'selectWorkshop',
    multiple: false,
  },
  {
    id: 'engine',
    title: '发动机',
    options: ENGINES,
    control: 'radio',
    action: 'selectEngine',
    multiple: false,
  },
  {
    id: 'equipment',
    title: '设备',
    options: EQUIPMENT,
    control: 'checkbox',
    action: 'toggleEquipment',
    multiple: true,
  },
] as const satisfies readonly ConfigStep[]
