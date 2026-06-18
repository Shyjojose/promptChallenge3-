import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const CO2_COLOR = (kg) => {
  if (kg < 5) return '#00ff88'
  if (kg < 20) return '#ff9500'
  return '#ff4d6d'
}

export default function HUD({ totalCO2, contributions }) {
  const [expanded, setExpanded] = useState(false)
  const color = CO2_COLOR(totalCO2)
  const hasData = Object.keys(contributions).length > 0

  return (
    <motion.div
      initial={{ opacity: 0, x: -40 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.5 }}
      style={{
        position: 'fixed',
        top: '24px',
        left: '24px',
        zIndex: 100,
        pointerEvents: 'all',
        userSelect: 'none',
        minWidth: '200px',
      }}
    >
      {/* Main score badge */}
      <div
        className="glass"
        style={{ padding: '16px 20px', cursor: hasData ? 'pointer' : 'default' }}
        onClick={() => hasData && setExpanded(v => !v)}
      >
        <div style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.12em', color: '#7ea8d4', textTransform: 'uppercase', marginBottom: '4px' }}>
          Total CO₂ Footprint
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
          <span style={{
            fontSize: '36px',
            fontWeight: '700',
            color,
            textShadow: `0 0 20px ${color}88`,
            fontFamily: 'Space Grotesk, sans-serif',
            transition: 'color 0.4s ease',
          }}>
            {totalCO2.toFixed(1)}
          </span>
          <span style={{ fontSize: '14px', color: '#7ea8d4' }}>kg CO₂</span>
        </div>
        {hasData && (
          <div style={{ fontSize: '11px', color: '#7ea8d4', marginTop: '4px' }}>
            {expanded ? '▲ Hide breakdown' : '▼ Show breakdown'}
          </div>
        )}

        {/* Progress bar */}
        {totalCO2 > 0 && (
          <div style={{ marginTop: '10px', height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', overflow: 'hidden' }}>
            <motion.div
              animate={{ width: `${Math.min((totalCO2 / 50) * 100, 100)}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              style={{ height: '100%', background: `linear-gradient(90deg, #00ff88, ${color})`, borderRadius: '2px' }}
            />
          </div>
        )}
      </div>

      {/* Breakdown panel */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            className="glass"
            initial={{ opacity: 0, height: 0, y: -8 }}
            animate={{ opacity: 1, height: 'auto', y: 0 }}
            exit={{ opacity: 0, height: 0, y: -8 }}
            transition={{ duration: 0.25 }}
            style={{ marginTop: '8px', padding: '12px 16px', overflow: 'hidden' }}
          >
            <div style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.1em', color: '#7ea8d4', textTransform: 'uppercase', marginBottom: '8px' }}>
              Breakdown
            </div>
            {Object.entries(contributions).map(([id, kg]) => (
              <div key={id} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '13px' }}>
                <span style={{ color: '#c8e0f4', textTransform: 'capitalize' }}>{id.replace('_', ' ')}</span>
                <span style={{ color: CO2_COLOR(kg), fontWeight: 600 }}>{kg.toFixed(2)} kg</span>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Title badge */}
      <div style={{ marginTop: '12px', paddingLeft: '4px' }}>
        <div style={{ fontSize: '20px', fontWeight: 700, fontFamily: 'Space Grotesk, sans-serif', color: '#e8f4ff', letterSpacing: '-0.02em' }}>
          🌍 EcoSphere
        </div>
        <div style={{ fontSize: '11px', color: '#7ea8d4', marginTop: '2px' }}>
          Click floating objects to explore
        </div>
      </div>
    </motion.div>
  )
}
