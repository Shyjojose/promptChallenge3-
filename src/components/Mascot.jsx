import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const MASCOT_IMAGES = {
  happy:    '/images/earth_happy.webp',
  sweating: '/images/earth_sweating.webp',
  thinking: '/images/earth_thinking.webp',
}

function TypewriterText({ text }) {
  const [displayed, setDisplayed] = useState('')

  useEffect(() => {
    setDisplayed('')
    if (!text) return
    let i = 0
    const interval = setInterval(() => {
      if (i < text.length) {
        setDisplayed(text.slice(0, i + 1))
        i++
      } else {
        clearInterval(interval)
      }
    }, 22)
    return () => clearInterval(interval)
  }, [text])

  return <span>{displayed}</span>
}

export default function Mascot({ emotion, dialogue, onDismiss }) {
  const src = MASCOT_IMAGES[emotion] || MASCOT_IMAGES.happy

  return (
    <div style={{
      position: 'fixed',
      bottom: '24px',
      right: '24px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-end',
      gap: '12px',
      zIndex: 100,
      pointerEvents: 'none',
    }}>
      {/* Speech bubble — aria-live so screen readers announce new dialogue */}
      <div aria-live="polite" aria-atomic="true">
        <AnimatePresence>
          {dialogue && (
            <motion.div
              key={dialogue}
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              style={{
                maxWidth: '280px',
                background: 'rgba(3, 5, 15, 0.92)',
                border: '1px solid rgba(0, 212, 255, 0.3)',
                borderRadius: '16px 16px 4px 16px',
                padding: '14px 16px',
                color: '#e8f4ff',
                fontFamily: 'Space Grotesk, sans-serif',
                fontSize: '14px',
                lineHeight: '1.5',
                backdropFilter: 'blur(20px)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.5), 0 0 20px rgba(0,212,255,0.1)',
                pointerEvents: 'all',
              }}
            >
              <TypewriterText text={dialogue} />
              <button
                onClick={onDismiss}
                style={{
                  display: 'block',
                  marginTop: '8px',
                  background: 'transparent',
                  border: '1px solid rgba(0,212,255,0.4)',
                  borderRadius: '6px',
                  color: '#00d4ff',
                  fontSize: '12px',
                  padding: '3px 10px',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                Got it ✓
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Mascot avatar */}
      <motion.div
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        whileHover={{ scale: 1.08 }}
        style={{ pointerEvents: 'all' }}
      >
        <motion.img
          key={src}
          src={src}
          alt={`Terra the Earth mascot, ${emotion}`}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3 }}
          style={{
            width: '120px',
            height: '120px',
            objectFit: 'contain',
            filter: 'drop-shadow(0 0 16px rgba(0,255,136,0.5))',
            borderRadius: '50%',
          }}
        />
      </motion.div>
    </div>
  )
}
