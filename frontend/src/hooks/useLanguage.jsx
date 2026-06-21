import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { translations } from '../i18n/translations'
import { WEDDING_CONFIG } from '../config/wedding'

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

// Converte "14-06-2027" (DD-MM-YYYY) in "14 Giugno 2027" / "14 June 2027".
// Se il valore non è in questo formato, lo lascia invariato.
const MONTHS = {
  it: ['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno', 'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'],
  en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
}

function formatDate(value, lang) {
  if (typeof value !== 'string') return value
  const match = value.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/)
  if (!match) return value
  const [, day, month, year] = match
  const monthName = MONTHS[lang]?.[Number(month) - 1]
  if (!monthName) return value
  return `${Number(day)} ${monthName} ${year}`
}

// Traduzione del dress code "evitare" (solo bianco, come da WEDDING_CONFIG.dressCode.avoid)
const COLOR_NAMES = {
  it: { bianco: 'il bianco', nero: 'il nero' },
  en: { bianco: 'white', nero: 'black' },
}

function formatAvoidList(colors, lang) {
  if (!Array.isArray(colors) || colors.length === 0) return ''
  const names = colors.map(c => COLOR_NAMES[lang]?.[c] || c)
  if (names.length === 1) return names[0]
  const last = names[names.length - 1]
  const rest = names.slice(0, -1)
  const and = lang === 'en' ? 'and' : 'e'
  return `${rest.join(', ')} ${and} ${last}`
}

// ─────────────────────────────────────────────────────────────────────────
// Variabili globali derivate da WEDDING_CONFIG, disponibili automaticamente
// in OGNI chiamata t(key, vars) senza doverle passare manualmente.
// Si possono comunque sovrascrivere passando lo stesso nome in vars.
// ─────────────────────────────────────────────────────────────────────────
function buildGlobalVars(lang) {
  const c = WEDDING_CONFIG
  return {
    // Coppia
    brideName: c.couple.bride,
    groomName: c.couple.groom,
    coupleNames: `${c.couple.bride} & ${c.couple.groom}`,

    // Data e orari
    date: c.date,
    ceremonyTime: c.venue.ceremony.time,
    receptionTime: c.venue.reception.time,
    time: c.venue.ceremony.time,   // alias usato in alcune chiavi esistenti

    // Luoghi
    ceremonyName: c.venue.ceremony.name,
    ceremonyAddress: c.venue.ceremony.address,
    receptionName: c.venue.reception.name,
    receptionAddress: c.venue.reception.address,
    city: c.venue.city,

    // Dress code
    dressCodeStyle: c.dressCode.style,
    dressCodeAvoid: formatAvoidList(c.dressCode.avoid, lang),

    // Logistica
    taxiName: c.logistics.taxi.name,
    taxiPhone: c.logistics.taxi.phone,
    airportName: c.logistics.airport.name,
    airportCode: c.logistics.airport.code,
    trainStationName: c.logistics.trainStation.name,
    parkingNote: c.logistics.parking.note,

    // Regalo
    iban: c.gift.bankTransfer.iban,
    bic: c.gift.bankTransfer.bic,
    accountHolder: c.gift.bankTransfer.accountHolder,
    paymentReference: c.gift.bankTransfer.reference,

    // Contatti / social
    contactEmail: c.contacts.email,
    weddingHashtag: c.social.hashtag,

    // App
    siteUrl: c.app.siteUrl,
  }
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
   *
   * Ogni chiamata riceve automaticamente le variabili globali derivate da
   * WEDDING_CONFIG (date, ceremonyTime, iban, taxiPhone, ecc.) — non serve
   * passarle a mano. I `vars` espliciti, se presenti, hanno la precedenza
   * e possono sovrascrivere quelle globali con lo stesso nome.
   *
   * Falls back to Italian if a key is missing in the active language,
   * and finally to the raw key if missing everywhere.
   */
  const t = useCallback((key, vars) => {
    const globalVars = buildGlobalVars(lang)
    const mergedVars = { ...globalVars, ...vars }

    // Formatta automaticamente il campo `date` (es. "14-06-2027" → "14 Giugno 2027")
    const formattedVars = {
      ...mergedVars,
      date: formatDate(mergedVars.date, lang),
    }

    const value = resolve(translations[lang], key)
    if (value === undefined) {
      const fallback = resolve(translations.it, key)
      return fallback !== undefined ? interpolate(fallback, formattedVars) : key
    }
    return interpolate(value, formattedVars)
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