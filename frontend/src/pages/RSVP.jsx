import { useState, useEffect, useRef } from 'react'
import { Minus, Plus, Users, Baby } from 'lucide-react'
import { api } from '../utils/api'
import { useToast, ToastContainer } from '../hooks/useToast'
import { useLanguage } from '../hooks/useLanguage'
import LanguageSwitch from '../components/LanguageSwitch'
import Skeleton from '../components/Skeleton'
import { burstConfetti } from '../utils/confetti'

/* Compact +/- stepper for party size */
function Stepper({ icon, label, hint, value, onChange, max = 10 }) {
  const btn = (disabled) => ({
    width: 38, height: 38, borderRadius: '50%', flexShrink: 0,
    border: '1.5px solid var(--hairline)', background: '#fff',
    cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.4 : 1,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: 'var(--rose-deep)', transition: 'all .15s',
  })
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 4px' }}>
      <span style={{
        width: 40, height: 40, borderRadius: 12, flexShrink: 0,
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        background: 'linear-gradient(150deg,var(--rose-soft),var(--blush))', color: 'var(--rose-deep)',
      }}>{icon}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, color: 'var(--charcoal)', fontSize: '.95rem' }}>{label}</div>
        <div style={{ fontSize: '.78rem', color: 'var(--warm-gray)' }}>{hint}</div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button type="button" aria-label="−" style={btn(value <= 0)} disabled={value <= 0} onClick={() => onChange(Math.max(0, value - 1))}><Minus size={16} /></button>
        <span style={{ minWidth: 22, textAlign: 'center', fontWeight: 700, fontSize: '1.1rem', color: 'var(--charcoal)', fontVariantNumeric: 'tabular-nums' }}>{value}</span>
        <button type="button" aria-label="+" style={btn(value >= max)} disabled={value >= max} onClick={() => onChange(Math.min(max, value + 1))}><Plus size={16} /></button>
      </div>
    </div>
  )
}

export default function Rsvp() {
  const toast = useToast()
  const { t } = useLanguage()
  const [allGuests, setAllGuests] = useState([])
  const [selectedGuestId, setSelectedGuestId] = useState('')
  const [guest, setGuest] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [rsvpStatus, setRsvpStatus] = useState('confirmed')
  const [dietary, setDietary] = useState('')
  const [specialRequests, setSpecialRequests] = useState('')
  const [companions, setCompanions] = useState([])
  const [children, setChildren] = useState(0)
  const [editingCompanion, setEditingCompanion] = useState(null)
  const [companionForm, setCompanionForm] = useState({ name: '', dietary: '', special_requests: '' })
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
      setSpecialRequests(selected.special_requests || '')
      setCompanions(Array.isArray(selected.companions) ? selected.companions : [])
      setChildren(Number(selected.children) || 0)
    }
  }

  const save = async () => {
    if (!guest) { toast.error(t('rsvp.toastSelectGuest')); return }
    setSaving(true)
    try {
      const payload = rsvpStatus === 'confirmed'
        ? { rsvp_status: rsvpStatus, dietary, special_requests: specialRequests, companions, children }
        : { rsvp_status: rsvpStatus, dietary, special_requests: specialRequests, companions: [], children: 0 }
      const updated = await api.updatersvp(guest.id, payload)
      setGuest(updated)
      setAllGuests(prev => prev.map(g => g.id === guest.id ? updated : g))
      if (rsvpStatus === 'confirmed') {
        toast.success(t('rsvp.toastConfirmed'))
        burstConfetti()
      } else {
        toast.success(t('rsvp.toastDeclined'))
      }
    } catch (e) {
      toast.error(t('rsvp.toastError', { message: e.message }))
    }
    setSaving(false)
  }

  if (loading) return (
    <div className="page-enter" style={{ padding: '60px 20px 100px' }}>
      <div className="container-sm">
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, marginBottom: 40 }}>
          <Skeleton width={64} height={64} radius="50%" />
          <Skeleton width={220} height={30} />
          <Skeleton width={160} height={16} />
        </div>
        <div className="card" style={{ padding: 32, display: 'flex', flexDirection: 'column', gap: 18 }}>
          <Skeleton width={120} height={14} />
          <Skeleton height={48} radius="var(--radius-md)" />
          <Skeleton width={120} height={14} style={{ marginTop: 8 }} />
          <div style={{ display: 'flex', gap: 12 }}>
            <Skeleton height={86} radius="var(--radius-md)" />
            <Skeleton height={86} radius="var(--radius-md)" />
          </div>
          <Skeleton height={48} radius="var(--radius-pill)" style={{ marginTop: 8 }} />
        </div>
      </div>
    </div>
  )

  const confirmedCount = allGuests.filter(g => g.rsvp_status === 'confirmed').length
  const totalGuests = allGuests.length

  const dietaryOptions = [
    { val: '',               icon: '🍽️', label: t('rsvp.dietaryNone') },
    { val: 'vegetariano',    icon: '🥗', label: t('rsvp.dietaryVegetarian') },
    { val: 'vegano',         icon: '🌱', label: t('rsvp.dietaryVegan') },
    { val: 'senza_glutine',  icon: '🌾', label: t('rsvp.dietaryGlutenFree') },
    { val: 'senza_lattosio', icon: '🥛', label: t('rsvp.dietaryLactoseFree') },
    { val: 'allergie',       icon: '⚠️', label: t('rsvp.dietaryAllergies') },
  ]

  const infoCards = [
    { icon: '📅', label: t('rsvp.infoDate'),      val: t('rsvp.infoDateVal') },
    { icon: '📍', label: t('rsvp.infoLocation'),  val: t('rsvp.infoLocationVal') },
    { icon: '🚗', label: t('rsvp.infoParking'),   val: t('rsvp.infoParkingVal') },
    { icon: '👗', label: t('rsvp.infoDressCode'), val: t('rsvp.infoDressCodeVal') },
  ]

  return (
    <div className="page-enter" style={{ padding: '60px 20px 100px' }}>
      <div className="container-sm">

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 48, position: 'relative' }}>
          <div style={{ position: 'absolute', top: -16, right: 0 }}>
            <LanguageSwitch />
          </div>
          <div style={{ fontSize: '3rem', marginBottom: 16 }}>✉️</div>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '2.5rem', color: 'var(--charcoal)', marginBottom: 8 }}>
            {t('rsvp.headerTitle')}
          </h1>
          <p style={{ color: 'var(--warm-gray)' }}>
            {t('rsvp.headerSubtitle')}
          </p>
        </div>

        {/* Main card */}
        <div className="card" style={{ padding: 32 }}>

          {/* Step 1 — Guest selector */}
          <div style={{ marginBottom: 28 }}>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, color: 'var(--charcoal)', fontSize: '.9rem', textTransform: 'uppercase', letterSpacing: '.04em' }}>
              {t('rsvp.step1')}
            </label>
            <select
              className="select"
              value={selectedGuestId}
              onChange={handleGuestSelect}
              style={{ fontSize: '1rem', padding: '12px 14px', width: '100%' }}
            >
              <option value="">{t('rsvp.choosePlaceholder')}</option>
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
                    {guest.rsvp_status === 'confirmed' ? t('rsvp.alreadyConfirmed') : t('rsvp.alreadyDeclined')}
                  </span>
                  <p style={{ fontSize: '.8rem', color: 'var(--warm-gray)', marginTop: 6 }}>
                    {t('rsvp.updateNote')}
                  </p>
                </div>
              )}

              {/* Step 2 — RSVP choice */}
              <div style={{ marginBottom: 28 }}>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, color: 'var(--charcoal)', fontSize: '.9rem', textTransform: 'uppercase', letterSpacing: '.04em' }}>
                  {t('rsvp.step2')}
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  {[
                    { val: 'confirmed', icon: '🎉', label: t('rsvp.willAttend'), desc: t('rsvp.willAttendDesc') },
                    { val: 'declined',  icon: '😔', label: t('rsvp.willDecline'), desc: t('rsvp.willDeclineDesc') },
                  ].map(opt => (
                    <button
                      key={opt.val}
                      onClick={() => setRsvpStatus(opt.val)}
                      style={{
                        padding: '20px 16px', borderRadius: 'var(--radius-md)',
                        border: rsvpStatus === opt.val ? '2px solid var(--rose)' : '2px solid var(--cream)',
                        background: rsvpStatus === opt.val ? 'rgba(199,107,139,.08)' : 'var(--ivory)',
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
                    {t('rsvp.step3')}
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 10 }}>
                    {dietaryOptions.map(opt => (
                      <button
                        key={opt.val}
                        onClick={() => setDietary(opt.val)}
                        style={{
                          padding: '14px 10px', borderRadius: 'var(--radius-md)',
                          border: dietary === opt.val ? '2px solid var(--rose)' : '2px solid var(--cream)',
                          background: dietary === opt.val ? 'rgba(199,107,139,.08)' : 'var(--ivory)',
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
                      {t('rsvp.allergyNote')}
                    </p>
                  )}
                </div>
              )}

              {/* Special requests for main guest (only when confirmed) */}
              {rsvpStatus === 'confirmed' && (
                <div style={{ marginBottom: 28 }}>
                  <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, color: 'var(--charcoal)', fontSize: '.9rem', textTransform: 'uppercase', letterSpacing: '.04em' }}>
                    Richieste speciali (opzionale)
                  </label>
                  <textarea
                    value={specialRequests}
                    onChange={e => setSpecialRequests(e.target.value)}
                    placeholder="Es. senza noci, tavolo vicino all'entrata, ecc."
                    style={{
                      width: '100%', padding: '12px 14px', borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--hairline)', fontFamily: 'inherit', fontSize: '.95rem',
                      color: 'var(--charcoal)', resize: 'vertical', minHeight: 80
                    }}
                  />
                </div>
              )}

              {/* Party size — companions & children (only when confirming) */}
              {rsvpStatus === 'confirmed' && (
                <div style={{ marginBottom: 28 }}>
                  <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, color: 'var(--charcoal)', fontSize: '.9rem', textTransform: 'uppercase', letterSpacing: '.04em' }}>
                    {t('rsvp.partyTitle')}
                  </label>
                  <div style={{ background: 'var(--ivory)', border: '1px solid var(--hairline)', borderRadius: 'var(--radius-md)', padding: '4px 14px' }}>
                    <Stepper
                      icon={<Users size={20} />}
                      label={t('rsvp.companionsLabel')}
                      hint={t('rsvp.companionsHint')}
                      value={companions.length}
                      onChange={(n) => {
                        if (n > companions.length) {
                          setEditingCompanion({ idx: companions.length, isNew: true })
                          setCompanionForm({ name: '', dietary: '', special_requests: '' })
                        } else {
                          setCompanions(companions.slice(0, n))
                        }
                      }}
                    />
                    <div style={{ height: 1, background: 'var(--hairline)' }} />
                    <Stepper icon={<Baby size={20} />} label={t('rsvp.childrenLabel')} hint={t('rsvp.childrenHint')} value={children} onChange={setChildren} />
                  </div>

                  {/* Companion list */}
                  {companions.length > 0 && (
                    <div style={{ marginTop: 16 }}>
                      {companions.map((c, idx) => (
                        <div
                          key={idx}
                          style={{
                            padding: '12px 14px', marginBottom: 8, borderRadius: 'var(--radius-md)',
                            background: 'var(--ivory)', border: '1px solid var(--hairline)',
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                          }}
                        >
                          <div>
                            <div style={{ fontWeight: 600, color: 'var(--charcoal)', fontSize: '.95rem' }}>{c.name}</div>
                            <div style={{ fontSize: '.82rem', color: 'var(--warm-gray)' }}>
                              {c.dietary && `Dieta: ${c.dietary}`}
                              {c.special_requests && ` • ${c.special_requests}`}
                            </div>
                          </div>
                          <button
                            onClick={() => {
                              setEditingCompanion({ idx, isNew: false })
                              setCompanionForm(c)
                            }}
                            style={{
                              padding: '6px 10px', borderRadius: 6, border: '1px solid var(--hairline)',
                              background: 'white', cursor: 'pointer', fontSize: '.85rem', color: 'var(--warm-gray)'
                            }}
                          >
                            ✏️ Modifica
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Modal for editing companion */}
              {editingCompanion && (
                <div style={{
                  position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', zIndex: 1000,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
                }} onClick={e => e.target === e.currentTarget && setEditingCompanion(null)}>
                  <div className="card" style={{ width: '100%', maxWidth: 480, padding: 28 }}>
                    <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.2rem', marginBottom: 20 }}>
                      {editingCompanion.isNew ? 'Aggiungi accompagnatore' : 'Modifica accompagnatore'}
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      <div>
                        <label style={{ fontSize: '.85rem', fontWeight: 600, color: 'var(--charcoal)', display: 'block', marginBottom: 4 }}>Nome *</label>
                        <input
                          className="input"
                          placeholder="Nome Cognome"
                          value={companionForm.name}
                          onChange={e => setCompanionForm(p => ({ ...p, name: e.target.value }))}
                        />
                      </div>

                      <div>
                        <label style={{ fontSize: '.85rem', fontWeight: 600, color: 'var(--charcoal)', display: 'block', marginBottom: 8 }}>Intolleranze alimentari (opzionale)</label>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 8 }}>
                          {dietaryOptions.map(opt => (
                            <button
                              key={opt.val}
                              onClick={() => setCompanionForm(p => ({ ...p, dietary: opt.val }))}
                              style={{
                                padding: '10px 8px', borderRadius: 'var(--radius-md)',
                                border: companionForm.dietary === opt.val ? '2px solid var(--rose)' : '2px solid var(--cream)',
                                background: companionForm.dietary === opt.val ? 'rgba(199,107,139,.08)' : 'var(--ivory)',
                                cursor: 'pointer', transition: 'all .2s', textAlign: 'center', fontSize: '.78rem'
                              }}
                            >
                              <div style={{ fontSize: '1.1rem', marginBottom: 2 }}>{opt.icon}</div>
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label style={{ fontSize: '.85rem', fontWeight: 600, color: 'var(--charcoal)', display: 'block', marginBottom: 4 }}>Richieste speciali (opzionale)</label>
                        <textarea
                          value={companionForm.special_requests}
                          onChange={e => setCompanionForm(p => ({ ...p, special_requests: e.target.value }))}
                          placeholder="Es. allergia a frutta secca, preferenza di menu, ecc."
                          style={{
                            width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-md)',
                            border: '1px solid var(--hairline)', fontFamily: 'inherit', fontSize: '.9rem',
                            color: 'var(--charcoal)', resize: 'vertical', minHeight: 60
                          }}
                        />
                      </div>
                    </div>

                    <div style={{ marginTop: 20, display: 'flex', gap: 10 }}>
                      <button
                        className="btn btn-outline"
                        onClick={() => {
                          if (!editingCompanion.isNew) {
                            setCompanions(companions.filter((_, i) => i !== editingCompanion.idx))
                          }
                          setEditingCompanion(null)
                        }}
                        style={{ flex: 1 }}
                      >
                        {editingCompanion.isNew ? 'Annulla' : 'Elimina'}
                      </button>
                      <button
                        className="btn btn-primary"
                        onClick={() => {
                          if (!companionForm.name.trim()) {
                            toast.error('Il nome è obbligatorio')
                            return
                          }
                          const updated = [...companions]
                          if (editingCompanion.isNew) {
                            updated.push(companionForm)
                          } else {
                            updated[editingCompanion.idx] = companionForm
                          }
                          setCompanions(updated)
                          setEditingCompanion(null)
                        }}
                        style={{ flex: 1 }}
                      >
                        Salva
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Save button */}
              <button
                className="btn btn-primary"
                onClick={save}
                disabled={saving}
                style={{ width: '100%', justifyContent: 'center', padding: '14px 0' }}
              >
                {saving ? t('rsvp.saving') : t('rsvp.confirm')}
              </button>

              {/* Info cards (only when confirming) */}
              {rsvpStatus === 'confirmed' && (
                <div style={{ marginTop: 32, display: 'grid', gap: 12 }}>
                  {infoCards.map(info => (
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
              {t('rsvp.guestListTitle')}
            </h2>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20 }}>
              <div className="card" style={{ padding: '12px 16px', flex: '1', minWidth: 140 }}>
                <div style={{ fontSize: '.8rem', color: 'var(--warm-gray)', textTransform: 'uppercase', letterSpacing: '.04em' }}>{t('rsvp.totalGuests')}</div>
                <div style={{ fontSize: '1.6rem', fontWeight: 600, color: 'var(--charcoal)' }}>{totalGuests}</div>
              </div>
              <div className="card" style={{ padding: '12px 16px', flex: '1', minWidth: 140, background: 'rgba(199,107,139,.08)' }}>
                <div style={{ fontSize: '.8rem', color: 'var(--warm-gray)', textTransform: 'uppercase', letterSpacing: '.04em' }}>{t('rsvp.confirmedCount')}</div>
                <div style={{ fontSize: '1.6rem', fontWeight: 600, color: 'var(--rose)' }}>{confirmedCount}</div>
              </div>
            </div>

            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'var(--cream)', borderBottom: '1px solid var(--border-light)' }}>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '.82rem', fontWeight: 600, color: 'var(--warm-gray)', textTransform: 'uppercase', letterSpacing: '.04em' }}>{t('rsvp.colName')}</th>
                    <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '.82rem', fontWeight: 600, color: 'var(--warm-gray)', textTransform: 'uppercase', letterSpacing: '.04em' }}>{t('rsvp.colStatus')}</th>
                  </tr>
                </thead>
                <tbody>
                  {allGuests.map((g, idx) => (
                    <tr
                      key={g.id}
                      style={{
                        borderBottom: idx < allGuests.length - 1 ? '1px solid var(--border-light)' : 'none',
                        background: String(g.id) === selectedGuestId ? 'rgba(199,107,139,.05)' : 'transparent',
                      }}
                    >
                      <td style={{ padding: '11px 16px', color: 'var(--charcoal)', fontWeight: String(g.id) === selectedGuestId ? 600 : 400 }}>
                        {g.name}
                      </td>
                      <td style={{ padding: '11px 16px', textAlign: 'center' }}>
                        {g.rsvp_status === 'confirmed' ? (
                          <span className="badge" style={{ background: 'rgba(67,160,71,.2)', color: '#2d6a4f' }}>{t('rsvp.statusConfirmed')}</span>
                        ) : g.rsvp_status === 'declined' ? (
                          <span className="badge" style={{ background: 'rgba(199,107,139,.16)', color: 'var(--rose-deep)' }}>{t('rsvp.statusDeclined')}</span>
                        ) : (
                          <span className="badge" style={{ background: 'var(--cream)', color: 'var(--warm-gray)' }}>{t('rsvp.statusPending')}</span>
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
