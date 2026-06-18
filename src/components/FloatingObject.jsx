import { useRef, useState, useEffect } from 'react'
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

function GLBModel({ modelPath, color, baseScale = 1.5 }) {
  const { scene } = useGLTF(modelPath)
  const clonedScene = scene.clone()

  return <primitive object={clonedScene} scale={baseScale} />
}

export default function FloatingObject({
  id, modelPath, label, color, position, impulse, scale = 1.5, isActive, onClick,
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
        rigidRef.current.setLinvel({ x: impulse[0] * 20, y: impulse[1] * 20, z: impulse[2] * 20 }, true)
        rigidRef.current.setAngvel({ x: impulse[0] * 5, y: impulse[1] * 5, z: impulse[2] * 5 }, true)
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
      colliders={id === 'ac_unit' || id === 'car' || id === 'laptop' ? 'cuboid' : 'ball'}
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
            <meshBasicMaterial
              color={color}
              transparent
              opacity={0.08}
              side={THREE.BackSide}
            />
          </mesh>
        )}

        <group
          onPointerOver={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = 'pointer' }}
          onPointerOut={() => { setHovered(false); document.body.style.cursor = 'auto' }}
          onClick={(e) => {
            e.stopPropagation()
            onClick()
          }}
        >
          {id === 'burger' ? (
            <ProceduralBurger scale={scale * 1.5} />
          ) : id === 'ac_unit' ? (
            <ProceduralAC scale={scale} />
          ) : id === 'car' ? (
            <ProceduralCar scale={scale} />
          ) : id === 'laptop' ? (
            <ProceduralLaptop scale={scale} />
          ) : (
            <GLBModel modelPath={modelPath} color={color} baseScale={scale} />
          )}
        </group>

        {/* Floating label */}
        <Html
          position={[0, 1.5, 0]}
          center
          style={{
            pointerEvents: 'none',
            opacity: hovered || isActive ? 1 : 0,
            transition: 'opacity 0.2s',
          }}
        >
          <div style={{
            background: 'rgba(3,5,15,0.9)',
            border: `1px solid ${color}`,
            borderRadius: '8px',
            padding: '4px 12px',
            color: color,
            fontFamily: 'Space Grotesk, sans-serif',
            fontSize: '13px',
            fontWeight: '600',
            whiteSpace: 'nowrap',
            boxShadow: `0 0 12px ${color}55`,
            transform: 'translateY(-60px)',
          }}>
            {label}
          </div>
        </Html>
      </group>
    </RigidBody>
  )
}
