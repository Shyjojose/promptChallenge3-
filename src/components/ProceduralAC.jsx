import { useRef } from 'react'

export default function ProceduralAC({ scale = 1 }) {
  const group = useRef()
  
  return (
    <group ref={group} scale={scale}>
      {/* Main Body */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[1.5, 0.6, 0.5]} />
        <meshStandardMaterial color="#ffffff" roughness={0.6} />
      </mesh>
      
      {/* Front Vent Area */}
      <mesh position={[0, -0.1, 0.26]}>
        <boxGeometry args={[1.3, 0.25, 0.05]} />
        <meshStandardMaterial color="#222222" roughness={0.8} />
      </mesh>

      {/* Vent Louvers (Blades) */}
      <mesh position={[0, -0.05, 0.28]}>
        <boxGeometry args={[1.2, 0.02, 0.02]} />
        <meshStandardMaterial color="#dddddd" roughness={0.5} />
      </mesh>
      <mesh position={[0, -0.15, 0.28]}>
        <boxGeometry args={[1.2, 0.02, 0.02]} />
        <meshStandardMaterial color="#dddddd" roughness={0.5} />
      </mesh>
      
      {/* Top Intake Grill */}
      <mesh position={[0, 0.31, 0]}>
        <boxGeometry args={[1.2, 0.02, 0.3]} />
        <meshStandardMaterial color="#bbbbbb" roughness={0.7} />
      </mesh>

      {/* Brand Logo Plate */}
      <mesh position={[0.6, 0.15, 0.26]}>
        <boxGeometry args={[0.15, 0.05, 0.02]} />
        <meshStandardMaterial color="#aaaaaa" roughness={0.3} metalness={0.8} />
      </mesh>

      {/* Power LED Indicator */}
      <mesh position={[0.65, -0.1, 0.26]}>
        <sphereGeometry args={[0.03, 16, 16]} />
        <meshStandardMaterial color="#00ff88" emissive="#00ff88" emissiveIntensity={1.5} />
      </mesh>
    </group>
  )
}
