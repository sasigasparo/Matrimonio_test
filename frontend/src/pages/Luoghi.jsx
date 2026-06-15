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
  note: 'Il ricevimento si terrà nei giardini con vista sul Golfo di Napoli. In caso di pioggia, ci sposteremo nelle sale interne.',
  coords: { lat: 40.8296, lng: 14.2156 },
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
    desc: 'Stazione Napoli Centrale (Piazza Garibaldi). Collegamenti con Roma, Salerno e tutta Italia.',
  },
  {
    icon: '✈️',
    titolo: 'In aereo',
    desc: 'Aeroporto di Napoli Capodichino (NAP) – 15/20 min dal centro città.',
  },
  {
    icon: '🏨',
    titolo: 'Dove dormire',
    desc: 'Zona Chiaia, Mergellina o Centro Storico consigliate.',
  },
]

/* ───────── COMPONENTI ───────── */

function InfoCard({ icon, titolo, desc }) {
  return (
    <div style={{
      background: 'var(--ivory)',
      border: '1.5px solid rgba(200,162,168,.2)',
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
            background: 'rgba(200,162,168,.1)',
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
            🗺️ Google Maps
          </a>

          <a
            href={`https://www.waze.com/ul?q=${encodeURIComponent(luogo.indirizzo)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-outline btn-sm"
          >
            🚗 Waze
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
  return (
    <div className="page-enter" style={{ padding: '60px 20px 120px' }}>
      <div style={{ maxWidth: 720, margin: '0 auto' }}>

        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ fontSize: '3rem' }}>📍</div>
          <h1 style={{ fontFamily: 'var(--font-serif)' }}>
            Luoghi & Indicazioni – Napoli
          </h1>
        </div>

        {/* CERIMONIA */}
        <LuogoCard luogo={CERIMONIA} showMap={false} />

        <div style={{ height: 20 }} />

        {/* RICEVIMENTO */}
        <LuogoCard luogo={RICEVIMENTO} showMap />

        <section style={{ marginTop: 40 }}>
          <h2>🚗 Come arrivare</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {PARCHEGGI.map(p => <InfoCard key={p.titolo} {...p} />)}
          </div>
        </section>

        <section style={{ marginTop: 40 }}>
          <h2>🌍 Per chi viene da fuori</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {FUORI_CITTA.map(f => <InfoCard key={f.titolo} {...f} />)}
          </div>
        </section>

      </div>
    </div>
  )
}