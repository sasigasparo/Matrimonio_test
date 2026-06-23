import { useState, useEffect } from 'react'
import { api } from '../utils/api'
import { useToast, ToastContainer } from '../hooks/useToast'

const DIET_LABELS = {
  vegetariano:    'Vegetariano',
  vegano:         'Vegano',
  senza_glutine:  'Senza glutine',
  senza_lattosio: 'Senza lattosio',
  allergie:       'Allergie',
}

const LOG_LABELS = {
  create_guest:    'Ospite aggiunto',
  update_guest:    'Ospite modificato',
  delete_guest:    'Ospite eliminato',
  send_invite:     'Invito inviato',
  send_all_invites:'Inviti massivi inviati',
  rsvp_update:     'RSVP aggiornato',
  login:           'Accesso',
  upload_photo:    'Foto caricata',
  delete_photo:    'Foto eliminata',
  delete_message:  'Messaggio eliminato',
}

function StatCard({ icon, label, value, color }) {
  return (
    <div className="card" style={{ padding:'20px 24px', display:'flex', gap:16, alignItems:'center' }}>
      <div style={{
        width:48, height:48, borderRadius:'var(--radius-sm)',
        background:`${color}18`, display:'flex', alignItems:'center',
        justifyContent:'center', fontSize:'1.5rem', flexShrink:0
      }}>{icon}</div>
      <div>
        <div style={{ fontSize:'1.8rem', fontFamily:'var(--font-serif)', color:'var(--charcoal)', lineHeight:1 }}>{value}</div>
        <div style={{ fontSize:'.8rem', color:'var(--warm-gray)', textTransform:'uppercase', letterSpacing:'.04em', marginTop:3 }}>{label}</div>
      </div>
    </div>
  )
}

export default function Admin() {
  const toast = useToast()
  const [tab, setTab]             = useState('dashboard')
  const [dashboard, setDashboard] = useState(null)
  const [guests, setGuests]       = useState([])
  const [logs, setLogs]           = useState([])
  const [photos, setPhotos]       = useState([])
  const [messages, setMessages]   = useState([])
  const [geoData, setGeoData]     = useState(null)
  const [geoLoading, setGeoLoading]       = useState(false)
  const [rsvpTimeline, setRsvpTimeline]   = useState([])
  const [timelineLoading, setTimelineLoading] = useState(false)
  const [loading, setLoading]     = useState(true)

  // New guest form
  const [newGuest, setNewGuest] = useState({ name:'', email:'', phone:'', table_num:'', dietary:'' })
  const [addOpen, setAddOpen]       = useState(false)
  const [adding, setAdding]         = useState(false)
  const [rsvpng, setrsvpng]         = useState(false)
  const [sendOnCreate, setSendOnCreate] = useState(true)

  // Edit guest
  const [editGuest, setEditGuest]   = useState(null)
  const [editForm, setEditForm]     = useState({})
  const [saving, setSaving]         = useState(false)
  const [sendOnEdit, setSendOnEdit] = useState(false)

  // Guest table sort
  const [sortField, setSortField] = useState('nome')
  const [sortDir, setSortDir]     = useState('asc')

  useEffect(() => {
    loadDashboard()
    loadGuests()
  }, [])

  const loadDashboard = async () => {
    try {
      const data = await api.dashboard()
      setDashboard(data)
    } catch { toast.error('Errore caricamento dashboard') }
    setLoading(false)
  }

  const loadGuests = async () => {
    try { setGuests(await api.listGuests()) } catch {}
  }

  const loadLogs = async () => {
    try { setLogs(await api.auditLogs()) } catch {}
  }

  const loadPhotos = async () => {
    try { setPhotos(await api.listPhotos()) } catch {}
  }

  const loadMessages = async () => {
    try { setMessages(await api.listMessages()) } catch {}
  }

  const loadGeoStats = async () => {
    setGeoLoading(true)
    try { setGeoData(await api.geoStats()) } catch { toast.error('Errore caricamento statistiche') }
    setGeoLoading(false)
  }

  const loadRsvpTimeline = async () => {
    if (rsvpTimeline.length > 0) return
    setTimelineLoading(true)
    try { setRsvpTimeline(await api.rsvpTimeline()) } catch { toast.error('Errore caricamento timeline') }
    setTimelineLoading(false)
  }

  const switchTab = (id) => {
    setTab(id)
    if (id === 'logs')    loadLogs()
    if (id === 'photos')  loadPhotos()
    if (id === 'messages') loadMessages()
    if (id === 'stats')   loadGeoStats()
    if (id === 'analisi') { loadRsvpTimeline(); loadPhotos(); loadMessages() }
  }

  // ── Guest actions ────────────────────────────────────────────────────────────
  const normalizePhone = (p) => {
    if (!p || !p.trim()) return ''
    const t = p.trim()
    return t.startsWith('+') ? t : '+' + t
  }

  const addGuest = async () => {
    if (!newGuest.name || !newGuest.email) { toast.error('Nome ed email richiesti'); return }
    setAdding(true)
    try {
      const tableNum = parseInt(newGuest.table_num, 10)
      const g = await api.createGuest({ ...newGuest, phone: normalizePhone(newGuest.phone), table_num: tableNum > 0 ? tableNum : null })
      setGuests(prev => [...prev, g])
      toast.success(`✓ Invitato ${g.name} aggiunto`)
      setNewGuest({ name:'', email:'', phone:'', table_num:'', dietary:'' })
      setAddOpen(false)
      loadDashboard()
      if (sendOnCreate) sendInvite(g.id, g.name)
    } catch(e) { toast.error('Errore: ' + e.message) }
    setAdding(false)
  }

  const sendInvite = async (id, name) => {
    try {
      const r = await api.sendInvite(id)
      r.sent ? toast.success(`📧 Invito inviato a ${name}`) : toast.error('SMTP non configurato — configura le variabili email nel .env')
      loadGuests()
    } catch(e) { toast.error('Errore: ' + e.message) }
  }

  const sendAll = async () => {
    setrsvpng(true)
    try {
      const results = await api.sendAll()
      const sent = results.filter(r => r.sent).length
      toast.success(`📧 ${sent} rsvp inviati su ${results.length}`)
      loadGuests(); loadDashboard()
    } catch(e) { toast.error('Errore: ' + e.message) }
    setrsvpng(false)
  }

  const deleteGuest = async (id, name) => {
    if (!confirm(`Eliminare ${name}?`)) return
    try {
      await api.deleteGuest(id)
      setGuests(prev => prev.filter(g => g.id !== id))
      toast.success('Invitato eliminato')
      loadDashboard()
    } catch { toast.error('Errore') }
  }

  const openEdit = (g) => {
    setEditGuest(g)
    setEditForm({ name: g.name, email: g.email, phone: g.phone || '', table_num: g.table_num ?? '' })
  }

  const saveEdit = async () => {
    if (!editForm.name || !editForm.email) { toast.error('Nome ed email richiesti'); return }
    setSaving(true)
    try {
      const tableNum = parseInt(editForm.table_num, 10)
      const updated = await api.updateGuest(editGuest.id, {
        ...editForm,
        phone: normalizePhone(editForm.phone),
        table_num: tableNum > 0 ? tableNum : null,
      })
      setGuests(prev => prev.map(g => g.id === updated.id ? updated : g))
      toast.success(`✓ ${updated.name} aggiornato`)
      setEditGuest(null)
      if (sendOnEdit) sendInvite(updated.id, updated.name)
    } catch(e) { toast.error('Errore: ' + e.message) }
    setSaving(false)
  }

  // ── Photo actions ────────────────────────────────────────────────────────────
  const deletePhoto = async (id) => {
    if (!confirm('Eliminare questa foto?')) return
    try {
      await api.deletePhoto(id)
      setPhotos(prev => prev.filter(p => p.id !== id))
      toast.success('Foto eliminata')
      loadDashboard()
    } catch { toast.error('Errore eliminazione foto') }
  }

  // ── Message actions ──────────────────────────────────────────────────────────
  const deleteMessage = async (id) => {
    if (!confirm('Eliminare questo messaggio?')) return
    try {
      await api.deleteMsg(id)
      setMessages(prev => prev.filter(m => m.id !== id))
      toast.success('Messaggio eliminato')
      loadDashboard()
    } catch { toast.error('Errore eliminazione messaggio') }
  }

  // ── RSVP stats (computed from guests) ───────────────────────────────────────
  const splitName = (fullName = '') => {
    const parts = fullName.trim().split(' ')
    const nome    = parts[0] || ''
    const cognome = parts.slice(1).join(' ')
    return { nome, cognome }
  }

  const toggleSort = (field) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortField(field); setSortDir('asc') }
  }

  const sortedGuests = [...guests].sort((a, b) => {
    const { nome: na, cognome: ca } = splitName(a.name)
    const { nome: nb, cognome: cb } = splitName(b.name)
    const va = sortField === 'cognome' ? (ca || na) : na
    const vb = sortField === 'cognome' ? (cb || nb) : nb
    return sortDir === 'asc' ? va.localeCompare(vb, 'it') : vb.localeCompare(va, 'it')
  })

  const confirmed = guests.filter(g => g.rsvp_status === 'confirmed')
  const totalAdults   = confirmed.reduce((s, g) => s + 1 + (g.companions || 0), 0)
  const totalChildren = confirmed.reduce((s, g) => s + (g.children || 0), 0)
  const totalSeats    = totalAdults + totalChildren

  const dietGroups = confirmed.reduce((acc, g) => {
    const d = g.dietary
    if (d && d !== 'nessuna' && d !== 'none' && d !== '') {
      if (!acc[d]) acc[d] = []
      acc[d].push(g.name)
    }
    return acc
  }, {})

  const navGroups = [
    {
      items: [{ id:'dashboard', label:'Dashboard', icon:'📊' }]
    },
    {
      label: 'Gestione',
      items: [
        { id:'guests',   label:'Gestione Invitati', icon:'👥' },
        { id:'rsvp',     label:'Diete & Tavoli',    icon:'🍽️' },
        { id:'photos',   label:'Galleria Foto',     icon:'📷' },
        { id:'messages', label:'Messaggi',          icon:'💬' },
      ]
    },
    {
      label: 'Dati',
      items: [
        { id:'analisi', label:'Analisi',        icon:'📈' },
        { id:'stats',   label:'Geo & Traffico', icon:'🌍' },
      ]
    },
    {
      label: 'Sistema',
      items: [{ id:'logs', label:'Registro Attività', icon:'📋' }]
    },
  ]

  return (
    <div className="page-enter">
      <style>{`
        .admin-layout{display:flex;min-height:100vh;width:100%}
        .admin-sidebar{width:230px;flex-shrink:0;background:var(--white);border-right:1px solid var(--cream);position:sticky;top:0;height:100vh;overflow-y:auto;display:flex;flex-direction:column}
        .admin-content{flex:1;min-width:0;padding:40px 36px 100px}
        .admin-nav-item{display:flex;align-items:center;gap:10px;width:100%;text-align:left;padding:10px 22px;border:none;background:none;cursor:pointer;font-size:.875rem;color:var(--charcoal);transition:background .15s,color .15s;border-left:3px solid transparent;font-family:inherit;line-height:1.4}
        .admin-nav-item:hover{background:var(--ivory)}
        .admin-nav-item.active{background:var(--rose-soft);color:var(--rose);border-left-color:var(--rose);font-weight:600}
        .admin-nav-section{font-size:.65rem;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:var(--warm-gray);padding:20px 22px 4px}
        .admin-sidebar-header{padding:28px 22px 20px;border-bottom:1px solid var(--cream)}
        .admin-sidebar-divider{height:1px;background:var(--cream);margin:8px 0}
        @media(max-width:768px){
          .admin-layout{flex-direction:column}
          .admin-sidebar{width:100%;height:auto;position:static;border-right:none;border-bottom:1px solid var(--cream);flex-direction:row;overflow-x:auto;scrollbar-width:none;padding-bottom:4px}
          .admin-sidebar::-webkit-scrollbar{display:none}
          .admin-sidebar-header{display:none}
          .admin-nav-section{display:none}
          .admin-sidebar-divider{display:none}
          .admin-nav-item{white-space:nowrap;border-left:none;border-bottom:3px solid transparent;padding:10px 14px;flex-shrink:0}
          .admin-nav-item.active{border-left-color:transparent;border-bottom-color:var(--rose);background:var(--rose-soft)}
          .admin-content{padding:24px 16px 80px}
        }
      `}</style>
      <div className="admin-layout">
        <aside className="admin-sidebar">
          <div className="admin-sidebar-header">
            <div style={{ fontFamily:'var(--font-serif)', fontSize:'1.15rem', color:'var(--charcoal)', fontWeight:700, marginBottom:8 }}>
              ⚙️ Admin
            </div>
            {dashboard && (
              <div style={{ fontSize:'.75rem', color:'var(--warm-gray)', lineHeight:1.8 }}>
                <span>{dashboard.stats.guests_total} invitati totali</span><br/>
                <span style={{ color:'var(--sage)' }}>✓ {dashboard.stats.guests_confirmed} confermati</span>
                {dashboard.stats.guests_pending > 0 && (
                  <><br/><span style={{ color:'var(--gold)' }}>⏳ {dashboard.stats.guests_pending} in attesa</span></>
                )}
              </div>
            )}
          </div>
          {navGroups.map((group, gi) => (
            <div key={gi}>
              {gi > 0 && gi < navGroups.length && group.label && (
                <div className="admin-nav-section">{group.label}</div>
              )}
              {group.items.map(item => (
                <button
                  key={item.id}
                  className={`admin-nav-item${tab === item.id ? ' active' : ''}`}
                  onClick={() => switchTab(item.id)}
                >
                  <span style={{ fontSize:'1rem', lineHeight:1, width:20, textAlign:'center', flexShrink:0 }}>{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              ))}
              {gi === 0 && <div className="admin-sidebar-divider" />}
            </div>
          ))}
        </aside>
        <div className="admin-content">

        {/* ── Dashboard ─────────────────────────────────────────────────────── */}
        {tab === 'dashboard' && dashboard && (
          <div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(180px, 1fr))', gap:12, marginBottom:32 }}>
              <StatCard icon="👥" label="Invitati totali"   value={dashboard.stats.guests_total}     color="var(--rose)" />
              <StatCard icon="✓"  label="Confermati"        value={dashboard.stats.guests_confirmed}  color="var(--sage)" />
              <StatCard icon="✕"  label="Declinati"         value={dashboard.stats.guests_declined}   color="var(--rose)" />
              <StatCard icon="⏳" label="In attesa"         value={dashboard.stats.guests_pending}    color="var(--gold)" />
              <StatCard icon="📧" label="RSVP inviati"      value={dashboard.stats.invites_sent}      color="var(--blush)" />
              <StatCard icon="📷" label="Foto caricate"     value={dashboard.stats.photos}            color="var(--sage)" />
              <StatCard icon="💌" label="Messaggi"          value={dashboard.stats.messages}          color="var(--rose)" />
              <StatCard icon="🎙️" label="Messaggi vocali"   value={dashboard.stats.audio_messages}    color="var(--gold)" />
            </div>

            <h3 style={{ fontFamily:'var(--font-serif)', fontSize:'1.3rem', marginBottom:16 }}>Attività recente</h3>
            <div className="card" style={{ overflow:'auto' }}>
              <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'.85rem' }}>
                <thead>
                  <tr style={{ borderBottom:'2px solid var(--cream)' }}>
                    {['Data', 'Utente', 'Azione', 'Target'].map(h => (
                      <th key={h} style={{ padding:'12px 16px', textAlign:'left', color:'var(--warm-gray)', fontWeight:500, textTransform:'uppercase', letterSpacing:'.04em', fontSize:'.75rem' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {dashboard.recent_logs.map(l => (
                    <tr key={l.id} style={{ borderBottom:'1px solid var(--cream)' }}>
                      <td style={{ padding:'10px 16px', color:'var(--warm-gray)', whiteSpace:'nowrap' }}>{new Date(l.created_at).toLocaleString('it-IT')}</td>
                      <td style={{ padding:'10px 16px', color:'var(--charcoal)', fontWeight:500 }}>{l.actor}</td>
                      <td style={{ padding:'10px 16px', color:'var(--charcoal)' }}>{LOG_LABELS[l.action] || l.action}</td>
                      <td style={{ padding:'10px 16px', color:'var(--warm-gray)', fontSize:'.82rem' }}>{l.target}{l.detail ? ` — ${l.detail}` : ''}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── Invitati ──────────────────────────────────────────────────────── */}
        {tab === 'guests' && (
          <div>
            {dashboard && (
              <div style={{
                display:'flex', alignItems:'center', gap:10,
                padding:'10px 16px', borderRadius:8, marginBottom:20, fontSize:'.85rem',
                background: dashboard.stats.email_configured ? 'rgba(135,167,127,.12)' : 'rgba(199,107,139,.1)',
                border: `1px solid ${dashboard.stats.email_configured ? 'var(--sage)' : 'var(--rose)'}`,
                color: dashboard.stats.email_configured ? 'var(--sage)' : 'var(--rose)',
              }}>
                <span style={{ fontSize:'1rem' }}>{dashboard.stats.email_configured ? '✓' : '⚠'}</span>
                {dashboard.stats.email_configured
                  ? 'Email configurata — gli inviti vengono inviati automaticamente.'
                  : 'Email non configurata. Aggiungi SMTP_USER e SMTP_PASSWORD nel file .env per abilitare gli inviti.'}
              </div>
            )}
            <div style={{ display:'flex', gap:12, marginBottom:24, flexWrap:'wrap', alignItems:'center' }}>
              <button className="btn btn-primary" onClick={() => setAddOpen(!addOpen)}>
                {addOpen ? '✕ Annulla' : '+ Aggiungi invitato'}
              </button>
              <button className="btn btn-outline" onClick={sendAll} disabled={rsvpng}>
                {rsvpng ? 'Invio…' : '📧 Invia tutti gli RSVP pendenti'}
              </button>
              <button className="btn btn-outline" onClick={() => {
                const emails = guests.map(g => g.email).join(', ')
                navigator.clipboard.writeText(emails)
                toast.success('Lista email copiata negli appunti')
              }}>
                📋 Copia lista email
              </button>
            </div>

            {addOpen && (
              <div className="card" style={{ padding:24, marginBottom:24 }}>
                <h3 style={{ fontFamily:'var(--font-serif)', marginBottom:20 }}>Nuovo invitato</h3>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))', gap:12 }}>
                  <div><label>Nome *</label><input className="input" placeholder="Mario Rossi" value={newGuest.name} onChange={e => setNewGuest(p=>({...p, name:e.target.value}))} /></div>
                  <div><label>Email *</label><input className="input" placeholder="mario@email.it" value={newGuest.email} onChange={e => setNewGuest(p=>({...p, email:e.target.value}))} /></div>
                  <div><label>Telefono</label><input className="input" placeholder="+39 333 1234567" value={newGuest.phone} onChange={e => setNewGuest(p=>({...p, phone:e.target.value}))} /></div>
                  <div><label>Tavolo N°</label><input className="input" type="number" placeholder="(opzionale)" value={newGuest.table_num} onChange={e => setNewGuest(p=>({...p, table_num:e.target.value}))} /></div>
                </div>
                <div style={{ marginTop:16, display:'flex', alignItems:'center', gap:16, flexWrap:'wrap' }}>
                  <label style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer', fontSize:'.9rem', color:'var(--charcoal)', userSelect:'none' }}>
                    <input
                      type="checkbox"
                      checked={sendOnCreate}
                      onChange={e => setSendOnCreate(e.target.checked)}
                      style={{ width:16, height:16, accentColor:'var(--rose)', cursor:'pointer' }}
                    />
                    Invia invito subito via email
                  </label>
                  <button className="btn btn-primary" onClick={addGuest} disabled={adding}>
                    {adding ? 'Aggiunta…' : sendOnCreate ? '+ Aggiungi e invia invito' : '+ Aggiungi'}
                  </button>
                </div>
              </div>
            )}

            <div className="card" style={{ overflow:'auto' }}>
              <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'.85rem', minWidth:680 }}>
                <thead>
                  <tr style={{ borderBottom:'2px solid var(--cream)', background:'var(--ivory)' }}>
                    {[
                      { key:'nome',    label:'Nome' },
                      { key:'cognome', label:'Cognome' },
                    ].map(({ key, label }) => (
                      <th key={key} onClick={() => toggleSort(key)} style={{ padding:'12px 16px', textAlign:'left', color:'var(--warm-gray)', fontWeight:500, textTransform:'uppercase', letterSpacing:'.04em', fontSize:'.75rem', cursor:'pointer', userSelect:'none' }}>
                        {label} {sortField === key ? (sortDir === 'asc' ? '↑' : '↓') : ''}
                      </th>
                    ))}
                    {['Email', 'Tavolo', 'RSVP', 'Invito', 'Azioni'].map(h => (
                      <th key={h} style={{ padding:'12px 16px', textAlign:'left', color:'var(--warm-gray)', fontWeight:500, textTransform:'uppercase', letterSpacing:'.04em', fontSize:'.75rem' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sortedGuests.map(g => {
                    const { nome, cognome } = splitName(g.name)
                    return (
                    <tr key={g.id} style={{ borderBottom:'1px solid var(--cream)' }}>
                      <td style={{ padding:'10px 16px', fontWeight:500, color:'var(--charcoal)' }}>
                        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                          {g.avatar_url && <img src={g.avatar_url} style={{ width:28, height:28, borderRadius:'50%' }} />}
                          {nome}
                        </div>
                      </td>
                      <td style={{ padding:'10px 16px', fontWeight:500, color:'var(--charcoal)' }}>{cognome}</td>
                      <td style={{ padding:'10px 16px' }}>
                        <a href={`mailto:${g.email}`} style={{ color:'var(--rose)', textDecoration:'none', fontSize:'.85rem' }}>{g.email}</a>
                      </td>
                      <td style={{ padding:'10px 16px', color:'var(--warm-gray)' }}>{g.table_num || '—'}</td>
                      <td style={{ padding:'10px 16px' }}><span className={`badge badge-${g.rsvp_status}`}>{g.rsvp_status}</span></td>
                      <td style={{ padding:'10px 16px' }}>
                        {g.invite_sent ? <span style={{ color:'var(--sage)', fontSize:'.85rem' }}>✓ Inviato</span> : <span style={{ color:'var(--warm-gray)', fontSize:'.85rem' }}>Non inviato</span>}
                      </td>
                      <td style={{ padding:'10px 16px' }}>
                        <div style={{ display:'flex', gap:6 }}>
                          <button className="btn btn-sm btn-outline" onClick={() => sendInvite(g.id, g.name)}>📧</button>
                          <button className="btn btn-sm btn-outline" onClick={() => openEdit(g)}>✏️</button>
                          <button className="btn btn-sm" style={{ background:'rgba(199,107,139,.15)', color:'var(--rose)', border:'none' }} onClick={() => deleteGuest(g.id, g.name)}>🗑</button>
                        </div>
                      </td>
                    </tr>
                  )
                  })}
                </tbody>
              </table>
              {guests.length === 0 && (
                <p style={{ textAlign:'center', padding:40, color:'var(--warm-gray)' }}>Nessun invitato ancora. Aggiungi il primo!</p>
              )}
            </div>
          </div>
        )}

        {/* ── Diete & Posti ─────────────────────────────────────────────────── */}
        {tab === 'rsvp' && (
          <div>
            {/* Posti confermati */}
            <h3 style={{ fontFamily:'var(--font-serif)', fontSize:'1.3rem', marginBottom:16 }}>Posti confermati</h3>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(160px, 1fr))', gap:12, marginBottom:36 }}>
              <StatCard icon="🪑" label="Totale posti"  value={totalSeats}    color="var(--rose)" />
              <StatCard icon="🧑" label="Adulti"        value={totalAdults}   color="var(--sage)" />
              <StatCard icon="👶" label="Bambini"       value={totalChildren} color="var(--gold)" />
            </div>

            {/* Dettaglio per ospite confermato */}
            <h3 style={{ fontFamily:'var(--font-serif)', fontSize:'1.3rem', marginBottom:16 }}>Dettaglio posti per ospite</h3>
            <div className="card" style={{ overflow:'auto', marginBottom:36 }}>
              <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'.85rem', minWidth:500 }}>
                <thead>
                  <tr style={{ borderBottom:'2px solid var(--cream)', background:'var(--ivory)' }}>
                    {['Nome', 'Adulti (+ acc.)', 'Bambini', 'Totale'].map(h => (
                      <th key={h} style={{ padding:'12px 16px', textAlign:'left', color:'var(--warm-gray)', fontWeight:500, textTransform:'uppercase', letterSpacing:'.04em', fontSize:'.75rem' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {confirmed.map(g => {
                    const adults   = 1 + (g.companions || 0)
                    const children = g.children || 0
                    return (
                      <tr key={g.id} style={{ borderBottom:'1px solid var(--cream)' }}>
                        <td style={{ padding:'10px 16px', fontWeight:500, color:'var(--charcoal)' }}>{g.name}</td>
                        <td style={{ padding:'10px 16px', color:'var(--warm-gray)' }}>
                          {adults}{g.companions > 0 && <span style={{ fontSize:'.75rem', marginLeft:4, color:'var(--warm-gray)' }}>(+{g.companions} acc.)</span>}
                        </td>
                        <td style={{ padding:'10px 16px', color:'var(--warm-gray)' }}>{children || '—'}</td>
                        <td style={{ padding:'10px 16px', fontWeight:600, color:'var(--charcoal)' }}>{adults + children}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              {confirmed.length === 0 && (
                <p style={{ textAlign:'center', padding:40, color:'var(--warm-gray)' }}>Nessun ospite confermato ancora.</p>
              )}
            </div>

            {/* Riepilogo diete */}
            <h3 style={{ fontFamily:'var(--font-serif)', fontSize:'1.3rem', marginBottom:16 }}>Riepilogo esigenze alimentari</h3>
            {Object.keys(dietGroups).length === 0 ? (
              <div className="card" style={{ padding:32, textAlign:'center', color:'var(--warm-gray)' }}>
                Nessuna esigenza alimentare registrata tra i confermati.
              </div>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                {Object.entries(dietGroups).map(([diet, names]) => (
                  <div key={diet} className="card" style={{ padding:'16px 20px', display:'flex', gap:16, alignItems:'flex-start' }}>
                    <div style={{
                      minWidth:40, height:40, borderRadius:'var(--radius-sm)',
                      background:'var(--blush)', display:'flex', alignItems:'center',
                      justifyContent:'center', fontSize:'1.1rem', fontWeight:700,
                      color:'var(--rose)', flexShrink:0,
                    }}>
                      {names.length}
                    </div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontWeight:600, color:'var(--charcoal)', marginBottom:4 }}>
                        {DIET_LABELS[diet] || diet}
                      </div>
                      <div style={{ fontSize:'.85rem', color:'var(--warm-gray)' }}>
                        {names.join(' · ')}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Foto ──────────────────────────────────────────────────────────── */}
        {tab === 'photos' && (
          <div>
            <p style={{ color:'var(--warm-gray)', marginBottom:24, fontSize:'.9rem' }}>
              {photos.length} foto caricate — clicca 🗑 per eliminare.
            </p>
            {photos.length === 0 ? (
              <div className="card" style={{ padding:48, textAlign:'center', color:'var(--warm-gray)' }}>
                Nessuna foto ancora.
              </div>
            ) : (
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(200px, 1fr))', gap:12 }}>
                {photos.map(p => (
                  <div key={p.id} className="card" style={{ padding:0, overflow:'hidden', position:'relative' }}>
                    <img
                      src={p.url}
                      alt={p.caption || 'Foto'}
                      style={{ width:'100%', aspectRatio:'1', objectFit:'cover', display:'block' }}
                    />
                    <div style={{ padding:'10px 12px' }}>
                      {p.caption && (
                        <p style={{ fontSize:'.8rem', color:'var(--charcoal)', margin:'0 0 4px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                          {p.caption}
                        </p>
                      )}
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                        <span style={{ fontSize:'.72rem', color:'var(--warm-gray)' }}>
                          {new Date(p.created_at).toLocaleDateString('it-IT')}
                        </span>
                        <button
                          onClick={() => deletePhoto(p.id)}
                          style={{
                            background:'rgba(199,107,139,.15)', color:'var(--rose)',
                            border:'none', borderRadius:6, padding:'4px 8px',
                            cursor:'pointer', fontSize:'.8rem',
                          }}
                        >
                          🗑
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Messaggi ──────────────────────────────────────────────────────── */}
        {tab === 'messages' && (
          <div>
            <p style={{ color:'var(--warm-gray)', marginBottom:24, fontSize:'.9rem' }}>
              {messages.length} messaggi — clicca 🗑 per eliminare.
            </p>
            {messages.length === 0 ? (
              <div className="card" style={{ padding:48, textAlign:'center', color:'var(--warm-gray)' }}>
                Nessun messaggio ancora.
              </div>
            ) : (
              <div className="card" style={{ overflow:'auto' }}>
                <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'.85rem' }}>
                  <thead>
                    <tr style={{ borderBottom:'2px solid var(--cream)', background:'var(--ivory)' }}>
                      {['Mittente', 'Contenuto', 'Tipo', 'Data', ''].map((h, i) => (
                        <th key={i} style={{ padding:'12px 16px', textAlign:'left', color:'var(--warm-gray)', fontWeight:500, textTransform:'uppercase', letterSpacing:'.04em', fontSize:'.75rem' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {messages.map(m => (
                      <tr key={m.id} style={{ borderBottom:'1px solid var(--cream)' }}>
                        <td style={{ padding:'10px 16px', fontWeight:500, color:'var(--charcoal)', whiteSpace:'nowrap' }}>
                          {m.guest_name || 'Anonimo'}
                        </td>
                        <td style={{ padding:'10px 16px', color:'var(--warm-gray)', maxWidth:320 }}>
                          {m.photo_url && (
                            <img src={m.photo_url} alt="" style={{ width:40, height:40, objectFit:'cover', borderRadius:4, marginRight:8, verticalAlign:'middle' }} />
                          )}
                          {m.content ? (
                            <span style={{ overflow:'hidden', display:'inline-block', maxWidth:240, verticalAlign:'middle', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                              {m.content}
                            </span>
                          ) : m.audio_path ? (
                            <span style={{ color:'var(--warm-gray)', fontStyle:'italic' }}>🎙️ Messaggio vocale</span>
                          ) : (
                            <span style={{ color:'var(--warm-gray)', fontStyle:'italic' }}>—</span>
                          )}
                        </td>
                        <td style={{ padding:'10px 16px' }}>
                          <span className="badge badge-pending" style={{ fontSize:'.7rem' }}>{m.type}</span>
                        </td>
                        <td style={{ padding:'10px 16px', color:'var(--warm-gray)', whiteSpace:'nowrap' }}>
                          {new Date(m.created_at).toLocaleString('it-IT')}
                        </td>
                        <td style={{ padding:'10px 16px' }}>
                          <button
                            onClick={() => deleteMessage(m.id)}
                            style={{
                              background:'rgba(199,107,139,.15)', color:'var(--rose)',
                              border:'none', borderRadius:6, padding:'4px 8px',
                              cursor:'pointer', fontSize:'.85rem',
                            }}
                          >
                            🗑
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── Statistiche ───────────────────────────────────────────────────── */}
        {tab === 'stats' && (
          <div>
            {geoLoading && (
              <p style={{ color:'var(--warm-gray)', marginBottom:24 }}>⏳ Geolocalizzazione in corso…</p>
            )}
            {geoData && !geoLoading && (() => {
              const maxHour = Math.max(...geoData.peak_hours.map(h => h.count), 1)
              return (
                <div style={{ display:'flex', flexDirection:'column', gap:36 }}>

                  {/* Stat cards */}
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(160px,1fr))', gap:12 }}>
                    <StatCard icon="🌐" label="Visite totali"  value={geoData.total_visits} color="var(--rose)" />
                    <StatCard icon="👤" label="IP unici"       value={geoData.unique_ips}   color="var(--sage)" />
                    <StatCard icon="🗺️" label="Paesi"          value={geoData.countries.length} color="var(--gold)" />
                  </div>

                  {/* Paesi */}
                  {geoData.countries.length > 0 && (
                    <div>
                      <h3 style={{ fontFamily:'var(--font-serif)', fontSize:'1.3rem', marginBottom:16 }}>Connessioni per paese</h3>
                      <div className="card" style={{ overflow:'auto' }}>
                        <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'.88rem' }}>
                          <thead>
                            <tr style={{ borderBottom:'2px solid var(--cream)', background:'var(--ivory)' }}>
                              {['', 'Paese', 'Visite', ''].map((h, i) => (
                                <th key={i} style={{ padding:'12px 16px', textAlign: i === 2 ? 'right' : 'left', color:'var(--warm-gray)', fontWeight:500, textTransform:'uppercase', letterSpacing:'.04em', fontSize:'.75rem' }}>{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {geoData.countries.map((c, i) => {
                              const pct = Math.round((c.count / geoData.total_visits) * 100)
                              return (
                                <tr key={i} style={{ borderBottom:'1px solid var(--cream)' }}>
                                  <td style={{ padding:'10px 16px', fontSize:'1.4rem', width:40 }}>{c.flag}</td>
                                  <td style={{ padding:'10px 16px', fontWeight:500, color:'var(--charcoal)' }}>{c.country}</td>
                                  <td style={{ padding:'10px 16px', textAlign:'right', color:'var(--warm-gray)' }}>{c.count}</td>
                                  <td style={{ padding:'10px 24px 10px 8px', width:140 }}>
                                    <div style={{ background:'var(--cream)', borderRadius:4, height:8, overflow:'hidden' }}>
                                      <div style={{ width:'100%', background:'var(--rose)', height:'100%', borderRadius:4, transform:`scaleX(${pct/100})`, transformOrigin:'left', transition:'transform .4s' }} />
                                    </div>
                                  </td>
                                </tr>
                              )
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Città */}
                  {geoData.locations.length > 0 && (
                    <div>
                      <h3 style={{ fontFamily:'var(--font-serif)', fontSize:'1.3rem', marginBottom:16 }}>Dettaglio città</h3>
                      <div className="card" style={{ overflow:'auto' }}>
                        <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'.85rem' }}>
                          <thead>
                            <tr style={{ borderBottom:'2px solid var(--cream)', background:'var(--ivory)' }}>
                              {['', 'Città', 'Paese', 'Visite'].map((h, i) => (
                                <th key={i} style={{ padding:'10px 16px', textAlign:'left', color:'var(--warm-gray)', fontWeight:500, textTransform:'uppercase', letterSpacing:'.04em', fontSize:'.75rem' }}>{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {geoData.locations.map((l, i) => (
                              <tr key={i} style={{ borderBottom:'1px solid var(--cream)' }}>
                                <td style={{ padding:'8px 16px', fontSize:'1.2rem', width:36 }}>{l.flag}</td>
                                <td style={{ padding:'8px 16px', fontWeight:500, color:'var(--charcoal)' }}>{l.city || '—'}</td>
                                <td style={{ padding:'8px 16px', color:'var(--warm-gray)' }}>{l.country}</td>
                                <td style={{ padding:'8px 16px', color:'var(--warm-gray)' }}>{l.visits}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Orari di picco */}
                  <div>
                    <h3 style={{ fontFamily:'var(--font-serif)', fontSize:'1.3rem', marginBottom:16 }}>Orari di picco</h3>
                    <div className="card" style={{ padding:'20px 24px' }}>
                      <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                        {geoData.peak_hours.map(h => (
                          <div key={h.hour} style={{ display:'flex', alignItems:'center', gap:10 }}>
                            <span style={{ width:38, fontSize:'.75rem', color:'var(--warm-gray)', textAlign:'right', flexShrink:0 }}>
                              {String(h.hour).padStart(2,'0')}:00
                            </span>
                            <div style={{ flex:1, background:'var(--cream)', borderRadius:4, height:10, overflow:'hidden' }}>
                              <div style={{ width:'100%', background:'var(--rose)', height:'100%', borderRadius:4, transform:`scaleX(${h.count / maxHour})`, transformOrigin:'left', transition:'transform .4s', opacity: h.count ? 1 : 0 }} />
                            </div>
                            <span style={{ width:24, fontSize:'.75rem', color:'var(--warm-gray)', textAlign:'right', flexShrink:0 }}>
                              {h.count || ''}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Azioni più comuni */}
                  {geoData.actions.length > 0 && (
                    <div>
                      <h3 style={{ fontFamily:'var(--font-serif)', fontSize:'1.3rem', marginBottom:16 }}>Azioni più frequenti</h3>
                      <div className="card" style={{ overflow:'auto' }}>
                        <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'.85rem' }}>
                          <thead>
                            <tr style={{ borderBottom:'2px solid var(--cream)', background:'var(--ivory)' }}>
                              {['Azione', 'Occorrenze', ''].map((h, i) => (
                                <th key={i} style={{ padding:'10px 16px', textAlign: i === 1 ? 'right' : 'left', color:'var(--warm-gray)', fontWeight:500, textTransform:'uppercase', letterSpacing:'.04em', fontSize:'.75rem' }}>{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {geoData.actions.map((a, i) => {
                              const maxAct = geoData.actions[0]?.count || 1
                              return (
                                <tr key={i} style={{ borderBottom:'1px solid var(--cream)' }}>
                                  <td style={{ padding:'8px 16px', fontWeight:500, color:'var(--charcoal)' }}>
                                    <span className="badge badge-pending" style={{ fontSize:'.75rem' }}>{a.action}</span>
                                  </td>
                                  <td style={{ padding:'8px 16px', textAlign:'right', color:'var(--warm-gray)' }}>{a.count}</td>
                                  <td style={{ padding:'8px 24px 8px 8px', width:120 }}>
                                    <div style={{ background:'var(--cream)', borderRadius:4, height:8, overflow:'hidden' }}>
                                      <div style={{ width:'100%', background:'var(--gold)', height:'100%', borderRadius:4, transform:`scaleX(${a.count/maxAct})`, transformOrigin:'left' }} />
                                    </div>
                                  </td>
                                </tr>
                              )
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                </div>
              )
            })()}
            {!geoData && !geoLoading && (
              <div className="card" style={{ padding:48, textAlign:'center', color:'var(--warm-gray)' }}>
                Nessun dato disponibile.
              </div>
            )}
          </div>
        )}

        {/* ── Analisi ───────────────────────────────────────────────────────── */}
        {tab === 'analisi' && (
          <div style={{ display:'flex', flexDirection:'column', gap:36 }}>

            {/* Funnel RSVP */}
            <div>
              <h3 style={{ fontFamily:'var(--font-serif)', fontSize:'1.3rem', marginBottom:16 }}>Funnel risposte</h3>
              {dashboard && (() => {
                const total = dashboard.stats.guests_total || 1
                const responded = dashboard.stats.guests_confirmed + dashboard.stats.guests_declined
                const steps = [
                  { label:'Invitati registrati', value: dashboard.stats.guests_total, color:'var(--rose)' },
                  { label:'Inviti inviati',       value: dashboard.stats.invites_sent, color:'var(--gold)' },
                  { label:'Hanno risposto',       value: responded,                    color:'var(--blush)' },
                  { label:'Confermati',           value: dashboard.stats.guests_confirmed, color:'var(--sage)' },
                ]
                return (
                  <div className="card" style={{ padding:'20px 24px', display:'flex', flexDirection:'column', gap:16 }}>
                    {steps.map((s, i) => {
                      const pct = Math.min(s.value / total, 1)
                      return (
                        <div key={i} style={{ display:'flex', alignItems:'center', gap:12 }}>
                          <span style={{ width:170, fontSize:'.85rem', color:'var(--charcoal)', flexShrink:0 }}>{s.label}</span>
                          <div style={{ flex:1, background:'var(--cream)', borderRadius:4, height:12, overflow:'hidden' }}>
                            <div style={{ width:'100%', height:'100%', background:s.color, borderRadius:4, transform:`scaleX(${pct})`, transformOrigin:'left', transition:'transform .4s' }} />
                          </div>
                          <span style={{ width:70, textAlign:'right', fontSize:'.82rem', color:'var(--warm-gray)', flexShrink:0 }}>
                            {s.value} <span style={{ fontSize:'.7rem' }}>({Math.round(pct*100)}%)</span>
                          </span>
                        </div>
                      )
                    })}
                  </div>
                )
              })()}
            </div>

            {/* Timeline RSVP */}
            <div>
              <h3 style={{ fontFamily:'var(--font-serif)', fontSize:'1.3rem', marginBottom:16 }}>Timeline risposte</h3>
              {timelineLoading && <p style={{ color:'var(--warm-gray)' }}>⏳ Caricamento…</p>}
              {!timelineLoading && rsvpTimeline.length === 0 && (
                <div className="card" style={{ padding:32, textAlign:'center', color:'var(--warm-gray)' }}>
                  Nessuna risposta registrata ancora.
                </div>
              )}
              {!timelineLoading && rsvpTimeline.length > 0 && (() => {
                const maxDay = Math.max(...rsvpTimeline.map(d => d.confirmed + d.declined), 1)
                return (
                  <div className="card" style={{ padding:'20px 24px', display:'flex', flexDirection:'column', gap:8 }}>
                    {rsvpTimeline.map((d, i) => (
                      <div key={i} style={{ display:'flex', alignItems:'center', gap:12 }}>
                        <span style={{ width:72, fontSize:'.75rem', color:'var(--warm-gray)', flexShrink:0 }}>
                          {new Date(d.date + 'T12:00:00').toLocaleDateString('it-IT', { day:'2-digit', month:'short' })}
                        </span>
                        <div style={{ flex:1, display:'flex', gap:3, height:14, overflow:'hidden', borderRadius:3 }}>
                          {d.confirmed > 0 && (
                            <div style={{ height:'100%', borderRadius:3, background:'var(--sage)', flex:d.confirmed }} title={`${d.confirmed} confermati`} />
                          )}
                          {d.declined > 0 && (
                            <div style={{ height:'100%', borderRadius:3, background:'var(--rose)', flex:d.declined }} title={`${d.declined} declinati`} />
                          )}
                          <div style={{ height:'100%', background:'var(--cream)', flex: Math.max(maxDay - d.confirmed - d.declined, 0), borderRadius:3 }} />
                        </div>
                        <span style={{ width:72, fontSize:'.75rem', textAlign:'right', flexShrink:0 }}>
                          {d.confirmed > 0 && <span style={{ color:'var(--sage)' }}>✓{d.confirmed} </span>}
                          {d.declined > 0 && <span style={{ color:'var(--rose)' }}>✕{d.declined}</span>}
                        </span>
                      </div>
                    ))}
                    <div style={{ display:'flex', gap:20, marginTop:8, fontSize:'.74rem', color:'var(--warm-gray)' }}>
                      <span><span style={{ display:'inline-block', width:10, height:10, borderRadius:2, background:'var(--sage)', marginRight:4 }} />Confermati</span>
                      <span><span style={{ display:'inline-block', width:10, height:10, borderRadius:2, background:'var(--rose)', marginRight:4 }} />Declinati</span>
                    </div>
                  </div>
                )
              })()}
            </div>

            {/* Top contributor */}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(280px,1fr))', gap:24 }}>
              <div>
                <h3 style={{ fontFamily:'var(--font-serif)', fontSize:'1.3rem', marginBottom:16 }}>Top uploader foto</h3>
                {(() => {
                  const guestMap = Object.fromEntries(guests.map(g => [g.id, g.name]))
                  const counts = {}
                  for (const p of photos) {
                    const name = p.guest_id ? (guestMap[p.guest_id] || `#${p.guest_id}`) : 'Anonimo'
                    counts[name] = (counts[name] || 0) + 1
                  }
                  const top = Object.entries(counts).sort(([,a],[,b]) => b-a).slice(0,5)
                  const maxVal = top[0]?.[1] || 1
                  return top.length === 0 ? (
                    <div className="card" style={{ padding:32, textAlign:'center', color:'var(--warm-gray)' }}>Nessuna foto ancora.</div>
                  ) : (
                    <div className="card" style={{ padding:'16px 20px', display:'flex', flexDirection:'column', gap:10 }}>
                      {top.map(([name, count], i) => (
                        <div key={i} style={{ display:'flex', alignItems:'center', gap:10 }}>
                          <span style={{ width:18, fontSize:'.75rem', color:'var(--warm-gray)', flexShrink:0 }}>{i+1}.</span>
                          <span style={{ flex:1, fontSize:'.85rem', color:'var(--charcoal)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{name}</span>
                          <div style={{ width:72, background:'var(--cream)', borderRadius:4, height:8, overflow:'hidden', flexShrink:0 }}>
                            <div style={{ width:'100%', height:'100%', background:'var(--rose)', borderRadius:4, transform:`scaleX(${count/maxVal})`, transformOrigin:'left' }} />
                          </div>
                          <span style={{ width:26, fontSize:'.8rem', color:'var(--warm-gray)', textAlign:'right', flexShrink:0 }}>{count}</span>
                        </div>
                      ))}
                    </div>
                  )
                })()}
              </div>

              <div>
                <h3 style={{ fontFamily:'var(--font-serif)', fontSize:'1.3rem', marginBottom:16 }}>Top mittenti messaggi</h3>
                {(() => {
                  const counts = {}
                  for (const m of messages) {
                    const name = m.guest_name || 'Anonimo'
                    counts[name] = (counts[name] || 0) + 1
                  }
                  const top = Object.entries(counts).sort(([,a],[,b]) => b-a).slice(0,5)
                  const maxVal = top[0]?.[1] || 1
                  return top.length === 0 ? (
                    <div className="card" style={{ padding:32, textAlign:'center', color:'var(--warm-gray)' }}>Nessun messaggio ancora.</div>
                  ) : (
                    <div className="card" style={{ padding:'16px 20px', display:'flex', flexDirection:'column', gap:10 }}>
                      {top.map(([name, count], i) => (
                        <div key={i} style={{ display:'flex', alignItems:'center', gap:10 }}>
                          <span style={{ width:18, fontSize:'.75rem', color:'var(--warm-gray)', flexShrink:0 }}>{i+1}.</span>
                          <span style={{ flex:1, fontSize:'.85rem', color:'var(--charcoal)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{name}</span>
                          <div style={{ width:72, background:'var(--cream)', borderRadius:4, height:8, overflow:'hidden', flexShrink:0 }}>
                            <div style={{ width:'100%', height:'100%', background:'var(--gold)', borderRadius:4, transform:`scaleX(${count/maxVal})`, transformOrigin:'left' }} />
                          </div>
                          <span style={{ width:26, fontSize:'.8rem', color:'var(--warm-gray)', textAlign:'right', flexShrink:0 }}>{count}</span>
                        </div>
                      ))}
                    </div>
                  )
                })()}
              </div>
            </div>

            {/* Breakdown tipi messaggio */}
            <div>
              <h3 style={{ fontFamily:'var(--font-serif)', fontSize:'1.3rem', marginBottom:16 }}>Tipologie messaggi</h3>
              {(() => {
                const TYPE_LABELS = { text:'Testo', audio:'Vocale', photo:'Foto', video:'Video', both:'Testo + Audio' }
                const counts = {}
                for (const m of messages) {
                  const t = m.type || 'unknown'
                  counts[t] = (counts[t] || 0) + 1
                }
                const entries = Object.entries(counts).sort(([,a],[,b]) => b-a)
                const maxVal = entries[0]?.[1] || 1
                return entries.length === 0 ? (
                  <div className="card" style={{ padding:32, textAlign:'center', color:'var(--warm-gray)' }}>Nessun messaggio ancora.</div>
                ) : (
                  <div className="card" style={{ padding:'20px 24px', display:'flex', flexDirection:'column', gap:10 }}>
                    {entries.map(([type, count], i) => (
                      <div key={i} style={{ display:'flex', alignItems:'center', gap:12 }}>
                        <span style={{ width:110, fontSize:'.85rem', color:'var(--charcoal)', flexShrink:0 }}>{TYPE_LABELS[type] || type}</span>
                        <div style={{ flex:1, background:'var(--cream)', borderRadius:4, height:10, overflow:'hidden' }}>
                          <div style={{ width:'100%', height:'100%', background:'var(--sage)', borderRadius:4, transform:`scaleX(${count/maxVal})`, transformOrigin:'left', transition:'transform .4s' }} />
                        </div>
                        <span style={{ width:32, fontSize:'.85rem', color:'var(--warm-gray)', textAlign:'right', flexShrink:0 }}>{count}</span>
                      </div>
                    ))}
                  </div>
                )
              })()}
            </div>

          </div>
        )}

        {/* ── Log ───────────────────────────────────────────────────────────── */}
        {tab === 'logs' && (
          <div className="card" style={{ overflow:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'.8rem', minWidth:600 }}>
              <thead>
                <tr style={{ borderBottom:'2px solid var(--cream)', background:'var(--ivory)' }}>
                  {['Data', 'Utente', 'Azione', 'Target', 'IP'].map(h => (
                    <th key={h} style={{ padding:'12px 16px', textAlign:'left', color:'var(--warm-gray)', fontWeight:500, textTransform:'uppercase', letterSpacing:'.04em', fontSize:'.72rem' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {logs.map(l => (
                  <tr key={l.id} style={{ borderBottom:'1px solid var(--cream)' }}>
                    <td style={{ padding:'8px 16px', color:'var(--warm-gray)', whiteSpace:'nowrap' }}>{new Date(l.created_at).toLocaleString('it-IT')}</td>
                    <td style={{ padding:'8px 16px', color:'var(--charcoal)' }}>{l.actor}</td>
                    <td style={{ padding:'8px 16px', color:'var(--charcoal)', fontSize:'.85rem' }}>{LOG_LABELS[l.action] || l.action}</td>
                    <td style={{ padding:'8px 16px', color:'var(--warm-gray)', fontSize:'.82rem' }}>{l.target}{l.detail ? ` — ${l.detail}` : ''}</td>
                    <td style={{ padding:'8px 16px', color:'var(--warm-gray)', fontFamily:'monospace', fontSize:'.78rem' }}>{l.ip}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {logs.length === 0 && (
              <p style={{ textAlign:'center', padding:40, color:'var(--warm-gray)' }}>Nessun log ancora</p>
            )}
          </div>
        )}
        </div>{/* admin-content */}
      </div>{/* admin-layout */}
      {editGuest && (
        <div style={{
          position:'fixed', inset:0, background:'rgba(0,0,0,.45)', zIndex:1000,
          display:'flex', alignItems:'center', justifyContent:'center', padding:16,
        }} onClick={e => e.target === e.currentTarget && setEditGuest(null)}>
          <div className="card" style={{ width:'100%', maxWidth:480, padding:28 }}>
            <h3 style={{ fontFamily:'var(--font-serif)', fontSize:'1.2rem', marginBottom:20 }}>
              Modifica invitato
            </h3>
            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              <div><label>Nome *</label><input className="input" value={editForm.name} onChange={e => setEditForm(p=>({...p, name:e.target.value}))} /></div>
              <div><label>Email *</label><input className="input" type="email" value={editForm.email} onChange={e => setEditForm(p=>({...p, email:e.target.value}))} /></div>
              <div><label>Telefono</label><input className="input" value={editForm.phone} onChange={e => setEditForm(p=>({...p, phone:e.target.value}))} /></div>
              <div><label>Tavolo N°</label><input className="input" type="number" placeholder="(opzionale)" value={editForm.table_num} onChange={e => setEditForm(p=>({...p, table_num:e.target.value}))} /></div>
            </div>
            <div style={{ marginTop:20, display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:10 }}>
              <label style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer', fontSize:'.9rem', color:'var(--charcoal)', userSelect:'none' }}>
                <input
                  type="checkbox"
                  checked={sendOnEdit}
                  onChange={e => setSendOnEdit(e.target.checked)}
                  style={{ width:16, height:16, accentColor:'var(--rose)', cursor:'pointer' }}
                />
                Invia invito dopo il salvataggio
              </label>
              <div style={{ display:'flex', gap:10 }}>
                <button className="btn btn-outline" onClick={() => setEditGuest(null)}>Annulla</button>
                <button className="btn btn-primary" onClick={saveEdit} disabled={saving}>
                  {saving ? 'Salvataggio…' : sendOnEdit ? 'Salva e invia' : 'Salva'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      <ToastContainer toasts={toast.toasts} />
    </div>
  )
}
