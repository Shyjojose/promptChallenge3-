import { useRef } from 'react'

export default function ProceduralLaptop({ scale = 1 }) {
  const group = useRef()
  
  return (
    <group ref={group} scale={scale}>
      {/* Base / Keyboard Half */}
      <mesh position={[0, -0.05, 0]}>
        <boxGeometry args={[1.6, 0.05, 1.1]} />
        <meshStandardMaterial color="#b0b5b9" roughness={0.3} metalness={0.8} />
      </mesh>
      
      {/* Keyboard Area (Dark inset) */}
      <mesh position={[0, -0.02, 0.1]}>
        <boxGeometry args={[1.4, 0.051, 0.5]} />
        <meshStandardMaterial color="#222" roughness={0.9} />
      </mesh>
      
      {/* Trackpad */}
      <mesh position={[0, -0.02, 0.45]}>
        <boxGeometry args={[0.5, 0.051, 0.15]} />
        <meshStandardMaterial color="#a0a5a9" roughness={0.4} />
      </mesh>

      {/* Screen Half (hinged at the back) */}
      <group position={[0, -0.025, -0.55]} rotation={[-Math.PI / 2.5, 0, 0]}>
        {/* Screen Lid / Backing */}
        <mesh position={[0, 0.55, 0]}>
          <boxGeometry args={[1.6, 1.1, 0.04]} />
          <meshStandardMaterial color="#b0b5b9" roughness={0.3} metalness={0.8} />
        </mesh>
        
        {/* Actual Display Screen (Glowing) */}
        <mesh position={[0, 0.55, 0.021]}>
          <boxGeometry args={[1.5, 0.95, 0.01]} />
          {/* Glowing blue screen */}
          <meshStandardMaterial color="#3498db" emissive="#2980b9" emissiveIntensity={0.8} />
        </mesh>
      </group>
    </group>
  )
}
