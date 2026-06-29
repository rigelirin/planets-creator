import { Canvas } from '@react-three/fiber'
import { OrbitControls, Stars } from '@react-three/drei'
import { Bloom, EffectComposer, ToneMapping } from '@react-three/postprocessing'
import { ToneMappingMode } from 'postprocessing'
import { NoToneMapping } from 'three'
import { CAMERA_DISTANCE, STAR_COLOR, STAR_DIRECTION } from '@/constants'
import { usePlanetStore } from '@/state/usePlanetStore'
import { TerrainSphere } from './TerrainSphere'
import { WaterShell } from './WaterShell'
import { CloudShell } from './CloudShell'
import { AtmosphereShell } from './AtmosphereShell'
import { RingShell } from './RingShell'
import { CaptureRenderer } from './CaptureRenderer'

const STAR_POS: [number, number, number] = [
  STAR_DIRECTION.x * 6,
  STAR_DIRECTION.y * 6,
  STAR_DIRECTION.z * 6,
]

export function PlanetCanvas() {
  // Selectors: re-render only when these booleans flip (not on slider drags).
  const oceanEnabled = usePlanetStore((s) => s.params.oceanEnabled)
  const cloudsEnabled = usePlanetStore((s) => s.params.cloudsEnabled)
  const atmosphereEnabled = usePlanetStore((s) => s.params.atmosphereEnabled)
  const ringsEnabled = usePlanetStore((s) => s.params.ringsEnabled)

  return (
    <Canvas
      camera={{ position: [0, 0, CAMERA_DISTANCE], fov: 45, near: 0.01, far: 100 }}
      // Tonemap once, in the composer, AFTER bloom — so terrain (PBR) and the raw
      // ShaderMaterial shells are tonemapped identically. preserveDrawingBuffer
      // keeps the composed frame readable for the screenshot button.
      gl={{ antialias: true, toneMapping: NoToneMapping, preserveDrawingBuffer: true }}
      dpr={[1, 2]}
    >
      <color attach="background" args={['#05060a']} />
      <ambientLight intensity={0.13} />
      <directionalLight position={STAR_POS} intensity={2.2} color={STAR_COLOR} />

      <CaptureRenderer />
      <TerrainSphere />
      {oceanEnabled && <WaterShell />}
      {cloudsEnabled && <CloudShell />}
      {atmosphereEnabled && <AtmosphereShell />}
      {ringsEnabled && <RingShell />}

      <Stars radius={80} depth={50} count={4000} factor={2.2} fade speed={0} />
      <OrbitControls enablePan={false} minDistance={1.3} maxDistance={10} enableDamping />

      <EffectComposer>
        <Bloom mipmapBlur luminanceThreshold={0.8} intensity={0.7} radius={0.6} />
        <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
      </EffectComposer>
    </Canvas>
  )
}
