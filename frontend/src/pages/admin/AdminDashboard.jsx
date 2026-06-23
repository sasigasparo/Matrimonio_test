import { StatCard } from './StatCard'
import { LOG_LABELS } from './constants'

export function AdminDashboard({ dashboard }) {
  return (
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
      <div className="card mbl-cards" style={{ overflow:'auto' }}>
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
                <td data-label="Data" style={{ padding:'10px 16px', color:'var(--warm-gray)', whiteSpace:'nowrap' }}>{new Date(l.created_at).toLocaleString('it-IT')}</td>
                <td data-label="Utente" style={{ padding:'10px 16px', color:'var(--charcoal)', fontWeight:500 }}>{l.actor}</td>
                <td data-label="Azione" style={{ padding:'10px 16px', color:'var(--charcoal)' }}>{LOG_LABELS[l.action] || l.action}</td>
                <td data-label="Target" style={{ padding:'10px 16px', color:'var(--warm-gray)', fontSize:'.82rem' }}>{l.target}{l.detail ? ` — ${l.detail}` : ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
