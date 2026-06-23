import { useState, useMemo } from 'react'
import { useLanguage } from '../hooks/useLanguage'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { Search, ChevronDown, X, HelpCircle } from 'lucide-react'

/* ── Single accordion row — clip-free expand via grid-template-rows 0fr→1fr ── */
function FaqItem({ domanda, risposta, link, defaultOpen }) {
  const [open, setOpen] = useState(defaultOpen || false)

  return (
    <div style={{ borderBottom: '1px solid var(--hairline)' }}>
      <button
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        style={{
          width: '100%', textAlign: 'left',
          padding: '17px 18px', minHeight: 56,
          background: 'none', border: 'none', cursor: 'pointer',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 14,
          WebkitTapHighlightColor: 'transparent',
        }}
      >
        <span style={{ fontWeight: 600, color: 'var(--charcoal)', fontSize: '.98rem', lineHeight: 1.4 }}>
          {domanda}
        </span>
        <span style={{
          flexShrink: 0, width: 28, height: 28, borderRadius: '50%',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          background: open ? 'var(--rose)' : 'var(--rose-soft)',
          color: open ? '#fff' : 'var(--rose-deep)',
          transform: open ? 'rotate(180deg)' : 'rotate(0)',
          transition: 'transform .3s var(--ease-out-quart), background .2s',
        }}>
          <ChevronDown size={17} strokeWidth={2.4} />
        </span>
      </button>

      {/* 0fr → 1fr lets the row grow to ANY content height with no clipping */}
      <div style={{
        display: 'grid',
        gridTemplateRows: open ? '1fr' : '0fr',
        transition: 'grid-template-rows .32s var(--ease-out-quart)',
      }}>
        <div style={{ overflow: 'hidden' }}>
          <p style={{ padding: '0 18px 16px', color: 'var(--ink-soft)', fontSize: '.92rem', lineHeight: 1.65, margin: 0 }}>
            {risposta}
          </p>
          {link && (
            <div style={{ padding: '0 18px 18px' }}>
              <a href={link.href} target="_blank" rel="noopener noreferrer" className="btn btn-primary btn-sm">
                {link.label}
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function FAQ() {
  const { t } = useLanguage()
  const reduce = useReducedMotion()
  const [categoriaAttiva, setCategoriaAttiva] = useState(null)
  const [query, setQuery] = useState('')

  const categories = t('faq.categories')
  const q = query.trim().toLowerCase()

  // Filter by active category, then by search text (matches question OR answer).
  const visible = useMemo(() => {
    const byCat = categoriaAttiva ? categories.filter(c => c.key === categoriaAttiva) : categories
    if (!q) return byCat
    return byCat
      .map(cat => ({ ...cat, domande: cat.domande.filter(d => (d.q + ' ' + d.a).toLowerCase().includes(q)) }))
      .filter(cat => cat.domande.length > 0)
  }, [categories, categoriaAttiva, q])

  const hasResults = visible.some(c => c.domande.length > 0)

  return (
    <div className="page-enter" style={{ padding: '48px 18px 40px', maxWidth: 680, margin: '0 auto' }}>

      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 26 }}>
        <div style={{
          width: 56, height: 56, margin: '0 auto 14px', borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'linear-gradient(150deg, var(--rose-soft), var(--blush))', color: 'var(--rose-deep)',
        }}>
          <HelpCircle size={26} strokeWidth={2} />
        </div>
        <h1 style={{ fontSize: 'clamp(2rem, 7vw, 2.6rem)', color: 'var(--charcoal)', marginBottom: 6 }}>
          {t('faq.pageTitle')}
        </h1>
        <p style={{ color: 'var(--warm-gray)', fontSize: '.95rem', margin: 0 }}>{t('faq.subtitle')}</p>
      </div>

      {/* Sticky search + filters (stays reachable while scrolling long lists) */}
      <div style={{
        position: 'sticky', top: 64, zIndex: 'var(--z-sticky)',
        margin: '0 -18px 22px', padding: '10px 18px 12px',
        background: 'rgba(255,247,249,0.86)', backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
      }}>
        {/* Search */}
        <div style={{ position: 'relative', marginBottom: 12 }}>
          <Search size={18} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'var(--warm-gray)' }} />
          <input
            className="input"
            type="search"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder={t('faq.searchPlaceholder')}
            aria-label={t('faq.searchPlaceholder')}
            style={{ paddingLeft: 46, paddingRight: query ? 44 : 16 }}
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              aria-label="Clear"
              style={{
                position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
                width: 30, height: 30, borderRadius: '50%', border: 'none', cursor: 'pointer',
                background: 'var(--cream)', color: 'var(--warm-gray)',
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <X size={15} />
            </button>
          )}
        </div>

        {/* Category chips — horizontal scroll on mobile, no wrap */}
        <div className="no-scrollbar" style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 2, scrollSnapType: 'x proximity' }}>
          <button
            className={`chip${categoriaAttiva === null ? ' is-active' : ''}`}
            onClick={() => setCategoriaAttiva(null)}
            style={{ scrollSnapAlign: 'start' }}
          >
            {t('faq.allFilter')}
          </button>
          {categories.map(c => (
            <button
              key={c.key}
              className={`chip${categoriaAttiva === c.key ? ' is-active' : ''}`}
              onClick={() => setCategoriaAttiva(prev => prev === c.key ? null : c.key)}
              style={{ scrollSnapAlign: 'start' }}
            >
              <span aria-hidden="true">{c.icon}</span> {c.categoria}
            </button>
          ))}
        </div>
      </div>

      {/* Results */}
      {hasResults ? (
        <AnimatePresence mode="popLayout">
          {visible.map(cat => (
            <motion.section
              key={cat.key}
              layout={!reduce}
              initial={reduce ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduce ? undefined : { opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              style={{ marginBottom: 18 }}
            >
              <h2 style={{
                fontSize: '.78rem', fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase',
                color: 'var(--rose-deep)', margin: '0 0 8px', paddingLeft: 4,
                display: 'flex', alignItems: 'center', gap: 8,
              }}>
                <span aria-hidden="true" style={{ fontSize: '1rem' }}>{cat.icon}</span> {cat.categoria}
              </h2>
              <div style={{ background: 'var(--white)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--hairline)', boxShadow: 'var(--shadow-sm)', overflow: 'hidden' }}>
                {cat.domande.map((faq, i) => (
                  <FaqItem
                    key={i}
                    domanda={faq.q}
                    risposta={faq.a}
                    link={faq.link}
                    defaultOpen={!!q && cat.domande.length <= 2}
                  />
                ))}
              </div>
            </motion.section>
          ))}
        </AnimatePresence>
      ) : (
        <div style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--warm-gray)' }}>
          <Search size={32} style={{ opacity: .4, marginBottom: 12 }} />
          <p style={{ margin: 0 }}>{t('faq.noResults')}</p>
        </div>
      )}
    </div>
  )
}
