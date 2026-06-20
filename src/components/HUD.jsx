import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

// H4 FIX: Returns a CSS var string so the colour integrates with the design
// token system rather than hardcoding hex values inline.
const CO2_COLOR = (kg) => {
  if (kg < 5) return 'var(--accent-green)'
  if (kg < 20) return 'var(--accent-orange)'
  return 'var(--accent-red)'
}

export default function HUD({ totalCO2, contributions, kbData }) {
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
        role={hasData ? 'button' : undefined}
        tabIndex={hasData ? 0 : -1}
        aria-expanded={hasData ? expanded : undefined}
        aria-label="Toggle CO₂ breakdown"
        style={{ padding: '16px 20px', cursor: hasData ? 'pointer' : 'default' }}
        onClick={() => hasData && setExpanded((v) => !v)}
        onKeyDown={(e) => e.key === 'Enter' && hasData && setExpanded((v) => !v)}
      >
        <div
          style={{
            fontSize: '11px',
            fontWeight: 600,
            letterSpacing: '0.12em',
            // H4 FIX: CSS vars
            color: 'var(--text-secondary)',
            textTransform: 'uppercase',
            marginBottom: '4px',
          }}
        >
          Total CO₂ Footprint
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
          <span
            style={{
              fontSize: '36px',
              fontWeight: '700',
              color,
              textShadow: `0 0 20px ${color}88`,
              fontFamily: 'var(--font-main)',
              transition: 'color 0.4s ease',
            }}
          >
            {totalCO2.toFixed(1)}
          </span>
          <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>kg CO₂</span>
        </div>
        {hasData && (
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            {expanded ? '▲ Hide breakdown' : '▼ Show breakdown'}
          </div>
        )}

        {/* Progress bar */}
        {totalCO2 > 0 && (
          <div
            style={{
              marginTop: '10px',
              height: '4px',
              background: 'rgba(255,255,255,0.1)',
              borderRadius: '2px',
              overflow: 'hidden',
            }}
          >
            <motion.div
              animate={{ width: `${Math.min((totalCO2 / 50) * 100, 100)}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              style={{
                height: '100%',
                background: `linear-gradient(90deg, var(--accent-green), ${color})`,
                borderRadius: '2px',
              }}
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
            <div
              style={{
                fontSize: '11px',
                fontWeight: 600,
                letterSpacing: '0.1em',
                color: 'var(--text-secondary)',
                textTransform: 'uppercase',
                marginBottom: '8px',
              }}
            >
              Breakdown
            </div>
            {Object.entries(contributions).map(([id, kg]) => (
              <div
                key={id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '4px 0',
                  borderBottom: '1px solid var(--border-white-subtle)',
                  fontSize: '13px',
                }}
              >
                <span style={{ color: 'var(--text-muted)' }}>
                  {kbData?.[id]?.name || id.replace(/_/g, ' ')}
                </span>
                <span style={{ color: CO2_COLOR(kg), fontWeight: 600 }}>{kg.toFixed(2)} kg</span>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Title badge */}
      <div style={{ marginTop: '12px', paddingLeft: '4px' }}>
        <div
          style={{
            fontSize: '20px',
            fontWeight: 700,
            fontFamily: 'var(--font-main)',
            color: 'var(--text-primary)',
            letterSpacing: '-0.02em',
          }}
        >
          🌍 EcoSphere
        </div>
        <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
          Click floating objects to explore
        </div>
      </div>
    </motion.div>
  )
}
