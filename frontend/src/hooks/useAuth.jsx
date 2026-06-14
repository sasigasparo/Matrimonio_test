import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { api, saveToken, clearToken, parseJwt } from '../utils/api'

const AuthCtx = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)
  const [loading, setLoading] = useState(true)

  const loadUser = useCallback(async () => {
    const tok = localStorage.getItem('wedding_token')
    if (!tok) { setLoading(false); return }
    const payload = parseJwt(tok)
    if (!payload || payload.exp * 1000 < Date.now()) {
      clearToken(); setLoading(false); return
    }
    try {
      const me = await api.me()
      setUser({ ...me, is_admin: payload.is_admin })
    } catch {
      clearToken()
    }
    setLoading(false)
  }, [])

  useEffect(() => { loadUser() }, [loadUser])

  // Password-only login: caller passes the guest object returned by the API.
  const login = (userData) => {
    setUser(userData)
    return Promise.resolve()
  }

  const logout = () => {
    clearToken()
    setUser(null)
  }

  return (
    <AuthCtx.Provider value={{ user, loading, login, logout, reload: loadUser }}>
      {children}
    </AuthCtx.Provider>
  )
}

export const useAuth = () => useContext(AuthCtx)