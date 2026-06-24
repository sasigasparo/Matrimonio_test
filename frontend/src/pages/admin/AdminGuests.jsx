import { useState } from 'react'
import { useToast } from '../../hooks/useToast'

export function AdminGuests({
  t, guests, dashboard, sortedGuests, splitName, sortField, sortDir, toggleSort,
  addOpen, setAddOpen, newGuest, setNewGuest, adding, sendOnCreate, setSendOnCreate,
  addGuest, sendInvite, sendAll, rsvpng, deleteGuest,
  editGuest, setEditGuest, openEdit, editForm, setEditForm, saving, sendOnEdit, setSendOnEdit, saveEdit
}) {
  const toast = useToast()

  return (
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
            ? 'Email configurata — gli inviti possono essere inviati.'
            : 'Email non configurata. Aggiungi SMTP_USER e SMTP_PASSWORD  per abilitare gli inviti.'}
        </div>
      )}
      <div style={{ display:'flex', gap:12, marginBottom:24, flexWrap:'wrap', alignItems:'center' }}>
        <button className="btn btn-primary" onClick={() => setAddOpen(!addOpen)}>
          {addOpen ? t.cancel : t.addGuest}
        </button>
        <button className="btn btn-outline" onClick={sendAll} disabled={rsvpng}>
          {rsvpng ? t.sending : t.sendAllRsvp}
        </button>
        <button className="btn btn-outline" onClick={() => {
          const emails = guests.map(g => g.email).join(', ')
          navigator.clipboard.writeText(emails)
          toast.success(t.emailsCopied)
        }}>
          {t.copyEmails}
        </button>
      </div>

      {addOpen && (
        <div className="card" style={{ padding:24, marginBottom:24 }}>
          <h3 style={{ fontFamily:'var(--font-serif)', marginBottom:20 }}>{t.newGuest}</h3>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))', gap:12 }}>
            <div><label>{t.fullName} *</label><input className="input" placeholder="Mario Rossi" value={newGuest.name} onChange={e => setNewGuest(p=>({...p, name:e.target.value}))} /></div>
            <div><label>{t.email} *</label><input className="input" placeholder="mario@email.it" value={newGuest.email} onChange={e => setNewGuest(p=>({...p, email:e.target.value}))} /></div>
            <div><label>{t.phone}</label><input className="input" placeholder="+39 333 1234567" value={newGuest.phone} onChange={e => setNewGuest(p=>({...p, phone:e.target.value}))} /></div>
            <div><label>{t.tableNumber}</label><input className="input" type="number" placeholder="(opzionale)" value={newGuest.table_num} onChange={e => setNewGuest(p=>({...p, table_num:e.target.value}))} /></div>
          </div>
          <div style={{ marginTop:16, display:'flex', alignItems:'center', gap:16, flexWrap:'wrap' }}>
            <label style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer', fontSize:'.9rem', color:'var(--charcoal)', userSelect:'none' }}>
              <input
                type="checkbox"
                checked={sendOnCreate}
                onChange={e => setSendOnCreate(e.target.checked)}
                style={{ width:16, height:16, accentColor:'var(--rose)', cursor:'pointer' }}
              />
              {t.sendInvite}
            </label>
            <button className="btn btn-primary" onClick={addGuest} disabled={adding}>
              {adding ? t.adding : sendOnCreate ? t.addAndSend : t.addOnly}
            </button>
          </div>
        </div>
      )}

      <div className="card mbl-cards" style={{ overflow:'auto' }}>
        <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'.85rem', minWidth:680 }}>
          <thead>
            <tr style={{ borderBottom:'2px solid var(--cream)', background:'var(--ivory)' }}>
              {[
                { key:'nome',    label:'Nome e Cognome' },
              ].map(({ key, label }) => (
                <th key={key} onClick={() => toggleSort(key)} style={{ padding:'12px 16px', textAlign:'left', color:'var(--warm-gray)', fontWeight:500, textTransform:'uppercase', letterSpacing:'.04em', fontSize:'.75rem', cursor:'pointer', userSelect:'none' }}>
                  {label} {sortField === key ? (sortDir === 'asc' ? '↑' : '↓') : ''}
                </th>
              ))}
              {[t.email, t.table, t.rsvpStatus, t.invite, t.actions].map(h => (
                <th key={h} style={{ padding:'12px 16px', textAlign:'left', color:'var(--warm-gray)', fontWeight:500, textTransform:'uppercase', letterSpacing:'.04em', fontSize:'.75rem' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedGuests.map(g => {
              const { nome, cognome } = splitName(g.name)
              return (
              <tr key={g.id} style={{ borderBottom:'1px solid var(--cream)' }}>
                <td data-label="Nome e Cognome" style={{ padding:'10px 16px', fontWeight:500, color:'var(--charcoal)' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    {g.avatar_url && <img src={g.avatar_url} style={{ width:28, height:28, borderRadius:'50%' }} />}
                    <span>{nome} {cognome}</span>
                  </div>
                </td>
                <td data-label="Email" style={{ padding:'10px 16px' }}>
                  <a href={`mailto:${g.email}`} style={{ color:'var(--rose)', textDecoration:'none', fontSize:'.85rem' }}>{g.email}</a>
                </td>
                <td data-label="Tavolo" style={{ padding:'10px 16px', color:'var(--warm-gray)' }}>{g.table_num || '—'}</td>
                <td data-label="RSVP" style={{ padding:'10px 16px' }}><span className={`badge badge-${g.rsvp_status}`}>{g.rsvp_status}</span></td>
                <td data-label="Invito" className="mbl-hide" style={{ padding:'10px 16px' }}>
                  {g.invite_sent ? <span style={{ color:'var(--sage)', fontSize:'.85rem' }}>✓ {t.sent}</span> : <span style={{ color:'var(--warm-gray)', fontSize:'.85rem' }}>{t.notSent}</span>}
                </td>
                <td className="mbl-actions" style={{ padding:'10px 16px' }}>
                  <button className="btn btn-sm btn-outline" onClick={() => sendInvite(g.id, g.name)}>📧</button>
                  <button className="btn btn-sm btn-outline" onClick={() => openEdit(g)}>✏️</button>
                  <button className="btn btn-sm" style={{ background:'rgba(199,107,139,.15)', color:'var(--rose)', border:'none' }} onClick={() => deleteGuest(g.id, g.name)}>🗑</button>
                </td>
              </tr>
            )
            })}
          </tbody>
        </table>
        {guests.length === 0 && (
          <p style={{ textAlign:'center', padding:40, color:'var(--warm-gray)' }}>{t.noGuests}</p>
        )}
      </div>

      {editGuest && (
        <div style={{
          position:'fixed', inset:0, background:'rgba(0,0,0,.45)', zIndex:1000,
          display:'flex', alignItems:'center', justifyContent:'center', padding:16,
        }} onClick={e => e.target === e.currentTarget && setEditGuest(null)}>
          <div className="card" style={{ width:'100%', maxWidth:480, padding:28 }}>
            <h3 style={{ fontFamily:'var(--font-serif)', fontSize:'1.2rem', marginBottom:20 }}>
              {t.editGuest}
            </h3>
            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              <div><label>{t.fullName} *</label><input className="input" value={editForm.name} onChange={e => setEditForm(p=>({...p, name:e.target.value}))} /></div>
              <div><label>{t.email} *</label><input className="input" type="email" value={editForm.email} onChange={e => setEditForm(p=>({...p, email:e.target.value}))} /></div>
              <div><label>{t.phone}</label><input className="input" value={editForm.phone} onChange={e => setEditForm(p=>({...p, phone:e.target.value}))} /></div>
              <div><label>{t.tableNumber}</label><input className="input" type="number" placeholder="(opzionale)" value={editForm.table_num} onChange={e => setEditForm(p=>({...p, table_num:e.target.value}))} /></div>
            </div>
            <div style={{ marginTop:20, display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:10 }}>
              <label style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer', fontSize:'.9rem', color:'var(--charcoal)', userSelect:'none' }}>
                <input
                  type="checkbox"
                  checked={sendOnEdit}
                  onChange={e => setSendOnEdit(e.target.checked)}
                  style={{ width:16, height:16, accentColor:'var(--rose)', cursor:'pointer' }}
                />
                {t.sendAfterSave}
              </label>
              <div style={{ display:'flex', gap:10 }}>
                <button className="btn btn-outline" onClick={() => setEditGuest(null)}>{t.cancel}</button>
                <button className="btn btn-primary" onClick={saveEdit} disabled={saving}>
                  {saving ? t.saving : sendOnEdit ? t.saveAndSend : t.save}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
