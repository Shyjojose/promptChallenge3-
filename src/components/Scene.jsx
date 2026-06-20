import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Stars, useGLTF } from '@react-three/drei'
import { RigidBody } from '@react-three/rapier'
import FloatingObject from './FloatingObject'

// M2 FIX: `collider` shape moved into the data array (was a hard-coded JSX
// ternary checking id === 'ac_unit' || id === 'car' || id === 'laptop').
// Adding a new boxy object now requires editing ONLY this array — not JSX logic.
const OBJECTS = [
  {
    id: 'ac_unit',
    modelPath: '/models/ac_unit.glb',
    label: 'AC Unit',
    color: '#00d4ff',
    position: [-6, 3, 0],
    impulse: [0.05, 0.02, 0.02],
    scale: 1.5,
    collider: 'cuboid',
  },
  {
    id: 'car',
    modelPath: '/models/car.glb',
    label: 'Car',
    color: '#ff4d6d',
    position: [5, 2, -1],
    impulse: [-0.08, 0.04, 0.02],
    scale: 1.5,
    collider: 'cuboid',
  },
  {
    id: 'zuk',
    modelPath: '/models/free_zuk_3d_model.glb',
    label: 'Zuk Van',
    color: '#ff4d6d',
    position: [2, 0, -2],
    impulse: [-0.05, 0.02, 0.03],
    scale: 5,
    collider: 'cuboid',
  },
  {
    id: 'burger',
    modelPath: '/models/burger.glb',
    label: 'Burger',
    color: '#ff9500',
    position: [-3, -4, 1],
    impulse: [0.03, -0.05, 0.05],
    scale: 1.5,
    collider: 'ball',
  },
  {
    id: 'avocado',
    modelPath: '/models/avocado.glb',
    label: 'Avocado',
    color: '#00ff88',
    position: [4, -3, 2],
    impulse: [-0.04, 0.06, -0.02],
    scale: 40,
    collider: 'ball',
  },
  {
    id: 'duck',
    modelPath: '/models/duck.glb',
    label: 'Rubber Duck',
    color: '#ffd60a',
    position: [0, 5, -2],
    impulse: [0.05, -0.03, 0.06],
    scale: 1.5,
    collider: 'ball',
  },
  {
    id: 'waterbottle',
    modelPath: '/models/waterbottle.glb',
    label: 'Water Bottle',
    color: '#5bc0eb',
    position: [-5, -1, 3],
    impulse: [-0.05, 0.02, -0.04],
    scale: 10,
    collider: 'ball',
  },
  {
    id: 'coffeecup',
    modelPath: '/models/base_coffee_cup.glb',
    label: 'Coffee Cup',
    color: '#d4a373',
    position: [2, 3, 1],
    impulse: [0.04, -0.02, -0.05],
    scale: 0.5,
    collider: 'ball',
  },
  {
    id: 'laptop',
    modelPath: '',
    label: 'Laptop',
    color: '#95a5a6',
    position: [-2, 1, -2],
    impulse: [0.02, 0.05, 0.01],
    scale: 1.2,
    collider: 'cuboid',
  },
  {
    id: 'cloudstorage',
    modelPath: '/models/cloud_file_storage_-__anil.glb',
    label: 'Cloud Storage',
    color: '#3498db',
    position: [0, 2, 0],
    impulse: [-0.03, -0.04, 0.02],
    scale: 1,
    collider: 'ball',
  },
  {
    id: 'lightbulb',
    modelPath: '/models/incandescent_light_bulb.glb',
    label: 'Incandescent Bulb',
    color: '#f1c40f',
    position: [3, -1, 1],
    impulse: [0.03, 0.02, -0.01],
    scale: 10,
    collider: 'ball',
  },
  {
    id: 'shirt',
    modelPath: '/models/free_shirt.glb',
    label: 'Cotton Shirt',
    color: '#e74c3c',
    position: [-4, 2, 2],
    impulse: [0.04, 0.03, -0.02],
    scale: 0.3,
    collider: 'ball',
  },
]

function StarBackground() {
  const starsRef = useRef()

  useFrame((state, delta) => {
    if (starsRef.current) {
      starsRef.current.rotation.y += delta * 0.05
      starsRef.current.rotation.x += delta * 0.02
    }
  })

  return (
    <group ref={starsRef}>
      <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
    </group>
  )
}

function AmbientLights() {
  return (
    <>
      <ambientLight intensity={1.5} />
      <directionalLight position={[5, 10, 5]} intensity={2.0} color="#ffffff" />
      <pointLight position={[10, 10, 10]} intensity={1.5} color="#00d4ff" />
      <pointLight position={[-10, -10, -5]} intensity={1} color="#7b2fff" />
      <pointLight position={[0, 0, 15]} intensity={0.5} color="#ffffff" />
    </>
  )
}

function InvisibleWalls() {
  return (
    <>
      <RigidBody type="fixed" position={[0, 16, 0]} restitution={1.0} friction={0}>
        <mesh>
          <boxGeometry args={[60, 1, 60]} />
          <meshBasicMaterial visible={false} />
        </mesh>
      </RigidBody>
      <RigidBody type="fixed" position={[0, -16, 0]} restitution={1.0} friction={0}>
        <mesh>
          <boxGeometry args={[60, 1, 60]} />
          <meshBasicMaterial visible={false} />
        </mesh>
      </RigidBody>
      <RigidBody type="fixed" position={[24, 0, 0]} restitution={1.0} friction={0}>
        <mesh>
          <boxGeometry args={[1, 60, 60]} />
          <meshBasicMaterial visible={false} />
        </mesh>
      </RigidBody>
      <RigidBody type="fixed" position={[-24, 0, 0]} restitution={1.0} friction={0}>
        <mesh>
          <boxGeometry args={[1, 60, 60]} />
          <meshBasicMaterial visible={false} />
        </mesh>
      </RigidBody>
      <RigidBody type="fixed" position={[0, 0, 10]} restitution={1.0} friction={0}>
        <mesh>
          <boxGeometry args={[60, 60, 1]} />
          <meshBasicMaterial visible={false} />
        </mesh>
      </RigidBody>
      <RigidBody type="fixed" position={[0, 0, -20]} restitution={1.0} friction={0}>
        <mesh>
          <boxGeometry args={[60, 60, 1]} />
          <meshBasicMaterial visible={false} />
        </mesh>
      </RigidBody>
    </>
  )
}

export default function Scene({ onObjectClick, activeObjectId }) {
  return (
    <>
      <StarBackground />
      <AmbientLights />
      <InvisibleWalls />
      {OBJECTS.map((obj) => (
        <FloatingObject
          key={obj.id}
          {...obj}
          isActive={activeObjectId === obj.id}
          onClick={() => onObjectClick(obj.id)}
        />
      ))}
    </>
  )
}

// L3 FIX: Added explanatory comment so future contributors understand why
// useGLTF.preload() is called at module level (outside any component).
// @react-three/drei explicitly supports this pattern — it primes the GLTF
// asset cache at module evaluation time, preventing visible pop-in when
// FloatingObject components first mount and request their models.
OBJECTS.filter((obj) => obj.modelPath).forEach((obj) => useGLTF.preload(obj.modelPath))
