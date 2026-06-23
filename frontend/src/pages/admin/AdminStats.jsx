import { StatCard } from './StatCard'

export function AdminStats({ geoData, geoLoading }) {
  if (geoLoading) {
    return <p style={{ color:'var(--warm-gray)', marginBottom:24 }}>⏳ Geolocalizzazione in corso…</p>
  }

  if (!geoData) {
    return (
      <div className="card" style={{ padding:48, textAlign:'center', color:'var(--warm-gray)' }}>
        Nessun dato disponibile.
      </div>
    )
  }

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
          <div className="card mbl-cards" style={{ overflow:'auto' }}>
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
                      <td data-label="Paese" style={{ padding:'10px 16px', fontWeight:500, color:'var(--charcoal)' }}>{c.country}</td>
                      <td data-label="Visite" style={{ padding:'10px 16px', textAlign:'right', color:'var(--warm-gray)' }}>{c.count} <span style={{ fontSize:'.75rem' }}>({pct}%)</span></td>
                      <td className="mbl-hide" style={{ padding:'10px 24px 10px 8px', width:140 }}>
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
          <div className="card mbl-cards" style={{ overflow:'auto' }}>
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
                    <td data-label="Città" style={{ padding:'8px 16px', fontWeight:500, color:'var(--charcoal)' }}>{l.city || '—'}</td>
                    <td data-label="Paese" style={{ padding:'8px 16px', color:'var(--warm-gray)' }}>{l.country}</td>
                    <td data-label="Visite" style={{ padding:'8px 16px', color:'var(--warm-gray)' }}>{l.visits}</td>
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
          <div className="card mbl-cards" style={{ overflow:'auto' }}>
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
                      <td data-label="Azione" style={{ padding:'8px 16px', fontWeight:500, color:'var(--charcoal)' }}>
                        <span className="badge badge-pending" style={{ fontSize:'.75rem' }}>{a.action}</span>
                      </td>
                      <td data-label="N°" style={{ padding:'8px 16px', textAlign:'right', color:'var(--warm-gray)' }}>{a.count}</td>
                      <td className="mbl-hide" style={{ padding:'8px 24px 8px 8px', width:120 }}>
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
}
