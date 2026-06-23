import { StatCard } from './StatCard'

export function AdminAnalisi({ dashboard, rsvpTimeline, timelineLoading, photos, messages, guests }) {
  return (
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
                    <span className="admin-funnel-label" style={{ width:170, fontSize:'.85rem', color:'var(--charcoal)', flexShrink:0 }}>{s.label}</span>
                    <div style={{ flex:1, background:'var(--cream)', borderRadius:4, height:12, overflow:'hidden' }}>
                      <div style={{ width:'100%', height:'100%', background:s.color, borderRadius:4, transform:`scaleX(${pct})`, transformOrigin:'left', transition:'transform .4s' }} />
                    </div>
                    <span className="admin-funnel-pct" style={{ width:70, textAlign:'right', fontSize:'.82rem', color:'var(--warm-gray)', flexShrink:0 }}>
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
  )
}
