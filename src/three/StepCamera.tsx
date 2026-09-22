import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { getCameraPose } from '../data/cameras'
import { useConfiguratorStore } from '../stores'

type OrbitLike = {
  target: THREE.Vector3
  update: () => void
  addEventListener: (type: string, listener: () => void) => void
  removeEventListener: (type: string, listener: () => void) => void
}

const SETTLE_DISTANCE = 0.02

/**
 * Animates to a step preset only when the step changes.
 * After settling (or as soon as the user drags/zooms), OrbitControls stays in control.
 */
export function StepCamera() {
  const activeModule = useConfiguratorStore((s) => s.activeModule)
  const camera = useThree((s) => s.camera)
  const controls = useThree((s) => s.controls) as OrbitLike | null

  const goal = useMemo(() => getCameraPose(activeModule), [activeModule])
  const goalPosition = useMemo(
    () => new THREE.Vector3(...goal.position),
    [goal],
  )
  const goalTarget = useMemo(() => new THREE.Vector3(...goal.target), [goal])

  const animating = useRef(false)
  const userOverride = useRef(false)

  // New step → start a one-shot camera move (unless user is mid-drag).
  useEffect(() => {
    userOverride.current = false
    animating.current = true
  }, [activeModule])

  // Any OrbitControls interaction cancels the tween so zoom/orbit stick.
  useEffect(() => {
    if (!controls) return

    const onStart = () => {
      userOverride.current = true
      animating.current = false
    }

    controls.addEventListener('start', onStart)
    return () => controls.removeEventListener('start', onStart)
  }, [controls])

  useFrame((_, delta) => {
    if (!controls || !animating.current || userOverride.current) return

    const damp = 1 - Math.exp(-3.2 * delta)
    camera.position.lerp(goalPosition, damp)
    controls.target.lerp(goalTarget, damp)
    controls.update()

    const positionDone =
      camera.position.distanceTo(goalPosition) < SETTLE_DISTANCE
    const targetDone = controls.target.distanceTo(goalTarget) < SETTLE_DISTANCE

    if (positionDone && targetDone) {
      camera.position.copy(goalPosition)
      controls.target.copy(goalTarget)
      controls.update()
      animating.current = false
    }
  })

  return null
}
