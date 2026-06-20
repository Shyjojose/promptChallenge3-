import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const MASCOT_IMAGES = {
  happy: '/images/earth_happy.webp',
  sweating: '/images/earth_sweating.webp',
  thinking: '/images/earth_thinking.webp',
}

// L1 FIX: Replaced setInterval with a recursive setTimeout approach.
// setInterval doesn't sync to the browser paint cycle; recursive setTimeout
// yields control back to the event loop between characters, producing smoother
// rendering in animation-heavy WebGL pages.
function TypewriterText({ text }) {
  const [displayed, setDisplayed] = useState('')
  const indexRef = useRef(0)
  const timerRef = useRef(null)

  useEffect(() => {
    // Reset on new text
    setDisplayed('')
    indexRef.current = 0

    if (!text) return

    const tick = () => {
      if (indexRef.current < text.length) {
        indexRef.current += 1
        setDisplayed(text.slice(0, indexRef.current))
        timerRef.current = setTimeout(tick, 22)
      }
    }

    timerRef.current = setTimeout(tick, 22)
    return () => clearTimeout(timerRef.current)
  }, [text])

  return <span>{displayed}</span>
}

export default function Mascot({ emotion, dialogue, onDismiss }) {
  const src = MASCOT_IMAGES[emotion] || MASCOT_IMAGES.happy

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        gap: '12px',
        zIndex: 100,
        pointerEvents: 'none',
      }}
    >
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
                // H4 FIX: CSS vars throughout
                background: 'var(--bg-overlay-light)',
                border: '1px solid var(--border-cyan-dim)',
                borderRadius: '16px 16px 4px 16px',
                padding: '14px 16px',
                color: 'var(--text-primary)',
                fontFamily: 'var(--font-main)',
                fontSize: '14px',
                lineHeight: '1.5',
                backdropFilter: 'blur(20px)',
                boxShadow: 'var(--shadow-card), var(--glow-cyan)',
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
                  border: '1px solid var(--border-cyan)',
                  borderRadius: '6px',
                  color: 'var(--accent-cyan)',
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
