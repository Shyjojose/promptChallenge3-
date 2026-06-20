import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import { describe, it, expect } from 'vitest'
import HUD from './HUD'

// Minimal kb_data stub matching the real shape
const KB_DATA = {
  car: { name: 'Gasoline Car' },
  burger: { name: 'Beef Burger' },
}

describe('HUD Component', () => {
  it('renders the EcoSphere title and instruction', () => {
    render(<HUD totalCO2={0} contributions={{}} kbData={KB_DATA} />)
    expect(screen.getByText(/EcoSphere/i)).toBeInTheDocument()
    expect(screen.getByText(/Click floating objects/i)).toBeInTheDocument()
  })

  it('displays the formatted CO₂ total', () => {
    render(<HUD totalCO2={12.5} contributions={{}} kbData={KB_DATA} />)
    // toFixed(1) → "12.5"
    expect(screen.getByText('12.5')).toBeInTheDocument()
  })

  it('shows "Show breakdown" hint when contributions exist', () => {
    render(<HUD totalCO2={3} contributions={{ car: 3 }} kbData={KB_DATA} />)
    expect(screen.getByText(/Show breakdown/i)).toBeInTheDocument()
  })

  it('shows breakdown items after clicking to expand', () => {
    render(<HUD totalCO2={3} contributions={{ car: 3 }} kbData={KB_DATA} />)
    const badge = screen.getByRole('button', { name: /Toggle CO₂ breakdown/i })

    // Initially collapsed — breakdown items not visible
    expect(screen.queryByText('Gasoline Car')).not.toBeInTheDocument()

    // Click to expand
    fireEvent.click(badge)
    expect(screen.getByText('Gasoline Car')).toBeInTheDocument()
    expect(screen.getByText(/Hide breakdown/i)).toBeInTheDocument()
  })

  it('collapses breakdown (shows "Show" text) after second click', () => {
    render(<HUD totalCO2={3} contributions={{ car: 3 }} kbData={KB_DATA} />)
    const badge = screen.getByRole('button', { name: /Toggle CO₂ breakdown/i })

    // Expand
    fireEvent.click(badge)
    expect(screen.getByText(/Hide breakdown/i)).toBeInTheDocument()

    // Collapse — note: AnimatePresence may keep element in DOM during exit
    // animation in jsdom (no real CSS transitions), so we assert on the
    // toggle text label rather than DOM removal.
    fireEvent.click(badge)
    expect(screen.getByText(/Show breakdown/i)).toBeInTheDocument()
  })

  it('falls back to id string when kbData has no entry for an id', () => {
    render(<HUD totalCO2={1} contributions={{ unknown_item: 1 }} kbData={KB_DATA} />)
    const badge = screen.getByRole('button', { name: /Toggle CO₂ breakdown/i })
    fireEvent.click(badge)
    // Should render "unknown item" (underscores replaced with spaces)
    expect(screen.getByText('unknown item')).toBeInTheDocument()
  })

  it('does not render breakdown toggle when there are no contributions', () => {
    render(<HUD totalCO2={0} contributions={{}} kbData={KB_DATA} />)
    expect(screen.queryByRole('button', { name: /Toggle CO₂ breakdown/i })).not.toBeInTheDocument()
  })
})
