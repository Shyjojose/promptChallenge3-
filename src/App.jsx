import { Suspense, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Canvas } from '@react-three/fiber'
import { Physics } from '@react-three/rapier'
import Scene from './components/Scene'
import Modal from './components/Modal'
import Mascot from './components/Mascot'
import HUD from './components/HUD'
import ChatWindow from './components/ChatWindow'
import kbData from './data/kb_data.json'

function LoadingOverlay() {
  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8 }}
      style={{
        position: 'fixed', inset: 0,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        background: 'linear-gradient(135deg, #03050f 0%, #050d1f 50%, #020810 100%)',
        zIndex: 9999,
        pointerEvents: 'none',
      }}
    >
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
        style={{ fontSize: '56px', marginBottom: '20px', display: 'block' }}
      >
        🌍
      </motion.div>
      <div style={{
        color: '#00d4ff',
        fontFamily: 'Space Grotesk, sans-serif',
        fontSize: '18px',
        fontWeight: 600,
        letterSpacing: '0.05em',
      }}>
        Launching EcoSphere…
      </div>
      <div style={{ color: '#7ea8d4', fontSize: '13px', marginTop: '8px', fontFamily: 'Space Grotesk, sans-serif' }}>
        Loading zero-gravity environment
      </div>
    </motion.div>
  )
}

export default function App() {
  const [selectedObject, setSelectedObject] = useState(null) // { id, name, unit, co2_per_unit_kg, recommendation }
  const [mascotState, setMascotState] = useState({ emotion: 'happy', dialogue: null })
  const [totalCO2, setTotalCO2] = useState(0)
  const [contributions, setContributions] = useState({})
  const [chatContext, setChatContext] = useState(null)
  const [isLoaded, setIsLoaded] = useState(false)

  const handleObjectClick = useCallback((objectId) => {
    const data = kbData[objectId]
    if (!data) return
    setSelectedObject({ id: objectId, ...data })
  }, [])

  const handleModalClose = useCallback(() => {
    setSelectedObject(null)
    setMascotState(prev => ({ ...prev, dialogue: null }))
  }, [])

  const handleCO2Update = useCallback((objectId, co2Amount, mascotResponse) => {
    // Fix: compute total inside setContributions so we always work from the latest state
    setContributions(prev => {
      const next = { ...prev, [objectId]: co2Amount }
      const total = Object.values(next).reduce((sum, v) => sum + v, 0)
      setTotalCO2(parseFloat(total.toFixed(2)))
      return next
    })

    if (mascotResponse) {
      setMascotState({
        emotion: mascotResponse.emotion_state || 'thinking',
        dialogue: mascotResponse.dialogue,
      })
      setChatContext({
        object_name: mascotResponse.object_name || 'this item',
        co2_amount: co2Amount,
        recommendation: selectedObject?.recommendation || '',
        initialMessage: mascotResponse.dialogue
      })
    }
  }, [])

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      {/* 3D Canvas Layer */}
      <Canvas
        camera={{ position: [0, 0, 20], fov: 60 }}
        style={{ background: 'linear-gradient(135deg, #03050f 0%, #050d1f 50%, #020810 100%)' }}
        onCreated={() => setIsLoaded(true)}
      >
        <Suspense fallback={null}>
          <Physics gravity={[0, 0, 0]}>
            <Scene
              onObjectClick={handleObjectClick}
              activeObjectId={selectedObject?.id}
            />
          </Physics>
        </Suspense>
      </Canvas>

      {/* Loading overlay rendered in regular DOM, outside Canvas */}
      <AnimatePresence>
        {!isLoaded && <LoadingOverlay key="loader" />}
      </AnimatePresence>

      {/* 2D Overlay Layer */}
      <HUD totalCO2={totalCO2} contributions={contributions} kbData={kbData} />

      <Mascot
        emotion={mascotState.emotion}
        dialogue={chatContext ? null : mascotState.dialogue}
        onDismiss={() => setMascotState(prev => ({ ...prev, dialogue: null }))}
      />
      
      <AnimatePresence>
        {chatContext && (
          <ChatWindow 
            initialContext={chatContext} 
            onClose={() => setChatContext(null)} 
          />
        )}
      </AnimatePresence>

      {selectedObject && (
        <Modal
          object={selectedObject}
          onClose={handleModalClose}
          onSubmit={handleCO2Update}
          setMascotState={setMascotState}
        />
      )}
    </div>
  )
}
