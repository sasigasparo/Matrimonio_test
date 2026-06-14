import { useState, useEffect, useRef } from 'react'
import { api } from '../utils/api'
import { useToast, ToastContainer } from '../hooks/useToast'

export default function Rsvp() {
  const toast = useToast()
  const [allGuests, setAllGuests] = useState([])
  const [selectedGuestId, setSelectedGuestId] = useState('')
  const [guest, setGuest] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [rsvpStatus, setRsvpStatus] = useState('confirmed')
  const [dietary, setDietary] = useState('')
  const dietaryRef = useRef(null)

  useEffect(() => {
    api.allGuests()
      .then(guests => setAllGuests(guests || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  // Scroll to dietary section if arriving from FAQ link
  useEffect(() => {
    if (window.location.hash === '#dietary' && dietaryRef.current) {
      setTimeout(() => {
        dietaryRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }, 600)
    }
  }, [loading])

  const handleGuestSelect = (e) => {
    const id = e.target.value
    setSelectedGuestId(id)
    if (!id) { setGuest(null); return }
    const selected = allGuests.find(g => String(g.id) === id)
    if (selected) {
      setGuest(selected)
      setRsvpStatus(selected.rsvp_status === 'declined' ? 'declined' : 'confirmed')
      setDietary(selected.dietary || '')
    }
  }

  const save = async () => {
    if (!guest) { toast.error('Seleziona il tuo nome'); return }
    setSaving(true)
    try {
      const updated = await api.updatersvp(guest.id, { rsvp_status: rsvpStatus, dietary })
      setGuest(updated)
      setAllGuests(prev => prev.map(g => g.id === guest.id ? updated : g))
      toast.success(rsvpStatus === 'confirmed'
        ? '🎉 Presenza confermata! Ci vediamo al matrimonio!'
        : 'Risposta registrata. Grazie!')
    } catch (e) {
      toast.error('Errore: ' + e.message)
    }
    setSaving(false)
  }

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}>
      <div className="spinner" />
    </div>
  )

  const confirmedCount = allGuests.filter(g => g.rsvp_status === 'confirmed').length
  const totalGuests = allGuests.length

  return (
    <div className="page-enter" style={{ padding: '60px 20px 100px' }}>
      <div className="container-sm">

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <div style={{ fontSize: '3rem', marginBottom: 16 }}>✉️</div>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '2.5rem', color: 'var(--charcoal)', marginBottom: 8 }}>
            Sezione inviti
          </h1>
          <p style={{ color: 'var(--warm-gray)' }}>
            Scegli il tuo nome per confermare la tua presenza
          </p>
        </div>

        {/* Main card */}
        <div className="card" style={{ padding: 32 }}>

          {/* Step 1 — Guest selector */}
          <div style={{ marginBottom: 28 }}>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, color: 'var(--charcoal)', fontSize: '.9rem', textTransform: 'uppercase', letterSpacing: '.04em' }}>
              1 · Chi sei?
            </label>
            <select
              className="select"
              value={selectedGuestId}
              onChange={handleGuestSelect}
              style={{ fontSize: '1rem', padding: '12px 14px', width: '100%' }}
            >
              <option value="">— Scegli il tuo nome —</option>
              {allGuests.map(g => (
                <option key={g.id} value={String(g.id)}>
                  {g.name}
                  {g.rsvp_status === 'confirmed' ? ' ✓' : g.rsvp_status === 'declined' ? ' ✕' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Steps 2 & 3 appear only after a guest is selected */}
          {guest && (
            <>
              {/* Current status badge */}
              {guest.rsvp_status !== 'pending' && (
                <div style={{ marginBottom: 20, textAlign: 'center' }}>
                  <span className={`badge badge-${guest.rsvp_status}`}>
                    {guest.rsvp_status === 'confirmed' ? '✓ Già confermato' : '✕ Hai già declinato'}
                  </span>
                  <p style={{ fontSize: '.8rem', color: 'var(--warm-gray)', marginTop: 6 }}>
                    Puoi aggiornare la risposta qui sotto.
                  </p>
                </div>
              )}

              {/* Step 2 — RSVP choice */}
              <div style={{ marginBottom: 28 }}>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, color: 'var(--charcoal)', fontSize: '.9rem', textTransform: 'uppercase', letterSpacing: '.04em' }}>
                  2 · Puoi partecipare?
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  {[
                    { val: 'confirmed', icon: '🎉', label: 'Ci sarò!', desc: "Non vedo l'ora" },
                    { val: 'declined',  icon: '😔', label: 'Non posso', desc: 'Con dispiacere' },
                  ].map(opt => (
                    <button
                      key={opt.val}
                      onClick={() => setRsvpStatus(opt.val)}
                      style={{
                        padding: '20px 16px', borderRadius: 'var(--radius-md)',
                        border: rsvpStatus === opt.val ? '2px solid var(--rose)' : '2px solid var(--cream)',
                        background: rsvpStatus === opt.val ? 'rgba(200,130,106,.08)' : 'var(--ivory)',
                        cursor: 'pointer', transition: 'all .2s', textAlign: 'center',
                      }}
                    >
                      <div style={{ fontSize: '1.8rem', marginBottom: 6 }}>{opt.icon}</div>
                      <div style={{ fontFamily: 'var(--font-serif)', fontSize: '1.1rem', color: 'var(--charcoal)' }}>{opt.label}</div>
                      <div style={{ fontSize: '.8rem', color: 'var(--warm-gray)', marginTop: 2 }}>{opt.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Step 3 — Dietary (only when confirmed) */}
              {rsvpStatus === 'confirmed' && (
                <div id="dietary" ref={dietaryRef} style={{ marginBottom: 28 }}>
                  <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, color: 'var(--charcoal)', fontSize: '.9rem', textTransform: 'uppercase', letterSpacing: '.04em' }}>
                    3 · Esigenze alimentari
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 10 }}>
                    {[
                      { val: '',                icon: '🍽️', label: 'Nessuna' },
                      { val: 'vegetariano',     icon: '🥗', label: 'Vegetariano' },
                      { val: 'vegano',          icon: '🌱', label: 'Vegano' },
                      { val: 'senza_glutine',   icon: '🌾', label: 'Senza glutine' },
                      { val: 'senza_lattosio',  icon: '🥛', label: 'Senza lattosio' },
                      { val: 'allergie',        icon: '⚠️', label: 'Allergie' },
                    ].map(opt => (
                      <button
                        key={opt.val}
                        onClick={() => setDietary(opt.val)}
                        style={{
                          padding: '14px 10px', borderRadius: 'var(--radius-md)',
                          border: dietary === opt.val ? '2px solid var(--rose)' : '2px solid var(--cream)',
                          background: dietary === opt.val ? 'rgba(200,130,106,.08)' : 'var(--ivory)',
                          cursor: 'pointer', transition: 'all .2s', textAlign: 'center',
                        }}
                      >
                        <div style={{ fontSize: '1.4rem', marginBottom: 4 }}>{opt.icon}</div>
                        <div style={{ fontSize: '.82rem', color: 'var(--charcoal)', fontWeight: dietary === opt.val ? 600 : 400 }}>
                          {opt.label}
                        </div>
                      </button>
                    ))}
                  </div>
                  {dietary === 'allergie' && (
                    <p style={{ fontSize: '.82rem', color: 'var(--warm-gray)', marginTop: 8 }}>
                      ℹ️ Specifica le tue allergie nella sezione messaggi, così potremo tener conto di tutto.
                    </p>
                  )}
                </div>
              )}

              {/* Save button */}
              <button
                className="btn btn-primary"
                onClick={save}
                disabled={saving}
                style={{ width: '100%', justifyContent: 'center', padding: '14px 0' }}
              >
                {saving ? 'Salvataggio…' : 'Conferma risposta'}
              </button>

              {/* Info cards (only when confirming) */}
              {rsvpStatus === 'confirmed' && (
                <div style={{ marginTop: 32, display: 'grid', gap: 12 }}>
                  {[
                    { icon: '📅', label: 'Data',       val: 'Sabato 14 Giugno 2025, ore 15:00' },
                    { icon: '📍', label: 'Luogo',      val: 'Villa Belvedere, Via del Poggio 12, Siena (SI)' },
                    { icon: '🚗', label: 'Parcheggio', val: 'Disponibile parcheggio gratuito in loco' },
                    { icon: '👗', label: 'Dress code', val: 'Elegante. Evitare il bianco e il nero.' },
                  ].map(info => (
                    <div key={info.label} className="card" style={{ padding: '14px 18px', display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                      <span style={{ fontSize: '1.3rem' }}>{info.icon}</span>
                      <div>
                        <div style={{ fontSize: '.75rem', color: 'var(--warm-gray)', textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 2 }}>{info.label}</div>
                        <div style={{ color: 'var(--charcoal)', fontSize: '.95rem' }}>{info.val}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Guest list */}
        {allGuests.length > 0 && (
          <div style={{ marginTop: 48 }}>
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.8rem', color: 'var(--charcoal)', marginBottom: 16 }}>
              Elenco invitati
            </h2>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20 }}>
              <div className="card" style={{ padding: '12px 16px', flex: '1', minWidth: 140 }}>
                <div style={{ fontSize: '.8rem', color: 'var(--warm-gray)', textTransform: 'uppercase', letterSpacing: '.04em' }}>Totale invitati</div>
                <div style={{ fontSize: '1.6rem', fontWeight: 600, color: 'var(--charcoal)' }}>{totalGuests}</div>
              </div>
              <div className="card" style={{ padding: '12px 16px', flex: '1', minWidth: 140, background: 'rgba(200,130,106,.08)' }}>
                <div style={{ fontSize: '.8rem', color: 'var(--warm-gray)', textTransform: 'uppercase', letterSpacing: '.04em' }}>Confermati</div>
                <div style={{ fontSize: '1.6rem', fontWeight: 600, color: 'var(--rose)' }}>{confirmedCount}</div>
              </div>
            </div>

            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'var(--cream)', borderBottom: '1px solid var(--border-light)' }}>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '.82rem', fontWeight: 600, color: 'var(--warm-gray)', textTransform: 'uppercase', letterSpacing: '.04em' }}>Nome</th>
                    <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '.82rem', fontWeight: 600, color: 'var(--warm-gray)', textTransform: 'uppercase', letterSpacing: '.04em' }}>Stato</th>
                  </tr>
                </thead>
                <tbody>
                  {allGuests.map((g, idx) => (
                    <tr
                      key={g.id}
                      style={{
                        borderBottom: idx < allGuests.length - 1 ? '1px solid var(--border-light)' : 'none',
                        background: String(g.id) === selectedGuestId ? 'rgba(200,130,106,.05)' : 'transparent',
                      }}
                    >
                      <td style={{ padding: '11px 16px', color: 'var(--charcoal)', fontWeight: String(g.id) === selectedGuestId ? 600 : 400 }}>
                        {g.name}
                      </td>
                      <td style={{ padding: '11px 16px', textAlign: 'center' }}>
                        {g.rsvp_status === 'confirmed' ? (
                          <span className="badge" style={{ background: 'rgba(138,158,140,.2)', color: '#2d6a4f' }}>✓ Confermato</span>
                        ) : g.rsvp_status === 'declined' ? (
                          <span className="badge" style={{ background: 'rgba(200,130,106,.2)', color: '#8b4513' }}>✕ Declinato</span>
                        ) : (
                          <span className="badge" style={{ background: 'var(--cream)', color: 'var(--warm-gray)' }}>⏳ In sospeso</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
      <ToastContainer toasts={toast.toasts} />
    </div>
  )
}