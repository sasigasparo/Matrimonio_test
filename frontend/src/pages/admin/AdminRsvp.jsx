import { StatCard } from './StatCard'
import { DIET_LABELS } from './constants'

export function AdminRsvp({ confirmed, totalSeats, totalAdults, totalChildren, dietGroups }) {
  return (
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
      <div className="card mbl-cards" style={{ overflow:'auto', marginBottom:36 }}>
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
                  <td data-label="Nome" style={{ padding:'10px 16px', fontWeight:500, color:'var(--charcoal)' }}>{g.name}</td>
                  <td data-label="Adulti" style={{ padding:'10px 16px', color:'var(--warm-gray)' }}>
                    {adults}{g.companions > 0 && <span style={{ fontSize:'.75rem', marginLeft:4, color:'var(--warm-gray)' }}>(+{g.companions} acc.)</span>}
                  </td>
                  <td data-label="Bambini" style={{ padding:'10px 16px', color:'var(--warm-gray)' }}>{children || '—'}</td>
                  <td data-label="Totale" style={{ padding:'10px 16px', fontWeight:600, color:'var(--charcoal)' }}>{adults + children}</td>
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
  )
}
