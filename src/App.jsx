import { Suspense, useState, useCallback } from 'react'
import { AnimatePresence } from 'framer-motion'
import { Canvas } from '@react-three/fiber'
import { Physics } from '@react-three/rapier'
import Scene from './components/Scene'
import Modal from './components/Modal'
import Mascot from './components/Mascot'
import HUD from './components/HUD'
import ChatWindow from './components/ChatWindow'
import kbData from './data/kb_data.json'

export default function App() {
  const [selectedObject, setSelectedObject] = useState(null) // { id, name, unit, co2_per_unit_kg, recommendation }
  const [mascotState, setMascotState] = useState({ emotion: 'happy', dialogue: null })
  const [totalCO2, setTotalCO2] = useState(0)
  const [contributions, setContributions] = useState({})
  const [chatContext, setChatContext] = useState(null)

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
    setContributions(prev => ({ ...prev, [objectId]: co2Amount }))
    setTotalCO2(prev => {
      const oldContrib = contributions[objectId] || 0
      return parseFloat((prev - oldContrib + co2Amount).toFixed(2))
    })

    if (mascotResponse) {
      setMascotState({
        emotion: mascotResponse.emotion_state || 'thinking',
        dialogue: mascotResponse.dialogue,
      })
      
      // Open the chat with the initial response and context
      setChatContext({
        object_name: mascotResponse.object_name || 'this item',
        initialMessage: mascotResponse.dialogue
      })
    }
  }, [contributions])

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      {/* 3D Canvas Layer */}
      <Canvas
        camera={{ position: [0, 0, 20], fov: 60 }}
        style={{ background: 'linear-gradient(135deg, #03050f 0%, #050d1f 50%, #020810 100%)' }}
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

      {/* 2D Overlay Layer */}
      <HUD totalCO2={totalCO2} contributions={contributions} />

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
