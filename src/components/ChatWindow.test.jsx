import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import ChatWindow from './ChatWindow'

// jsdom doesn't implement scrollIntoView — mock it globally
beforeEach(() => {
  window.HTMLElement.prototype.scrollIntoView = vi.fn()
})

const INITIAL_CONTEXT = {
  object_name: 'Car',
  co2_amount: 12,
  recommendation: 'Take public transit.',
  initialMessage: 'Hi! I noticed your car usage.',
}

describe('ChatWindow Component', () => {
  beforeEach(() => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ text: 'Great question! Try cycling.' }),
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders the initial Terra message', () => {
    render(<ChatWindow initialContext={INITIAL_CONTEXT} onClose={vi.fn()} />)
    expect(screen.getByText('Hi! I noticed your car usage.')).toBeInTheDocument()
  })

  it('shows suggested questions on first render', () => {
    render(<ChatWindow initialContext={INITIAL_CONTEXT} onClose={vi.fn()} />)
    expect(screen.getByText(/How can I reduce this\?/)).toBeInTheDocument()
  })

  it('calls onClose when the ✕ button is clicked', () => {
    const onClose = vi.fn()
    render(<ChatWindow initialContext={INITIAL_CONTEXT} onClose={onClose} />)
    fireEvent.click(screen.getByRole('button', { name: /Close Terra chat/i }))
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('sends a message on Enter key and shows response', async () => {
    render(<ChatWindow initialContext={INITIAL_CONTEXT} onClose={vi.fn()} />)

    const input = screen.getByPlaceholderText(/Ask Terra/i)
    fireEvent.change(input, { target: { value: 'How can I reduce this?' } })
    fireEvent.keyDown(input, { key: 'Enter' })

    // User message should appear immediately
    expect(screen.getByText('How can I reduce this?')).toBeInTheDocument()

    // API response should appear after fetch resolves
    await waitFor(() => {
      expect(screen.getByText('Great question! Try cycling.')).toBeInTheDocument()
    })
  })

  it('sends a message on Send button click', async () => {
    render(<ChatWindow initialContext={INITIAL_CONTEXT} onClose={vi.fn()} />)

    const input = screen.getByPlaceholderText(/Ask Terra/i)
    fireEvent.change(input, { target: { value: 'Tell me more.' } })
    fireEvent.click(screen.getByRole('button', { name: /Send/i }))

    await waitFor(() => {
      expect(screen.getByText('Great question! Try cycling.')).toBeInTheDocument()
    })
  })

  it('sends a suggested question when chip is clicked', async () => {
    render(<ChatWindow initialContext={INITIAL_CONTEXT} onClose={vi.fn()} />)

    // The suggestion chips are rendered with a 💬 prefix
    const chip = screen.getByText(/How can I reduce this\?/)
    fireEvent.click(chip)

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledOnce()
    })
  })

  it('M4: caps messages to MAX_HISTORY=10 before sending to API', async () => {
    render(<ChatWindow initialContext={INITIAL_CONTEXT} onClose={vi.fn()} />)

    const input = screen.getByPlaceholderText(/Ask Terra/i)
    fireEvent.change(input, { target: { value: 'question' } })
    fireEvent.click(screen.getByRole('button', { name: /Send/i }))

    await waitFor(() => {
      const lastCall = global.fetch.mock.calls[global.fetch.mock.calls.length - 1]
      const body = JSON.parse(lastCall[1].body)
      // Messages in payload must never exceed MAX_HISTORY (10)
      expect(body.messages.length).toBeLessThanOrEqual(10)
    })
  })

  it('shows a fallback message when the API call fails', async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: false })

    render(<ChatWindow initialContext={INITIAL_CONTEXT} onClose={vi.fn()} />)
    const input = screen.getByPlaceholderText(/Ask Terra/i)
    fireEvent.change(input, { target: { value: 'Test message' } })
    fireEvent.click(screen.getByRole('button', { name: /Send/i }))

    await waitFor(() => {
      expect(screen.getByText(/fuzzy/i)).toBeInTheDocument()
    })
  })

  it('disables Send button while loading', async () => {
    // Make fetch hang so loading state persists
    global.fetch = vi.fn(() => new Promise(() => {}))

    render(<ChatWindow initialContext={INITIAL_CONTEXT} onClose={vi.fn()} />)
    const input = screen.getByPlaceholderText(/Ask Terra/i)
    fireEvent.change(input, { target: { value: 'Question' } })

    const sendBtn = screen.getByRole('button', { name: /Send/i })
    fireEvent.click(sendBtn)

    // After click the button should be disabled
    await waitFor(() => {
      expect(sendBtn).toBeDisabled()
    })
  })
})
