// Calendar helpers — build a wedding event and export it to .ics / Google Calendar.
import { WEDDING_CONFIG } from '../config/wedding'

// WEDDING_CONFIG.date is "DD-MM-YYYY"; times are "HH:MM". Parse to a local Date.
function parseLocal(dateStr, timeStr) {
  const [d, m, y] = dateStr.split('-').map(Number)
  const [h, min] = (timeStr || '00:00').split(':').map(Number)
  return new Date(y, m - 1, d, h, min)
}

// Floating local timestamp for calendars: YYYYMMDDTHHMMSS (no timezone = "as shown").
function fmt(dt) {
  const p = n => String(n).padStart(2, '0')
  return `${dt.getFullYear()}${p(dt.getMonth() + 1)}${p(dt.getDate())}T${p(dt.getHours())}${p(dt.getMinutes())}00`
}

export function buildWeddingEvent() {
  const { couple, venue, date, app } = WEDDING_CONFIG
  const start = parseLocal(date, venue.ceremony.time)
  const end = new Date(start.getTime() + 8 * 60 * 60 * 1000) // ~8h celebration
  const title = `Matrimonio ${couple.displayName}`
  const location = `${venue.ceremony.name}, ${venue.ceremony.address}`
  const description =
    `Cerimonia: ${venue.ceremony.name} (${venue.ceremony.time}) — ${venue.ceremony.address}\n` +
    `Ricevimento: ${venue.reception.name} (${venue.reception.time}) — ${venue.reception.address}\n` +
    (app?.siteUrl ? `\n${app.siteUrl}` : '')
  return { title, start, end, location, description }
}

export function googleCalendarUrl(ev = buildWeddingEvent()) {
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: ev.title,
    dates: `${fmt(ev.start)}/${fmt(ev.end)}`,
    details: ev.description,
    location: ev.location,
  })
  return `https://calendar.google.com/calendar/render?${params.toString()}`
}

export function buildICS(ev = buildWeddingEvent()) {
  const esc = s => String(s).replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n')
  const stamp = fmt(new Date())
  const uid = `${stamp}-${Math.random().toString(36).slice(2)}@sofia-marco`
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Sofia & Marco//Wedding//IT',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${stamp}`,
    `DTSTART:${fmt(ev.start)}`,
    `DTEND:${fmt(ev.end)}`,
    `SUMMARY:${esc(ev.title)}`,
    `DESCRIPTION:${esc(ev.description)}`,
    `LOCATION:${esc(ev.location)}`,
    'BEGIN:VALARM',
    'TRIGGER:-P1D',
    'ACTION:DISPLAY',
    `DESCRIPTION:${esc(ev.title)}`,
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n')
}

// Trigger a .ics download (Apple Calendar, Outlook, etc.).
export function downloadICS(ev = buildWeddingEvent()) {
  const blob = new Blob([buildICS(ev)], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'sofia-marco-wedding.ics'
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
