import { createContext, useContext, useState, useCallback } from 'react'
import { translations } from '../i18n/translations'
import { WEDDING_CONFIG } from '../config/wedding'

const LanguageContext = createContext(null)
const LANG = 'en'   // sito solo in inglese — vedi frontend/src/i18n/en.js

function resolve(obj, path) {
  return path.split('.').reduce((acc, key) => (acc == null ? acc : acc[key]), obj)
}

// Converte "17-10-2026" (DD-MM-YYYY) in "17 October 2026".
// Se il valore non è in questo formato, lo lascia invariato.
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

function formatDate(value) {
  if (typeof value !== 'string') return value
  const match = value.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/)
  if (!match) return value
  const [, day, month, year] = match
  const monthName = MONTHS[Number(month) - 1]
  if (!monthName) return value
  return `${Number(day)} ${monthName} ${year}`
}

// Traduzione del dress code "evitare" (solo bianco, come da WEDDING_CONFIG.dressCode.avoid)
const COLOR_NAMES = { white: 'white', black: 'black' }

function formatAvoidList(colors) {
  if (!Array.isArray(colors) || colors.length === 0) return ''
  const names = colors.map(c => COLOR_NAMES[c] || c)
  if (names.length === 1) return names[0]
  const last = names[names.length - 1]
  const rest = names.slice(0, -1)
  return `${rest.join(', ')} and ${last}`
}

// ─────────────────────────────────────────────────────────────────────────
// Variabili globali derivate da WEDDING_CONFIG, disponibili automaticamente
// in OGNI chiamata t(key, vars) senza doverle passare manualmente.
// Si possono comunque sovrascrivere passando lo stesso nome in vars.
// ─────────────────────────────────────────────────────────────────────────
function buildGlobalVars() {
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
    dressCodeAvoid: formatAvoidList(c.dressCode.avoid),

    // Logistica
    taxiName: c.logistics.taxi.name,
    taxiPhone: c.logistics.taxi.phone,
    airportName: c.logistics.airport.name,
    airportCode: c.logistics.airport.code,
    distanceFromCenter: c.logistics.airport.distanceFromCenter,
    trainStationName: c.logistics.trainStation.name,
    parkingNote: c.logistics.parking.note,

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
  /**
   * t('login.title')
   * t('rsvp.toastError', { message: err.message })
   *
   * Ogni chiamata riceve automaticamente le variabili globali derivate da
   * WEDDING_CONFIG (date, ceremonyTime, taxiPhone, ecc.) — non serve
   * passarle a mano. I `vars` espliciti, se presenti, hanno la precedenza
   * e possono sovrascrivere quelle globali con lo stesso nome.
   *
   * Sito solo in inglese: fallback finale alla chiave grezza se assente.
   */
  const t = useCallback((key, vars) => {
    const globalVars = buildGlobalVars()
    const mergedVars = { ...globalVars, ...vars }

    // Formatta automaticamente il campo `date` (es. "17-10-2026" → "17 October 2026")
    const formattedVars = {
      ...mergedVars,
      date: formatDate(mergedVars.date),
    }

    const value = resolve(translations[LANG], key)
    return value !== undefined ? interpolate(value, formattedVars) : key
  }, [])

  return (
    <LanguageContext.Provider value={{ lang: LANG, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error('useLanguage must be used within a LanguageProvider')
  return ctx
}