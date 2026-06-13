import { useState, useEffect } from 'react'
import { api } from '../utils/api'
import { useToast, ToastContainer } from '../hooks/useToast'

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
  const [tab, setTab]           = useState('dashboard')
  const [dashboard, setDashboard] = useState(null)
  const [guests, setGuests]     = useState([])
  const [logs, setLogs]         = useState([])
  const [loading, setLoading]   = useState(true)

  // New guest form
  const [newGuest, setNewGuest] = useState({ name:'', email:'', phone:'', table_num:'', dietary:'' })
  const [addOpen, setAddOpen]   = useState(false)
  const [adding, setAdding]     = useState(false)
  const [rsvpng, setrsvpng] = useState(false)

  useEffect(() => {
    loadDashboard()
    loadGuests()
  }, [])

  const loadDashboard = async () => {
    try {
      const data = await api.dashboard()
      setDashboard(data)
    } catch(e) { toast.error('Errore caricamento dashboard') }
    setLoading(false)
  }

  const loadGuests = async () => {
    try { setGuests(await api.listGuests()) } catch {}
  }

  const loadLogs = async () => {
    try { setLogs(await api.auditLogs()) } catch {}
  }

  const addGuest = async () => {
    if (!newGuest.name || !newGuest.email) { toast.error('Nome ed email richiesti'); return }
    setAdding(true)
    try {
      const g = await api.createGuest({
        ...newGuest,
        table_num: newGuest.table_num ? Number(newGuest.table_num) : null
      })
      setGuests(prev => [...prev, g])
      toast.success(`✓ Invitato ${g.name} aggiunto`)
      setNewGuest({ name:'', email:'', phone:'', table_num:'', dietary:'' })
      setAddOpen(false)
      loadDashboard()
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
    } catch(e) { toast.error('Errore') }
  }

  const tabs = [
    { id:'dashboard', label:'Dashboard', icon:'📊' },
    { id:'guests',    label:'Invitati',  icon:'👥' },
    { id:'logs',      label:'Log',       icon:'📋' },
  ]

  return (
    <div className="page-enter" style={{ padding:'40px 0 100px' }}>
      <div className="container">
        <div style={{ marginBottom:32 }}>
          <h1 style={{ fontFamily:'var(--font-serif)', fontSize:'2.2rem', color:'var(--charcoal)', marginBottom:4 }}>
            ⚙️ Pannello Admin
          </h1>
          <p style={{ color:'var(--warm-gray)' }}>Gestisci invitati, invii e monitora l'attività</p>
        </div>

        {/* Tab bar */}
        <div style={{ display:'flex', gap:8, marginBottom:32, flexWrap:'wrap' }}>
          {tabs.map(t => (
            <button
              key={t.id}
              className={`btn ${tab === t.id ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => { setTab(t.id); if(t.id==='logs') loadLogs() }}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* Dashboard tab */}
        {tab === 'dashboard' && dashboard && (
          <div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(180px, 1fr))', gap:12, marginBottom:32 }}>
              <StatCard icon="👥" label="Invitati totali"    value={dashboard.stats.guests_total}     color="var(--rose)" />
              <StatCard icon="✓"  label="Confermati"         value={dashboard.stats.guests_confirmed}  color="var(--sage)" />
              <StatCard icon="✕"  label="Declinati"          value={dashboard.stats.guests_declined}   color="var(--rose)" />
              <StatCard icon="⏳" label="In attesa"          value={dashboard.stats.guests_pending}    color="var(--gold)" />
              <StatCard icon="📧" label="rsvp inviati"     value={dashboard.stats.invites_sent}      color="var(--blush)" />
              <StatCard icon="📷" label="Foto caricate"      value={dashboard.stats.photos}            color="var(--sage)" />
              <StatCard icon="💌" label="Messaggi"           value={dashboard.stats.messages}          color="var(--rose)" />
              <StatCard icon="🎙️" label="Messaggi vocali"    value={dashboard.stats.audio_messages}    color="var(--gold)" />
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
                      <td style={{ padding:'10px 16px', color:'var(--warm-gray)' }}>{new Date(l.created_at).toLocaleString('it-IT')}</td>
                      <td style={{ padding:'10px 16px', color:'var(--charcoal)', fontWeight:500 }}>{l.actor}</td>
                      <td style={{ padding:'10px 16px' }}><span className="badge badge-pending">{l.action}</span></td>
                      <td style={{ padding:'10px 16px', color:'var(--warm-gray)' }}>{l.target}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Guests tab */}
        {tab === 'guests' && (
          <div>
            <div style={{ display:'flex', gap:12, marginBottom:24, flexWrap:'wrap', alignItems:'center' }}>
              <button className="btn btn-primary" onClick={() => setAddOpen(!addOpen)}>
                {addOpen ? '✕ Annulla' : '+ Aggiungi invitato'}
              </button>
              <button className="btn btn-outline" onClick={sendAll} disabled={rsvpng}>
                {rsvpng ? 'Invio…' : '📧 Invia tutti gli rsvp pendenti'}
              </button>
            </div>

            {addOpen && (
              <div className="card" style={{ padding:24, marginBottom:24 }}>
                <h3 style={{ fontFamily:'var(--font-serif)', marginBottom:20 }}>Nuovo invitato</h3>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))', gap:12 }}>
                  <div><label>Nome *</label><input className="input" placeholder="Mario Rossi" value={newGuest.name} onChange={e => setNewGuest(p=>({...p, name:e.target.value}))} /></div>
                  <div><label>Email *</label><input className="input" placeholder="mario@email.it" value={newGuest.email} onChange={e => setNewGuest(p=>({...p, email:e.target.value}))} /></div>
                  <div><label>Telefono</label><input className="input" placeholder="+39 333 1234567" value={newGuest.phone} onChange={e => setNewGuest(p=>({...p, phone:e.target.value}))} /></div>
                  <div><label>Tavolo N°</label><input className="input" type="number" min="1" placeholder="1" value={newGuest.table_num} onChange={e => setNewGuest(p=>({...p, table_num:e.target.value}))} /></div>
                </div>
                <button className="btn btn-primary" onClick={addGuest} disabled={adding} style={{ marginTop:16 }}>
                  {adding ? 'Aggiunta…' : 'Aggiungi'}
                </button>
              </div>
            )}

            <div className="card" style={{ overflow:'auto' }}>
              <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'.85rem', minWidth:600 }}>
                <thead>
                  <tr style={{ borderBottom:'2px solid var(--cream)', background:'var(--ivory)' }}>
                    {['Nome', 'Email', 'Tavolo', 'rsvp', 'Invito', 'Azioni'].map(h => (
                      <th key={h} style={{ padding:'12px 16px', textAlign:'left', color:'var(--warm-gray)', fontWeight:500, textTransform:'uppercase', letterSpacing:'.04em', fontSize:'.75rem' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {guests.map(g => (
                    <tr key={g.id} style={{ borderBottom:'1px solid var(--cream)' }}>
                      <td style={{ padding:'10px 16px', fontWeight:500, color:'var(--charcoal)' }}>
                        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                          {g.avatar_url && <img src={g.avatar_url} style={{ width:28, height:28, borderRadius:'50%' }} />}
                          {g.name}
                        </div>
                      </td>
                      <td style={{ padding:'10px 16px', color:'var(--warm-gray)' }}>{g.email}</td>
                      <td style={{ padding:'10px 16px', color:'var(--warm-gray)' }}>{g.table_num || '—'}</td>
                      <td style={{ padding:'10px 16px' }}><span className={`badge badge-${g.rsvp_status}`}>{g.rsvp_status}</span></td>
                      <td style={{ padding:'10px 16px' }}>
                        {g.invite_sent ? <span style={{ color:'var(--sage)', fontSize:'.85rem' }}>✓ Inviato</span> : <span style={{ color:'var(--warm-gray)', fontSize:'.85rem' }}>Non inviato</span>}
                      </td>
                      <td style={{ padding:'10px 16px' }}>
                        <div style={{ display:'flex', gap:6 }}>
                          <button className="btn btn-sm btn-outline" onClick={() => sendInvite(g.id, g.name)}>📧</button>
                          <button className="btn btn-sm" style={{ background:'rgba(200,130,106,.15)', color:'var(--rose)', border:'none' }} onClick={() => deleteGuest(g.id, g.name)}>🗑</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {guests.length === 0 && (
                <p style={{ textAlign:'center', padding:40, color:'var(--warm-gray)' }}>Nessun invitato ancora. Aggiungi il primo!</p>
              )}
            </div>
          </div>
        )}

        {/* Logs tab */}
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
                    <td style={{ padding:'8px 16px' }}><span className="badge badge-pending" style={{ fontSize:'.7rem' }}>{l.action}</span></td>
                    <td style={{ padding:'8px 16px', color:'var(--warm-gray)' }}>{l.target}</td>
                    <td style={{ padding:'8px 16px', color:'var(--warm-gray)', fontFamily:'monospace' }}>{l.ip}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {logs.length === 0 && (
              <p style={{ textAlign:'center', padding:40, color:'var(--warm-gray)' }}>Nessun log ancora</p>
            )}
          </div>
        )}
      </div>
      <ToastContainer toasts={toast.toasts} />
    </div>
  )
}
