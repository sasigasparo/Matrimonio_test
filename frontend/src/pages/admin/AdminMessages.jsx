export function AdminMessages({ messages, deleteMessage }) {
  return (
    <div>
      <p style={{ color:'var(--warm-gray)', marginBottom:24, fontSize:'.9rem' }}>
        {messages.length} messaggi — clicca 🗑 per eliminare.
      </p>
      {messages.length === 0 ? (
        <div className="card" style={{ padding:48, textAlign:'center', color:'var(--warm-gray)' }}>
          Nessun messaggio ancora.
        </div>
      ) : (
        <div className="card mbl-cards" style={{ overflow:'auto' }}>
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
                  <td data-label="Mittente" style={{ padding:'10px 16px', fontWeight:500, color:'var(--charcoal)', whiteSpace:'nowrap' }}>
                    {m.guest_name || 'Anonimo'}
                  </td>
                  <td data-label="Contenuto" style={{ padding:'10px 16px', color:'var(--warm-gray)', maxWidth:320 }}>
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
                  <td data-label="Tipo" style={{ padding:'10px 16px' }}>
                    <span className="badge badge-pending" style={{ fontSize:'.7rem' }}>{m.type}</span>
                  </td>
                  <td data-label="Data" style={{ padding:'10px 16px', color:'var(--warm-gray)', whiteSpace:'nowrap' }}>
                    {new Date(m.created_at).toLocaleString('it-IT')}
                  </td>
                  <td className="mbl-actions" style={{ padding:'10px 16px' }}>
                    <button
                      onClick={() => deleteMessage(m.id)}
                      style={{
                        background:'rgba(199,107,139,.15)', color:'var(--rose)',
                        border:'none', borderRadius:6, padding:'4px 8px',
                        cursor:'pointer', fontSize:'.85rem',
                      }}
                    >
                      🗑 Elimina
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
