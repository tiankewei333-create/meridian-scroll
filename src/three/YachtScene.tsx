import {
  ContactShadows,
  OrbitControls,
  useGLTF,
} from '@react-three/drei'
import { useLayoutEffect, useMemo } from 'react'
import * as THREE from 'three'
import {
  ACCENT_STRIPES,
  DECKS,
  DETAILS,
  HULL_COLORS,
  SUNPADS,
  UPHOLSTERIES,
} from '../data'
import { useConfiguratorStore } from '../stores'
import { StepCamera } from './StepCamera'

const YACHT_URL = '/models/yacht/small_yacht.compressed.glb?v=draco-webp-v1'
const DRACO_PATH = '/draco/'
const TARGET_SIZE = 6

const UPHOLSTERY_NAMES = new Set([
  'interior_cockpit',
  'interior_dash',
  'interior_vinyl',
])

function prepareMaterials(root: THREE.Object3D) {
  root.traverse((obj) => {
    if (!(obj instanceof THREE.Mesh)) return

    obj.castShadow = true
    obj.receiveShadow = true

    const source = obj.material
    const list = Array.isArray(source) ? source : [source]
    const cloned = list.map((material) => {
      if (!material) return material
      const next = material.clone()
      next.side = THREE.DoubleSide
      next.needsUpdate = true
      return next
    })

    obj.material = Array.isArray(source) ? cloned : cloned[0]!
  })
}

/** Resolve Blender object name from mesh or any ancestor node. */
function matchesNodePrefix(obj: THREE.Object3D, prefix: string) {
  const key = prefix.toLowerCase()
  let current: THREE.Object3D | null = obj
  while (current) {
    if (current.name.toLowerCase().startsWith(key)) return true
    current = current.parent
  }
  return false
}

function matchesExactNode(obj: THREE.Object3D, name: string) {
  const key = name.toLowerCase()
  let current: THREE.Object3D | null = obj
  while (current) {
    if (current.name.toLowerCase() === key) return true
    current = current.parent
  }
  return false
}

function matchesUpholstery(obj: THREE.Object3D) {
  let current: THREE.Object3D | null = obj
  while (current) {
    if (UPHOLSTERY_NAMES.has(current.name.toLowerCase())) return true
    current = current.parent
  }
  return false
}

type PaintOptions = {
  /** Keep albedo map and only tint (good for teak decks). */
  keepMap?: boolean
}

function applyPaint(
  root: THREE.Object3D,
  matcher: (obj: THREE.Mesh) => boolean,
  color: string,
  options: PaintOptions = {},
) {
  root.traverse((obj) => {
    if (!(obj instanceof THREE.Mesh) || !matcher(obj)) return

    const materials = Array.isArray(obj.material) ? obj.material : [obj.material]
    for (const material of materials) {
      if (!material || !('color' in material)) continue
      const mat = material as THREE.MeshStandardMaterial
      if (mat.transparent && mat.opacity < 0.9) continue

      if (!options.keepMap && mat.map) {
        mat.map = null
      }
      mat.vertexColors = false
      mat.color.set(color)
      mat.needsUpdate = true
    }
  })
}

function applyDetailVisibility(root: THREE.Object3D, enabledIds: string[]) {
  const enabledMeshes = new Set(
    DETAILS.filter((detail) => enabledIds.includes(detail.id))
      .map((detail) => detail.mesh?.toLowerCase())
      .filter((name): name is string => Boolean(name)),
  )

  root.traverse((obj) => {
    if (!obj.name.toLowerCase().startsWith('detail')) return
    obj.visible = enabledMeshes.has(obj.name.toLowerCase())
  })
}

function YachtModel() {
  const { scene } = useGLTF(YACHT_URL, DRACO_PATH)
  const config = useConfiguratorStore((s) => s.config)

  const hullColor =
    HULL_COLORS.find((o) => o.id === config.hullColor)?.color ?? '#f3f1ea'
  const accentColor =
    ACCENT_STRIPES.find((o) => o.id === config.accentStripe)?.color ?? '#0c2340'
  const sunpadColor =
    SUNPADS.find((o) => o.id === config.sunpad)?.color ?? '#f2ebe0'
  const deckColor =
    DECKS.find((o) => o.id === config.deck)?.color ?? '#b08956'
  const upholsteryColor =
    UPHOLSTERIES.find((o) => o.id === config.upholstery)?.color ?? '#f4f2ed'

  const { root, position, scale } = useMemo(() => {
    const root = scene.clone(true)
    prepareMaterials(root)

    const box = new THREE.Box3().setFromObject(root)
    const size = box.getSize(new THREE.Vector3())
    const center = box.getCenter(new THREE.Vector3())
    const maxDim = Math.max(size.x, size.y, size.z, 0.001)
    const nextScale = TARGET_SIZE / maxDim

    return {
      root,
      scale: nextScale,
      position: new THREE.Vector3(
        -center.x * nextScale,
        -box.min.y * nextScale,
        -center.z * nextScale,
      ),
    }
  }, [scene])

  useLayoutEffect(() => {
    applyPaint(root, (m) => matchesNodePrefix(m, 'Hull'), hullColor)
    applyPaint(root, (m) => matchesNodePrefix(m, 'Accent'), accentColor)
    applyPaint(root, (m) => matchesNodePrefix(m, 'Sunpad'), sunpadColor)
    // Keep wood grain on deck; only tint the teak map.
    applyPaint(
      root,
      (m) => matchesExactNode(m, 'Interior_Deck'),
      deckColor,
      { keepMap: true },
    )
    applyPaint(root, (m) => matchesUpholstery(m), upholsteryColor)
    applyDetailVisibility(root, config.details)
  }, [
    root,
    hullColor,
    accentColor,
    sunpadColor,
    deckColor,
    upholsteryColor,
    config.details,
  ])

  return (
    // Model bow originally faces -X (left). Rotate 180° so bow faces +X,
    // matching camera presets (sunpad / cockpit).
    <group rotation={[0, Math.PI * 1.15, 0]}>
      <primitive object={root} scale={scale} position={position} />
    </group>
  )
}

useGLTF.preload(YACHT_URL, DRACO_PATH)

export function YachtScene() {
  return (
    <>
      <color attach="background" args={['#eef1f4']} />
      <ambientLight intensity={0.7} />
      <directionalLight
        castShadow
        position={[6, 10, 4]}
        intensity={1.4}
        shadow-mapSize={[1024, 1024]}
      />
      <hemisphereLight intensity={0.35} groundColor="#c9d1d9" />
      <YachtModel />
      <ContactShadows
        position={[0, 0, 0]}
        opacity={0.4}
        scale={14}
        blur={2.5}
        far={8}
      />
      <OrbitControls
        makeDefault
        enablePan={false}
        minPolarAngle={0.15}
        maxPolarAngle={Math.PI / 2.05}
        minDistance={2.5}
        maxDistance={20}
        target={[0, 0.8, 0]}
      />
      <StepCamera />
    </>
  )
}
