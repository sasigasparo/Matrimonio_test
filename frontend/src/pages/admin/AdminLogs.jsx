import { LOG_LABELS } from './constants'

export function AdminLogs({ logs }) {
  return (
    <div className="card mbl-cards" style={{ overflow:'auto' }}>
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
              <td data-label="Data" style={{ padding:'8px 16px', color:'var(--warm-gray)', whiteSpace:'nowrap' }}>{new Date(l.created_at).toLocaleString('it-IT')}</td>
              <td data-label="Utente" style={{ padding:'8px 16px', color:'var(--charcoal)' }}>{l.actor}</td>
              <td data-label="Azione" style={{ padding:'8px 16px', color:'var(--charcoal)', fontSize:'.85rem' }}>{LOG_LABELS[l.action] || l.action}</td>
              <td data-label="Target" style={{ padding:'8px 16px', color:'var(--warm-gray)', fontSize:'.82rem' }}>{l.target}{l.detail ? ` — ${l.detail}` : ''}</td>
              <td data-label="IP" className="mbl-hide" style={{ padding:'8px 16px', color:'var(--warm-gray)', fontFamily:'monospace', fontSize:'.78rem' }}>{l.ip}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {logs.length === 0 && (
        <p style={{ textAlign:'center', padding:40, color:'var(--warm-gray)' }}>Nessun log ancora</p>
      )}
    </div>
  )
}
