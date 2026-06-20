import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const SUGGESTED_QUESTIONS = [
  'How can I reduce this?',
  'What does this equal in trees?',
  'Give me a quick eco tip',
  'How does this compare to average?',
]

// M4 FIX: Cap message history at 10 exchanges to bound token cost and
// request payload size. Long conversations were previously sent in full.
const MAX_HISTORY = 10

function MessageBubble({ msg }) {
  const isUser = msg.role === 'user'
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      style={{
        alignSelf: isUser ? 'flex-end' : 'flex-start',
        maxWidth: '85%',
        background: isUser ? 'var(--bg-user-bubble)' : 'var(--bg-white-faint)',
        border: isUser ? '1px solid var(--border-cyan)' : '1px solid var(--border-white-faint)',
        padding: '10px 14px',
        borderRadius: isUser ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
        color: 'var(--text-primary)',
        fontSize: '14px',
        fontFamily: 'var(--font-main)',
        lineHeight: 1.4,
      }}
    >
      {msg.text}
    </motion.div>
  )
}

function SuggestionChips({ visible, onSuggest }) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95 }}
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
            alignSelf: 'flex-start',
            width: '100%',
          }}
        >
          {SUGGESTED_QUESTIONS.map((q) => (
            <button
              key={q}
              onClick={() => onSuggest(q)}
              style={{
                background: 'var(--bg-cyan-chip)',
                border: '1px solid var(--border-cyan-faint)',
                borderRadius: '20px',
                padding: '6px 12px',
                color: 'var(--accent-cyan)',
                fontSize: '12px',
                fontFamily: 'var(--font-main)',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'background 0.15s',
              }}
              onMouseOver={(e) => (e.currentTarget.style.background = 'var(--bg-cyan-chip-hover)')}
              onMouseOut={(e) => (e.currentTarget.style.background = 'var(--bg-cyan-chip)')}
            >
              💬 {q}
            </button>
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function ChatInput({ input, setInput, onSend, disabled }) {
  return (
    <div
      style={{
        padding: '12px',
        borderTop: '1px solid var(--border-cyan-dim)',
        display: 'flex',
        gap: '8px',
      }}
    >
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && onSend()}
        placeholder="Ask Terra..."
        aria-label="Message to Terra"
        style={{
          flex: 1,
          background: 'var(--bg-white-faint)',
          border: '1px solid var(--border-white-faint)',
          borderRadius: '8px',
          padding: '8px 12px',
          color: 'var(--text-primary)',
          outline: 'none',
          fontFamily: 'var(--font-main)',
        }}
      />
      <button
        onClick={onSend}
        disabled={disabled}
        style={{
          background: 'var(--gradient-cta)',
          border: 'none',
          borderRadius: '8px',
          padding: '0 16px',
          color: 'var(--bg-dark)',
          fontWeight: 'bold',
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.5 : 1,
        }}
      >
        Send
      </button>
    </div>
  )
}

export default function ChatWindow({ onClose, initialContext }) {
  // L4 FIX: Compute co2Label inside the component body (not at the call-site
  // closure boundary), so it is never stale if initialContext were to change.
  const co2Label =
    initialContext.co2_amount != null ? ` (${initialContext.co2_amount} kg CO₂/day)` : ''

  const [messages, setMessages] = useState([
    {
      role: 'model',
      text:
        initialContext.initialMessage ||
        `Hi! I'm Terra 🌍 Let's talk about your ${initialContext.object_name}${co2Label}. Ask me anything about reducing your impact!`,
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [suggestionsVisible, setSuggestionsVisible] = useState(true)
  const endOfMessagesRef = useRef(null)

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async (text) => {
    if (!text.trim() || loading) return

    setSuggestionsVisible(false)
    const userMessage = { role: 'user', text: text.trim() }
    const newMessages = [...messages, userMessage]
    setMessages(newMessages)
    setInput('')
    setLoading(true)

    try {
      // M4 FIX: Slice to last MAX_HISTORY messages before sending to the API
      // to prevent unbounded growth in token cost and payload size.
      const windowedMessages = newMessages.slice(-MAX_HISTORY)

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: windowedMessages,
          // Pass carbon context so server builds a relevant system prompt
          context: {
            object_name: initialContext.object_name,
            co2_amount: initialContext.co2_amount,
            recommendation: initialContext.recommendation,
          },
        }),
      })
      if (!res.ok) throw new Error('API Error')
      const data = await res.json()
      // M6 server fallback means data.text will always be present on success
      // or graceful failure; only an unhandled network error throws below.
      if (data.text) {
        setMessages((prev) => [...prev, { role: 'model', text: data.text }])
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: 'model',
          text: 'Sorry, my connection is fuzzy right now. Try again in a moment! 🌍',
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  const handleSend = () => sendMessage(input)
  const handleSuggestion = (q) => sendMessage(q)

  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.9 }}
      transition={{ duration: 0.3 }}
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '160px', // next to mascot
        width: '320px',
        height: '450px',
        // H4 FIX: CSS vars throughout
        background: 'var(--bg-overlay)',
        border: '1px solid var(--border-cyan)',
        borderRadius: '16px',
        display: 'flex',
        flexDirection: 'column',
        backdropFilter: 'blur(16px)',
        boxShadow: 'var(--shadow-card)',
        zIndex: 150,
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '12px 16px',
          borderBottom: '1px solid var(--border-cyan-dim)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'var(--bg-cyan-tint)',
        }}
      >
        <h3
          style={{
            margin: 0,
            color: 'var(--text-primary)',
            fontSize: '15px',
            fontFamily: 'var(--font-main)',
          }}
        >
          Chat with Terra
        </h3>
        <button
          onClick={onClose}
          aria-label="Close Terra chat"
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            fontSize: '18px',
            lineHeight: 1,
          }}
        >
          ✕
        </button>
      </div>

      {/* Messages */}
      <div
        role="log"
        aria-label="Conversation with Terra"
        aria-live="polite"
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}
      >
        {messages.map((msg, idx) => (
          <MessageBubble key={idx} msg={msg} />
        ))}

        <SuggestionChips visible={suggestionsVisible && !loading} onSuggest={handleSuggestion} />

        {loading && (
          <div
            style={{
              alignSelf: 'flex-start',
              color: 'var(--text-secondary)',
              fontSize: '13px',
              fontFamily: 'var(--font-main)',
            }}
          >
            Terra is thinking... 🌍
          </div>
        )}
        <div ref={endOfMessagesRef} />
      </div>

      {/* Input */}
      <ChatInput
        input={input}
        setInput={setInput}
        onSend={handleSend}
        disabled={loading || !input.trim()}
      />
    </motion.div>
  )
}
