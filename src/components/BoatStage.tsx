import { Canvas } from '@react-three/fiber'
import { useProgress } from '@react-three/drei'
import { Component, Suspense, type ReactNode } from 'react'
import { useConfiguratorStore } from '../stores'
import { YachtScene } from '../three/YachtScene'

class StageErrorBoundary extends Component<
  { children: ReactNode },
  { error: Error | null }
> {
  state: { error: Error | null } = { error: null }

  static getDerivedStateFromError(error: Error) {
    return { error }
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex h-full items-center justify-center px-6 text-center">
          <div>
            <p className="text-sm font-medium text-ink">3D 预览加载失败</p>
            <p className="mt-2 max-w-md text-xs text-muted">
              {this.state.error.message}
            </p>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

function StageLoadingOverlay() {
  const { active, progress, item } = useProgress()

  if (!active) return null

  const percent = Math.min(100, Math.round(progress))

  return (
    <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center bg-stage/90 backdrop-blur-[2px]">
      <div className="w-64 text-center">
        <p className="text-sm font-medium text-ink">正在加载游艇模型</p>
        <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-line">
          <div
            className="h-full rounded-full bg-brand transition-[width] duration-200"
            style={{ width: `${percent}%` }}
          />
        </div>
        <p className="mt-2 text-xs text-muted">{percent}%</p>
        {item ? (
          <p className="mt-1 truncate text-[11px] text-muted/80">{item}</p>
        ) : null}
      </div>
    </div>
  )
}

export function BoatStage() {
  const model = useConfiguratorStore((s) => s.config.model)

  return (
    <section className="relative flex min-h-0 flex-1 flex-col bg-stage">
      <div className="relative min-h-0 flex-1">
        <StageLoadingOverlay />
        <StageErrorBoundary>
          <Canvas
            className="h-full w-full touch-none"
            shadows
            camera={{ position: [7.2, 4, 7], fov: 40, near: 0.1, far: 500 }}
            gl={{ antialias: true, alpha: false }}
            onCreated={({ gl }) => {
              gl.setClearColor('#eef1f4')
            }}
          >
            <Suspense fallback={null}>
              <YachtScene />
            </Suspense>
          </Canvas>
        </StageErrorBoundary>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-6 z-10 text-center">
        <p className="text-2xl font-semibold tracking-wide text-ink uppercase">
          {model}
        </p>
        <p className="mt-1 text-xs tracking-widest text-muted uppercase">
          拖动旋转 · 切换步骤自动对焦
        </p>
      </div>
    </section>
  )
}
