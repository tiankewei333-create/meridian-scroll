import { useFrame, useThree } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { getCameraPose } from '../data/cameras'
import { useConfiguratorStore } from '../stores'

type OrbitLike = {
  target: THREE.Vector3
  update: () => void
}

/** Smoothly frames the yacht for the active configuration step. */
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
  const initialized = useRef(false)

  useFrame((_, delta) => {
    if (!controls) return

    if (!initialized.current) {
      camera.position.copy(goalPosition)
      controls.target.copy(goalTarget)
      controls.update()
      initialized.current = true
      return
    }

    const damp = 1 - Math.exp(-3.2 * delta)
    camera.position.lerp(goalPosition, damp)
    controls.target.lerp(goalTarget, damp)
    controls.update()
  })

  return null
}
