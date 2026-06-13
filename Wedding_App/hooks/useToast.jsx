import { useState, useCallback } from 'react'

export function useToast() {
  const [toasts, setToasts] = useState([])

  const show = useCallback((message, type = 'info', duration = 3500) => {
    const id = Date.now()
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, duration)
  }, [])

  const success = (msg) => show(msg, 'success')
  const error   = (msg) => show(msg, 'error', 4500)
  const info    = (msg) => show(msg, 'info')

  return { toasts, show, success, error, info }
}

export function ToastContainer({ toasts }) {
  const icons = { success: '✓', error: '✕', info: 'ℹ' }
  return (
    <div className="toast-container">
      {toasts.map(t => (
        <div key={t.id} className={`toast toast-${t.type}`}>
          <span>{icons[t.type]}</span>
          {t.message}
        </div>
      ))}
    </div>
  )
}
