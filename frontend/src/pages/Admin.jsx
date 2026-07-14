import { useState, useEffect } from 'react'
import { api } from '../utils/api'
import { useToast, ToastContainer } from '../hooks/useToast'
import { AdminDashboard } from './admin/AdminDashboard'
import { AdminGuests } from './admin/AdminGuests'
import { AdminRsvp } from './admin/AdminRsvp'
import { AdminPhotos } from './admin/AdminPhotos'
import { AdminMessages } from './admin/AdminMessages'
import { AdminStats } from './admin/AdminStats'
import { AdminAnalisi } from './admin/AdminAnalisi'
import { AdminLogs } from './admin/AdminLogs'
import { DIET_LABELS, LOG_LABELS } from './admin/constants'
import { i18n } from './admin/i18n'

export default function Admin() {
  const toast = useToast()
  const t = i18n.en
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
    } catch { toast.error('Error loading dashboard') }
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
    try { setGeoData(await api.geoStats()) } catch { toast.error('Error loading statistics') }
    setGeoLoading(false)
  }

  const loadRsvpTimeline = async () => {
    if (rsvpTimeline.length > 0) return
    setTimelineLoading(true)
    try { setRsvpTimeline(await api.rsvpTimeline()) } catch { toast.error('Error loading timeline') }
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
    if (!newGuest.name || !newGuest.email) { toast.error('Name and email required'); return }
    setAdding(true)
    try {
      const tableNum = parseInt(newGuest.table_num, 10)
      const g = await api.createGuest({ ...newGuest, phone: normalizePhone(newGuest.phone), table_num: tableNum > 0 ? tableNum : null })
      setGuests(prev => [...prev, g])
      toast.success(`✓ Guest ${g.name} added`)
      setNewGuest({ name:'', email:'', phone:'', table_num:'', dietary:'' })
      setAddOpen(false)
      loadDashboard()
      if (sendOnCreate) sendInvite(g.id, g.name)
    } catch(e) { toast.error('Error: ' + e.message) }
    setAdding(false)
  }

  const sendInvite = async (id, name) => {
    try {
      const r = await api.sendInvite(id)
      r.sent ? toast.success(`📧 Invite sent to ${name}`) : toast.error('SMTP not configured — set the email variables in .env')
      loadGuests()
    } catch(e) { toast.error('Error: ' + e.message) }
  }

  const sendAll = async () => {
    setrsvpng(true)
    try {
      const results = await api.sendAll()
      const sent = results.filter(r => r.sent).length
      toast.success(`📧 ${sent} RSVPs sent out of ${results.length}`)
      loadGuests(); loadDashboard()
    } catch(e) { toast.error('Error: ' + e.message) }
    setrsvpng(false)
  }

  const deleteGuest = async (id, name) => {
    if (!confirm(`Delete ${name}?`)) return
    try {
      await api.deleteGuest(id)
      setGuests(prev => prev.filter(g => g.id !== id))
      toast.success('Guest deleted')
      loadDashboard()
    } catch { toast.error('Error') }
  }

  const openEdit = (g) => {
    setEditGuest(g)
    setEditForm({ name: g.name, email: g.email, phone: g.phone || '', table_num: g.table_num ?? '' })
  }

  const saveEdit = async () => {
    if (!editForm.name || !editForm.email) { toast.error('Name and email required'); return }
    setSaving(true)
    try {
      const tableNum = parseInt(editForm.table_num, 10)
      const updated = await api.updateGuest(editGuest.id, {
        ...editForm,
        phone: normalizePhone(editForm.phone),
        table_num: tableNum > 0 ? tableNum : null,
      })
      setGuests(prev => prev.map(g => g.id === updated.id ? updated : g))
      toast.success(`✓ ${updated.name} updated`)
      setEditGuest(null)
      if (sendOnEdit) sendInvite(updated.id, updated.name)
    } catch(e) { toast.error('Error: ' + e.message) }
    setSaving(false)
  }

  // ── Photo actions ────────────────────────────────────────────────────────────
  const deletePhoto = async (id) => {
    if (!confirm('Delete this photo?')) return
    try {
      await api.deletePhoto(id)
      setPhotos(prev => prev.filter(p => p.id !== id))
      toast.success('Photo deleted')
      loadDashboard()
    } catch { toast.error('Error deleting photo') }
  }

  // ── Message actions ──────────────────────────────────────────────────────────
  const deleteMessage = async (id) => {
    if (!confirm('Delete this message?')) return
    try {
      await api.deleteMsg(id)
      setMessages(prev => prev.filter(m => m.id !== id))
      toast.success('Message deleted')
      loadDashboard()
    } catch { toast.error('Error deleting message') }
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
      items: [{ id:'dashboard', label: t.dashboard,        mobileLabel: t.dashboard, icon:'📊' }]
    },
    {
      label: t.management,
      items: [
        { id:'guests',   label: t.guests, mobileLabel: t.guests, icon:'👥' },
        { id:'rsvp',     label: t.rsvp,    mobileLabel: t.rsvp,   icon:'🍽️' },
        { id:'photos',   label: t.photos,     mobileLabel: t.photos,     icon:'📷' },
        { id:'messages', label: t.messages,          mobileLabel: t.messages, icon:'💬' },
      ]
    },
    {
      label: t.data,
      items: [
        { id:'analisi', label: t.analytics,        mobileLabel: t.analytics, icon:'📈' },
        { id:'stats',   label: t.stats, mobileLabel: t.stats,     icon:'🌍' },
      ]
    },
    {
      label: t.system,
      items: [{ id:'logs', label: t.logs, mobileLabel: t.logs, icon:'📋' }]
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
        .admin-nav-label-short{display:none}
        @media(max-width:768px){
          .admin-layout{flex-direction:column}
          .admin-sidebar{width:100%;height:auto;position:static;border-right:none;border-bottom:1px solid var(--cream);display:grid;grid-template-columns:repeat(4,1fr);gap:1px;background:var(--cream);padding:0}
          .admin-sidebar-header{display:none}
          .admin-nav-section{display:none}
          .admin-sidebar-divider{display:none}
          .admin-nav-group{display:contents}
          .admin-nav-item{flex-direction:column;gap:4px;border-left:none;border-bottom:none;padding:12px 6px;background:var(--white);color:var(--warm-gray);justify-content:center;align-items:center;min-height:68px;font-size:.68rem}
          .admin-nav-item .admin-nav-icon{font-size:1.35rem;line-height:1}
          .admin-nav-label-full{display:none}
          .admin-nav-label-short{display:block;font-size:.68rem;text-align:center;line-height:1.2;color:inherit}
          .admin-nav-item.active{background:var(--rose-soft);color:var(--rose);font-weight:600}
          .admin-content{padding:16px 14px 100px}
          /* Card-table transform */
          .mbl-cards{overflow:visible!important}
          .mbl-cards table{min-width:0!important;width:100%!important}
          .mbl-cards thead{display:none!important}
          .mbl-cards tbody{display:flex;flex-direction:column}
          .mbl-cards tbody tr{display:flex;flex-direction:column;padding:12px 0;border-bottom:1px solid var(--cream)!important;gap:0}
          .mbl-cards tbody tr:last-child{border-bottom:none!important}
          .mbl-cards td{display:flex;justify-content:space-between;align-items:center;padding:4px 0!important;border:none!important;font-size:.85rem;gap:10px;min-height:28px}
          .mbl-cards td[data-label]::before{content:attr(data-label);font-size:.64rem;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--warm-gray);flex-shrink:0;min-width:64px}
          .mbl-cards td.mbl-actions{padding-top:8px!important;justify-content:flex-start;gap:8px}
          .mbl-cards td.mbl-actions::before{display:none}
          .mbl-hide{display:none!important}
          /* Funnel label */
          .admin-funnel-label{width:auto!important;flex:0 0 auto;max-width:100px;font-size:.78rem!important;white-space:normal!important;line-height:1.3!important}
          .admin-funnel-pct{display:none!important}
          /* Section heading on mobile */
          .admin-section-title{display:block}
        }
        .admin-section-title{display:none;font-family:var(--font-serif);font-size:1.1rem;color:var(--charcoal);font-weight:700;margin-bottom:18px}
      `}</style>
      <div className="admin-layout">
        <aside className="admin-sidebar">
          <div className="admin-sidebar-header">
            <div style={{ fontFamily:'var(--font-serif)', fontSize:'1.15rem', color:'var(--charcoal)', fontWeight:700, marginBottom:8 }}>
              ⚙️ Admin
            </div>
            {dashboard && (
              <div style={{ fontSize:'.75rem', color:'var(--warm-gray)', lineHeight:1.8 }}>
                <span>{dashboard.stats.guests_total} total guests</span><br/>
                <span style={{ color:'var(--sage)' }}>✓ {dashboard.stats.guests_confirmed} confirmed</span>
                {dashboard.stats.guests_pending > 0 && (
                  <><br/><span style={{ color:'var(--gold)' }}>⏳ {dashboard.stats.guests_pending} pending</span></>
                )}
              </div>
            )}
          </div>
          {navGroups.map((group, gi) => (
            <div key={gi} className="admin-nav-group">
              {gi > 0 && gi < navGroups.length && group.label && (
                <div className="admin-nav-section">{group.label}</div>
              )}
              {group.items.map(item => (
                <button
                  key={item.id}
                  className={`admin-nav-item${tab === item.id ? ' active' : ''}`}
                  onClick={() => switchTab(item.id)}
                >
                  <span className="admin-nav-icon" style={{ fontSize:'1rem', lineHeight:1, width:20, textAlign:'center', flexShrink:0 }}>{item.icon}</span>
                  <span className="admin-nav-label admin-nav-label-full">{item.label}</span>
                  <span className="admin-nav-label admin-nav-label-short">{item.mobileLabel}</span>
                </button>
              ))}
              {gi === 0 && <div className="admin-sidebar-divider" />}
            </div>
          ))}
        </aside>
        <div className="admin-content">

        {/* Mobile section title */}
        {(() => {
          const allItems = navGroups.flatMap(g => g.items)
          const current = allItems.find(i => i.id === tab)
          return current ? (
            <div className="admin-section-title">{current.icon} {current.label}</div>
          ) : null
        })()}

        {/* ── Dashboard ─────────────────────────────────────────────────────── */}
        {tab === 'dashboard' && dashboard && <AdminDashboard dashboard={dashboard} t={t} />}

        {/* ── Invitati ──────────────────────────────────────────────────────── */}
        {tab === 'guests' && (
          <AdminGuests t={t}
            guests={guests} dashboard={dashboard} sortedGuests={sortedGuests} splitName={splitName}
            sortField={sortField} sortDir={sortDir} toggleSort={toggleSort}
            addOpen={addOpen} setAddOpen={setAddOpen} newGuest={newGuest} setNewGuest={setNewGuest}
            adding={adding} sendOnCreate={sendOnCreate} setSendOnCreate={setSendOnCreate}
            addGuest={addGuest} sendInvite={sendInvite} sendAll={sendAll} rsvpng={rsvpng}
            deleteGuest={deleteGuest} editGuest={editGuest} setEditGuest={setEditGuest} openEdit={openEdit}
            editForm={editForm} setEditForm={setEditForm} saving={saving}
            sendOnEdit={sendOnEdit} setSendOnEdit={setSendOnEdit} saveEdit={saveEdit}
          />
        )}

        {/* ── Diete & Posti ─────────────────────────────────────────────────── */}
        {tab === 'rsvp' && (
          <AdminRsvp t={t} confirmed={confirmed} totalSeats={totalSeats} totalAdults={totalAdults} totalChildren={totalChildren} dietGroups={dietGroups} />
        )}

        {/* ── Foto ──────────────────────────────────────────────────────────── */}
        {tab === 'photos' && <AdminPhotos t={t} photos={photos} deletePhoto={deletePhoto} />}

        {/* ── Messaggi ──────────────────────────────────────────────────────── */}
        {tab === 'messages' && <AdminMessages t={t} messages={messages} deleteMessage={deleteMessage} />}

        {/* ── Statistiche ───────────────────────────────────────────────────── */}
        {tab === 'stats' && <AdminStats t={t} geoData={geoData} geoLoading={geoLoading} />}

        {/* ── Analisi ───────────────────────────────────────────────────────── */}
        {tab === 'analisi' && (
          <AdminAnalisi t={t} dashboard={dashboard} rsvpTimeline={rsvpTimeline} timelineLoading={timelineLoading} photos={photos} messages={messages} guests={guests} />
        )}

        {/* ── Log ───────────────────────────────────────────────────────────── */}
        {tab === 'logs' && <AdminLogs t={t} logs={logs} />}
        </div>{/* admin-content */}
      </div>{/* admin-layout */}
      <ToastContainer toasts={toast.toasts} />
    </div>
  )
}
