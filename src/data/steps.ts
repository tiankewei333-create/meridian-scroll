import type { ConfigOption, YachtConfiguration } from '../types/sharedTypes'
import {
  ACCENT_STRIPES,
  DECKS,
  DETAILS,
  HULL_COLORS,
  SUNPADS,
  UPHOLSTERIES,
} from './options'

export type StepId = keyof Pick<
  YachtConfiguration,
  'hullColor' | 'accentStripe' | 'sunpad' | 'deck' | 'upholstery' | 'details'
>

export type StepControl = 'swatch' | 'material' | 'radio' | 'checkbox'

export type StepAction =
  | 'selectHull'
  | 'selectAccent'
  | 'selectSunpad'
  | 'selectDeck'
  | 'selectUpholstery'
  | 'toggleDetail'

type SingleStepId = Exclude<StepId, 'details'>

interface StepBase {
  title: string
  description: string
  /** Human-readable GLB target for the option panel hint */
  meshHint: string
  options: readonly ConfigOption[]
}

export interface SingleSelectStep extends StepBase {
  id: SingleStepId
  control: 'swatch' | 'material' | 'radio'
  action: Exclude<StepAction, 'toggleDetail'>
  multiple: false
}

export interface MultiSelectStep extends StepBase {
  id: 'details'
  control: 'checkbox'
  action: 'toggleDetail'
  multiple: true
}

export type ConfigStep = SingleSelectStep | MultiSelectStep

export const STEPS = [
  {
    id: 'hullColor',
    title: '船壳',
    description: '船体凝胶涂层颜色',
    meshHint: 'Hull_Main',
    options: HULL_COLORS,
    control: 'swatch',
    action: 'selectHull',
    multiple: false,
  },
  {
    id: 'accentStripe',
    title: '腰线',
    description: '舷侧装饰条',
    meshHint: 'Accent_Stripe',
    options: ACCENT_STRIPES,
    control: 'swatch',
    action: 'selectAccent',
    multiple: false,
  },
  {
    id: 'sunpad',
    title: '日光垫',
    description: '船首软垫面料',
    meshHint: 'Sunpad_Bow',
    options: SUNPADS,
    control: 'material',
    action: 'selectSunpad',
    multiple: false,
  },
  {
    id: 'deck',
    title: '甲板',
    description: '柚木甲板色调',
    meshHint: 'Interior_Deck',
    options: DECKS,
    control: 'material',
    action: 'selectDeck',
    multiple: false,
  },
  {
    id: 'upholstery',
    title: '座舱',
    description: '座椅 / 仪表台 / 乙烯基软装',
    meshHint: 'Interior_Cockpit · Dash · Vinyl',
    options: UPHOLSTERIES,
    control: 'material',
    action: 'selectUpholstery',
    multiple: false,
  },
  {
    id: 'details',
    title: '选装',
    description: '细节件显隐',
    meshHint: 'Detail_*',
    options: DETAILS,
    control: 'checkbox',
    action: 'toggleDetail',
    multiple: true,
  },
] as const satisfies readonly ConfigStep[]
