import { useRef, useState, useEffect, useMemo, Component } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGLTF, Html } from '@react-three/drei'
import { RigidBody } from '@react-three/rapier'
import * as THREE from 'three'
import ProceduralBurger from './ProceduralBurger'
import ProceduralAC from './ProceduralAC'
import ProceduralCar from './ProceduralCar'
import ProceduralLaptop from './ProceduralLaptop'

// Memoize geometry outside render to avoid re-instantiation (anti-memory-leak)
const FALLBACK_GEO = new THREE.SphereGeometry(0.8, 16, 16)
const FALLBACK_MAT = new THREE.MeshStandardMaterial({ color: '#ff0055' })

// M3 FIX: Error boundary wrapping GLBModel so a missing or malformed .glb
// file cannot crash the entire Canvas (previously an unhandled throw would
// propagate up and kill the whole React tree, including the 3D scene).
class GLBErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error) {
    console.warn('[GLBErrorBoundary] Failed to load model:', error.message)
  }

  render() {
    if (this.state.hasError) {
      // Render a simple fallback sphere so the physics body still exists
      return <mesh geometry={FALLBACK_GEO} material={FALLBACK_MAT} />
    }
    return this.props.children
  }
}

function GLBModel({ modelPath, baseScale = 1.5 }) {
  const { scene } = useGLTF(modelPath)
  const clonedScene = useMemo(() => scene.clone(), [scene])

  return <primitive object={clonedScene} scale={baseScale} />
}

function ObjectModel({ id, scale, modelPath }) {
  if (id === 'burger') return <ProceduralBurger scale={scale * 1.5} />
  if (id === 'ac_unit') return <ProceduralAC scale={scale} />
  if (id === 'car') return <ProceduralCar scale={scale} />
  if (id === 'laptop') return <ProceduralLaptop scale={scale} />

  return (
    // M3 FIX: Wrapped in GLBErrorBoundary — a bad model URL now
    // renders a fallback sphere instead of crashing the whole scene.
    <GLBErrorBoundary>
      <GLBModel modelPath={modelPath} baseScale={scale} />
    </GLBErrorBoundary>
  )
}

export default function FloatingObject({
  // M2 FIX: `collider` now comes from the OBJECTS data in Scene.jsx instead
  // of being derived from a hard-coded JSX ternary checking id values.
  id,
  modelPath,
  label,
  color,
  position,
  impulse,
  scale = 1.5,
  collider = 'ball',
  isActive,
  onClick,
}) {
  const rigidRef = useRef()
  const meshGroupRef = useRef()
  const [hovered, setHovered] = useState(false)
  const clock = useRef(0)

  // Apply initial drift velocity once the body is ready
  useEffect(() => {
    // A small timeout ensures Rapier has initialized the rigid body
    const timer = setTimeout(() => {
      if (rigidRef.current) {
        rigidRef.current.setLinvel(
          { x: impulse[0] * 20, y: impulse[1] * 20, z: impulse[2] * 20 },
          true
        )
        rigidRef.current.setAngvel(
          { x: impulse[0] * 5, y: impulse[1] * 5, z: impulse[2] * 5 },
          true
        )
      }
    }, 100)
    return () => clearTimeout(timer)
  }, [impulse])

  // Animate scale smoothly via ref — NEVER via useState (would cause re-render per frame)
  useFrame((state, delta) => {
    if (!meshGroupRef.current) return
    clock.current += delta

    const targetScale = isActive ? 1.4 : hovered ? 1.2 : 1.0
    const currentScale = meshGroupRef.current.scale.x
    const newScale = THREE.MathUtils.lerp(currentScale, targetScale, delta * 5)
    meshGroupRef.current.scale.setScalar(newScale)
  })

  return (
    <RigidBody
      ref={rigidRef}
      position={position}
      colliders={collider}
      linearDamping={0}
      angularDamping={0}
      restitution={1.0}
      friction={0}
    >
      <group ref={meshGroupRef}>
        {/* Glow outline ring when hovered */}
        {(hovered || isActive) && (
          <mesh>
            <sphereGeometry args={[1.1, 16, 16]} />
            <meshBasicMaterial color={color} transparent opacity={0.08} side={THREE.BackSide} />
          </mesh>
        )}

        <group
          onPointerOver={(e) => {
            e.stopPropagation()
            setHovered(true)
            document.body.style.cursor = 'pointer'
          }}
          onPointerOut={() => {
            setHovered(false)
            document.body.style.cursor = 'auto'
          }}
          onClick={(e) => {
            e.stopPropagation()
            onClick()
          }}
        >
          <ObjectModel id={id} scale={scale} modelPath={modelPath} />
        </group>

        {/* Floating label — uses CSS vars via inline style in Html overlay */}
        <Html
          position={[0, 1.5, 0]}
          center
          style={{
            pointerEvents: 'none',
            opacity: hovered || isActive ? 1 : 0,
            transition: 'opacity 0.2s',
          }}
        >
          <div
            style={{
              background: 'rgba(3,5,15,0.9)',
              border: `1px solid ${color}`,
              borderRadius: '8px',
              padding: '4px 12px',
              color: color,
              fontFamily: 'var(--font-main)',
              fontSize: '13px',
              fontWeight: '600',
              whiteSpace: 'nowrap',
              boxShadow: `0 0 12px ${color}55`,
              transform: 'translateY(-60px)',
            }}
          >
            {label}
          </div>
        </Html>
      </group>
    </RigidBody>
  )
}
