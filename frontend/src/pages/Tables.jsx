import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import TableAuth, { useTableAuth } from './TableAuth'

const API_URL = (import.meta.env.VITE_API_URL || 'https://matrimonio-test.onrender.com').replace(/\/$/, '')

// ─── helpers ────────────────────────────────────────────────────────────────
function getToken() { return localStorage.getItem('wedding_token') }

async function apiFetch(path, opts = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    ...opts,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}`, ...(opts.headers || {}) },
  })
  if (!res.ok) throw new Error((await res.json()).detail || 'Errore API')
  return res.json()
}

// ─── seat positions around a round table ────────────────────────────────────
function seatPositions(count, r = 62) {
  return Array.from({ length: count }, (_, i) => {
    const angle = (2 * Math.PI * i) / count - Math.PI / 2
    return { x: Math.cos(angle) * r, y: Math.sin(angle) * r }
  })
}

// ─── RSVP badge colour ──────────────────────────────────────────────────────
function rsvpColor(status) {
  if (status === 'confirmed') return '#6a9e6c'
  if (status === 'declined')  return '#c97a7a'
  return '#b0a090'
}

// ════════════════════════════════════════════════════════════════════════════
// TableCircle – draws one round table with seated omini
// ════════════════════════════════════════════════════════════════════════════
function TableCircle({ table, guests, onSeatClick, onTableClick, selected }) {
  const seats = seatPositions(table.seats)
  const cx = 130, cy = 130
  // Angle each seat is at (for rotating the name label outward)
  const angles = Array.from({ length: table.seats }, (_, i) =>
    (2 * Math.PI * i) / table.seats - Math.PI / 2
  )

  return (
    <g
      onClick={() => onTableClick(table)}
      style={{ cursor: 'pointer' }}
    >
      {/* glow when selected */}
      {selected && (
        <circle cx={cx} cy={cy} r={52} fill="none" stroke="var(--rose,#c8a2a8)" strokeWidth={4} opacity={0.5} />
      )}
      {/* table top */}
      <circle cx={cx} cy={cy} r={44}
        fill="rgba(240,228,216,0.95)"
        stroke={selected ? 'var(--rose,#c8a2a8)' : 'rgba(180,140,120,0.45)'}
        strokeWidth={selected ? 2.5 : 1.5}
      />
      {/* table name */}
      <text x={cx} y={cy - 6} textAnchor="middle" fontSize={11} fontWeight={700}
        fill="#5a4030" fontFamily="Georgia, serif" style={{ pointerEvents: 'none' }}>
        {table.name}
      </text>
      <text x={cx} y={cy + 10} textAnchor="middle" fontSize={9} fill="#9a8070"
        fontFamily="Georgia, serif" style={{ pointerEvents: 'none' }}>
        {table.assigned?.filter(Boolean).length || 0}/{table.seats}
      </text>

      {/* seats */}
      {seats.map((pos, i) => {
        const guest = table.assigned?.[i]
        const occupied = !!guest
        const angle = angles[i]
        // Name label sits further out from the seat circle
        const labelR = 90
        const lx = cx + Math.cos(angle) * labelR
        const ly = cy + Math.sin(angle) * labelR
        // Shorten name to fit: first name only
        const shortName = occupied ? guest.name.split(' ')[0] : ''

        return (
          <g key={i}
            onClick={e => { e.stopPropagation(); onSeatClick(table, i, guest) }}
            style={{ cursor: 'pointer' }}
          >
            {/* seat circle */}
            <circle
              cx={cx + pos.x} cy={cy + pos.y} r={13}
              fill={occupied ? rsvpColor(guest.rsvp_status) : 'rgba(255,255,255,0.7)'}
              stroke={occupied ? 'rgba(0,0,0,0.12)' : 'rgba(180,140,120,0.35)'}
              strokeWidth={1.2}
            />
            {occupied ? (
              /* omino */
              <g transform={`translate(${cx + pos.x},${cy + pos.y})`} style={{ pointerEvents: 'none' }}>
                <circle cy={-4} r={4} fill="rgba(255,255,255,0.85)" />
                <path d="M-4,4 Q0,12 4,4" fill="rgba(255,255,255,0.85)" />
              </g>
            ) : (
              <text x={cx + pos.x} y={cy + pos.y} textAnchor="middle" dominantBaseline="central"
                fontSize={13} fill="rgba(180,140,120,0.6)" style={{ pointerEvents: 'none' }}>+</text>
            )}

            {/* Name label outside the seat */}
            {occupied && (
              <text
                x={lx} y={ly}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize={8.5}
                fontWeight={600}
                fill="#5a4030"
                fontFamily="Georgia, serif"
                style={{ pointerEvents: 'none' }}
              >
                {shortName}
              </text>
            )}
          </g>
        )
      })}
    </g>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// GuestPicker modal – assign a guest to a seat
// ════════════════════════════════════════════════════════════════════════════
function GuestPicker({ table, seatIndex, currentGuest, guests, allTables, onAssign, onRemove, onClose }) {
  const [search, setSearch] = useState('')

  // guests already seated elsewhere
  const seated = new Set(allTables.flatMap(t => (t.assigned || []).map(g => g?.id)).filter(Boolean))

  const filtered = guests.filter(g => {
    if (search && !g.name.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 400,
      background: 'rgba(44,36,32,0.45)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
    }} onClick={onClose}>
      <div style={{
        background: '#fff', borderRadius: 16, width: '100%', maxWidth: 420,
        boxShadow: '0 24px 64px rgba(0,0,0,0.18)', overflow: 'hidden',
      }} onClick={e => e.stopPropagation()}>
        <div style={{ padding: '20px 20px 0', borderBottom: '1px solid rgba(200,162,168,0.2)' }}>
          <h3 style={{ margin: '0 0 4px', fontFamily: 'Georgia,serif', color: 'var(--charcoal,#2c2420)', fontSize: '1.1rem' }}>
            {currentGuest ? `Posto ${seatIndex + 1} — ${table.name}` : `Assegna posto ${seatIndex + 1} — ${table.name}`}
          </h3>
          {currentGuest && (
            <p style={{ margin: '0 0 12px', color: '#9a8070', fontSize: '0.85rem' }}>
              Attualmente: <strong>{currentGuest.name}</strong>
            </p>
          )}
          <input
            autoFocus
            placeholder="Cerca ospite…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid rgba(200,162,168,0.35)',
              fontSize: '0.95rem', fontFamily: 'inherit', marginBottom: 12, boxSizing: 'border-box',
            }}
          />
        </div>

        <div style={{ maxHeight: 320, overflowY: 'auto', padding: '8px 0' }}>
          {currentGuest && (
            <button
              onClick={() => onRemove(table.id, seatIndex)}
              style={{
                display: 'block', width: '100%', textAlign: 'left', padding: '10px 20px',
                background: 'none', border: 'none', cursor: 'pointer', color: '#c97a7a',
                fontSize: '0.9rem', fontWeight: 600,
              }}
            >
              🗑 Rimuovi ospite da questo posto
            </button>
          )}
          {filtered.length === 0 && (
            <p style={{ padding: '12px 20px', color: '#b0a090', fontSize: '0.85rem' }}>Nessun ospite trovato</p>
          )}
          {filtered.map(g => {
            const alreadySeated = seated.has(g.id) && g.id !== currentGuest?.id
            return (
              <button
                key={g.id}
                disabled={alreadySeated}
                onClick={() => !alreadySeated && onAssign(table.id, seatIndex, g.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  width: '100%', padding: '10px 20px', background: 'none', border: 'none',
                  cursor: alreadySeated ? 'not-allowed' : 'pointer',
                  opacity: alreadySeated ? 0.4 : 1,
                  textAlign: 'left',
                }}
              >
                <span style={{
                  width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                  background: rsvpColor(g.rsvp_status),
                }}/>
                <span style={{ fontSize: '0.9rem', color: '#2c2420', flex: 1 }}>{g.name}</span>
                <span style={{ fontSize: '0.75rem', color: '#b0a090' }}>
                  {alreadySeated ? 'già assegnato' : g.rsvp_status === 'confirmed' ? '✓ confermato' : g.rsvp_status === 'declined' ? '✗ rifiutato' : '○ in attesa'}
                </span>
              </button>
            )
          })}
        </div>

        <div style={{ padding: 16, borderTop: '1px solid rgba(200,162,168,0.15)' }}>
          <button onClick={onClose} style={{
            width: '100%', padding: '10px', borderRadius: 8, border: '1px solid rgba(200,162,168,0.35)',
            background: 'none', cursor: 'pointer', fontFamily: 'inherit', color: '#9a8070', fontSize: '0.9rem',
          }}>
            Annulla
          </button>
        </div>
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// TableEditor modal – create/edit table
// ════════════════════════════════════════════════════════════════════════════
function TableEditor({ table, onSave, onDelete, onClose }) {
  const [name,  setName]  = useState(table?.name  || '')
  const [seats, setSeats] = useState(table?.seats || 8)
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (!name.trim()) return
    setSaving(true)
    await onSave({ ...table, name: name.trim(), seats: Number(seats) })
    setSaving(false)
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 400,
      background: 'rgba(44,36,32,0.45)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
    }} onClick={onClose}>
      <div style={{
        background: '#fff', borderRadius: 16, width: '100%', maxWidth: 380,
        boxShadow: '0 24px 64px rgba(0,0,0,0.18)', padding: 24,
      }} onClick={e => e.stopPropagation()}>
        <h3 style={{ margin: '0 0 20px', fontFamily: 'Georgia,serif', color: '#2c2420' }}>
          {table?.id ? 'Modifica tavolo' : 'Nuovo tavolo'}
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#5a4030', display: 'block', marginBottom: 4 }}>Nome tavolo</label>
            <input
              autoFocus value={name} onChange={e => setName(e.target.value)}
              placeholder="es. Tavolo degli sposi"
              style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid rgba(200,162,168,0.4)', fontSize: '0.95rem', fontFamily: 'inherit', boxSizing: 'border-box' }}
            />
          </div>
          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#5a4030', display: 'block', marginBottom: 4 }}>Posti a sedere</label>
            <input
              type="number" min={2} max={20} value={seats} onChange={e => setSeats(e.target.value)}
              style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid rgba(200,162,168,0.4)', fontSize: '0.95rem', fontFamily: 'inherit', boxSizing: 'border-box' }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
          {table?.id && (
            <button onClick={() => onDelete(table.id)} style={{
              padding: '10px 16px', borderRadius: 8, border: '1px solid #fcc',
              background: '#fee', color: '#c33', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.85rem',
            }}>
              Elimina
            </button>
          )}
          <button onClick={onClose} style={{
            flex: 1, padding: '10px', borderRadius: 8, border: '1px solid rgba(200,162,168,0.35)',
            background: 'none', cursor: 'pointer', fontFamily: 'inherit', color: '#9a8070',
          }}>
            Annulla
          </button>
          <button onClick={handleSave} disabled={saving || !name.trim()} style={{
            flex: 2, padding: '10px', borderRadius: 8, border: 'none',
            background: 'linear-gradient(135deg,#c8a2a8,#e8c4a8)', color: '#fff',
            cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit', fontWeight: 600,
            opacity: saving || !name.trim() ? 0.6 : 1,
          }}>
            {saving ? 'Salvo…' : '✓ Salva'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// Main Tables page
// ════════════════════════════════════════════════════════════════════════════
export default function Tables() {
  const navigate = useNavigate()
  const { isGranted } = useTableAuth()
  const [authed, setAuthed] = useState(isGranted())

  const [tables,  setTables]  = useState([])
  const [guests,  setGuests]  = useState([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState('')

  // UI state
  const [selectedTable, setSelectedTable] = useState(null)
  const [seatPicker, setSeatPicker] = useState(null)   // { table, seatIndex, currentGuest }
  const [tableEditor, setTableEditor] = useState(null) // null | table object | {}

  // ── fetch ──────────────────────────────────────────────────────────────
  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [t, g] = await Promise.all([
        apiFetch('/api/tables'),
        apiFetch('/api/guests/all-guests'),
      ])
      setTables(t)
      setGuests(g)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  // ── stats ──────────────────────────────────────────────────────────────
  const totalSeats    = tables.reduce((s, t) => s + t.seats, 0)
  const assignedCount = tables.reduce((s, t) => s + (t.assigned?.filter(Boolean).length || 0), 0)
  const freeSeats     = totalSeats - assignedCount

  // ── handlers ───────────────────────────────────────────────────────────
  const handleSeatClick = (table, seatIndex, currentGuest) => {
    setSeatPicker({ table, seatIndex, currentGuest })
  }

  const handleAssign = async (tableId, seatIndex, guestId) => {
    try {
      await apiFetch(`/api/tables/${tableId}/assign`, {
        method: 'POST',
        body: JSON.stringify({ seat_index: seatIndex, guest_id: guestId }),
      })
      setSeatPicker(null)
      load()
    } catch (e) { alert(e.message) }
  }

  const handleRemove = async (tableId, seatIndex) => {
    try {
      await apiFetch(`/api/tables/${tableId}/seats/${seatIndex}`, { method: 'DELETE' })
      setSeatPicker(null)
      load()
    } catch (e) { alert(e.message) }
  }

  const handleSaveTable = async (t) => {
    try {
      if (t.id) {
        await apiFetch(`/api/tables/${t.id}`, { method: 'PUT', body: JSON.stringify({ name: t.name, seats: t.seats }) })
      } else {
        await apiFetch('/api/tables', { method: 'POST', body: JSON.stringify({ name: t.name, seats: t.seats }) })
      }
      setTableEditor(null)
      load()
    } catch (e) { alert(e.message) }
  }

  const handleDeleteTable = async (id) => {
    if (!confirm('Eliminare questo tavolo? Gli ospiti assegnati verranno rimossi.')) return
    try {
      await apiFetch(`/api/tables/${id}`, { method: 'DELETE' })
      setTableEditor(null)
      setSelectedTable(null)
      load()
    } catch (e) { alert(e.message) }
  }

  // ── columns layout ──────────────────────────────────────────────────────
  // Each table needs a 220×220 SVG cell
  const CELL = 260

  // ── Auth gate (must be after all hooks) ────────────────────────────────
  if (!authed) return <TableAuth onSuccess={() => setAuthed(true)} />

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
      <div className="spinner" />
    </div>
  )

  if (error) return (
    <div style={{ textAlign: 'center', padding: 40, color: '#c33' }}>
      <p>{error}</p>
      <button className="btn btn-primary" onClick={load}>Riprova</button>
    </div>
  )

  return (
    <div style={{ padding: '24px 16px 80px', maxWidth: 1200, margin: '0 auto' }}>

      {/* ── Header ── */}
      <div style={{ marginBottom: 24, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontFamily: 'Georgia,serif', fontSize: '1.8rem', color: '#2c2420', margin: 0 }}>
            🪑 Disposizione Tavoli
          </h1>
          <p style={{ color: '#9a8070', margin: '4px 0 0', fontSize: '0.9rem' }}>
            {tables.length} tavoli · {assignedCount} ospiti assegnati · {freeSeats} posti liberi
          </p>
        </div>
        <button
          onClick={() => setTableEditor({})}
          style={{
            padding: '10px 20px', borderRadius: 99, border: 'none',
            background: 'linear-gradient(135deg,#c8a2a8,#e8c4a8)', color: '#fff',
            cursor: 'pointer', fontWeight: 600, fontFamily: 'inherit', fontSize: '0.9rem',
            boxShadow: '0 2px 8px rgba(200,130,100,0.25)',
          }}
        >
          + Nuovo tavolo
        </button>
      </div>

      {/* ── Legend ── */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
        {[
          { color: '#6a9e6c', label: 'Confermato' },
          { color: '#b0a090', label: 'In attesa' },
          { color: '#c97a7a', label: 'Rifiutato' },
          { color: 'rgba(255,255,255,0.7)', label: 'Posto libero', border: 'rgba(180,140,120,0.4)' },
        ].map(({ color, label, border }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem', color: '#9a8070' }}>
            <span style={{ width: 12, height: 12, borderRadius: '50%', background: color, border: border ? `1px solid ${border}` : 'none', flexShrink: 0 }} />
            {label}
          </div>
        ))}
      </div>

      {/* ── Empty state ── */}
      {tables.length === 0 && (
        <div style={{
          textAlign: 'center', padding: '60px 20px',
          background: 'rgba(240,228,216,0.3)', borderRadius: 16,
          border: '2px dashed rgba(200,162,168,0.35)',
        }}>
          <div style={{ fontSize: '3rem', marginBottom: 12 }}>🪑</div>
          <h3 style={{ fontFamily: 'Georgia,serif', color: '#2c2420', margin: '0 0 8px' }}>Nessun tavolo ancora</h3>
          <p style={{ color: '#9a8070', margin: '0 0 20px' }}>Crea il primo tavolo per iniziare a sistemare gli ospiti</p>
          <button
            onClick={() => setTableEditor({})}
            style={{
              padding: '12px 28px', borderRadius: 99, border: 'none',
              background: 'linear-gradient(135deg,#c8a2a8,#e8c4a8)', color: '#fff',
              cursor: 'pointer', fontWeight: 600, fontFamily: 'inherit',
            }}
          >
            + Crea primo tavolo
          </button>
        </div>
      )}

      {/* ── Tables grid ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: `repeat(auto-fill, minmax(${CELL}px, 1fr))`,
        gap: 16,
      }}>
        {tables.map(table => (
          <div
            key={table.id}
            style={{
              background: selectedTable?.id === table.id ? 'rgba(200,162,168,0.08)' : 'rgba(255,255,255,0.7)',
              borderRadius: 16,
              border: `1.5px solid ${selectedTable?.id === table.id ? 'rgba(200,162,168,0.5)' : 'rgba(200,162,168,0.2)'}`,
              padding: 8,
              transition: 'all 0.2s',
              boxShadow: selectedTable?.id === table.id ? '0 4px 20px rgba(200,130,100,0.12)' : '0 2px 8px rgba(0,0,0,0.04)',
            }}
          >
            <svg viewBox="0 0 260 260" width="100%" style={{ display: 'block' }}>
              <TableCircle
                table={table}
                guests={guests}
                onSeatClick={handleSeatClick}
                onTableClick={t => setSelectedTable(prev => prev?.id === t.id ? null : t)}
                selected={selectedTable?.id === table.id}
              />
            </svg>
            {/* Edit button below table */}
            <button
              onClick={() => setTableEditor(table)}
              style={{
                display: 'block', width: '100%', padding: '7px', marginTop: 4,
                borderRadius: 8, border: '1px solid rgba(200,162,168,0.3)',
                background: 'none', cursor: 'pointer', color: '#9a8070',
                fontSize: '0.78rem', fontFamily: 'inherit',
              }}
            >
              ✎ Modifica tavolo
            </button>
          </div>
        ))}
      </div>

      {/* ── Guest list panel (when table selected) ── */}
      {selectedTable && (() => {
        const t = tables.find(x => x.id === selectedTable.id)
        if (!t) return null
        const assigned = (t.assigned || []).filter(Boolean)
        const empty    = t.seats - assigned.length
        return (
          <div style={{
            marginTop: 24, padding: 20,
            background: 'rgba(255,255,255,0.85)', borderRadius: 16,
            border: '1px solid rgba(200,162,168,0.25)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
          }}>
            <h3 style={{ fontFamily: 'Georgia,serif', color: '#2c2420', margin: '0 0 12px', fontSize: '1rem' }}>
              {t.name} — Ospiti assegnati ({assigned.length}/{t.seats})
            </h3>
            {assigned.length === 0 ? (
              <p style={{ color: '#b0a090', fontSize: '0.85rem', margin: 0 }}>Nessun ospite assegnato. Clicca su un posto per aggiungere.</p>
            ) : (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {assigned.map((g, i) => g && (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '5px 10px', borderRadius: 99,
                    background: `${rsvpColor(g.rsvp_status)}22`,
                    border: `1px solid ${rsvpColor(g.rsvp_status)}55`,
                    fontSize: '0.82rem', color: '#2c2420',
                  }}>
                    <span style={{ width: 7, height: 7, borderRadius: '50%', background: rsvpColor(g.rsvp_status) }} />
                    {g.name}
                    <button
                      onClick={() => handleRemove(t.id, i)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: '#c97a7a', lineHeight: 1, fontSize: '0.9rem' }}
                    >×</button>
                  </div>
                ))}
              </div>
            )}
            {empty > 0 && (
              <p style={{ color: '#b0a090', fontSize: '0.8rem', margin: '10px 0 0' }}>
                {empty} {empty === 1 ? 'posto libero' : 'posti liberi'} — clicca sugli omini nella planimetria per assegnare
              </p>
            )}
          </div>
        )
      })()}

      {/* ── Unassigned guests ── */}
      {(() => {
        const seated = new Set(tables.flatMap(t => (t.assigned || []).map(g => g?.id)).filter(Boolean))
        const unassigned = guests.filter(g => !seated.has(g.id))
        if (unassigned.length === 0) return null
        return (
          <div style={{
            marginTop: 16, padding: 20,
            background: 'rgba(255,248,240,0.9)', borderRadius: 16,
            border: '1px solid rgba(232,196,168,0.35)',
          }}>
            <h3 style={{ fontFamily: 'Georgia,serif', color: '#2c2420', margin: '0 0 10px', fontSize: '0.95rem' }}>
              Ospiti senza posto ({unassigned.length})
            </h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {unassigned.map(g => (
                <span key={g.id} style={{
                  padding: '4px 10px', borderRadius: 99,
                  background: `${rsvpColor(g.rsvp_status)}18`,
                  border: `1px solid ${rsvpColor(g.rsvp_status)}44`,
                  fontSize: '0.8rem', color: '#5a4030',
                  display: 'flex', alignItems: 'center', gap: 5,
                }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: rsvpColor(g.rsvp_status) }} />
                  {g.name}
                </span>
              ))}
            </div>
          </div>
        )
      })()}

      {/* ── Modals ── */}
      {seatPicker && (
        <GuestPicker
          table={seatPicker.table}
          seatIndex={seatPicker.seatIndex}
          currentGuest={seatPicker.currentGuest}
          guests={guests}
          allTables={tables}
          onAssign={handleAssign}
          onRemove={handleRemove}
          onClose={() => setSeatPicker(null)}
        />
      )}
      {tableEditor !== null && (
        <TableEditor
          table={tableEditor?.id ? tableEditor : null}
          onSave={handleSaveTable}
          onDelete={handleDeleteTable}
          onClose={() => setTableEditor(null)}
        />
      )}
    </div>
  )
}