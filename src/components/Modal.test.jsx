import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import '@testing-library/jest-dom'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import Modal from './Modal'

// Minimal object prop matching the real kb_data shape
const OBJECT = {
  id: 'car',
  name: 'Gasoline Car',
  unit: 'miles',
  co2_per_unit_kg: 0.4,
  recommendation: 'Consider carpooling or public transit.',
}

describe('Modal Component', () => {
  beforeEach(() => {
    // Mock the global fetch so no real API calls are made
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ dialogue: 'Great job!', emotion_state: 'happy' }),
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders the object name and unit', () => {
    render(<Modal object={OBJECT} onClose={vi.fn()} onSubmit={vi.fn()} setMascotState={vi.fn()} />)
    expect(screen.getByRole('heading', { name: /Gasoline Car/i })).toBeInTheDocument()
    expect(screen.getByText(/miles per day/i)).toBeInTheDocument()
  })

  it('renders the recommendation text', () => {
    render(<Modal object={OBJECT} onClose={vi.fn()} onSubmit={vi.fn()} setMascotState={vi.fn()} />)
    expect(screen.getByText(/carpooling/i)).toBeInTheDocument()
  })

  it('calls onClose when the ✕ button is clicked', () => {
    const onClose = vi.fn()
    render(<Modal object={OBJECT} onClose={onClose} onSubmit={vi.fn()} setMascotState={vi.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: /Close modal/i }))
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('CO₂ display updates when slider changes', () => {
    render(<Modal object={OBJECT} onClose={vi.fn()} onSubmit={vi.fn()} setMascotState={vi.fn()} />)
    const slider = screen.getByRole('slider')
    // Default value for 'car' is 30 miles → 30 * 0.4 = 12 kg CO₂
    fireEvent.change(slider, { target: { value: '10' } })
    // 10 * 0.4 = 4 kg — should appear in the CO₂ readout
    expect(screen.getByText('4')).toBeInTheDocument()
  })

  it('calls onSubmit with correct arguments (including recommendation) on submit', async () => {
    const onSubmit = vi.fn()
    const onClose = vi.fn()
    render(<Modal object={OBJECT} onClose={onClose} onSubmit={onSubmit} setMascotState={vi.fn()} />)

    const slider = screen.getByRole('slider')
    fireEvent.change(slider, { target: { value: '10' } })

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Ask Terra/i }))
    })

    await waitFor(() => {
      // H2 fix: recommendation is now the 4th arg
      expect(onSubmit).toHaveBeenCalledWith(
        'car',
        4, // co2: 10 * 0.4
        expect.objectContaining({ dialogue: 'Great job!' }),
        'Consider carpooling or public transit.' // recommendation passed explicitly
      )
    })
  })

  it('falls back gracefully when Terra API fails', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Network Error'))
    const onSubmit = vi.fn()
    render(<Modal object={OBJECT} onClose={vi.fn()} onSubmit={onSubmit} setMascotState={vi.fn()} />)

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Ask Terra/i }))
    })

    await waitFor(() => {
      // Should still call onSubmit with a fallback mascot response
      expect(onSubmit).toHaveBeenCalledWith(
        'car',
        expect.any(Number),
        expect.objectContaining({ emotion_state: 'thinking' }),
        expect.any(String)
      )
    })
  })
})
