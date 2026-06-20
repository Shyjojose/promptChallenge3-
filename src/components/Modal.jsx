import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

async function callTerraAPI(payload) {
  try {
    const res = await fetch('/api/terra', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return await res.json()
  } catch (err) {
    console.warn('Terra API call failed, using fallback:', err.message)
    return {
      dialogue: `Phew, my connection is fuzzy! But try this: ${payload.kb_recommendation}`,
      emotion_state: 'thinking',
    }
  }
}

const SLIDER_RANGES = {
  ac_unit:     { min: 0, max: 24,  step: 1,   default: 4 },
  car:         { min: 0, max: 200, step: 5,    default: 30 },
  burger:      { min: 0, max: 30,  step: 1,    default: 3 },
  avocado:     { min: 0, max: 50,  step: 1,    default: 5 },
  duck:        { min: 0, max: 20,  step: 1,    default: 1 },
  waterbottle: { min: 0, max: 100, step: 1,    default: 5 },
}

export default function Modal({ object, onClose, onSubmit, setMascotState }) {
  const range = SLIDER_RANGES[object.id] || { min: 0, max: 100, step: 1, default: 10 }
  const [value, setValue] = useState(range.default)
  const [loading, setLoading] = useState(false)

  const co2 = parseFloat((value * object.co2_per_unit_kg).toFixed(2))
  const isHigh = co2 > 5

  // L2 FIX: Memoize co2Color so it isn't recalculated on every render during
  // slider drag events (previously a plain ternary expression on every render).
  const co2Color = useMemo(() => {
    if (co2 < 2) return 'var(--accent-green)'
    if (co2 < 10) return 'var(--accent-orange)'
    return 'var(--accent-red)'
  }, [co2])

  const handleSubmit = async () => {
    setLoading(true)
    setMascotState({ emotion: 'thinking', dialogue: null })

    const mascotResponse = await callTerraAPI({
      object_name: object.name,
      user_input: value,
      co2_amount: co2,
      kb_recommendation: object.recommendation,
      unit: object.unit,
    })

    mascotResponse.object_name = object.name
    // H2 FIX: Pass object.recommendation as the 4th argument so App.jsx can
    // store it without relying on a potentially stale selectedObject closure.
    onSubmit(object.id, co2, mascotResponse, object.recommendation)
    setLoading(false)
    onClose()
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{
          position: 'fixed', inset: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(8px)',
          zIndex: 200,
        }}
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.85, opacity: 0, y: 30 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ duration: 0.3, ease: [0.34, 1.56, 0.64, 1] }}
          className="glass"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-object-title"
          style={{ width: '420px', padding: '32px', position: 'relative' }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <button
            onClick={onClose}
            style={{
              position: 'absolute', top: '16px', right: '16px',
              background: 'transparent', border: 'none',
              // H4 FIX: use CSS var
              color: 'var(--text-secondary)', fontSize: '20px', cursor: 'pointer', lineHeight: 1,
            }}
            aria-label="Close modal"
          >
            ✕
          </button>

          <h2 id="modal-object-title" style={{ fontSize: '22px', fontWeight: 700, marginBottom: '4px', fontFamily: 'var(--font-main)' }}>
            {object.name}
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '28px' }}>
            How many {object.unit} per day?
          </p>

          {/* Slider */}
          <div style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
              <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Usage amount</span>
              <span style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>
                {value} <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{object.unit}</span>
              </span>
            </div>
            <input
              id={`slider-${object.id}`}
              type="range"
              min={range.min}
              max={range.max}
              step={range.step}
              value={value}
              onChange={(e) => setValue(Number(e.target.value))}
              style={{
                width: '100%',
                WebkitAppearance: 'none',
                appearance: 'none',
                height: '6px',
                background: `linear-gradient(90deg, var(--accent-cyan) ${((value - range.min) / (range.max - range.min)) * 100}%, rgba(255,255,255,0.1) 0%)`,
                borderRadius: '3px',
                outline: 'none',
                cursor: 'pointer',
              }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px', fontSize: '11px', color: 'var(--text-secondary)' }}>
              <span>{range.min}</span><span>{range.max}</span>
            </div>
          </div>

          {/* CO2 Result */}
          <div style={{
            background: `rgba(${isHigh ? '255,77,109' : '0,255,136'},0.06)`,
            border: `1px solid ${co2Color}33`,
            borderRadius: '12px',
            padding: '16px',
            marginBottom: '20px',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '6px' }}>
              Estimated CO₂
            </div>
            <div style={{ fontSize: '42px', fontWeight: 700, color: co2Color, textShadow: `0 0 20px ${co2Color}66` }}>
              {co2}
              <span style={{ fontSize: '18px', color: 'var(--text-secondary)', marginLeft: '4px' }}>kg</span>
            </div>
            {isHigh && (
              <div style={{ fontSize: '12px', color: 'var(--accent-orange)', marginTop: '6px' }}>
                ⚠ That's quite a lot! Terra has a tip for you.
              </div>
            )}
          </div>

          {/* Recommendation */}
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '24px', lineHeight: '1.5', padding: '0 4px' }}>
            💡 {object.recommendation}
          </div>

          {/* CTA */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleSubmit}
            disabled={loading}
            style={{
              width: '100%',
              padding: '14px',
              background: loading
                ? 'rgba(0,212,255,0.2)'
                : 'var(--gradient-cta)',
              border: 'none',
              borderRadius: '12px',
              color: 'var(--bg-dark)',
              fontWeight: 700,
              fontSize: '15px',
              fontFamily: 'var(--font-main)',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            {loading ? '🌍 Terra is thinking...' : 'Ask Terra for advice →'}
          </motion.button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
