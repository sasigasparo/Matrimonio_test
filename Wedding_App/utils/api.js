// ── API base ──────────────────────────────────────────────────────────────────
const BASE = 'http://localhost:8000/api'

function token() {
  return localStorage.getItem('wedding_token')
}

async function request(method, path, body = null, isForm = false) {
  const headers = {}
  const tok = token()
  if (tok) headers['Authorization'] = `Bearer ${tok}`

  let reqBody = null
  if (body) {
    if (isForm) {
      reqBody = body  // FormData
    } else {
      headers['Content-Type'] = 'application/json'
      reqBody = JSON.stringify(body)
    }
  }

  const res = await fetch(`${BASE}${path}`, { method, headers, body: reqBody })

  if (!res.ok) {
    let msg = `HTTP ${res.status}`
    try { const j = await res.json(); msg = j.detail || msg } catch {}
    throw new Error(msg)
  }

  if (res.status === 204) return null
  return res.json()
}

export const api = {
  get:    (path)         => request('GET',    path),
  post:   (path, body)   => request('POST',   path, body),
  put:    (path, body)   => request('PUT',    path, body),
  del:    (path)         => request('DELETE', path),
  upload: (path, form)   => request('POST',   path, form, true),

  // Auth
  loginUrl: () => `${BASE}/auth/login`,
  me:       () => request('GET', '/auth/me'),

  // Guests
  listGuests:    ()       => request('GET',    '/guests/'),
  allGuests:     ()       => request('GET',    '/guests/all-guests'),
  createGuest:   (body)   => request('POST',   '/guests/', body),
  deleteGuest:   (id)     => request('DELETE', `/guests/${id}`),
  updatersvp:    (id, b)  => request('PUT',    `/guests/${id}/rsvp`, b),
  sendInvite:    (id)     => request('POST',   `/guests/${id}/invite`),
  sendAll:       ()       => request('POST',   '/guests/invite-all'),
  guestStats:    ()       => request('GET',    '/guests/stats'),

  // Photos
  listPhotos:  ()       => request('GET', '/photos/'),
  uploadPhoto: (form)   => request('POST', '/photos/', form, true),
  deletePhoto: (id)     => request('DELETE', `/photos/${id}`),

  // Messages
  listMessages: ()      => request('GET', '/messages/public'),
  sendMessage:  (form)  => request('POST', '/messages/', form, true),
  deleteMsg:    (id)    => request('DELETE', `/messages/${id}`),

  // Menu
  getMenu:      ()      => request('GET', '/menu/'),
  myChoices:    ()      => request('GET', '/menu/choices/me'),
  saveChoices:  (ids)   => request('POST', '/menu/choices', { item_ids: ids }),

  // Admin
  dashboard:   ()       => request('GET', '/admin/dashboard'),
  auditLogs:   ()       => request('GET', '/admin/logs'),
}

// ── Token helpers ─────────────────────────────────────────────────────────────
export function saveToken(tok) {
  localStorage.setItem('wedding_token', tok)
}

export function clearToken() {
  localStorage.removeItem('wedding_token')
}

export function parseJwt(tok) {
  try {
    return JSON.parse(atob(tok.split('.')[1]))
  } catch {
    return null
  }
}
