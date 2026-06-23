import { WEDDING_CONFIG } from '../config/wedding'
import { useLanguage } from '../hooks/useLanguage'

/* ───────── COMPONENTI ───────── */

function InfoCard({ icon, titolo, desc }) {
  return (
    <div style={{
      background: 'var(--ivory)',
      border: '1.5px solid rgba(207,165,181,.2)',
      borderRadius: 'var(--radius-md)',
      padding: '20px 22px',
      display: 'flex',
      gap: 16,
      alignItems: 'flex-start',
    }}>
      <span style={{ fontSize: '1.6rem' }}>{icon}</span>
      <div>
        <div style={{ fontWeight: 600, color: 'var(--charcoal)', marginBottom: 4 }}>
          {titolo}
        </div>
        <div style={{ fontSize: '.9rem', color: 'var(--warm-gray)', lineHeight: 1.6 }}>
          {desc}
        </div>
      </div>
    </div>
  )
}

function LuogoCard({ luogo, showMap }) {
  const { t } = useLanguage()
  return (
    <div className="card" style={{ overflow: 'hidden' }}>
      <div style={{ padding: '28px 28px 20px' }}>
        <h3 style={{
          fontFamily: 'var(--font-serif)',
          fontSize: '1.6rem',
          color: 'var(--charcoal)',
          marginBottom: 6,
        }}>
          {luogo.nome}
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
          <div>📍 {luogo.indirizzo}</div>
          <div>🕒 {luogo.orario}</div>
        </div>

        {luogo.note && (
          <p style={{
            fontSize: '.88rem',
            color: 'var(--warm-gray)',
            background: 'rgba(207,165,181,.1)',
            borderRadius: 8,
            padding: '10px 14px',
            borderLeft: '3px solid var(--blush)',
            lineHeight: 1.6,
          }}>
            {luogo.note}
          </p>
        )}

        <div style={{ display: 'flex', gap: 10, marginTop: 18, flexWrap: 'wrap' }}>
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(luogo.indirizzo)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-primary btn-sm"
          >
            {t('luoghi.googleMaps')}
          </a>

          <a
            href={`https://www.waze.com/ul?q=${encodeURIComponent(luogo.indirizzo)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-outline btn-sm"
          >
            {t('luoghi.waze')}
          </a>
        </div>
      </div>

      {showMap && (
        <iframe
          title="Mappa"
          src={`https://www.openstreetmap.org/export/embed.html?bbox=${luogo.coords.lng - 0.02}%2C${luogo.coords.lat - 0.015}%2C${luogo.coords.lng + 0.02}%2C${luogo.coords.lat + 0.015}&layer=mapnik&marker=${luogo.coords.lat}%2C${luogo.coords.lng}`}
          width="100%"
          height="300"
          style={{ border: 'none' }}
        />
      )}
    </div>
  )
}

/* ───────── PAGE ───────── */

export default function Luoghi() {
  const { t } = useLanguage()

  const cerimonia = {
    ...t('luoghi.ceremony', {
      date: WEDDING_CONFIG.date,
      time: WEDDING_CONFIG.venue.ceremony.time,
    }),
    indirizzo: WEDDING_CONFIG.venue.ceremony.address,
    coords: WEDDING_CONFIG.venue.ceremony.coords,
  }
  const ricevimento = {
    ...t('luoghi.reception', {
      time: WEDDING_CONFIG.venue.reception.time,
    }),
    indirizzo: WEDDING_CONFIG.venue.reception.address,
    coords: WEDDING_CONFIG.venue.reception.coords,
  }

  return (
    <div className="page-enter" style={{ padding: '60px 20px 120px' }}>
      <div style={{ maxWidth: 720, margin: '0 auto' }}>

        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ fontSize: '3rem' }}>📍</div>
          <h1 style={{ fontFamily: 'var(--font-serif)' }}>
            {t('luoghi.pageTitle')}
          </h1>
        </div>

        {/* CERIMONIA */}
        <LuogoCard luogo={cerimonia} showMap={false} />

        <div style={{ height: 20 }} />

        {/* RICEVIMENTO */}
        <LuogoCard luogo={ricevimento} showMap />

        <section style={{ marginTop: 40 }}>
          <h2>{t('luoghi.comeArrivare')}</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {t('luoghi.parcheggi').map(p => <InfoCard key={p.titolo} {...p} />)}
          </div>
        </section>

        <section style={{ marginTop: 40 }}>
          <h2>{t('luoghi.perChiVieneDaFuori')}</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {t('luoghi.fuoriCitta').map(f => <InfoCard key={f.titolo} {...f} />)}
          </div>
        </section>

      </div>
    </div>
  )
}