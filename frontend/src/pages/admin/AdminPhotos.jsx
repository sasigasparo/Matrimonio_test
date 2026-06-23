export function AdminPhotos({ photos, deletePhoto }) {
  return (
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
  )
}
