import { useRef } from 'react'

export default function ProceduralBurger({ scale = 1 }) {
  const group = useRef()
  
  return (
    <group ref={group} scale={scale}>
      {/* Top Bun */}
      <mesh position={[0, 0.45, 0]}>
        <sphereGeometry args={[0.5, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#e59866" roughness={0.8} />
      </mesh>
      
      {/* Lettuce */}
      <mesh position={[0, 0.3, 0]} scale={[1, 0.1, 1]}>
        <cylinderGeometry args={[0.55, 0.55, 0.2, 16]} />
        <meshStandardMaterial color="#2ecc71" roughness={0.9} />
      </mesh>
      
      {/* Cheese */}
      <mesh position={[0, 0.2, 0]} rotation={[0, Math.PI / 4, 0]}>
        <boxGeometry args={[0.8, 0.05, 0.8]} />
        <meshStandardMaterial color="#f1c40f" roughness={0.5} />
      </mesh>
      
      {/* Patty */}
      <mesh position={[0, 0.05, 0]}>
        <cylinderGeometry args={[0.5, 0.5, 0.25, 32]} />
        <meshStandardMaterial color="#5c4033" roughness={1} />
      </mesh>
      
      {/* Bottom Bun */}
      <mesh position={[0, -0.15, 0]}>
        <cylinderGeometry args={[0.5, 0.45, 0.15, 32]} />
        <meshStandardMaterial color="#e59866" roughness={0.8} />
      </mesh>
    </group>
  )
}
