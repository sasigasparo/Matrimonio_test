import { useState } from 'react'

const CERIMONIA = {
  nome: 'Chiesa di San Lorenzo',
  indirizzo: 'Piazza San Lorenzo, 1 – Greve in Chianti (FI)',
  orario: 'Sabato 14 Giugno 2025 · ore 15:00',
  note: 'Vi preghiamo di essere presenti almeno 15 minuti prima.',
  coords: { lat: 43.5842, lng: 11.3168 },
}

const RICEVIMENTO = {
  nome: 'Villa Belvedere',
  indirizzo: 'Via del Poggio 12 – Siena (SI) 53100',
  orario: 'A seguire · ore 17:00',
  note: 'Il ricevimento si terrà nei giardini della villa. In caso di pioggia, tutto si sposta nell\'elegante salone interno.',
  coords: { lat: 43.3188, lng: 11.3308 },
  // OpenStreetMap embed – completamente gratuito, nessuna API key
  mapSrc: 'https://www.openstreetmap.org/export/embed.html?bbox=11.3108%2C43.3138%2C43.3408%2C11.3508&layer=mapnik&marker=43.3188%2C11.3308',
}

const PARCHEGGI = [
  { icon: '🅿️', titolo: 'Parcheggio Villa', desc: 'Ampio parcheggio gratuito all\'interno della proprietà, segnalato all\'ingresso.' },
  { icon: '🚌', titolo: 'Bus navetta',       desc: 'Navetta gratuita dal centro di Siena (Piazza del Campo) ogni 30 minuti dalle 16:00.' },
  { icon: '🚕', titolo: 'Taxi / NCC',        desc: 'Consigliamo di prenotare in anticipo: Radio Taxi Siena +39 0577 49222.' },
]

const FUORI_CITTA = [
  {
    icon: '🚂',
    titolo: 'In treno',
    desc: 'Stazione più vicina: Siena FS (20 min). Trenitalia collega Firenze SMN a Siena in circa 1h30. Da Siena prendete la navetta o un taxi.',
  },
  {
    icon: '✈️',
    titolo: 'In aereo',
    desc: 'Aeroporto di Firenze (FLR) – 70 km. Aeroporto di Pisa (PSA) – 110 km. Da entrambi consigliamo il noleggio auto o un transfer privato.',
  },
  {
    icon: '🏨',
    titolo: 'Dove dormire',
    desc: 'Abbiamo riservato un blocco di camere all\'Agriturismo Il Colombaio (5 min dalla villa). Contattateci per il codice sconto. In alternativa: Hotel Campo Regio Relais a Siena centro.',
  },
]

function InfoCard({ icon, titolo, desc }) {
  return (
    <div style={{
      background: 'var(--ivory)',
      border: '1.5px solid rgba(200,162,168,.2)',
      borderRadius: 'var(--radius-md)',
      padding: '20px 22px',
      display: 'flex', gap: 16, alignItems: 'flex-start',
    }}>
      <span style={{ fontSize: '1.6rem', lineHeight: 1, flexShrink: 0 }}>{icon}</span>
      <div>
        <div style={{ fontWeight: 600, color: 'var(--charcoal)', marginBottom: 4 }}>{titolo}</div>
        <div style={{ fontSize: '.9rem', color: 'var(--warm-gray)', lineHeight: 1.6 }}>{desc}</div>
      </div>
    </div>
  )
}

function LuogoCard({ luogo, showMap }) {
  return (
    <div className="card" style={{ overflow: 'hidden' }}>
      <div style={{ padding: '28px 28px 20px' }}>
        <h3 style={{
          fontFamily: 'var(--font-serif)', fontSize: '1.6rem',
          color: 'var(--charcoal)', marginBottom: 6,
        }}>
          {luogo.nome}
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <span>📍</span>
            <span style={{ color: 'var(--warm-gray)', fontSize: '.95rem' }}>{luogo.indirizzo}</span>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <span>🕒</span>
            <span style={{ color: 'var(--warm-gray)', fontSize: '.95rem' }}>{luogo.orario}</span>
          </div>
        </div>
        {luogo.note && (
          <p style={{
            fontSize: '.88rem', color: 'var(--warm-gray)',
            background: 'rgba(200,162,168,.1)', borderRadius: 8,
            padding: '10px 14px', borderLeft: '3px solid var(--blush)',
            lineHeight: 1.6, margin: 0,
          }}>
            {luogo.note}
          </p>
        )}
        <div style={{ display: 'flex', gap: 10, marginTop: 18, flexWrap: 'wrap' }}>
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(luogo.indirizzo)}`}
            target="_blank" rel="noopener noreferrer"
            className="btn btn-primary btn-sm"
          >
            🗺️ Apri in Google Maps
          </a>
          <a
            href={`https://www.waze.com/ul?q=${encodeURIComponent(luogo.indirizzo)}`}
            target="_blank" rel="noopener noreferrer"
            className="btn btn-outline btn-sm"
          >
            🚗 Apri in Waze
          </a>
        </div>
      </div>

      {/* Mappa OpenStreetMap embed (solo per villa ricevimento) */}
      {showMap && (
        <div style={{ borderTop: '1px solid var(--cream)' }}>
          <iframe
            title="Mappa Villa Belvedere"
            src={`https://www.openstreetmap.org/export/embed.html?bbox=${luogo.coords.lng - 0.02}%2C${luogo.coords.lat - 0.015}%2C${luogo.coords.lng + 0.02}%2C${luogo.coords.lat + 0.015}&layer=mapnik&marker=${luogo.coords.lat}%2C${luogo.coords.lng}`}
            width="100%"
            height="300"
            style={{ display: 'block', border: 'none' }}
            loading="lazy"
          />
          <div style={{ padding: '8px 16px', background: 'var(--cream)', textAlign: 'center' }}>
            <a
              href={`https://www.openstreetmap.org/?mlat=${luogo.coords.lat}&mlon=${luogo.coords.lng}#map=15/${luogo.coords.lat}/${luogo.coords.lng}`}
              target="_blank" rel="noopener noreferrer"
              style={{ fontSize: '.78rem', color: 'var(--warm-gray)', textDecoration: 'none' }}
            >
              Visualizza mappa ingrandita ↗
            </a>
          </div>
        </div>
      )}
    </div>
  )
}

export default function Luoghi() {
  return (
    <div className="page-enter" style={{ padding: '60px 20px 120px' }}>
      <div style={{ maxWidth: 720, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 52 }}>
          <div style={{ fontSize: '3rem', marginBottom: 14 }}>📍</div>
          <h1 style={{
            fontFamily: 'var(--font-serif)', fontSize: '2.5rem',
            color: 'var(--charcoal)', marginBottom: 10,
          }}>
            Luoghi & Indicazioni
          </h1>
          <p style={{ color: 'var(--warm-gray)', maxWidth: 480, margin: '0 auto', lineHeight: 1.7 }}>
            Tutto quello che ti serve per arrivare senza pensieri al grande giorno.
          </p>
        </div>

        {/* Timeline cerimonia → ricevimento */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 48 }}>

          {/* Cerimonia */}
          <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
              <div style={{
                width: 42, height: 42, borderRadius: '50%',
                background: 'rgba(200,130,106,.15)', border: '2px solid var(--rose)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.2rem',
              }}>⛪</div>
              <div style={{ width: 2, height: 32, background: 'var(--blush)', margin: '6px 0' }} />
            </div>
            <div style={{ flex: 1, paddingTop: 4 }}>
              <div style={{ fontSize: '.75rem', color: 'var(--rose)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 6 }}>
                Cerimonia · ore 15:00
              </div>
              <LuogoCard luogo={CERIMONIA} showMap={false} />
            </div>
          </div>

          {/* Ricevimento */}
          <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
              <div style={{
                width: 42, height: 42, borderRadius: '50%',
                background: 'rgba(138,158,140,.15)', border: '2px solid var(--sage)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.2rem',
              }}>🥂</div>
            </div>
            <div style={{ flex: 1, paddingTop: 4 }}>
              <div style={{ fontSize: '.75rem', color: 'var(--sage)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 6 }}>
                Ricevimento · ore 17:00
              </div>
              <LuogoCard luogo={RICEVIMENTO} showMap={true} />
            </div>
          </div>
        </div>

        {/* Parcheggi & trasporti */}
        <section style={{ marginBottom: 44 }}>
          <h2 style={{
            fontFamily: 'var(--font-serif)', fontSize: '1.6rem',
            color: 'var(--charcoal)', marginBottom: 18,
          }}>
            🚗 Come arrivare
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {PARCHEGGI.map(p => <InfoCard key={p.titolo} {...p} />)}
          </div>
        </section>

        {/* Fuori città */}
        <section>
          <h2 style={{
            fontFamily: 'var(--font-serif)', fontSize: '1.6rem',
            color: 'var(--charcoal)', marginBottom: 18,
          }}>
            🌍 Per chi viene da fuori
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {FUORI_CITTA.map(f => <InfoCard key={f.titolo} {...f} />)}
          </div>
        </section>

      </div>
    </div>
  )
}
