import { WEDDING_CONFIG } from '../config/wedding'
import { useLanguage } from '../hooks/useLanguage'
import { MapPin, Clock, Navigation } from 'lucide-react'
import AddToCalendar from '../components/AddToCalendar'
import ShareButton from '../components/ShareButton'

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

function LuogoCard({ luogo, eyebrow }) {
  const { t } = useLanguage()
  const { lat, lng } = luogo.coords
  return (
    <div className="card" style={{ overflow: 'hidden', padding: 0 }}>
      {/* Interactive map */}
      <iframe
        title={`Mappa — ${luogo.nome}`}
        loading="lazy"
        src={`https://www.openstreetmap.org/export/embed.html?bbox=${lng - 0.015}%2C${lat - 0.011}%2C${lng + 0.015}%2C${lat + 0.011}&layer=mapnik&marker=${lat}%2C${lng}`}
        style={{ display: 'block', width: '100%', height: 220, border: 'none', filter: 'saturate(1.05)' }}
      />

      <div style={{ padding: '22px 24px 24px' }}>
        {eyebrow && (
          <div style={{ fontSize: '.72rem', fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--rose-deep)', marginBottom: 6 }}>
            {eyebrow}
          </div>
        )}
        <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.55rem', color: 'var(--charcoal)', marginBottom: 12 }}>
          {luogo.nome}
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 9, marginBottom: 16, color: 'var(--ink-soft)', fontSize: '.95rem' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 9 }}>
            <MapPin size={17} style={{ color: 'var(--rose-deep)', flexShrink: 0, marginTop: 2 }} /> <span>{luogo.indirizzo}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <Clock size={17} style={{ color: 'var(--rose-deep)', flexShrink: 0 }} /> <span>{luogo.orario}</span>
          </div>
        </div>

        {luogo.note && (
          <p style={{
            fontSize: '.88rem', color: 'var(--ink-soft)',
            background: 'var(--rose-soft)', borderRadius: 'var(--radius-sm)',
            padding: '12px 14px', lineHeight: 1.6, margin: '0 0 18px',
          }}>
            {luogo.note}
          </p>
        )}

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <a
            href={`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`}
            target="_blank" rel="noopener noreferrer" className="btn btn-primary btn-sm"
          >
            <Navigation size={15} /> {t('luoghi.googleMaps')}
          </a>
          <a
            href={`https://www.waze.com/ul?ll=${lat},${lng}&navigate=yes`}
            target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm"
          >
            {t('luoghi.waze')}
          </a>
        </div>
      </div>
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

        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{
            width: 56, height: 56, margin: '0 auto 14px', borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'linear-gradient(150deg, var(--rose-soft), var(--blush))', color: 'var(--rose-deep)',
          }}>
            <MapPin size={26} />
          </div>
          <h1 style={{ fontFamily: 'var(--font-serif)', marginBottom: 18 }}>
            {t('luoghi.pageTitle')}
          </h1>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
            <AddToCalendar />
            <ShareButton />
          </div>
        </div>

        {/* CERIMONIA */}
        <LuogoCard luogo={cerimonia} eyebrow={t('luoghi.ceremonyEyebrow')} />

        <div style={{ height: 18 }} />

        {/* RICEVIMENTO */}
        <LuogoCard luogo={ricevimento} eyebrow={t('luoghi.receptionEyebrow')} />

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