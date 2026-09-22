import type { StepId } from './steps'

export type CameraPose = {
  position: [number, number, number]
  target: [number, number, number]
}

/** Preset framing for the scaled dayboat (~6 units long). */
export const CAMERA_BY_STEP: Record<StepId | 'overview', CameraPose> = {
  hullColor: {
    position: [6.8, 3.4, 6.2],
    target: [0, 0.75, 0],
  },
  accentStripe: {
    position: [1.2, 2.2, 7.5],
    target: [0.2, 0.55, 0],
  },
  sunpad: {
    position: [5.8, 3.6, 1.8],
    target: [1.6, 1.15, 0],
  },
  deck: {
    position: [3.2, 7.2, 3.4],
    target: [0, 0.4, 0],
  },
  upholstery: {
    position: [-3.4, 3.2, 5.2],
    target: [-0.6, 1.05, 0],
  },
  details: {
    position: [-1.6, 2.6, 4.4],
    target: [0.1, 1.2, 0],
  },
  overview: {
    position: [7.2, 4.0, 7.0],
    target: [0, 0.8, 0],
  },
}

export function getCameraPose(step: StepId | null): CameraPose {
  if (!step) return CAMERA_BY_STEP.overview
  return CAMERA_BY_STEP[step] ?? CAMERA_BY_STEP.overview
}
