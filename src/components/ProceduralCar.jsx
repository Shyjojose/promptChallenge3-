import { useRef } from 'react'
import * as THREE from 'three'

export default function ProceduralCar({ scale = 1 }) {
  const group = useRef()
  
  return (
    <group ref={group} scale={scale}>
      {/* Main Chassis */}
      <mesh position={[0, 0.25, 0]}>
        <boxGeometry args={[2, 0.4, 1]} />
        <meshStandardMaterial color="#e74c3c" roughness={0.4} metalness={0.6} />
      </mesh>
      
      {/* Cabin / Roof */}
      <mesh position={[-0.2, 0.6, 0]}>
        <boxGeometry args={[1.2, 0.4, 0.9]} />
        <meshStandardMaterial color="#c0392b" roughness={0.4} metalness={0.6} />
      </mesh>

      {/* Windows (Dark Glass) */}
      {/* Windshield */}
      <mesh position={[0.41, 0.6, 0]} rotation={[0, 0, -0.2]}>
        <boxGeometry args={[0.05, 0.35, 0.85]} />
        <meshStandardMaterial color="#2c3e50" roughness={0.1} metalness={0.9} />
      </mesh>
      {/* Rear Window */}
      <mesh position={[-0.81, 0.6, 0]} rotation={[0, 0, 0.2]}>
        <boxGeometry args={[0.05, 0.35, 0.85]} />
        <meshStandardMaterial color="#2c3e50" roughness={0.1} metalness={0.9} />
      </mesh>
      {/* Side Windows */}
      <mesh position={[-0.2, 0.6, 0.46]}>
        <boxGeometry args={[1.1, 0.3, 0.05]} />
        <meshStandardMaterial color="#2c3e50" roughness={0.1} metalness={0.9} />
      </mesh>
      <mesh position={[-0.2, 0.6, -0.46]}>
        <boxGeometry args={[1.1, 0.3, 0.05]} />
        <meshStandardMaterial color="#2c3e50" roughness={0.1} metalness={0.9} />
      </mesh>

      {/* Wheels */}
      {/* Front Left */}
      <mesh position={[0.6, 0.1, 0.5]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.25, 0.25, 0.15, 32]} />
        <meshStandardMaterial color="#111111" roughness={0.9} />
      </mesh>
      {/* Front Right */}
      <mesh position={[0.6, 0.1, -0.5]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.25, 0.25, 0.15, 32]} />
        <meshStandardMaterial color="#111111" roughness={0.9} />
      </mesh>
      {/* Rear Left */}
      <mesh position={[-0.6, 0.1, 0.5]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.25, 0.25, 0.15, 32]} />
        <meshStandardMaterial color="#111111" roughness={0.9} />
      </mesh>
      {/* Rear Right */}
      <mesh position={[-0.6, 0.1, -0.5]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.25, 0.25, 0.15, 32]} />
        <meshStandardMaterial color="#111111" roughness={0.9} />
      </mesh>

      {/* Headlights */}
      <mesh position={[1.01, 0.35, 0.3]}>
        <boxGeometry args={[0.02, 0.15, 0.2]} />
        <meshStandardMaterial color="#ffffcc" emissive="#ffffcc" emissiveIntensity={1} />
      </mesh>
      <mesh position={[1.01, 0.35, -0.3]}>
        <boxGeometry args={[0.02, 0.15, 0.2]} />
        <meshStandardMaterial color="#ffffcc" emissive="#ffffcc" emissiveIntensity={1} />
      </mesh>

      {/* Taillights */}
      <mesh position={[-1.01, 0.35, 0.3]}>
        <boxGeometry args={[0.02, 0.1, 0.2]} />
        <meshStandardMaterial color="#ff0000" emissive="#ff0000" emissiveIntensity={0.8} />
      </mesh>
      <mesh position={[-1.01, 0.35, -0.3]}>
        <boxGeometry args={[0.02, 0.1, 0.2]} />
        <meshStandardMaterial color="#ff0000" emissive="#ff0000" emissiveIntensity={0.8} />
      </mesh>
    </group>
  )
}
