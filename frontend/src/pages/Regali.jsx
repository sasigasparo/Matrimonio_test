import { useState } from 'react'
import { useLanguage } from '../hooks/useLanguage'

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
  const { t } = useLanguage()
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
      background: 'rgba(255,255,255,0.65)', border: '1px solid rgba(207,165,181,0.25)',
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
          flexShrink: 0, padding: '8px 16px', borderRadius: 'var(--radius-pill)', border: 'none', cursor: 'pointer',
          background: copied ? 'rgba(67,160,71,0.16)' : 'rgba(199,107,139,0.12)',
          color: copied ? '#2e7d32' : 'var(--rose-deep)',
          fontSize: '.78rem', fontWeight: 600, whiteSpace: 'nowrap',
          transition: 'all .15s',
        }}
      >
        {copied ? t('regali.copied') : t('regali.copy')}
      </button>
    </div>
  )
}

export default function Regali() {
  const { t } = useLanguage()

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
            {t('regali.title')}
          </h1>
          <p style={{ color: 'var(--warm-gray)', maxWidth: 420, margin: '0 auto', lineHeight: 1.6 }}>
            {t('regali.intro')}
          </p>
        </div>

        <div style={{
          background: 'rgba(255,255,255,0.75)', backdropFilter: 'blur(14px)',
          border: '1px solid rgba(207,165,181,0.25)', borderRadius: 20,
          boxShadow: '0 16px 40px rgba(44,36,32,0.08)',
          padding: '28px 24px', display: 'flex', flexDirection: 'column', gap: 12,
        }}>
          <div style={{ fontSize: '.85rem', fontWeight: 600, color: 'var(--charcoal)', marginBottom: 4 }}>
            {t('regali.bankTransfer')}
          </div>
          <CopyField label={t('regali.fields.intestatario')} value={GIFT_INFO.intestatario} />
          <CopyField label={t('regali.fields.iban')} value={GIFT_INFO.iban} mono />
          <CopyField label={t('regali.fields.bic')} value={GIFT_INFO.bic} mono />
          <CopyField label={t('regali.fields.causale')} value={GIFT_INFO.causale} />
        </div>

        <p style={{ textAlign: 'center', color: 'var(--warm-gray)', fontSize: '.82rem', marginTop: 20, lineHeight: 1.6 }}>
          {t('regali.thanks')}
        </p>
      </div>
    </div>
  )
}
