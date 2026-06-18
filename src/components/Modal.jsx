import { useState } from 'react'
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
  const co2Color = co2 < 2 ? '#00ff88' : co2 < 10 ? '#ff9500' : '#ff4d6d'

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

    mascotResponse.object_name = object.name;
    onSubmit(object.id, co2, mascotResponse)
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
          style={{ width: '420px', padding: '32px', position: 'relative' }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <button
            onClick={onClose}
            style={{
              position: 'absolute', top: '16px', right: '16px',
              background: 'transparent', border: 'none',
              color: '#7ea8d4', fontSize: '20px', cursor: 'pointer', lineHeight: 1,
            }}
            aria-label="Close modal"
          >
            ✕
          </button>

          <h2 style={{ fontSize: '22px', fontWeight: 700, marginBottom: '4px', fontFamily: 'Space Grotesk, sans-serif' }}>
            {object.name}
          </h2>
          <p style={{ fontSize: '13px', color: '#7ea8d4', marginBottom: '28px' }}>
            How many {object.unit} per day?
          </p>

          {/* Slider */}
          <div style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
              <span style={{ fontSize: '13px', color: '#7ea8d4' }}>Usage amount</span>
              <span style={{ fontSize: '18px', fontWeight: 700, color: '#e8f4ff' }}>
                {value} <span style={{ fontSize: '13px', color: '#7ea8d4' }}>{object.unit}</span>
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
                background: `linear-gradient(90deg, #00d4ff ${((value - range.min) / (range.max - range.min)) * 100}%, rgba(255,255,255,0.1) 0%)`,
                borderRadius: '3px',
                outline: 'none',
                cursor: 'pointer',
              }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px', fontSize: '11px', color: '#7ea8d4' }}>
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
            <div style={{ fontSize: '11px', color: '#7ea8d4', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '6px' }}>
              Estimated CO₂
            </div>
            <div style={{ fontSize: '42px', fontWeight: 700, color: co2Color, textShadow: `0 0 20px ${co2Color}66` }}>
              {co2}
              <span style={{ fontSize: '18px', color: '#7ea8d4', marginLeft: '4px' }}>kg</span>
            </div>
            {isHigh && (
              <div style={{ fontSize: '12px', color: '#ff9500', marginTop: '6px' }}>
                ⚠ That's quite a lot! Terra has a tip for you.
              </div>
            )}
          </div>

          {/* Recommendation */}
          <div style={{ fontSize: '13px', color: '#7ea8d4', marginBottom: '24px', lineHeight: '1.5', padding: '0 4px' }}>
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
                : 'linear-gradient(135deg, #00d4ff, #00ff88)',
              border: 'none',
              borderRadius: '12px',
              color: '#03050f',
              fontWeight: 700,
              fontSize: '15px',
              fontFamily: 'Space Grotesk, sans-serif',
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
