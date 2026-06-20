import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { translations } from '../i18n/translations'

const LanguageContext = createContext(null)
const STORAGE_KEY = 'wedding_lang'
const DEFAULT_LANG = 'it'

function getInitialLang() {
  if (typeof window === 'undefined') return DEFAULT_LANG
  const saved = localStorage.getItem(STORAGE_KEY)
  if (saved === 'it' || saved === 'en') return saved
  const browserLang = (navigator.language || '').slice(0, 2).toLowerCase()
  return browserLang === 'en' ? 'en' : DEFAULT_LANG
}

function resolve(obj, path) {
  return path.split('.').reduce((acc, key) => (acc == null ? acc : acc[key]), obj)
}

function interpolate(value, vars) {
  if (!vars) return value

  if (typeof value === 'string') {
    return value.replace(/\{\{(\w+)\}\}/g, (_, k) => (vars[k] !== undefined ? vars[k] : `{{${k}}}`))
  }

  // Prima del fix, t('luoghi.ceremony', { date }) non sostituiva nulla:
  // 'ceremony' risolve a un oggetto { nome, orario, note }, non a una
  // stringa, quindi il vecchio interpolate() lo restituiva invariato e
  // "{{date}}" restava scritto così com'è in pagina.
  if (Array.isArray(value)) {
    return value.map((item) => interpolate(item, vars))
  }

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([k, v]) => [k, interpolate(v, vars)])
    )
  }

  return value
}

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(getInitialLang)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, lang)
    if (typeof document !== 'undefined') document.documentElement.lang = lang
  }, [lang])

  const setLang = useCallback((next) => setLangState(next === 'en' ? 'en' : 'it'), [])
  const toggleLang = useCallback(() => setLangState(l => (l === 'it' ? 'en' : 'it')), [])

  /**
   * t('login.title')
   * t('rsvp.toastError', { message: err.message })
   * Falls back to Italian if a key is missing in the active language,
   * and finally to the raw key if missing everywhere.
   */
  const t = useCallback((key, vars) => {
    const value = resolve(translations[lang], key)
    if (value === undefined) {
      const fallback = resolve(translations.it, key)
      return fallback !== undefined ? interpolate(fallback, vars) : key
    }
    return interpolate(value, vars)
  }, [lang])

  return (
    <LanguageContext.Provider value={{ lang, setLang, toggleLang, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error('useLanguage must be used within a LanguageProvider')
  return ctx
}