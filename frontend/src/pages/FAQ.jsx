import { useState } from 'react'
import { useLanguage } from '../hooks/useLanguage'

function FaqItem({ domanda, risposta, link }) {
  const [open, setOpen] = useState(false)

  return (
    <div style={{ borderBottom: '1px solid var(--cream)' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%',
          textAlign: 'left',
          padding: '18px 20px',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 16,
        }}
      >
        <span style={{ fontWeight: 600, color: 'var(--charcoal)' }}>
          {domanda}
        </span>
        <span
          style={{
            transform: open ? 'rotate(45deg)' : 'rotate(0)',
            transition: 'transform .25s',
            color: 'var(--rose)',
            fontSize: '1.2rem',
          }}
        >
          ＋
        </span>
      </button>

      <div
        style={{
          maxHeight: open ? 400 : 0,
          overflow: 'hidden',
          transition: 'max-height .3s ease',
        }}
      >
        <p style={{ padding: '0 20px 10px', color: 'var(--warm-gray)' }}>
          {risposta}
        </p>

        {link && (
          <div style={{ padding: '0 20px 20px' }}>
            <a
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary btn-sm"
            >
              {link.label}
            </a>
          </div>
        )}
      </div>
    </div>
  )
}

export default function FAQ() {
  const { t } = useLanguage()

  const [categoriaAttiva, setCategoriaAttiva] = useState(null)

  const categories = t('faq.categories')
  const categorieVisibili = categoriaAttiva
    ? categories.filter(c => c.key === categoriaAttiva)
    : categories

  return (
    <div style={{ padding: '60px 20px 120px', maxWidth: 700, margin: '0 auto' }}>
      <h1 style={{ textAlign: 'center', marginBottom: 30 }}>
        {t('faq.pageTitle')}
      </h1>

      {/* Filtri per categoria */}
      <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 30, flexWrap: 'wrap' }}>
        <button
          onClick={() => setCategoriaAttiva(null)}
          style={{
            padding: '8px 16px',
            background: categoriaAttiva === null ? 'var(--rose)' : 'var(--cream)',
            color: categoriaAttiva === null ? 'white' : 'var(--charcoal)',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: categoriaAttiva === null ? 600 : 400,
          }}
        >
          {t('faq.allFilter')}
        </button>
        {categories.map(c => (
          <button
            key={c.key}
            onClick={() =>
              setCategoriaAttiva(prev => prev === c.key ? null : c.key)
            }
            style={{
              padding: '8px 16px',
              background: categoriaAttiva === c.key ? 'var(--rose)' : 'var(--cream)',
              color: categoriaAttiva === c.key ? 'white' : 'var(--charcoal)',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: categoriaAttiva === c.key ? 600 : 400,
            }}
          >
            {c.icon} {c.categoria}
          </button>
        ))}
      </div>

      {/* Elenco FAQ */}
      {categorieVisibili.map(cat => (
        <div key={cat.key} style={{ marginBottom: 20 }}>
          <h2>{cat.icon} {cat.categoria}</h2>
          {cat.domande.map((faq, i) => (
            <FaqItem
              key={i}
              domanda={faq.q}
              risposta={faq.a}
              link={faq.link}
            />
          ))}
        </div>
      ))}
    </div>
  )
}