import { useState } from 'react'
const CERIMONIA = {
  nome: 'Duomo di Napoli',
  indirizzo: 'Via Duomo – 80138 Napoli (NA)',
  orario: 'Sabato 14 Giugno 2025 · ore 15:00',
  note: 'Vi preghiamo di essere presenti almeno 15 minuti prima.',
  coords: { lat: 40.8529, lng: 14.2616 },
}

const RICEVIMENTO = {
  nome: 'Villa Doria d’Angri',
  indirizzo: 'Via Francesco Petrarca, 80 – Posillipo, Napoli (NA)',
  orario: 'A seguire · ore 17:00',
  note: 'Il ricevimento si terrà nei giardini con vista sul Golfo di Napoli. In caso di pioggia, ci sposteremo nelle sale interne della villa.',
  coords: { lat: 40.8296, lng: 14.2156 },
  mapSrc: 'https://www.openstreetmap.org/export/embed.html',
}

const PARCHEGGI = [
  { icon: '🅿️', titolo: 'Parcheggi consigliati', desc: 'Parcheggi a pagamento nelle zone di Posillipo e Mergellina. Consigliata arrivo anticipato.' },
  { icon: '🚇', titolo: 'Metro + Funicolare', desc: 'Linea 1 fino a Toledo/Dante, poi autobus o taxi verso Posillipo.' },
  { icon: '🚕', titolo: 'Taxi / NCC', desc: 'Consigliamo prenotazione: Radio Taxi Napoli +39 081 8888.' },
]

const FUORI_CITTA = [
  {
    icon: '🚂',
    titolo: 'In treno',
    desc: 'Stazione Napoli Centrale (Piazza Garibaldi). Collegamenti veloci con Roma, Salerno e tutta Italia. Poi metro Linea 1 o taxi.',
  },
  {
    icon: '✈️',
    titolo: 'In aereo',
    desc: 'Aeroporto di Napoli Capodichino (NAP) – 15/20 min dal centro città. Taxi o Alibus per Napoli Centrale.',
  },
  {
    icon: '🏨',
    titolo: 'Dove dormire',
    desc: 'Consigliamo zona Chiaia, Mergellina o Centro Storico. Hotel e B&B disponibili a breve distanza dalla villa.',
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

      {showMap && (
        <div style={{ borderTop: '1px solid var(--cream)' }}>
          <iframe
            title="Mappa Ricevimento"
            src={`https://www.openstreetmap.org/export/embed.html?bbox=${luogo.coords.lng - 0.02}%2C${luogo.coords.lat - 0.015}%2C${luogo.coords.lng + 0.02}%2C${luogo.coords.lat + 0.015}&layer=mapnik&marker=${luogo.coords.lat}%2C${luogo.coords.lng}`}
            width="100%"
            height="300"
            style={{ display: 'block', border: 'none' }}
            loading="lazy"
          />
        </div>
      )}
    </div>
  )
}

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
