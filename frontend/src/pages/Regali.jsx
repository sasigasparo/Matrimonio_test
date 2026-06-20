import { useState } from 'react'

/* ── Dati bancari ───────────────────────────────────────────────────
   ⚠️ PLACEHOLDER — sostituisci questi valori con i vostri dati reali
   prima di pubblicare il sito. L'IBAN qui sotto è un esempio fittizio
   (è l'IBAN di esempio standard usato nella documentazione bancaria
   italiana), NON è un conto corrente reale.
-------------------------------------------------------------------- */
const GIFT_INFO = {
  intestatario: 'Sofia Rossi e Marco Bianchi',
  iban: 'IT60 X054 2811 1010 0000 0123 456',
  bic: 'BPPIITRRXXX',
  causale: 'Regalo di nozze — Sofia & Marco',
}

function CopyField({ label, value, mono = false }) {
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value.replace(/\s+/g, mono ? '' : ' ').trim())
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      // clipboard non disponibile (es. http non sicuro): l'utente può selezionare il testo a mano
    }
  }

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
      padding: '12px 14px', borderRadius: 12,
      background: 'rgba(255,255,255,0.65)', border: '1px solid rgba(200,162,168,0.25)',
    }}>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: '.7rem', letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--warm-gray)', marginBottom: 3 }}>
          {label}
        </div>
        <div style={{
          fontSize: mono ? '.95rem' : '.92rem',
          fontFamily: mono ? 'ui-monospace, "SF Mono", Menlo, monospace' : 'inherit',
          letterSpacing: mono ? '.04em' : 'normal',
          color: 'var(--charcoal)', wordBreak: 'break-word',
        }}>
          {value}
        </div>
      </div>
      <button
        onClick={copy}
        style={{
          flexShrink: 0, padding: '7px 12px', borderRadius: 8, border: 'none', cursor: 'pointer',
          background: copied ? 'rgba(138,158,140,0.18)' : 'rgba(200,130,106,0.1)',
          color: copied ? '#5a7a5c' : 'var(--rose)',
          fontSize: '.78rem', fontWeight: 600, whiteSpace: 'nowrap',
          transition: 'all .15s',
        }}
      >
        {copied ? '✓ Copiato' : 'Copia'}
      </button>
    </div>
  )
}

export default function Regali() {
  return (
    <div style={{
      minHeight: 'calc(100dvh - 56px)',
      display: 'flex', justifyContent: 'center',
      padding: '40px 20px 60px',
    }}>
      <div style={{ width: '100%', maxWidth: 560 }}>

        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: '2.6rem', marginBottom: 10 }}>🎁</div>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.9rem', color: 'var(--charcoal)', margin: '0 0 10px' }}>
            Il vostro regalo
          </h1>
          <p style={{ color: 'var(--warm-gray)', maxWidth: 420, margin: '0 auto', lineHeight: 1.6 }}>
            La cosa più importante per noi è avervi accanto in questo giorno. Se però desiderate
            farci un pensiero, il modo che preferiamo è un piccolo contributo per la nostra luna di miele.
          </p>
        </div>

        <div style={{
          background: 'rgba(255,255,255,0.75)', backdropFilter: 'blur(14px)',
          border: '1px solid rgba(200,162,168,0.25)', borderRadius: 20,
          boxShadow: '0 16px 40px rgba(44,36,32,0.08)',
          padding: '28px 24px', display: 'flex', flexDirection: 'column', gap: 12,
        }}>
          <div style={{ fontSize: '.85rem', fontWeight: 600, color: 'var(--charcoal)', marginBottom: 4 }}>
            Bonifico bancario
          </div>
          <CopyField label="Intestatario" value={GIFT_INFO.intestatario} />
          <CopyField label="IBAN" value={GIFT_INFO.iban} mono />
          <CopyField label="BIC / SWIFT" value={GIFT_INFO.bic} mono />
          <CopyField label="Causale" value={GIFT_INFO.causale} />
        </div>

        <p style={{ textAlign: 'center', color: 'var(--warm-gray)', fontSize: '.82rem', marginTop: 20, lineHeight: 1.6 }}>
          Grazie di cuore per l'affetto che ci dimostrerete semplicemente essendo presenti. 🌸
        </p>
      </div>
    </div>
  )
}
