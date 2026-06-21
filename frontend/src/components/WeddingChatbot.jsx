import { useState, useRef, useEffect } from 'react'

const API_URL = (import.meta.env.VITE_API_URL || 'https://matrimonio-test.onrender.com').replace(/\/$/, '')

const WELCOME_MESSAGE = {
  role: 'assistant',
  content: 'Ciao! 👋 Sono l\'assistente virtuale di Sofia & Marco. Chiedimi qualsiasi cosa sul matrimonio: data, location, programma, dress code, RSVP… 🌸',
}

export default function WeddingChatbot() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([WELCOME_MESSAGE])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [hasUnread, setHasUnread] = useState(false)
  const scrollRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, loading])

  useEffect(() => {
    if (open) {
      setHasUnread(false)
      setTimeout(() => inputRef.current?.focus(), 300)
    }
  }, [open])

  const sendMessage = async () => {
    const text = input.trim()
    if (!text || loading) return

    const userMsg = { role: 'user', content: text }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setInput('')
    setLoading(true)

    const url = `${API_URL}/api/chatbot/`
    const payload = {
      message: text,
      history: newMessages.slice(0, -1).map(m => ({ role: m.role, content: m.content })),
    }

    console.log('[Chatbot] 📤 Invio richiesta a:', url)
    console.log('[Chatbot] 📦 Payload:', payload)

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      console.log('[Chatbot] 📥 Status risposta:', res.status, res.statusText)

      if (!res.ok) {
        const errorText = await res.text().catch(() => '(impossibile leggere il body)')
        console.error('[Chatbot] ❌ Risposta non ok. Body errore:', errorText)
        throw new Error(`HTTP ${res.status}: ${errorText}`)
      }

      const data = await res.json()
      console.log('[Chatbot] ✅ Dati ricevuti:', data)

      setMessages(prev => [...prev, { role: 'assistant', content: data.reply }])
      if (!open) setHasUnread(true)
    } catch (e) {
      console.error('[Chatbot] ❌ Errore catturato:', e)
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Scusa, qualcosa è andato storto. Riprova tra poco oppure scrivi direttamente agli sposi! 💌',
      }])
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <>
      {/* ── Floating button ── */}
      <button
        onClick={() => setOpen(o => !o)}
        aria-label={open ? 'Chiudi chat' : 'Apri chat'}
        style={{
          position: 'fixed',
          bottom: 'max(16px, env(safe-area-inset-bottom, 0px) + 12px)',
          right: 16,
          zIndex: 300,
          width: 56,
          height: 56,
          borderRadius: '50%',
          border: 'none',
          cursor: 'pointer',
          background: 'linear-gradient(135deg, #c8a2a8, #e8c4a8)',
          boxShadow: '0 4px 20px rgba(200,130,100,0.4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '1.5rem',
          transition: 'transform 0.2s',
        }}
        onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.08)'}
        onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
      >
        {open ? '✕' : '💬'}
        {hasUnread && !open && (
          <span style={{
            position: 'absolute', top: 2, right: 2,
            width: 14, height: 14, borderRadius: '50%',
            background: '#c97a7a', border: '2px solid #fff',
          }} />
        )}
      </button>

      {/* ── Chat window ── */}
      {open && (
        <div className="wedding-chat-window" style={{
          position: 'fixed',
          bottom: 'max(80px, env(safe-area-inset-bottom, 0px) + 76px)',
          right: 8,
          left: 8,
          zIndex: 299,
          width: 'auto',
          maxWidth: 380,
          marginLeft: 'auto',
          height: 'min(70dvh, 560px)',
          maxHeight: 'calc(100dvh - 110px)',
          background: '#fff',
          borderRadius: 18,
          boxShadow: '0 12px 48px rgba(0,0,0,0.18)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          border: '1px solid rgba(200,162,168,0.2)',
        }}>
          {/* Header */}
          <div style={{
            background: 'linear-gradient(135deg, #c8a2a8, #e8c4a8)',
            padding: '14px 18px',
            display: 'flex', alignItems: 'center', gap: 10,
            flexShrink: 0,
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: '50%',
              background: 'rgba(255,255,255,0.25)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.2rem',
            }}>
              💍
            </div>
            <div>
              <div style={{ color: '#fff', fontWeight: 700, fontSize: '0.95rem', fontFamily: 'Georgia, serif' }}>
                Assistente Sofia & Marco
              </div>
              <div style={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.72rem' }}>
                Sempre disponibile 🌸
              </div>
            </div>
          </div>

          {/* Messages */}
          <div ref={scrollRef} style={{
            flex: 1, overflowY: 'auto', padding: '16px 14px',
            display: 'flex', flexDirection: 'column', gap: 10,
            background: 'linear-gradient(180deg, #faf6f0, #fdf9f5)',
          }}>
            {messages.map((m, i) => (
              <div key={i} style={{
                alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                maxWidth: '82%',
              }}>
                <div style={{
                  padding: '9px 13px',
                  borderRadius: m.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                  background: m.role === 'user'
                    ? 'linear-gradient(135deg, #c8a2a8, #e8c4a8)'
                    : '#fff',
                  color: m.role === 'user' ? '#fff' : '#2c2420',
                  fontSize: '0.88rem',
                  lineHeight: 1.5,
                  boxShadow: m.role === 'user' ? 'none' : '0 1px 6px rgba(0,0,0,0.06)',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                }}>
                  {m.content}
                </div>
              </div>
            ))}

            {loading && (
              <div style={{ alignSelf: 'flex-start' }}>
                <div style={{
                  padding: '10px 14px', borderRadius: '16px 16px 16px 4px',
                  background: '#fff', boxShadow: '0 1px 6px rgba(0,0,0,0.06)',
                  display: 'flex', gap: 4,
                }}>
                  {[0, 1, 2].map(i => (
                    <span key={i} style={{
                      width: 6, height: 6, borderRadius: '50%',
                      background: '#c8a2a8',
                      animation: `typingBounce 1.2s infinite ${i * 0.15}s`,
                    }} />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div style={{
            display: 'flex', gap: 8, padding: 12,
            borderTop: '1px solid rgba(200,162,168,0.15)',
            background: '#fff', flexShrink: 0,
          }}>
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => setTimeout(() => scrollRef.current?.scrollIntoView?.({ block: 'end' }), 300)}
              placeholder="Scrivi un messaggio…"
              disabled={loading}
              style={{
                flex: 1, padding: '10px 14px', borderRadius: 99,
                border: '1.5px solid rgba(200,162,168,0.3)',
                fontSize: '0.88rem', fontFamily: 'inherit', outline: 'none',
              }}
            />
            <button
              onClick={sendMessage}
              disabled={loading || !input.trim()}
              style={{
                width: 40, height: 40, borderRadius: '50%', border: 'none',
                background: 'linear-gradient(135deg, #c8a2a8, #e8c4a8)',
                color: '#fff', fontSize: '1.1rem', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                opacity: loading || !input.trim() ? 0.5 : 1,
                flexShrink: 0,
              }}
            >
              ➤
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes typingBounce {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
          30% { transform: translateY(-4px); opacity: 1; }
        }
        @media (max-width: 480px) {
          .wedding-chat-window {
            border-radius: 14px !important;
          }
        }
      `}</style>
    </>
  )
}