import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ChatWindow({ onClose, initialContext }) {
  const [messages, setMessages] = useState([
    { role: 'model', text: initialContext.initialMessage || `Hi there! Let's talk about the ${initialContext.object_name} you're using.` }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const endOfMessagesRef = useRef(null);

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage = { role: 'user', text: input.trim() };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages })
      });
      if (!res.ok) throw new Error('API Error');
      const data = await res.json();
      if (data.text) {
        setMessages(prev => [...prev, { role: 'model', text: data.text }]);
      }
    } catch (err) {
      setMessages(prev => [...prev, { role: 'model', text: 'Sorry, I am having trouble connecting right now.' }]);
    } finally {
      setLoading(false);
    }
  };

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
        background: 'rgba(3, 5, 15, 0.95)',
        border: '1px solid rgba(0, 212, 255, 0.4)',
        borderRadius: '16px',
        display: 'flex',
        flexDirection: 'column',
        backdropFilter: 'blur(16px)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
        zIndex: 150,
        overflow: 'hidden'
      }}
    >
      {/* Header */}
      <div style={{
        padding: '12px 16px',
        borderBottom: '1px solid rgba(0, 212, 255, 0.2)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: 'rgba(0, 212, 255, 0.1)'
      }}>
        <h3 style={{ margin: 0, color: '#e8f4ff', fontSize: '15px', fontFamily: 'Space Grotesk, sans-serif' }}>
          Chat with Terra
        </h3>
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            color: '#7ea8d4',
            cursor: 'pointer',
            fontSize: '18px',
            lineHeight: 1
          }}
        >
          ✕
        </button>
      </div>

      {/* Messages */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
      }}>
        {messages.map((msg, idx) => (
          <div key={idx} style={{
            alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
            maxWidth: '85%',
            background: msg.role === 'user' ? 'rgba(0, 212, 255, 0.2)' : 'rgba(255, 255, 255, 0.05)',
            border: msg.role === 'user' ? '1px solid rgba(0, 212, 255, 0.4)' : '1px solid rgba(255, 255, 255, 0.1)',
            padding: '10px 14px',
            borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
            color: '#e8f4ff',
            fontSize: '14px',
            fontFamily: 'Space Grotesk, sans-serif',
            lineHeight: 1.4
          }}>
            {msg.text}
          </div>
        ))}
        {loading && (
          <div style={{
            alignSelf: 'flex-start',
            color: '#7ea8d4',
            fontSize: '13px',
            fontFamily: 'Space Grotesk, sans-serif'
          }}>
            Terra is typing...
          </div>
        )}
        <div ref={endOfMessagesRef} />
      </div>

      {/* Input */}
      <div style={{
        padding: '12px',
        borderTop: '1px solid rgba(0, 212, 255, 0.2)',
        display: 'flex',
        gap: '8px'
      }}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Ask Terra..."
          style={{
            flex: 1,
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '8px',
            padding: '8px 12px',
            color: '#e8f4ff',
            outline: 'none',
            fontFamily: 'Space Grotesk, sans-serif'
          }}
        />
        <button
          onClick={handleSend}
          disabled={loading || !input.trim()}
          style={{
            background: 'linear-gradient(135deg, #00d4ff, #00ff88)',
            border: 'none',
            borderRadius: '8px',
            padding: '0 16px',
            color: '#03050f',
            fontWeight: 'bold',
            cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
            opacity: loading || !input.trim() ? 0.5 : 1
          }}
        >
          Send
        </button>
      </div>
    </motion.div>
  );
}
